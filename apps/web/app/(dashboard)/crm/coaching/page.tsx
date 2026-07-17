'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { GraduationCap, Plus, X, BookOpen } from 'lucide-react';
import { apiGet, apiPost, ApiRequestError } from '../../../../src/lib/api';
import styles from './page.module.css';

interface Rubric {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  criteria: Array<{ key: string; label: string; weight: number; maxScore: number }>;
}

interface TeamRow {
  repUserId: string;
  scorecardsReviewed: number;
  averageScorePct: number;
  averageTalkRatio: number | null;
}

interface LibraryItem {
  id: string;
  title: string;
  category: string;
  notes: string | null;
  tags: string[];
}

const CATEGORIES = ['OBJECTION_HANDLING', 'DISCOVERY', 'CLOSING', 'NEGOTIATION', 'DEMO'];

export default function CoachingPage() {
  const [tab, setTab] = useState<'dashboard' | 'rubrics' | 'library'>('dashboard');
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [rubricForm, setRubricForm] = useState({ name: '', description: '' });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, r, l] = await Promise.all([
        apiGet<TeamRow[]>('/crm/coaching/dashboard'),
        apiGet<Rubric[]>('/crm/coaching/rubrics'),
        apiGet<LibraryItem[]>('/crm/coaching/library'),
      ]);
      setTeam(Array.isArray(t) ? t : []);
      setRubrics(Array.isArray(r) ? r : []);
      setLibrary(Array.isArray(l) ? l : []);
    } catch (err) {
      toast.error('Could not load coaching data', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const createRubric = async () => {
    setBusy(true);
    try {
      await apiPost('/crm/coaching/rubrics', {
        name: rubricForm.name,
        description: rubricForm.description || undefined,
        criteria: [
          { key: 'talk_ratio', label: 'Talk Ratio Balance', weight: 1, maxScore: 10 },
          { key: 'discovery', label: 'Discovery Quality', weight: 1, maxScore: 10 },
          { key: 'objection_handling', label: 'Objection Handling', weight: 1, maxScore: 10 },
          { key: 'next_steps', label: 'Next Steps Set', weight: 1, maxScore: 10 },
        ],
      });
      toast.success('Rubric created');
      setRubricModalOpen(false);
      setRubricForm({ name: '', description: '' });
      await load();
    } catch (err) {
      toast.error('Could not create rubric', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const teamColumns: Column<TeamRow>[] = [
    { key: 'repUserId', header: 'Rep' },
    { key: 'scorecardsReviewed', header: 'Calls Reviewed', align: 'right' },
    { key: 'averageScorePct', header: 'Avg Score', align: 'right', render: (r) => (
      <Badge variant={r.averageScorePct >= 80 ? 'success' : r.averageScorePct >= 60 ? 'warning' : 'danger'}>{r.averageScorePct}%</Badge>
    ) },
    { key: 'averageTalkRatio', header: 'Avg Talk Ratio', align: 'right', render: (r) => r.averageTalkRatio != null ? `${r.averageTalkRatio}%` : '—' },
  ];

  const rubricColumns: Column<Rubric>[] = [
    { key: 'name', header: 'Rubric' },
    { key: 'criteria', header: 'Criteria', render: (r) => `${r.criteria.length} scored criteria` },
    { key: 'isActive', header: 'Status', render: (r) => <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  const libraryColumns: Column<LibraryItem>[] = [
    { key: 'title', header: 'Title' },
    { key: 'category', header: 'Category', render: (l) => l.category.replace(/_/g, ' ') },
    { key: 'tags', header: 'Tags', render: (l) => l.tags.join(', ') || '—' },
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Sales Coaching & Call Scoring"
        description="Structured scorecards (talk-ratio, objection-handling, next-steps-set) applied to logged calls, manager review workflow, and a coaching library — Gong/Chorus.ai/Salesloft-style."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Sales Coaching' }]}
      />

      <div className={styles.tabs}>
        {(['dashboard', 'rubrics', 'library'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <Card>
          {loading ? (
            <div className="ui-center-pad"><Spinner size="lg" /></div>
          ) : team.length === 0 ? (
            <div className="ui-empty-state">
              <GraduationCap size={48} className="ui-hr-faded" />
              <div className="font-semibold">No Coaching Data Yet</div>
              <div className="text-sm">Score a logged call against a rubric to populate the team dashboard.</div>
            </div>
          ) : (
            <DataTable<TeamRow> columns={teamColumns} data={team} rowKey={(r) => r.repUserId} />
          )}
        </Card>
      )}

      {tab === 'rubrics' && (
        <Card>
          <div className={styles.actions}>
            <ProtectedComponent permission="crm.coaching.manage">
              <Button variant="primary" onClick={() => setRubricModalOpen(true)} className="ui-hstack-2">
                <Plus size={16} /> New Rubric
              </Button>
            </ProtectedComponent>
          </div>
          {loading ? (
            <div className="ui-center-pad"><Spinner size="lg" /></div>
          ) : rubrics.length === 0 ? (
            <div className="ui-empty-state">
              <GraduationCap size={48} className="ui-hr-faded" />
              <div className="font-semibold">No Rubrics Defined</div>
              <div className="text-sm">Create a scoring rubric to start structured call reviews.</div>
            </div>
          ) : (
            <DataTable<Rubric> columns={rubricColumns} data={rubrics} rowKey={(r) => r.id} />
          )}
        </Card>
      )}

      {tab === 'library' && (
        <Card>
          {loading ? (
            <div className="ui-center-pad"><Spinner size="lg" /></div>
          ) : library.length === 0 ? (
            <div className="ui-empty-state">
              <BookOpen size={48} className="ui-hr-faded" />
              <div className="font-semibold">Coaching Library Empty</div>
              <div className="text-sm">Add exemplar calls/notes from the call detail view.</div>
            </div>
          ) : (
            <DataTable<LibraryItem> columns={libraryColumns} data={library} rowKey={(l) => l.id} />
          )}
        </Card>
      )}

      {rubricModalOpen && (
        <div className={styles.overlay}>
          <Card>
            <div className={styles.modalContent}>
              <div className="ui-flex-between">
                <h3 className="m-0">New Coaching Rubric</h3>
                <button onClick={() => setRubricModalOpen(false)} className="ui-btn-icon"><X size={18} /></button>
              </div>
              <input placeholder="Rubric name" value={rubricForm.name} onChange={(e) => setRubricForm({ ...rubricForm, name: e.target.value })} className="p-2" />
              <textarea placeholder="Description (optional)" value={rubricForm.description} onChange={(e) => setRubricForm({ ...rubricForm, description: e.target.value })} className="p-2" />
              <div className="ui-text-sm-muted">
                Creates a rubric with 4 standard criteria: Talk Ratio Balance, Discovery Quality, Objection Handling, Next Steps Set.
              </div>
              <Button variant="primary" onClick={createRubric} disabled={busy || !rubricForm.name}>Create Rubric</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
