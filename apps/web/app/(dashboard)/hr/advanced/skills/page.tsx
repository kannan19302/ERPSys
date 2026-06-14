'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { Plus, Award, TrendingDown, Users, Check } from 'lucide-react';

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
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [reports, setReports] = useState<GapReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [showReqForm, setShowReqForm] = useState(false);
  const [reqForm, setReqForm] = useState({ designation: '', skillName: '', requiredLevel: 3 });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, gapRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/skills/requirements', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/skills/gap-analysis', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (reqRes.ok) setRequirements(await reqRes.json());
      if (gapRes.ok) setReports(await gapRes.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/advanced-hr/skills/requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(reqForm)
      });
      if (res.ok) {
        setMsg('Skill designation requirement saved.');
        setShowReqForm(false);
        setReqForm({ designation: '', skillName: '', requiredLevel: 3 });
        fetchData();
      }
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Skills Matrix"
        description="Design target skill levels per designation and review employee skill gap diagnostics."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Skills' }]}
        actions={
          <Button variant="primary" onClick={() => setShowReqForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} /> New Skill Rule
          </Button>
        }
      />

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {/* Stats widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Designation Rules</span>
            <Award size={16} className="text-primary" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0' }}>{requirements.length}</h4>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Audited Staff</span>
            <Users size={16} className="text-success" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0' }}>{reports.length}</h4>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Staff with Skill Gaps</span>
            <TrendingDown size={16} className="text-danger" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0', color: reports.some(r => r.gapsCount > 0) ? 'var(--color-danger-text)' : 'inherit' }}>
            {reports.filter(r => r.gapsCount > 0).length}
          </h4>
        </Card>
      </div>

      {showReqForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4)' }}>Add Designation Skill Requirement</h4>
          <form onSubmit={handleCreateRequirement} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <input className="frappe-input" placeholder="Designation (e.g. HR Director)" value={reqForm.designation} onChange={e => setReqForm({ ...reqForm, designation: e.target.value })} required />
              <input className="frappe-input" placeholder="Skill Name (e.g. Compliance)" value={reqForm.skillName} onChange={e => setReqForm({ ...reqForm, skillName: e.target.value })} required />
              <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <label style={{ fontSize: 10 }}>Required Level (1-5)</label>
                <input className="frappe-input" type="number" min="1" max="5" value={reqForm.requiredLevel} onChange={e => setReqForm({ ...reqForm, requiredLevel: parseInt(e.target.value) || 3 })} required />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="outline" type="button" onClick={() => setShowReqForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Requirement</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          {/* Rules lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h4 style={{ margin: 0 }}>Rules Registry</h4>
            {requirements.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)', textAlign: 'center', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>No requirements set.</div>
            ) : (
              requirements.map(req => (
                <Card key={req.id} padding="sm">
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{req.designation}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    <span>Skill: {req.skillName}</span>
                    <span style={{ fontWeight: 'bold' }}>Required: Lvl {req.requiredLevel}</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Gap Reports Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h4 style={{ margin: 0 }}>Employee Skills Gaps Analysis</h4>
            <Card padding="none" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ padding: 'var(--space-4)' }}>Employee</th>
                    <th style={{ padding: 'var(--space-4)' }}>Designation</th>
                    <th style={{ padding: 'var(--space-4)' }}>Skills Tracked</th>
                    <th style={{ padding: 'var(--space-4)' }}>Gap Details</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No matching active roles detected. Set skill rules on the left.</td>
                    </tr>
                  ) : (
                    reports.map(rep => (
                      <tr key={rep.employeeId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{rep.employeeName}</td>
                        <td style={{ padding: 'var(--space-4)' }}>{rep.designation}</td>
                        <td style={{ padding: 'var(--space-4)' }}>{rep.skillsCount} skills</td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          {rep.gapsCount === 0 ? (
                            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Meets Requirements</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {rep.gaps.map(g => (
                                <div key={g.skillName} style={{ fontSize: '11px', color: 'var(--color-danger-text)' }}>
                                  ⚠️ {g.skillName}: Target {g.requiredLevel} (Has {g.actualLevel}, Gap: {g.gap})
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            background: rep.gapsCount === 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                            color: rep.gapsCount === 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)'
                          }}>
                            {rep.gapsCount === 0 ? 'COMPLIANT' : `${rep.gapsCount} GAPS`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
