'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Plus, Award, TrendingDown, Users, Check } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface Requirement {
  id: string;
  designation: string;
  skillName: string;
  requiredLevel: number;
}

interface GapReport {
  employeeId: string;
  employeeName: string;
  designation: string;
  skillsCount: number;
  gapsCount: number;
  gaps: Array<{ skillName: string; requiredLevel: number; actualLevel: number; gap: number }>;
}

export default function SkillsPage() {
  const client = useApiClient();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [reports, setReports] = useState<GapReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [showReqForm, setShowReqForm] = useState(false);
  const [reqForm, setReqForm] = useState({ designation: '', skillName: '', requiredLevel: 3 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requirementsData, reportsData] = await Promise.all([
        client.get<Requirement[] | { data?: Requirement[] }>('/advanced-hr/skills/requirements'),
        client.get<GapReport[] | { data?: GapReport[] }>('/advanced-hr/skills/gap-analysis'),
      ]);
      setRequirements(Array.isArray(requirementsData) ? requirementsData : (requirementsData.data || []));
      setReports(Array.isArray(reportsData) ? reportsData : (reportsData.data || []));
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/advanced-hr/skills/requirements', reqForm);
      setMsg('Skill designation requirement saved.');
      setShowReqForm(false);
      setReqForm({ designation: '', skillName: '', requiredLevel: 3 });
      fetchData();
    } catch {}
  };

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Skills Matrix"
        description="Design target skill levels per designation and review employee skill gap diagnostics."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Skills' }]}
        actions={
          <Button variant="primary" onClick={() => setShowReqForm(true)} className="ui-flex ui-items-center ui-gap-1">
            <Plus size={14} /> New Skill Rule
          </Button>
        }
      />

      {msg && (
        <div className={styles.s0}>
          {msg}
        </div>
      )}

      {/* Stats widgets */}
      <div className={styles.auto0}>
        <Card>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Designation Rules</span>
            <Award size={16} className="text-primary" />
          </div>
          <h4 className={styles.s1}>{requirements.length}</h4>
        </Card>
        <Card>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Audited Staff</span>
            <Users size={16} className="text-success" />
          </div>
          <h4 className={styles.s2}>{reports.length}</h4>
        </Card>
        <Card>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Staff with Skill Gaps</span>
            <TrendingDown size={16} className="text-danger" />
          </div>
          <h4 className={styles.dyn0} style={{ color: reports.some(r => r.gapsCount > 0) ? 'var(--color-danger-text)' : 'inherit' }}>
            {reports.filter(r => r.gapsCount > 0).length}
          </h4>
        </Card>
      </div>

      {showReqForm && (
        <Card padding="md">
          <h4 className={styles.s3}>Add Designation Skill Requirement</h4>
          <form onSubmit={handleCreateRequirement} className="ui-stack-3">
            <div className={styles.s4}>
              <input className="ui-input" placeholder="Designation (e.g. HR Director)" value={reqForm.designation} onChange={e => setReqForm({ ...reqForm, designation: e.target.value })} required />
              <input className="ui-input" placeholder="Skill Name (e.g. Compliance)" value={reqForm.skillName} onChange={e => setReqForm({ ...reqForm, skillName: e.target.value })} required />
              <div className={`ui-form-group ${styles.s5}`}>
                <label className={styles.s6}>Required Level (1-5)</label>
                <input className="ui-input" type="number" min="1" max="5" value={reqForm.requiredLevel} onChange={e => setReqForm({ ...reqForm, requiredLevel: parseInt(e.target.value) || 3 })} required />
              </div>
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowReqForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Requirement</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.s7}>
          {/* Rules lists */}
          <div className="ui-stack-4">
            <h4 className="m-0">Rules Registry</h4>
            {requirements.length === 0 ? (
              <div className={styles.s8}>No requirements set.</div>
            ) : (
              requirements.map(req => (
                <Card key={req.id} padding="sm">
                  <div className={styles.s9}>{req.designation}</div>
                  <div className={styles.s10}>
                    <span>Skill: {req.skillName}</span>
                    <span className="font-bold">Required: Lvl {req.requiredLevel}</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Gap Reports Table */}
          <div className="ui-stack-4">
            <h4 className="m-0">Employee Skills Gaps Analysis</h4>
            <ListPageTemplate
              title=""
              columns={[
                { key: 'employeeName', header: 'Employee' },
                { key: 'designation', header: 'Designation' },
                { key: 'skillsCount', header: 'Skills Tracked', render: (v) => `${v} skills` },
                { key: 'gapsCount', header: 'Gap Details', render: (_, row) => {
                  const rep = row as unknown as GapReport;
                  return rep.gapsCount === 0
                    ? <span className={styles.s11}><Check size={14} /> Meets Requirements</span>
                    : <div className={styles.s12}>{rep.gaps.map(g => <div key={g.skillName} className={styles.s13}>⚠️ {g.skillName}: Target {g.requiredLevel} (Has {g.actualLevel}, Gap: {g.gap})</div>)}</div>;
                }},
                { key: 'status', header: 'Audit Status', render: (_, row) => {
                  const rep = row as unknown as GapReport;
                  return <span className={styles.dyn1} style={{ background: rep.gapsCount === 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: rep.gapsCount === 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>{rep.gapsCount === 0 ? 'COMPLIANT' : `${rep.gapsCount} GAPS`}</span>;
                }},
              ] as ListColumn[]}
              data={reports.map(r => ({ ...r, id: r.employeeId })) as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No matching active roles detected"
              emptyDescription="Set skill rules on the left."
            />
          </div>
        </div>
      )}
    </div>
  );
}



