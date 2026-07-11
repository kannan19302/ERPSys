'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { GraduationCap, Plus, X, BookOpen } from 'lucide-react';
import { apiGet, apiPost, ApiRequestError } from '../../../../src/lib/api';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Sales Coaching & Call Scoring"
        description="Structured scorecards (talk-ratio, objection-handling, next-steps-set) applied to logged calls, manager review workflow, and a coaching library — Gong/Chorus.ai/Salesloft-style."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Sales Coaching' }]}
      />

      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
        {(['dashboard', 'rubrics', 'library'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: 'var(--space-3) var(--space-4)', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: tab === t ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              color: tab === t ? 'var(--color-primary)' : 'var(--color-text-secondary)', textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <Card>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
          ) : team.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
              <GraduationCap size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Coaching Data Yet</div>
              <div style={{ fontSize: 'var(--text-sm)' }}>Score a logged call against a rubric to populate the team dashboard.</div>
            </div>
          ) : (
            <DataTable<TeamRow> columns={teamColumns} data={team} rowKey={(r) => r.repUserId} />
          )}
        </Card>
      )}

      {tab === 'rubrics' && (
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <ProtectedComponent permission="crm.coaching.manage">
              <Button variant="primary" onClick={() => setRubricModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Plus size={16} /> New Rubric
              </Button>
            </ProtectedComponent>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
          ) : rubrics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
              <GraduationCap size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Rubrics Defined</div>
              <div style={{ fontSize: 'var(--text-sm)' }}>Create a scoring rubric to start structured call reviews.</div>
            </div>
          ) : (
            <DataTable<Rubric> columns={rubricColumns} data={rubrics} rowKey={(r) => r.id} />
          )}
        </Card>
      )}

      {tab === 'library' && (
        <Card>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
          ) : library.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
              <BookOpen size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>Coaching Library Empty</div>
              <div style={{ fontSize: 'var(--text-sm)' }}>Add exemplar calls/notes from the call detail view.</div>
            </div>
          ) : (
            <DataTable<LibraryItem> columns={libraryColumns} data={library} rowKey={(l) => l.id} />
          )}
        </Card>
      )}

      {rubricModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <Card>
            <div style={{ padding: 'var(--space-6)', width: '420px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>New Coaching Rubric</h3>
                <button onClick={() => setRubricModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <input placeholder="Rubric name" value={rubricForm.name} onChange={(e) => setRubricForm({ ...rubricForm, name: e.target.value })} style={{ padding: 'var(--space-2)' }} />
              <textarea placeholder="Description (optional)" value={rubricForm.description} onChange={(e) => setRubricForm({ ...rubricForm, description: e.target.value })} style={{ padding: 'var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
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
