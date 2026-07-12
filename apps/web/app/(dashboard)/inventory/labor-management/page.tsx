'use client';

import { useState, useEffect } from 'react';
import { Card } from '@unerp/ui';
import { Users, Clock, TrendingUp, Calendar } from 'lucide-react';

interface LaborDashboard {
  period: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  byTaskType: { taskType: string; count: number; avgEfficiencyPct: number | null }[];
  topWorkers: { workerId: string; workerName: string; completedTasks: number; avgEfficiencyPct: number | null }[];
}

interface LaborStandard {
  id: string;
  taskType: string;
  description: string | null;
  standardMins: number;
  warehouseId: string | null;
  isActive: boolean;
}

interface ShiftTemplate {
  id: string;
  shiftName: string;
  warehouseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  headcount: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function LaborManagementPage() {
  const [tab, setTab] = useState<'dashboard' | 'standards' | 'shifts'>('dashboard');
  const [dashboard, setDashboard] = useState<LaborDashboard | null>(null);
  const [standards, setStandards] = useState<LaborStandard[]>([]);
  const [shifts, setShifts] = useState<ShiftTemplate[]>([]);
  const [showStandardForm, setShowStandardForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchDashboard(); fetchStandards(); fetchShifts(); }, []);

  async function fetchDashboard() {
    const r = await fetch('/api/inventory/labor/dashboard');
    if (r.ok) setDashboard(await r.json());
  }

  async function fetchStandards() {
    const r = await fetch('/api/inventory/labor/standards');
    if (r.ok) setStandards(await r.json());
  }

  async function fetchShifts() {
    const r = await fetch('/api/inventory/labor/shift-templates');
    if (r.ok) setShifts(await r.json());
  }

  async function createStandard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await fetch('/api/inventory/labor/standards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskType: fd.get('taskType'),
        description: fd.get('description') || undefined,
        standardMins: parseFloat(fd.get('standardMins') as string),
      }),
    });
    setLoading(false);
    setShowStandardForm(false);
    fetchStandards();
  }

  async function createShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await fetch('/api/inventory/labor/shift-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        warehouseId: fd.get('warehouseId'),
        shiftName: fd.get('shiftName'),
        dayOfWeek: parseInt(fd.get('dayOfWeek') as string),
        startTime: fd.get('startTime'),
        endTime: fd.get('endTime'),
        headcount: parseInt(fd.get('headcount') as string) || 1,
      }),
    });
    setLoading(false);
    setShowShiftForm(false);
    fetchShifts();
  }

  async function deleteStandard(id: string) {
    await fetch(`/api/inventory/labor/standards/${id}`, { method: 'DELETE' });
    fetchStandards();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Labor Management</h1>
          <p className="text-sm text-muted-foreground">Warehouse workforce productivity and shift planning</p>
        </div>
      </div>

      {/* Stat Tiles */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks (7d)', value: dashboard.totalTasks, icon: Clock, color: 'text-blue-600' },
            { label: 'Completed', value: dashboard.completedTasks, icon: TrendingUp, color: 'text-green-600' },
            { label: 'Completion Rate', value: `${dashboard.completionRate}%`, icon: TrendingUp, color: 'text-purple-600' },
            { label: 'Task Types Active', value: dashboard.byTaskType.length, icon: Users, color: 'text-orange-600' },
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

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['dashboard', 'standards', 'shifts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'dashboard' ? 'Productivity' : t === 'standards' ? 'Labor Standards' : 'Shift Templates'}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">By Task Type</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-1">Type</th>
                <th className="text-right py-1">Count</th>
                <th className="text-right py-1">Avg Efficiency</th>
              </tr></thead>
              <tbody>
                {dashboard.byTaskType.map((r) => (
                  <tr key={r.taskType} className="border-b last:border-0">
                    <td className="py-1">{r.taskType}</td>
                    <td className="text-right">{r.count}</td>
                    <td className="text-right">{r.avgEfficiencyPct != null ? `${Math.round(Number(r.avgEfficiencyPct))}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Top Workers (7d)</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-1">Worker</th>
                <th className="text-right py-1">Tasks</th>
                <th className="text-right py-1">Efficiency</th>
              </tr></thead>
              <tbody>
                {dashboard.topWorkers.map((w) => (
                  <tr key={w.workerId} className="border-b last:border-0">
                    <td className="py-1">{w.workerName}</td>
                    <td className="text-right">{w.completedTasks}</td>
                    <td className="text-right">{w.avgEfficiencyPct != null ? `${Math.round(Number(w.avgEfficiencyPct))}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Standards Tab */}
      {tab === 'standards' && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Labor Standards</h3>
            <button onClick={() => setShowStandardForm(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">+ Add Standard</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left">
              <th className="py-2">Task Type</th><th className="py-2">Std Minutes</th><th className="py-2">Description</th><th className="py-2">Actions</th>
            </tr></thead>
            <tbody>
              {standards.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{s.taskType}</td>
                  <td className="py-2">{Number(s.standardMins).toFixed(1)}</td>
                  <td className="py-2 text-muted-foreground">{s.description ?? '—'}</td>
                  <td className="py-2"><button onClick={() => deleteStandard(s.id)} className="text-destructive hover:underline text-xs">Delete</button></td>
                </tr>
              ))}
              {standards.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No standards defined</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {/* Shifts Tab */}
      {tab === 'shifts' && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Shift Templates</h3>
            <button onClick={() => setShowShiftForm(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">+ Add Shift</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left">
              <th className="py-2">Shift</th><th className="py-2">Day</th><th className="py-2">Hours</th><th className="py-2">Headcount</th>
            </tr></thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{s.shiftName}</td>
                  <td className="py-2">{DAY_NAMES[s.dayOfWeek]}</td>
                  <td className="py-2">{s.startTime}–{s.endTime}</td>
                  <td className="py-2">{s.headcount}</td>
                </tr>
              ))}
              {shifts.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No shifts defined</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Standard Modal */}
      {showStandardForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Add Labor Standard</h3>
            <form onSubmit={createStandard} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Task Type</label>
                <select name="taskType" required className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background">
                  {['PICK','PACK','RECEIVE','PUTAWAY','CYCLE_COUNT','TRANSFER','LABEL','SORT'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Standard Minutes</label>
                <input name="standardMins" type="number" step="0.1" min="0.1" required className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <input name="description" className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowStandardForm(false)} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">Create</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Create Shift Modal */}
      {showShiftForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Add Shift Template</h3>
            <form onSubmit={createShift} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Shift Name</label>
                <input name="shiftName" required className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div>
                <label className="text-sm font-medium">Warehouse ID</label>
                <input name="warehouseId" required className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div>
                <label className="text-sm font-medium">Day of Week</label>
                <select name="dayOfWeek" className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background">
                  {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <input name="startTime" type="time" required className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <input name="endTime" type="time" required className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Headcount</label>
                <input name="headcount" type="number" min="1" defaultValue="1" className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowShiftForm(false)} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">Create</button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
