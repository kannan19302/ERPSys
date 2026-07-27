'use client';
import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, X, Loader2 } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import { Card, Button } from '@unerp/ui';
import { RouteGuard } from '@unerp/framework';

interface BiMetric {
  id: string;
  name: string;
  description: string | null;
  category: string;
  source: string;
  expression: string;
  unit: string | null;
  isActive: boolean;
  dimensions: string[];
}

export default function CatalogPage() {
  const client = useApiClient();
  const [metrics, setMetrics] = useState<BiMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', category: 'FINANCE', source: '', expression: '', unit: '', dimensionsStr: '', isActive: 'true' });

  useEffect(() => { fetchMetrics(); }, [client]);

  const fetchMetrics = async () => {
    try { setLoading(true); const r = await client.get<{ data: BiMetric[]; meta: unknown }>('/analytics/bi-metrics'); setMetrics(r.data || []); }
    catch { setMetrics([]); }
    finally { setLoading(false); }
  };

  const saveMetric = async () => {
    if (!newItem.name) return;
    try {
      await client.post('/analytics/bi-metrics', { name: newItem.name, description: newItem.description || undefined, category: newItem.category, source: newItem.source, expression: newItem.expression, unit: newItem.unit || undefined, dimensions: newItem.dimensionsStr ? newItem.dimensionsStr.split(',').map(s => s.trim()) : [], isActive: newItem.isActive === 'true' });
      setIsModalOpen(false); setNewItem({ name: '', description: '', category: 'FINANCE', source: '', expression: '', unit: '', dimensionsStr: '', isActive: 'true' }); fetchMetrics();
    } catch { /* ignore */ }
  };

  const deleteMetric = async (id: string) => { try { await client.delete(`/analytics/bi-metrics/${id}`); fetchMetrics(); } catch { /* ignore */ } };

  return (
    <RouteGuard permission="analytics.bi-metrics.read">
      <div className="p-8 ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl ui-hstack-3"><BookOpen size={28} className="ui-text-primary" /> BI Metric Catalog</h1>
            <p className="ui-text-muted mt-1">Enterprise metric definitions and dimensions</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>Add Metric</Button>
        </div>

        <div className="ui-grid-3">
          {['FINANCE', 'SALES', 'HR', 'OPERATIONS', 'INVENTORY', 'CRM'].map((cat) => {
            const count = metrics.filter((m) => m.category === cat).length;
            return count > 0 && <Card key={cat} className="p-4"><p className="text-sm font-medium">{cat}</p><p className="text-2xl font-bold">{count}</p><p className="ui-text-xs-muted">metrics</p></Card>;
          })}
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="ui-flex-center p-8"><Loader2 size={24} className="animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ui-table w-full">
                <thead><tr><th>Name</th><th>Category</th><th>Source</th><th>Expression</th><th>Dimensions</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {metrics.map((m) => (
                    <tr key={m.id}>
                      <td className="font-medium">{m.name}</td>
                      <td><span className="ui-badge-primary text-xs px-2 py-0.5 rounded">{m.category}</span></td>
                      <td className="ui-text-xs-muted">{m.source}</td>
                      <td className="font-mono text-xs">{m.expression}</td>
                      <td><div className="ui-hstack-2">{m.dimensions?.map((d, i) => <span key={i} className="ui-badge-secondary text-xs px-1.5 py-0.5 rounded">{d}</span>)}</div></td>
                      <td><span className={`px-2 py-0.5 rounded text-xs ${m.isActive ? 'ui-badge-success' : 'ui-badge-secondary'}`}>{m.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td><button onClick={() => deleteMetric(m.id)} className="ui-btn-icon ui-text-danger"><X size={14} /></button></td>
                    </tr>
                  ))}
                  {metrics.length === 0 && <tr><td colSpan={7} className="text-center ui-text-muted py-4">No metrics defined.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {isModalOpen && (
          <div className="fixed inset-0 ui-bg-overlay flex items-center justify-center z-50">
            <Card className="w-full max-w-lg p-6 ui-stack-4">
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Add BI Metric</h3><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
              <input className="ui-input" placeholder="Metric name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              <input className="ui-input" placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
              <div className="ui-flex ui-gap-2">
                <select className="ui-input flex-1" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                  <option value="FINANCE">Finance</option><option value="SALES">Sales</option><option value="HR">HR</option><option value="OPERATIONS">Operations</option><option value="INVENTORY">Inventory</option><option value="CRM">CRM</option>
                </select>
                <select className="ui-input flex-1" value={newItem.source} onChange={(e) => setNewItem({ ...newItem, source: e.target.value })}>
                  <option value="">Source</option><option value="SALES_ORDER">Sales Order</option><option value="INVOICE">Invoice</option><option value="PURCHASE_ORDER">Purchase Order</option><option value="PAYROLL">Payroll</option><option value="INVENTORY">Inventory</option>
                </select>
              </div>
              <input className="ui-input font-mono" placeholder="Expression (e.g. SUM(amount))" value={newItem.expression} onChange={(e) => setNewItem({ ...newItem, expression: e.target.value })} />
              <input className="ui-input" placeholder="Unit (e.g. USD, units)" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
              <input className="ui-input" placeholder="Dimensions (comma-separated, e.g. region, department)" value={newItem.dimensionsStr} onChange={(e) => setNewItem({ ...newItem, dimensionsStr: e.target.value })} />
              <div className="ui-flex ui-gap-3 ui-justify-end"><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={saveMetric}>Save</Button></div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
