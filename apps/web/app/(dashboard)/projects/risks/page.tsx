'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Plus, CheckCircle, X } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface Risk {
  id: string;
  title: string;
  description: string | null;
  probability: string;
  impact: string;
  mitigationPlan: string | null;
  status: string;
  projectId: string;
}

interface Mitigation {
  id: string;
  action: string;
  ownerId: string | null;
  dueDate: string | null;
  status: string;
  notes: string | null;
}

export default function RisksPage() {
  const client = useApiClient();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [mitigations, setMitigations] = useState<Record<string, Mitigation[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

  const [isMitigationOpen, setIsMitigationOpen] = useState(false);
  const [newMitigation, setNewMitigation] = useState({ riskId: '', action: '', dueDate: '', notes: '' });

  useEffect(() => { fetchRisks(); }, [client]);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const data = await client.get<Risk[] | { data?: Risk[] }>('/projects');
      const list = Array.isArray(data) ? data : (data?.data || []);
      setRisks(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMitigations = async (riskId: string) => {
    try {
      const data = await client.get<Mitigation[] | { data?: Mitigation[] }>(`/projects/risks/${riskId}/mitigations`);
      setMitigations(prev => ({ ...prev, [riskId]: Array.isArray(data) ? data : (data?.data || []) }));
    } catch { /* ignore */ }
  };

  const handleAddMitigation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/projects/risk-mitigations', newMitigation);
      setIsMitigationOpen(false);
      setNewMitigation({ riskId: '', action: '', dueDate: '', notes: '' });
      if (selectedRisk) fetchMitigations(selectedRisk);
      alert('Mitigation action added!');
    } catch { alert('Failed to add mitigation'); }
  };

  const toggleRisk = (riskId: string) => {
    if (selectedRisk === riskId) {
      setSelectedRisk(null);
    } else {
      setSelectedRisk(riskId);
      if (!mitigations[riskId]) fetchMitigations(riskId);
    }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}><ShieldAlert size={28} className="ui-text-danger" /> Risk Register</h1>
          <p className={styles.p2}>Track project risks and mitigation actions</p>
        </div>
      </div>
      {loading && <div className="ui-text-muted">Loading risks...</div>}
      {error && <div className="ui-text-danger">{error}</div>}
      <div className="ui-stack-3">
        {risks.map((risk) => (
          <div key={risk.id} className={styles.card}>
            <div className={styles.cardHeader} onClick={() => toggleRisk(risk.id)} role="button" tabIndex={0}>
              <div>
                <h3 className={styles.cardTitle}>
                  <AlertTriangle size={16} className="ui-text-warning" /> {risk.title}
                </h3>
                <p className={styles.cardDesc}>{risk.description || 'No description'}</p>
              </div>
              <div className={styles.badges}>
                <span className={styles.badge}>{risk.probability}</span>
                <span className={styles.badge}>{risk.impact}</span>
                <span className={styles.statusBadge}>{risk.status}</span>
              </div>
            </div>
            {selectedRisk === risk.id && (
              <div className={styles.mitigationsSection}>
                <div className="ui-flex-between">
                  <h4 className={styles.sectionTitle}>Mitigation Actions</h4>
                  <button onClick={() => { setNewMitigation(prev => ({ ...prev, riskId: risk.id })); setIsMitigationOpen(true); }} className={styles.addBtn}>
                    <Plus size={14} /> Add Action
                  </button>
                </div>
                {(mitigations[risk.id] || []).length === 0 && <p className={styles.empty}>No mitigation actions yet.</p>}
                {(mitigations[risk.id] || []).map((m) => (
                  <div key={m.id} className={styles.mitigationItem}>
                    <div className="ui-flex-between">
                      <span className={styles.mitigationAction}>{m.action}</span>
                      <span className={styles.mitigationStatus}>{m.status}</span>
                    </div>
                    {m.dueDate && <p className={styles.mitigationDue}>Due: {new Date(m.dueDate).toLocaleDateString()}</p>}
                    {m.notes && <p className={styles.mitigationNotes}>{m.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {isMitigationOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className="ui-flex-between">
              <h3>Add Mitigation Action</h3>
              <button onClick={() => setIsMitigationOpen(false)} className={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddMitigation} className="ui-stack-3">
              <div className="ui-form-group">
                <label className="ui-label">Action</label>
                <input className="ui-input" value={newMitigation.action} onChange={e => setNewMitigation(p => ({ ...p, action: e.target.value }))} required />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Due Date</label>
                <input className="ui-input" type="date" value={newMitigation.dueDate} onChange={e => setNewMitigation(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Notes</label>
                <textarea className="ui-input" value={newMitigation.notes} onChange={e => setNewMitigation(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <button type="submit" className={styles.submitBtn}>Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
