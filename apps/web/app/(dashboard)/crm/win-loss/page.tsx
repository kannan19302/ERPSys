'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent } from '@unerp/ui';
import { Plus, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiSend } from '../_components/api';

interface WinLossReason { id: string; name: string; category: 'WIN' | 'LOSS'; isActive: boolean; }
interface Competitor { id: string; name: string; website?: string; isActive: boolean; }
interface WinLossAnalytics {
  totalDeals: number; wonDeals: number; lostDeals: number; winRate: number;
  totalValue: number; wonValue: number; lostValue: number;
  reasonsBreakdown: { id: string; name: string; category: string; count: number; totalValue: number }[];
}

export default function WinLossPage() {
  const [analytics, setAnalytics] = useState<WinLossAnalytics | null>(null);
  const [reasons, setReasons] = useState<WinLossReason[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReasonForm, setShowReasonForm] = useState(false);
  const [reasonForm, setReasonForm] = useState({ name: '', category: 'WIN' as 'WIN' | 'LOSS' });
  const [showCompForm, setShowCompForm] = useState(false);
  const [compForm, setCompForm] = useState({ name: '', website: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsData, reasonsData, compsData] = await Promise.all([
        apiGet('/crm/win-loss/analytics'),
        apiGet<WinLossReason[]>('/crm/win-loss/reasons'),
        apiGet<Competitor[]>('/crm/win-loss/competitors'),
      ]);
      setAnalytics(analyticsData as WinLossAnalytics);
      setReasons(Array.isArray(reasonsData) ? reasonsData : []);
      setCompetitors(Array.isArray(compsData) ? compsData : []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createReason = async () => {
    await apiSend('/crm/win-loss/reasons', 'POST', reasonForm);
    setShowReasonForm(false); setReasonForm({ name: '', category: 'WIN' }); load();
  };

  const deleteReason = async (id: string) => {
    if (confirm('Delete this reason?')) { await apiSend(`/crm/win-loss/reasons/${id}`, 'DELETE'); load(); }
  };

  const createCompetitor = async () => {
    await apiSend('/crm/win-loss/competitors', 'POST', compForm);
    setShowCompForm(false); setCompForm({ name: '', website: '' }); load();
  };

  const deleteCompetitor = async (id: string) => {
    if (confirm('Delete this competitor?')) { await apiSend(`/crm/win-loss/competitors/${id}`, 'DELETE'); load(); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Win/Loss Analysis"
        description="Track win rates, competitive positioning, and deal analytics"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowReasonForm(true)}>
              <Plus className="w-4 h-4 mr-1" />Add Reason
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowCompForm(true)}>
              <Plus className="w-4 h-4 mr-1" />Add Competitor
            </Button>
          </div>
        }
      />

      {analytics && (
        <div className="ui-grid-4">
          <Card><div className="text-2xl font-bold">{analytics.winRate.toFixed(1)}%</div><div className="text-sm text-gray-500">Win Rate</div></Card>
          <Card><div className="text-2xl font-bold text-green-600">{analytics.wonDeals}</div><div className="text-sm text-gray-500">Won Deals</div></Card>
          <Card><div className="text-2xl font-bold text-red-600">{analytics.lostDeals}</div><div className="text-sm text-gray-500">Lost Deals</div></Card>
          <Card><div className="text-2xl font-bold">${(analytics.totalValue || 0).toLocaleString()}</div><div className="text-sm text-gray-500">Total Pipeline Value</div></Card>
        </div>
      )}

      <div className="ui-grid-2">
        <Card title="Win/Loss Reasons">
          {showReasonForm && (
            <div className="mb-4 p-3 border rounded bg-gray-50">
              <input className="input-style mb-2" value={reasonForm.name} onChange={e => setReasonForm(p => ({ ...p, name: e.target.value }))} placeholder="Reason name" />
              <select className="input-style mb-2" value={reasonForm.category} onChange={e => setReasonForm(p => ({ ...p, category: e.target.value as 'WIN' | 'LOSS' }))}>
                <option value="WIN">Win</option><option value="LOSS">Loss</option>
              </select>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={createReason}>Save</Button>
                <Button variant="secondary" size="sm" onClick={() => setShowReasonForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
          <ul className="space-y-1">
            {reasons.map(r => (
              <li key={r.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span>{r.category === 'WIN' ? <TrendingUp className="w-4 h-4 inline mr-2 text-green-500" /> : <TrendingDown className="w-4 h-4 inline mr-2 text-red-500" />}
                  {r.name} <Badge variant={r.category === 'WIN' ? 'success' : 'danger'} size="sm">{r.category}</Badge>
                </span>
                <ProtectedComponent permission="crm.winloss.manage">
                  <Button variant="ghost" size="sm" onClick={() => deleteReason(r.id)}>x</Button>
                </ProtectedComponent>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Competitors">
          {showCompForm && (
            <div className="mb-4 p-3 border rounded bg-gray-50">
              <input className="input-style mb-2" value={compForm.name} onChange={e => setCompForm(p => ({ ...p, name: e.target.value }))} placeholder="Competitor name" />
              <input className="input-style mb-2" value={compForm.website} onChange={e => setCompForm(p => ({ ...p, website: e.target.value }))} placeholder="Website (optional)" />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={createCompetitor}>Save</Button>
                <Button variant="secondary" size="sm" onClick={() => setShowCompForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
          <ul className="space-y-1">
            {competitors.map(c => (
              <li key={c.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span><BarChart3 className="w-4 h-4 inline mr-2" />{c.name}{c.website && <span className="text-xs text-gray-400 ml-2">{c.website}</span>}</span>
                <ProtectedComponent permission="crm.winloss.manage">
                  <Button variant="ghost" size="sm" onClick={() => deleteCompetitor(c.id)}>x</Button>
                </ProtectedComponent>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {analytics && analytics.reasonsBreakdown?.length > 0 && (
        <Card title="Reasons Breakdown">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Reason</th><th className="text-left py-2">Type</th><th className="text-right py-2">Count</th><th className="text-right py-2">Value</th></tr></thead>
            <tbody>
              {analytics.reasonsBreakdown.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{r.name}</td>
                  <td className="py-2"><Badge variant={r.category === 'WIN' ? 'success' : 'danger'} size="sm">{r.category}</Badge></td>
                  <td className="py-2 text-right">{r.count}</td>
                  <td className="py-2 text-right">${(r.totalValue || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
