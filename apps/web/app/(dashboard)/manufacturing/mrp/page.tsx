'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Check, ShoppingCart, Hammer, Calendar, AlertTriangle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface MRPPlannedItem {
  id: string;
  productId: string;
  bomId: string | null;
  demandSource: string;
  demandSourceId: string | null;
  quantityNeeded: string | number;
  quantityInStock: string | number;
  netQuantityRequired: string | number;
  actionType: 'CREATE_WORK_ORDER' | 'CREATE_PURCHASE_ORDER';
  status: 'PENDING' | 'PROCESSED';
  createdAt: string;
  product: Product;
}

interface MRPRun {
  id: string;
  runDate: string;
  status: string;
  runBy: string | null;
  plannedItems: MRPPlannedItem[];
}

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  status: string;
  quantity: number;
  startDate: string | null;
  endDate: string | null;
  bom: { name: string };
  workstation: { id: string; name: string } | null;
}

interface Workstation {
  id: string;
  name: string;
  code: string;
}

export default function MRPPage() {
  const client = useApiClient();
  const [runs, setRuns] = useState<MRPRun[]>([]);
  const [plannedItems, setPlannedItems] = useState<MRPPlannedItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [runningMRP, setRunningMRP] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Gantt / Scheduler Options
  const [schedulerDays, setSchedulerDays] = useState<string[]>([]);

  useEffect(() => {
    void fetchData();
    generateSchedulerDays();
  }, [client]);

  const generateSchedulerDays = () => {
    const days = [];
    const base = new Date();
    for (let i = -2; i < 8; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    setSchedulerDays(days);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [runsData, workOrderData, workstationData] = await Promise.all([
        client.get<MRPRun[]>('/manufacturing/mrp/runs'),
        client.get<WorkOrder[]>('/manufacturing/work-orders'),
        client.get<Workstation[]>('/manufacturing/workstations'),
      ]);
      setRuns(runsData);
        const flattened: MRPPlannedItem[] = [];
        const seenIds = new Set<string>();
        runsData.forEach((run) => {
          if (run.plannedItems) {
            run.plannedItems.forEach((item) => {
              if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                flattened.push(item);
              }
            });
          }
        });
        setPlannedItems(flattened);
      setWorkOrders(workOrderData);
      setWorkstations(workstationData);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleRunMRP = async () => {
    try {
      setRunningMRP(true);
      await client.post('/manufacturing/mrp/run');
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error starting MRP');
    } finally {
      setRunningMRP(false);
    }
  };

  const handleProcessItem = async (id: string) => {
    try {
      setProcessingId(id);
      const result = await client.post<{ reference: string }>(`/manufacturing/mrp/planned-items/${id}/process`);
      alert(`Successfully processed! Created ${result.reference}`);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error processing action');
    } finally {
      setProcessingId(null);
    }
  };

  // Calculations
  const pendingCount = plannedItems.filter((i) => i.status === 'PENDING').length;
  const woCount = plannedItems.filter((i) => i.status === 'PENDING' && i.actionType === 'CREATE_WORK_ORDER').length;
  const poCount = plannedItems.filter((i) => i.status === 'PENDING' && i.actionType === 'CREATE_PURCHASE_ORDER').length;

  // Helper to determine if a Work Order spans a specific date
  const getWOsOnDate = (wsId: string, dateStr: string): WorkOrder[] => {
    return workOrders.filter((wo) => {
      if (!wo.workstation || wo.workstation.id !== wsId) return false;
      if (!wo.startDate) return false;
      const start = wo.startDate.slice(0, 10);
      // Assume a 2-day duration for visual simplicity if endDate is missing
      const end = wo.endDate ? wo.endDate.slice(0, 10) : new Date(new Date(wo.startDate).getTime() + 48 * 3600000).toISOString().slice(0, 10);
      return dateStr >= start && dateStr <= end;
    });
  };

  return (
    <RouteGuard permission="manufacturing.mrp.read">
    <div className="ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <Layers size={28} className="ui-text-primary" />
            Material Requirements Planning (MRP)
          </h1>
          <p className={styles.p2}>
            Trigger demand-driven replenishment loops, calculate net safety stock requirements, and dispatch POs/WOs.
          </p>
        </div>
        <button
          onClick={handleRunMRP}
          disabled={runningMRP}
          style={{ opacity: runningMRP ? 0.7 : 1 }} className={styles.s1}
        >
          <RefreshCw size={16} className={runningMRP ? 'animate-spin' : ''} />
          {runningMRP ? 'Running Engine...' : 'Run MRP Calculation'}
        </button>
      </div>

      {/* KPI Tiles */}
      <div className={styles.p3}>
        <div className={styles.p4}>
          <p className={styles.p5}>PENDING MRP RECOMMENDATIONS</p>
          <p className={styles.p6}>{pendingCount}</p>
        </div>
        <div className={styles.p7}>
          <p className={styles.p8}>SUGGESTED WORK ORDERS (WO)</p>
          <p className={styles.p9}>{woCount}</p>
        </div>
        <div className={styles.p10}>
          <p className={styles.p11}>SUGGESTED PURCHASE ORDERS (PO)</p>
          <p className={styles.p12}>{poCount}</p>
        </div>
      </div>

      {/* Gantt scheduler timeline */}
      <div className={styles.p13}>
        <h3 className={styles.p14}>
          <Calendar size={20} className="ui-text-primary" />
          Workstation Gantt Operations Scheduler
        </h3>

        {loading ? (
          <div className="text-center p-12">Loading scheduler board...</div>
        ) : (
          <div className={styles.p15}>
            {/* Header Dates Row */}
            <div className={styles.p16}>
              <div className={styles.p17}>Workstation</div>
              {schedulerDays.map((day) => {
                const dateObj = new Date(day);
                return (
                  <div key={day} className={styles.p18}>
                    <div>{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className={styles.p19}>
                      {dateObj.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Workstation Rows */}
            {workstations.map((ws) => (
              <div key={ws.id} className={styles.p20}>
                <div className={styles.p21}>{ws.name}</div>
                {schedulerDays.map((day) => {
                  const activeWOs = getWOsOnDate(ws.id, day);
                  const isConflict = activeWOs.length > 1;
                  return (
                    <div key={day} className={styles.p22}>
                      {activeWOs.map((wo) => (
                        <span
                          key={wo.id}
                          title={`${wo.workOrderNumber}: ${wo.bom.name} (${Number(wo.quantity)} units)`}
                          style={{ background: isConflict ? 'var(--color-danger-light)' : 'var(--color-primary-light)', color: isConflict ? 'var(--color-danger)' : 'var(--color-primary)', border: isConflict ? '1px solid var(--color-danger)' : '1px solid var(--color-primary)' }} className={styles.s2}
                        >
                          {wo.workOrderNumber}
                        </span>
                      ))}
                      {isConflict && (
                        <span title="Workstation Overload Conflict!"><AlertTriangle size={10} className="ui-text-danger" /></span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Replenishments Grid */}
      <div className={styles.p23}>
        <h3 className={styles.p24}>Suggested Replenishment List</h3>

        {loading ? (
          <div className="text-center p-12">Loading MRP suggestions...</div>
        ) : (
          <div className="ui-stack-3">
            <div className={styles.p25}>
              <div>PRODUCT / SKU</div>
              <div>DEMAND SOURCE</div>
              <div>QTY NEEDED</div>
              <div>STOCK QTY</div>
              <div>NET REQ</div>
              <div className="text-right">ACTION RECOMMENDATION</div>
            </div>

            {plannedItems.map((item) => (
              <div
                key={item.id}
                style={{ opacity: item.status === 'PROCESSED' ? 0.6 : 1 }} className={styles.s3}
              >
                <div>
                  <p className="ui-heading-sm font-bold">{item.product.name}</p>
                  <p className={styles.p26}>{item.product.sku}</p>
                </div>

                <div>
                  <span className="ui-text-xs-label">
                    {item.demandSource === 'SALES_ORDER' ? 'Sales Demand' : 'BOM Child Component'}
                  </span>
                </div>

                <div>
                  <span className="text-sm">{Number(item.quantityNeeded)}</span>
                </div>

                <div>
                  <span className="ui-text-sm-muted">{Number(item.quantityInStock)}</span>
                </div>

                <div>
                  <span style={{ color: Number(item.netQuantityRequired) > 0 ? 'var(--color-danger)' : 'var(--color-text)' }} className={styles.s4}>
                    {Number(item.netQuantityRequired)}
                  </span>
                </div>

                <div className="ui-flex-end ui-gap-2">
                  {item.status === 'PROCESSED' ? (
                    <span className={styles.p27}>
                      <Check size={14} /> Processed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleProcessItem(item.id)}
                      disabled={processingId === item.id}
                      style={{ background: item.actionType === 'CREATE_WORK_ORDER' ? 'var(--color-primary)' : 'var(--color-success)' }} className={styles.s5}
                    >
                      {item.actionType === 'CREATE_WORK_ORDER' ? (
                        <>
                          <Hammer size={12} /> Make Work Order
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={12} /> Buy Materials
                        </>
                      )}
                      {processingId === item.id && '...'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {plannedItems.length === 0 && (
              <div className="ui-empty-state">
                No active requirements suggestions found. Click "Run MRP Calculation" to inspect order pipelines.
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Log */}
      <div className={styles.p28}>
        <h3 className={styles.p29}>Calculation History Traces</h3>
        <div className="ui-stack-2">
          {runs.map((run) => (
            <div key={run.id} className={styles.p30}>
              <span className="text-sm">
                <strong>Run ID:</strong> {run.id} | <strong>Date:</strong> {new Date(run.runDate).toLocaleString()}
              </span>
              <span style={{ color: run.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s6}>
                {run.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </RouteGuard>
  );
}
