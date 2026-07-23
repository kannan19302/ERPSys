'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, X, Edit3, Trash2, ArrowRight } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface RouteOp {
  id: string;
  sequence: number;
  name: string;
  workstationCode: string | null;
  durationMinutes: number;
  setupMinutes: number;
  description: string | null;
}

interface Route {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  totalLeadTimeMin: number | null;
  operations: RouteOp[];
}

export default function RoutingPage() {
  const client = useApiClient();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({ name: '', code: '', description: '', operations: '' });

  useEffect(() => { fetchRoutes(); }, [client]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const data = await client.get<Route[] | { data?: Route[] }>('/manufacturing/routes');
      setRoutes(Array.isArray(data) ? data : (data?.data || []));
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const operations = JSON.parse(newRoute.operations);
      await client.post('/manufacturing/routes', { name: newRoute.name, code: newRoute.code, description: newRoute.description || undefined, operations });
      setIsModalOpen(false);
      setNewRoute({ name: '', code: '', description: '', operations: '' });
      fetchRoutes();
      alert('Route created!');
    } catch { alert('Failed to create route - check operations JSON'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this route?')) return;
    try {
      await client.delete(`/manufacturing/routes/${id}`);
      fetchRoutes();
    } catch { alert('Failed to delete'); }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}><GitBranch size={28} className="ui-text-primary" /> Manufacturing Routes</h1>
          <p className={styles.p2}>Define production routings with sequenced operations</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}><Plus size={18} /> New Route</button>
      </div>
      {routes.map(r => (
        <div key={r.id} className={styles.card}>
          <div className={styles.cardHeader} onClick={() => setExpanded(expanded === r.id ? null : r.id)} role="button" tabIndex={0}>
            <div>
              <h3 className={styles.cardTitle}>{r.name} <span className={styles.code}>{r.code}</span></h3>
              <p className={styles.cardDesc}>{r.description || 'No description'}</p>
              <div className={styles.meta}><span>{r.operations.length} operations</span><span>Lead: {r.totalLeadTimeMin || 0} min</span><span className={r.isActive ? styles.active : styles.inactive}>{r.isActive ? 'Active' : 'Inactive'}</span></div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className={styles.deleteBtn}><Trash2 size={14} /></button>
          </div>
          {expanded === r.id && (
            <div className={styles.opsSection}>
              {r.operations.map((op, i) => (
                <div key={op.id} className={styles.opItem}>
                  <div className={styles.opSeq}>{op.sequence}</div>
                  {i < r.operations.length - 1 && <div className={styles.opArrow}><ArrowRight size={12} /></div>}
                  <div className={styles.opBody}>
                    <div className={styles.opName}>{op.name}</div>
                    <div className={styles.opMeta}>{op.workstationCode || 'Any WS'} · {op.durationMinutes}min {op.setupMinutes > 0 ? `(+${op.setupMinutes} setup)` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {routes.length === 0 && !loading && <div className="ui-text-muted">No routes defined yet.</div>}
      {isModalOpen && (
        <div className={styles.overlay}><div className={styles.modal}>
          <div className="ui-flex-between"><h3>New Route</h3><button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}><X size={18} /></button></div>
          <form onSubmit={handleCreate} className="ui-stack-3">
            <div className="ui-grid-2">
              <div className="ui-form-group"><label className="ui-label">Name</label><input className="ui-input" value={newRoute.name} onChange={e => setNewRoute(p => ({ ...p, name: e.target.value }))} required /></div>
              <div className="ui-form-group"><label className="ui-label">Code</label><input className="ui-input" value={newRoute.code} onChange={e => setNewRoute(p => ({ ...p, code: e.target.value }))} required /></div>
            </div>
            <div className="ui-form-group"><label className="ui-label">Description</label><textarea className="ui-input" value={newRoute.description} onChange={e => setNewRoute(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="ui-form-group"><label className="ui-label">Operations (JSON array)</label><textarea className={styles.codeInput} value={newRoute.operations} onChange={e => setNewRoute(p => ({ ...p, operations: e.target.value }))} placeholder='[{"sequence":1,"name":"Cut","workstationCode":"WS-CNC","durationMinutes":30,"setupMinutes":5}]' rows={5} required /></div>
            <button type="submit" className={styles.submitBtn}>Create</button>
          </form>
        </div></div>
      )}
    </div>
  );
}
