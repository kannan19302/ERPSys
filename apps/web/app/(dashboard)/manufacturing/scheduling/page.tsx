'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Badge, DataTable, type Column, KPICard, Spinner } from '@unerp/ui';
import { CalendarClock, Play, CheckCircle2, XCircle, Layers, Search } from 'lucide-react';

interface Workstation {
  id: string;
  code: string;
  name: string;
}

interface WorkOrder {
  id: string;
  workOrderNumber: string;
}

interface ScheduleEntry {
  workOrderId: string;
  workstationId: string;
  startTime: string;
  endTime: string;
  operationName: string;
}

interface ScheduleResult {
  algorithm: 'FORWARD' | 'BACKWARD';
  scheduledOrders: number;
  unscheduledOrders: number;
  totalOperations: number;
  schedule: ScheduleEntry[];
  unscheduled: string[];
}

interface BomCostResult {
  materialCost: number;
  laborCost: number;
  itemCosts: Array<{ productId: string; quantity: number; unitCost: number; totalCost: number }>;
}

const API_BASE = 'http://localhost:3001/api/v1';

export default function SchedulingPage() {
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState<'FORWARD' | 'BACKWARD'>('FORWARD');
  const [bomId, setBomId] = useState('');
  const [bomCost, setBomCost] = useState<BomCostResult | null>(null);
  const [bomLoading, setBomLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('admin_token') || '' : '';

  const fetchReference = useCallback(async () => {
    try {
      const [wsRes, woRes] = await Promise.all([
        fetch(`${API_BASE}/manufacturing/workstations`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/manufacturing/work-orders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (wsRes.ok) setWorkstations(await wsRes.json().then((d) => (Array.isArray(d) ? d : d?.data || [])));
      if (woRes.ok) setWorkOrders(await woRes.json().then((d) => (Array.isArray(d) ? d : d?.data || [])));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReference();
  }, [fetchReference]);

  const runScheduling = async () => {
    setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/manufacturing/scheduling/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ algorithm }),
      });
      if (res.ok) setResult(await res.json());
    } finally {
      setRunning(false);
    }
  };

  const lookupBomCost = async () => {
    if (!bomId.trim()) return;
    setBomLoading(true);
    setBomCost(null);
    try {
      const res = await fetch(`${API_BASE}/manufacturing/scheduling/bom-cost/${bomId.trim()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBomCost(await res.json());
    } finally {
      setBomLoading(false);
    }
  };

  const workstationName = (id: string) => workstations.find((w) => w.id === id)?.name || id;
  const workOrderNumber = (id: string) => workOrders.find((w) => w.id === id)?.workOrderNumber || id;
  const fmtTime = (iso: string) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const columns: Column<ScheduleEntry>[] = [
    { key: 'workOrderId', header: 'Work Order', render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{workOrderNumber(row.workOrderId)}</span> },
    { key: 'operationName', header: 'Operation' },
    { key: 'workstationId', header: 'Workstation', render: (row) => workstationName(row.workstationId) },
    { key: 'startTime', header: 'Start', render: (row) => fmtTime(row.startTime) },
    { key: 'endTime', header: 'End', render: (row) => fmtTime(row.endTime) },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Finite Capacity Scheduling"
        description="Advanced planning & scheduling (APS): sequence work orders against real workstation availability, forward or backward from a start date."
        breadcrumbs={[{ label: 'Manufacturing', href: '/manufacturing' }, { label: 'Scheduling' }]}
      />

      <Card padding="md">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Algorithm</label>
            <select
              className="frappe-input"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as 'FORWARD' | 'BACKWARD')}
            >
              <option value="FORWARD">Forward (from today)</option>
              <option value="BACKWARD">Backward (from due date)</option>
            </select>
          </div>
          <Button variant="primary" onClick={runScheduling} disabled={running}>
            <Play size={14} style={{ marginRight: 6 }} /> {running ? 'Scheduling…' : 'Run Scheduling'}
          </Button>
        </div>
      </Card>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <KPICard title="Scheduled Orders" value={result.scheduledOrders} icon={<CheckCircle2 size={20} />} color="var(--color-success)" />
            <KPICard title="Unscheduled Orders" value={result.unscheduledOrders} icon={<XCircle size={20} />} color="var(--color-danger)" />
            <KPICard title="Total Operations" value={result.totalOperations} icon={<Layers size={20} />} color="var(--color-primary)" />
          </div>

          {result.unscheduled.length > 0 && (
            <Card padding="md">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>
                <XCircle size={14} />
                {result.unscheduled.length} work order(s) could not be scheduled (no operations defined or no matching workstation):{' '}
                {result.unscheduled.map((id) => workOrderNumber(id)).join(', ')}
              </div>
            </Card>
          )}

          <Card padding="none">
            <DataTable
              columns={columns}
              data={result.schedule}
              rowKey={(r, i) => `${r.workOrderId}-${i}`}
              emptyTitle="No scheduled operations"
              emptyMessage="Run scheduling to sequence work orders across workstations."
              emptyIcon={<CalendarClock size={48} />}
            />
          </Card>
        </>
      )}

      <Card padding="md">
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>BOM Cost Lookup</h3>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <input
            className="frappe-input"
            placeholder="BOM ID"
            value={bomId}
            onChange={(e) => setBomId(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <Button variant="outline" onClick={lookupBomCost} disabled={bomLoading}>
            <Search size={14} style={{ marginRight: 6 }} /> {bomLoading ? 'Looking up…' : 'Look Up'}
          </Button>
        </div>
        {bomCost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Material Cost</div>
                <div style={{ fontWeight: 'var(--weight-bold)' }}>{fmtCurrency(bomCost.materialCost)}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Labor Cost</div>
                <div style={{ fontWeight: 'var(--weight-bold)' }}>{fmtCurrency(bomCost.laborCost)}</div>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2)' }}>Product</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2)' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2)' }}>Unit Cost</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {bomCost.itemCosts.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-2)' }}>{item.productId}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--space-2)' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--space-2)' }}>{fmtCurrency(item.unitCost)}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--space-2)' }}>{fmtCurrency(item.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!bomCost && !bomLoading && <Badge variant="default">Enter a BOM ID to view its material cost breakdown.</Badge>}
      </Card>
    </div>
  );
}
