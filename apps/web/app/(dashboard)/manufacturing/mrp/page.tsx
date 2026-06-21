'use client';

import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Check, ShoppingCart, Hammer, Calendar, AlertTriangle } from 'lucide-react';

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
    fetchData();
    generateSchedulerDays();
  }, []);

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
      const token = localStorage.getItem('token');
      
      const [runsRes, woRes, wsRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/manufacturing/mrp/runs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/manufacturing/work-orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/manufacturing/workstations', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (runsRes.ok) {
        const data = await runsRes.json();
        setRuns(Array.isArray(data) ? data : (data?.data || []));
        const flattened: MRPPlannedItem[] = [];
        const seenIds = new Set<string>();
        data.forEach((run: MRPRun) => {
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
      }

      if (woRes.ok) {
        setWorkOrders(await woRes.json());
      }
      if (wsRes.ok) {
        setWorkstations(await wsRes.json());
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleRunMRP = async () => {
    try {
      setRunningMRP(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/mrp/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('MRP calculation failed');
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
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/manufacturing/mrp/planned-items/${id}/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to process planned action');
      const result = await res.json();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Layers size={28} style={{ color: 'var(--color-primary)' }} />
            Material Requirements Planning (MRP)
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Trigger demand-driven replenishment loops, calculate net safety stock requirements, and dispatch POs/WOs.
          </p>
        </div>
        <button
          onClick={handleRunMRP}
          disabled={runningMRP}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            padding: 'var(--space-2.5) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            opacity: runningMRP ? 0.7 : 1,
          }}
        >
          <RefreshCw size={16} className={runningMRP ? 'animate-spin' : ''} />
          {runningMRP ? 'Running Engine...' : 'Run MRP Calculation'}
        </button>
      </div>

      {/* KPI Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>PENDING MRP RECOMMENDATIONS</p>
          <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-2)' }}>{pendingCount}</p>
        </div>
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)' }}>
          <p style={{ color: 'var(--color-primary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>SUGGESTED WORK ORDERS (WO)</p>
          <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-2)' }}>{woCount}</p>
        </div>
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)' }}>
          <p style={{ color: 'var(--color-success)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>SUGGESTED PURCHASE ORDERS (PO)</p>
          <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-2)' }}>{poCount}</p>
        </div>
      </div>

      {/* Gantt scheduler timeline */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
          Workstation Gantt Operations Scheduler
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading scheduler board...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
            {/* Header Dates Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px repeat(10, 1fr)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', minWidth: '800px' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Workstation</div>
              {schedulerDays.map((day) => {
                const dateObj = new Date(day);
                return (
                  <div key={day} style={{ textAlign: 'center', fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                    <div>{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div style={{ marginTop: '2px', background: 'var(--color-bg-hover)', borderRadius: '4px', padding: '2px' }}>
                      {dateObj.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Workstation Rows */}
            {workstations.map((ws) => (
              <div key={ws.id} style={{ display: 'grid', gridTemplateColumns: '200px repeat(10, 1fr)', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)', minWidth: '800px' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{ws.name}</div>
                {schedulerDays.map((day) => {
                  const activeWOs = getWOsOnDate(ws.id, day);
                  const isConflict = activeWOs.length > 1;
                  return (
                    <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '36px', justifyContent: 'center', borderRight: '1px dashed var(--color-border)' }}>
                      {activeWOs.map((wo) => (
                        <span
                          key={wo.id}
                          title={`${wo.workOrderNumber}: ${wo.bom.name} (${Number(wo.quantity)} units)`}
                          style={{
                            width: '90%',
                            fontSize: '9px',
                            background: isConflict ? 'var(--color-danger-light)' : 'var(--color-primary-light)',
                            color: isConflict ? 'var(--color-danger)' : 'var(--color-primary)',
                            textAlign: 'center',
                            borderRadius: '3px',
                            fontWeight: 'bold',
                            padding: '2px 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            border: isConflict ? '1px solid var(--color-danger)' : '1px solid var(--color-primary)'
                          }}
                        >
                          {wo.workOrderNumber}
                        </span>
                      ))}
                      {isConflict && (
                        <AlertTriangle size={10} style={{ color: 'var(--color-danger)' }} title="Workstation Overload Conflict!" />
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
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)' }}>Suggested Replenishment List</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading MRP suggestions...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.2fr',
              padding: 'var(--space-3) var(--space-4)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div>PRODUCT / SKU</div>
              <div>DEMAND SOURCE</div>
              <div>QTY NEEDED</div>
              <div>STOCK QTY</div>
              <div>NET REQ</div>
              <div style={{ textAlign: 'right' }}>ACTION RECOMMENDATION</div>
            </div>

            {plannedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.2fr',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  borderBottom: '1px solid var(--color-border)',
                  opacity: item.status === 'PROCESSED' ? 0.6 : 1,
                }}
              >
                <div>
                  <p style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{item.product.name}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{item.product.sku}</p>
                </div>

                <div>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
                    {item.demandSource === 'SALES_ORDER' ? 'Sales Demand' : 'BOM Child Component'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: 'var(--text-sm)' }}>{Number(item.quantityNeeded)}</span>
                </div>

                <div>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{Number(item.quantityInStock)}</span>
                </div>

                <div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: Number(item.netQuantityRequired) > 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>
                    {Number(item.netQuantityRequired)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  {item.status === 'PROCESSED' ? (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
                      <Check size={14} /> Processed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleProcessItem(item.id)}
                      disabled={processingId === item.id}
                      style={{
                        background: item.actionType === 'CREATE_WORK_ORDER' ? 'var(--color-primary)' : 'var(--color-success)',
                        color: 'white',
                        border: 'none',
                        padding: 'var(--space-1.5) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--weight-semibold)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
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
              <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
                No active requirements suggestions found. Click "Run MRP Calculation" to inspect order pipelines.
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Log */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Calculation History Traces</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {runs.map((run) => (
            <div key={run.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg)' }}>
              <span style={{ fontSize: 'var(--text-sm)' }}>
                <strong>Run ID:</strong> {run.id} | <strong>Date:</strong> {new Date(run.runDate).toLocaleString()}
              </span>
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'bold',
                color: run.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-danger)'
              }}>
                {run.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
