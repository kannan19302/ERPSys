'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Badge, DataTable, type Column, KPICard, Spinner } from '@unerp/ui';
import { CalendarClock, Play, CheckCircle2, XCircle, Layers, Search } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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

export default function SchedulingPage() {
  const client = useApiClient();
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState<'FORWARD' | 'BACKWARD'>('FORWARD');
  const [bomId, setBomId] = useState('');
  const [bomCost, setBomCost] = useState<BomCostResult | null>(null);
  const [bomLoading, setBomLoading] = useState(false);

  const fetchReference = useCallback(async () => {
    try {
      const [workstationData, workOrderData] = await Promise.all([
        client.get<Workstation[] | { data?: Workstation[] }>('/manufacturing/workstations'),
        client.get<WorkOrder[] | { data?: WorkOrder[] }>('/manufacturing/work-orders'),
      ]);
      setWorkstations(Array.isArray(workstationData) ? workstationData : (workstationData.data ?? []));
      setWorkOrders(Array.isArray(workOrderData) ? workOrderData : (workOrderData.data ?? []));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchReference();
  }, [fetchReference]);

  const runScheduling = async () => {
    setRunning(true);
    try {
      setResult(await client.post<ScheduleResult>('/manufacturing/scheduling/schedule', { algorithm }));
    } finally {
      setRunning(false);
    }
  };

  const lookupBomCost = async () => {
    if (!bomId.trim()) return;
    setBomLoading(true);
    setBomCost(null);
    try {
      setBomCost(await client.get<BomCostResult>(`/manufacturing/scheduling/bom-cost/${bomId.trim()}`));
    } finally {
      setBomLoading(false);
    }
  };

  const workstationName = (id: string) => workstations.find((w) => w.id === id)?.name || id;
  const workOrderNumber = (id: string) => workOrders.find((w) => w.id === id)?.workOrderNumber || id;
  const fmtTime = (iso: string) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const columns: Column<ScheduleEntry>[] = [
    { key: 'workOrderId', header: 'Work Order', render: (row) => <span className="font-semibold">{workOrderNumber(row.workOrderId)}</span> },
    { key: 'operationName', header: 'Operation' },
    { key: 'workstationId', header: 'Workstation', render: (row) => workstationName(row.workstationId) },
    { key: 'startTime', header: 'Start', render: (row) => fmtTime(row.startTime) },
    { key: 'endTime', header: 'End', render: (row) => fmtTime(row.endTime) },
  ];

  if (loading) {
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  return (
    <RouteGuard permission="manufacturing.scheduling.read">
    <div className="ui-stack-6">
      <PageHeader
        title="Finite Capacity Scheduling"
        description="Advanced planning & scheduling (APS): sequence work orders against real workstation availability, forward or backward from a start date."
        breadcrumbs={[{ label: 'Manufacturing', href: '/manufacturing' }, { label: 'Scheduling' }]}
      />

      <Card padding="md">
        <div className={styles.p1}>
          <div className="ui-stack-2">
            <label className="ui-heading-sm">Algorithm</label>
            <select
              className="ui-input"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as 'FORWARD' | 'BACKWARD')}
            >
              <option value="FORWARD">Forward (from today)</option>
              <option value="BACKWARD">Backward (from due date)</option>
            </select>
          </div>
          <Button variant="primary" onClick={runScheduling} disabled={running}>
            <Play size={14} className="mr-2" /> {running ? 'Scheduling…' : 'Run Scheduling'}
          </Button>
        </div>
      </Card>

      {result && (
        <>
          <div className="ui-grid-auto">
            <KPICard title="Scheduled Orders" value={result.scheduledOrders} icon={<CheckCircle2 size={20} />} color="var(--color-success)" />
            <KPICard title="Unscheduled Orders" value={result.unscheduledOrders} icon={<XCircle size={20} />} color="var(--color-danger)" />
            <KPICard title="Total Operations" value={result.totalOperations} icon={<Layers size={20} />} color="var(--color-primary)" />
          </div>

          {result.unscheduled.length > 0 && (
            <Card padding="md">
              <div className={styles.p2}>
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
        <h3 className={styles.p3}>BOM Cost Lookup</h3>
        <div className={styles.p4}>
          <input
            className={["ui-input", styles.p5].filter(Boolean).join(' ')}
          />
          <Button variant="outline" onClick={lookupBomCost} disabled={bomLoading}>
            <Search size={14} className="mr-2" /> {bomLoading ? 'Looking up…' : 'Look Up'}
          </Button>
        </div>
        {bomCost && (
          <div className="ui-stack-3">
            <div className={styles.p6}>
              <div>
                <div className="ui-text-xs-tertiary">Material Cost</div>
                <div className="font-bold">{fmtCurrency(bomCost.materialCost)}</div>
              </div>
              <div>
                <div className="ui-text-xs-tertiary">Labor Cost</div>
                <div className="font-bold">{fmtCurrency(bomCost.laborCost)}</div>
              </div>
            </div>
            <table className={styles.p7}>
              <thead>
                <tr className="border-b">
                  <th className={styles.p8}>Product</th>
                  <th className={styles.p9}>Qty</th>
                  <th className={styles.p10}>Unit Cost</th>
                  <th className={styles.p11}>Total</th>
                </tr>
              </thead>
              <tbody>
                {bomCost.itemCosts.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{item.productId}</td>
                    <td className={styles.p12}>{item.quantity}</td>
                    <td className={styles.p13}>{fmtCurrency(item.unitCost)}</td>
                    <td className={styles.p14}>{fmtCurrency(item.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!bomCost && !bomLoading && <Badge variant="default">Enter a BOM ID to view its material cost breakdown.</Badge>}
      </Card>
    </div>
    </RouteGuard>
  );
}
