'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Cpu, Clock, Layers, ShieldCheck } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  status: string;
  quantity: number;
  startDate: string | null;
  lotNumber?: string | null;
  bom: {
    id: string;
    name: string;
  };
}

interface Workstation {
  id: string;
  name: string;
  code: string;
}

interface Operation {
  id: string;
  sequence: number;
  name: string;
  workstationCode: string;
  durationMinutes: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED';
  startedAt: string | null;
  completedAt: string | null;
  operatorId: string | null;
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

export default function ShopFloorTerminal() {
  const client = useApiClient();
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string>('');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Active WO operation tracking
  const [activeWO, setActiveWO] = useState<WorkOrder | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [opLoading, setOpLoading] = useState(false);

  // Operation log progress state
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [scrapQty, setScrapQty] = useState('0');
  const [lotNumberConsumed, setLotNumberConsumed] = useState('');
  const [componentProductId, setComponentProductId] = useState('');
  const [submittingOp, setSubmittingOp] = useState(false);

  // Downtime log state
  const [downtimeCode, setDowntimeCode] = useState('');
  const [downtimeNotes, setDowntimeNotes] = useState('');

  useEffect(() => {
    void fetchInitialData();
  }, [client]);

  useEffect(() => {
    if (selectedWorkstationId) {
      void fetchWorkOrders();
    }
  }, [selectedWorkstationId, client]);

  const fetchInitialData = async () => {
    try {
      const [workstationData, productData] = await Promise.all([
        client.get<Workstation[] | { data?: Workstation[] }>('/manufacturing/workstations'),
        client.get<Product[] | { data?: Product[] }>('/inventory/products'),
      ]);
      const workstations = Array.isArray(workstationData) ? workstationData : (workstationData.data ?? []);
      setWorkstations(workstations);
      if (workstations.length > 0 && workstations[0]) setSelectedWorkstationId(workstations[0].id);
      setProducts(Array.isArray(productData) ? productData : (productData.data || []));
    } catch {
      // Ignored
    }
  };

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const data = await client.get<WorkOrder[]>('/manufacturing/work-orders');
      setWorkOrders(data.filter((w) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED'));
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const fetchOperations = async (woId: string) => {
    try {
      setOpLoading(true);
      setOperations(await client.get<Operation[]>(`/manufacturing/work-orders/${woId}/operations`));
    } catch {
      // Ignored
    } finally {
      setOpLoading(false);
    }
  };

  const handleSelectWorkOrder = (wo: WorkOrder) => {
    setActiveWO(wo);
    fetchOperations(wo.id);
  };

  const handleStartOperation = async (opId: string) => {
    if (!activeWO) return;
    try {
      await client.post(`/manufacturing/work-orders/${activeWO.id}/operations/${opId}/start`);
      void fetchOperations(activeWO.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error starting operation');
    }
  };

  const handleOpenCompleteModal = (op: Operation) => {
    setSelectedOp(op);
    setScrapQty('0');
    setLotNumberConsumed('');
    setComponentProductId('');
  };

  const handleCompleteOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWO || !selectedOp) return;
    try {
      setSubmittingOp(true);
      // 1. Complete operation step on backend
      await client.post(`/manufacturing/work-orders/${activeWO.id}/operations/${selectedOp.id}/complete`, {
          scrapQuantity: parseFloat(scrapQty),
          lotNumberConsumed: lotNumberConsumed || undefined,
          componentProductId: componentProductId || undefined,
      });

      // 2. Log micro-downtime if entered
      if (downtimeCode) {
        await client.post('/manufacturing/downtime', {
            workstationId: selectedWorkstationId,
            downtimeCode: downtimeCode,
            startTime: new Date(Date.now() - 15 * 60000).toISOString(), // mock 15m downtime
            endTime: new Date().toISOString(),
            notes: downtimeNotes,
        });
        setDowntimeCode('');
        setDowntimeNotes('');
      }

      alert('Operation step completed successfully!');
      setSelectedOp(null);
      
      // Refresh operations lists
      await fetchOperations(activeWO.id);

      // Check if all operations completed; if so, prompt overall WO completion
      const ops = await client.get<Operation[]>(`/manufacturing/work-orders/${activeWO.id}/operations`);

      const allDone = ops.every((o: any) => o.status === 'COMPLETED');
      if (allDone) {
        // Automatically mark Work Order as complete
        await client.request(`/manufacturing/work-orders/${activeWO.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' }) });
        alert('All routing operations complete. Work Order has been marked COMPLETED!');
        setActiveWO(null);
        void fetchWorkOrders();
      }

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmittingOp(false);
    }
  };

  return (
    <RouteGuard permission="manufacturing.shop-floor.read">
    <div style={{ gridTemplateColumns: activeWO ? '1.2fr 1fr' : '1fr' }} className={styles.s1}>
      {/* Main Terminal Panel */}
      <div className={styles.p1}>
        <div className="ui-flex-between">
          <div>
            <h1 className={styles.p2}>
              <Cpu size={32} className="ui-text-primary" />
              Shop Floor MES Terminal
            </h1>
            <p className={styles.p3}>
              Clock-in/out workstation operations, verify routing queues, and log lot consumptions.
            </p>
          </div>
          <span className={styles.p4}>
            <span className={styles.p5}></span>
            MES ONLINE
          </span>
        </div>

        {/* Workstation Select */}
        <div>
          <label className={styles.p6}>ACTIVE MACHINE / WORKSTATION</label>
          <select
            value={selectedWorkstationId}
            onChange={(e) => {
              setSelectedWorkstationId(e.target.value);
              setActiveWO(null);
            }}
            className={styles.p7}
          >
            {workstations.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name} ({ws.code})</option>
            ))}
          </select>
        </div>

        {/* Pending Work Orders list */}
        <div className="flex-1">
          <h3 className={styles.p8}>Work Orders Queue</h3>
          {loading ? (
            <div className="text-center p-12">Loading queue...</div>
          ) : (
            <div className={styles.p9}>
              {workOrders.map((wo) => (
                <div
                  key={wo.id}
                  onClick={() => handleSelectWorkOrder(wo)}
                  style={{ background: activeWO?.id === wo.id ? 'var(--color-bg-elevated)' : 'var(--color-bg)', border: activeWO?.id === wo.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' }} className={styles.s2}
                >
                  <div>
                    <span className={styles.p10}>
                      {wo.status}
                    </span>
                    <p className={styles.p11}>{wo.workOrderNumber}</p>
                    <p className={styles.p12}>BOM: {wo.bom.name}</p>
                  </div>
                  <p className={styles.p13}>Target Qty: {Number(wo.quantity)}</p>
                </div>
              ))}
              {workOrders.length === 0 && (
                <p className={styles.p14}>No active WOs in queue.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Operator Operations Steps Panel */}
      {activeWO && (
        <div className={styles.p15}>
          <div className="ui-flex-between">
            <h3 className={styles.p16}>Routing Operation Steps</h3>
            <button onClick={() => setActiveWO(null)} className={styles.p17}>&times;</button>
          </div>

          <p className="ui-text-sm-muted">
            Work Order: <strong>{activeWO.workOrderNumber}</strong> ({Number(activeWO.quantity)} units)
          </p>

          {opLoading ? (
            <div>Loading operations blueprint...</div>
          ) : (
            <div className={styles.p18}>
              {operations.map((op) => (
                <div key={op.id} className={styles.p19}>
                  <div className="ui-flex-between">
                    <div>
                      <span className={styles.p20}>Step {op.sequence}</span>
                      <h4 className={styles.p21}>{op.name}</h4>
                    </div>
                    <span style={{ background: op.status === 'COMPLETED' ? 'var(--color-success-light)' : op.status === 'RUNNING' ? 'var(--color-primary-light)' : 'var(--color-bg-hover)', color: op.status === 'COMPLETED' ? 'var(--color-success)' : op.status === 'RUNNING' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s3}>
                      {op.status}
                    </span>
                  </div>

                  <div className={styles.p22}>
                    <span className={styles.p23}>
                      <Clock size={12} /> Standard: {op.durationMinutes} min
                    </span>

                    {op.status === 'PENDING' && (
                      <button
                        onClick={() => handleStartOperation(op.id)}
                        className={styles.p24}
                      >
                        <Play size={12} fill="white" /> Clock In
                      </button>
                    )}

                    {op.status === 'RUNNING' && (
                      <button
                        onClick={() => handleOpenCompleteModal(op)}
                        className={styles.p25}
                      >
                        <CheckCircle2 size={12} /> Clock Out & Log
                      </button>
                    )}

                    {op.status === 'COMPLETED' && (
                      <span className={styles.p26}>
                        Closed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clock Out / Execution report Modal */}
      {selectedOp && (
        <div className={styles.p27}>
          <form onSubmit={handleCompleteOperation} className={styles.p28}>
            <h3 className="ui-heading-lg">Complete Operation: {selectedOp.name}</h3>

            <div>
              <label className="ui-text-xs-label">Log Scrap Quantity during this Step</label>
              <input required type="number" min="0" value={scrapQty} onChange={(e) => setScrapQty(e.target.value)} className={styles.p29} />
            </div>

            <div className={styles.p30}>
              <span className={styles.p31}>Genealogy Lot Traceability (Optional)</span>
              
              <div className={styles.p32}>
                <div>
                  <label className="ui-text-micro ui-text-muted">Component Consumed</label>
                  <select value={componentProductId} onChange={(e) => setComponentProductId(e.target.value)} className={styles.p33}>
                    <option value="">Select component...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ui-text-micro ui-text-muted">Lot Number Consumed</label>
                  <input type="text" placeholder="e.g. LOT-RAM-101" value={lotNumberConsumed} onChange={(e) => setLotNumberConsumed(e.target.value)} className={styles.p34} />
                </div>
              </div>
            </div>

            {/* Micro downtime */}
            <div className={styles.p35}>
              <label className={styles.p36}>Log Downtime Failure Code (If Any)</label>
              <select value={downtimeCode} onChange={(e) => setDowntimeCode(e.target.value)} className={styles.p37}>
                <option value="">No Downtime Occurred</option>
                <option value="MECHANICAL">Mechanical Jam</option>
                <option value="ELECTRICAL">Power Interruption</option>
                <option value="TOOL_WEAR">Calibration Timeout</option>
              </select>
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button type="button" onClick={() => setSelectedOp(null)} className={styles.p38}>Cancel</button>
              <button type="submit" disabled={submittingOp} className={styles.p39}>
                {submittingOp ? 'Saving...' : 'Submit & Close Operation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
