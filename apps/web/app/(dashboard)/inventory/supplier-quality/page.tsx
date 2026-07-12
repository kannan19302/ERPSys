'use client';

import { useState, useEffect } from 'react';
import { Card, Badge } from '@unerp/ui';
import { AlertTriangle, CheckCircle, ClipboardList, Star } from 'lucide-react';

interface QualityDashboard {
  totalNcrs: number;
  openNcrs: number;
  criticalNcrs: number;
  pendingCars: number;
  recentScorecards: Scorecard[];
}

interface Scorecard {
  id: string;
  vendorId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number | null;
  qualityScore: number | null;
  deliveryScore: number | null;
  fillRateScore: number | null;
  vendor: { id: string; name: string };
}

interface Ncr {
  id: string;
  ncrNumber: string;
  defectType: string;
  severity: string;
  status: string;
  description: string;
  defectQty: number;
  totalQty: number;
  vendor: { id: string; name: string };
  _count: { carRequests: number };
}

const SEVERITY_VARIANT: Record<string, 'default' | 'warning' | 'danger'> = {
  MINOR: 'default',
  MAJOR: 'warning',
  CRITICAL: 'danger',
};

export default function SupplierQualityPage() {
  const [tab, setTab] = useState<'dashboard' | 'ncrs' | 'cars' | 'scorecards'>('dashboard');
  const [dashboard, setDashboard] = useState<QualityDashboard | null>(null);
  const [ncrs, setNcrs] = useState<Ncr[]>([]);
  const [showNcrForm, setShowNcrForm] = useState(false);
  const [showCarForm, setShowCarForm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchDashboard(); fetchNcrs(); }, []);

  async function fetchDashboard() {
    const r = await fetch('/api/inventory/supplier-quality/dashboard');
    if (r.ok) setDashboard(await r.json());
  }

  async function fetchNcrs() {
    const r = await fetch('/api/inventory/supplier-quality/ncrs');
    if (r.ok) setNcrs(await r.json());
  }

  async function createNcr(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await fetch('/api/inventory/supplier-quality/ncrs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: fd.get('vendorId'),
        defectType: fd.get('defectType'),
        severity: fd.get('severity'),
        defectQty: parseInt(fd.get('defectQty') as string) || 0,
        totalQty: parseInt(fd.get('totalQty') as string) || 0,
        description: fd.get('description'),
      }),
    });
    setLoading(false);
    setShowNcrForm(false);
    fetchNcrs();
    fetchDashboard();
  }

  async function raiseCar(ncrId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await fetch('/api/inventory/supplier-quality/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ncrId,
        rootCause: fd.get('rootCause') || undefined,
        correctiveAction: fd.get('correctiveAction') || undefined,
      }),
    });
    setLoading(false);
    setShowCarForm(null);
    fetchNcrs();
  }

  async function closeNcr(id: string) {
    const resolution = prompt('Enter resolution notes:');
    if (!resolution) return;
    await fetch(`/api/inventory/supplier-quality/ncrs/${id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution }),
    });
    fetchNcrs();
    fetchDashboard();
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Supplier Quality Management</h1>
        <p className="text-sm text-muted-foreground">NCRs, corrective actions, and vendor scorecards</p>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total NCRs', value: dashboard.totalNcrs, icon: ClipboardList, color: 'text-blue-600' },
            { label: 'Open NCRs', value: dashboard.openNcrs, icon: AlertTriangle, color: 'text-orange-600' },
            { label: 'Critical NCRs', value: dashboard.criticalNcrs, icon: AlertTriangle, color: 'text-red-600' },
            { label: 'Pending CARs', value: dashboard.pendingCars, icon: CheckCircle, color: 'text-purple-600' },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <s.icon className={`w-8 h-8 ${s.color}`} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b">
        {(['dashboard', 'ncrs', 'cars', 'scorecards'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'cars' ? 'CARs' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && dashboard && dashboard.recentScorecards.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Recent Scorecards</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left">
              <th className="py-2">Vendor</th>
              <th className="py-2">Period</th>
              <th className="py-2 text-right">Quality</th>
              <th className="py-2 text-right">Delivery</th>
              <th className="py-2 text-right">Overall</th>
            </tr></thead>
            <tbody>
              {dashboard.recentScorecards.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2">{s.vendor.name}</td>
                  <td className="py-2 text-muted-foreground">{new Date(s.periodStart).toLocaleDateString()}</td>
                  <td className="py-2 text-right">{s.qualityScore != null ? Number(s.qualityScore).toFixed(0) : '—'}</td>
                  <td className="py-2 text-right">{s.deliveryScore != null ? Number(s.deliveryScore).toFixed(0) : '—'}</td>
                  <td className="py-2 text-right font-semibold">{s.overallScore != null ? Number(s.overallScore).toFixed(1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'ncrs' && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Non-Conformance Reports</h3>
            <button onClick={() => setShowNcrForm(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">+ Raise NCR</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left">
              <th className="py-2">NCR#</th><th className="py-2">Vendor</th><th className="py-2">Defect</th>
              <th className="py-2">Severity</th><th className="py-2">Status</th><th className="py-2">CARs</th><th className="py-2">Actions</th>
            </tr></thead>
            <tbody>
              {ncrs.map((n) => (
                <tr key={n.id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{n.ncrNumber}</td>
                  <td className="py-2">{n.vendor.name}</td>
                  <td className="py-2">{n.defectType}</td>
                  <td className="py-2"><Badge variant={SEVERITY_VARIANT[n.severity] ?? 'default'}>{n.severity}</Badge></td>
                  <td className="py-2">{n.status}</td>
                  <td className="py-2 text-center">{n._count.carRequests}</td>
                  <td className="py-2 flex gap-2">
                    {n.status !== 'CLOSED' && (
                      <>
                        <button onClick={() => setShowCarForm(n.id)} className="text-primary hover:underline text-xs">Raise CAR</button>
                        <button onClick={() => closeNcr(n.id)} className="text-muted-foreground hover:underline text-xs">Close</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {ncrs.length === 0 && <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">No NCRs found</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create NCR Modal */}
      {showNcrForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Raise NCR</h3>
            <form onSubmit={createNcr} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Vendor ID</label>
                <input name="vendorId" required className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div>
                <label className="text-sm font-medium">Defect Type</label>
                <select name="defectType" className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background">
                  {['DIMENSIONAL','COSMETIC','FUNCTIONAL','DOCUMENTATION','LABELING','QUANTITY'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <select name="severity" className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background">
                  {['MINOR','MAJOR','CRITICAL'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Defect Qty</label>
                  <input name="defectQty" type="number" min="0" defaultValue="0" className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium">Total Qty</label>
                  <input name="totalQty" type="number" min="0" defaultValue="0" className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea name="description" required rows={3} className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNcrForm(false)} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">Raise NCR</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* CAR Modal */}
      {showCarForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Raise Corrective Action Request</h3>
            <form onSubmit={(e) => raiseCar(showCarForm, e)} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Root Cause (optional)</label>
                <textarea name="rootCause" rows={2} className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div>
                <label className="text-sm font-medium">Required Corrective Action</label>
                <textarea name="correctiveAction" rows={3} className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCarForm(null)} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">Raise CAR</button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
