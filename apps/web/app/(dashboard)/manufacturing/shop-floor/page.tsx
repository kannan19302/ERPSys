'use client';

import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Cpu, Clock, Layers, ShieldCheck } from 'lucide-react';

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
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedWorkstationId) {
      fetchWorkOrders();
    }
  }, [selectedWorkstationId]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [wsRes, prodRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/manufacturing/workstations', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/inventory/products', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (wsRes.ok) {
        const data = await wsRes.json();
        setWorkstations(Array.isArray(data) ? data : (data?.data || []));
        if (data.length > 0) setSelectedWorkstationId(data[0].id);
      }
      if (prodRes.ok) {
        setProducts(await prodRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      }
    } catch {
      // Ignored
    }
  };

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/work-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: WorkOrder[] = await res.json();
        const filtered = data.filter((w) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED');
        setWorkOrders(filtered);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const fetchOperations = async (woId: string) => {
    try {
      setOpLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/manufacturing/work-orders/${woId}/operations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOperations(await res.json());
      }
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
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/manufacturing/work-orders/${activeWO.id}/operations/${opId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to start operation');
      fetchOperations(activeWO.id);
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
      const token = localStorage.getItem('token');

      // 1. Complete operation step on backend
      const res = await fetch(`http://localhost:3001/api/v1/manufacturing/work-orders/${activeWO.id}/operations/${selectedOp.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scrapQuantity: parseFloat(scrapQty),
          lotNumberConsumed: lotNumberConsumed || undefined,
          componentProductId: componentProductId || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to complete operation');

      // 2. Log micro-downtime if entered
      if (downtimeCode) {
        await fetch('http://localhost:3001/api/v1/manufacturing/downtime', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workstationId: selectedWorkstationId,
            downtimeCode: downtimeCode,
            startTime: new Date(Date.now() - 15 * 60000).toISOString(), // mock 15m downtime
            endTime: new Date().toISOString(),
            notes: downtimeNotes,
          }),
        });
        setDowntimeCode('');
        setDowntimeNotes('');
      }

      alert('Operation step completed successfully!');
      setSelectedOp(null);
      
      // Refresh operations lists
      await fetchOperations(activeWO.id);

      // Check if all operations completed; if so, prompt overall WO completion
      const ops = await fetch(`http://localhost:3001/api/v1/manufacturing/work-orders/${activeWO.id}/operations`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());

      const allDone = ops.every((o: any) => o.status === 'COMPLETED');
      if (allDone) {
        // Automatically mark Work Order as complete
        await fetch(`http://localhost:3001/api/v1/manufacturing/work-orders/${activeWO.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'COMPLETED' }),
        });
        alert('All routing operations complete. Work Order has been marked COMPLETED!');
        setActiveWO(null);
        fetchWorkOrders();
      }

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmittingOp(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: activeWO ? '1.2fr 1fr' : '1fr', gap: 'var(--space-6)', minHeight: '80vh' }}>
      {/* Main Terminal Panel */}
      <div style={{ background: '#1e293b', color: 'white', borderRadius: 'var(--radius-3xl)', padding: 'var(--space-8)', border: '2px solid #334155', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Cpu size={32} style={{ color: 'var(--color-primary)' }} />
              Shop Floor MES Terminal
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
              Clock-in/out workstation operations, verify routing queues, and log lot consumptions.
            </p>
          </div>
          <span style={{ background: '#334155', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%' }}></span>
            MES ONLINE
          </span>
        </div>

        {/* Workstation Select */}
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: '#94a3b8' }}>ACTIVE MACHINE / WORKSTATION</label>
          <select
            value={selectedWorkstationId}
            onChange={(e) => {
              setSelectedWorkstationId(e.target.value);
              setActiveWO(null);
            }}
            style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3)', color: 'white', fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: 'var(--space-2)', cursor: 'pointer' }}
          >
            {workstations.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name} ({ws.code})</option>
            ))}
          </select>
        </div>

        {/* Pending Work Orders list */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: '#94a3b8', marginBottom: 'var(--space-4)' }}>Work Orders Queue</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading queue...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {workOrders.map((wo) => (
                <div
                  key={wo.id}
                  onClick={() => handleSelectWorkOrder(wo)}
                  style={{
                    background: activeWO?.id === wo.id ? '#1e293b' : '#0f172a',
                    border: activeWO?.id === wo.id ? '2px solid var(--color-primary)' : '1px solid #334155',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 'var(--space-5)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div>
                    <span style={{ float: 'right', fontSize: '10px', fontWeight: 'bold', background: '#1e293b', color: '#94a3b8', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      {wo.status}
                    </span>
                    <p style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{wo.workOrderNumber}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: '#94a3b8', marginTop: '4px' }}>BOM: {wo.bom.name}</p>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-primary)' }}>Target Qty: {Number(wo.quantity)}</p>
                </div>
              ))}
              {workOrders.length === 0 && (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: 'var(--space-12)' }}>No active WOs in queue.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Operator Operations Steps Panel */}
      {activeWO && (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-3xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>Routing Operation Steps</h3>
            <button onClick={() => setActiveWO(null)} style={{ background: 'none', border: 'none', fontSize: 'var(--text-lg)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>&times;</button>
          </div>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Work Order: <strong>{activeWO.workOrderNumber}</strong> ({Number(activeWO.quantity)} units)
          </p>

          {opLoading ? (
            <div>Loading operations blueprint...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {operations.map((op) => (
                <div key={op.id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Step {op.sequence}</span>
                      <h4 style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', marginTop: '2px' }}>{op.name}</h4>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: op.status === 'COMPLETED' ? 'var(--color-success-light)' : op.status === 'RUNNING' ? 'var(--color-primary-light)' : 'var(--color-bg-hover)',
                      color: op.status === 'COMPLETED' ? 'var(--color-success)' : op.status === 'RUNNING' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                    }}>
                      {op.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> Standard: {op.durationMinutes} min
                    </span>

                    {op.status === 'PENDING' && (
                      <button
                        onClick={() => handleStartOperation(op.id)}
                        style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: 'var(--text-xs)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Play size={12} fill="white" /> Clock In
                      </button>
                    )}

                    {op.status === 'RUNNING' && (
                      <button
                        onClick={() => handleOpenCompleteModal(op)}
                        style={{ background: 'var(--color-success)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: 'var(--text-xs)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle2 size={12} /> Clock Out & Log
                      </button>
                    )}

                    {op.status === 'COMPLETED' && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 'bold' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCompleteOperation} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '420px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Complete Operation: {selectedOp.name}</h3>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Log Scrap Quantity during this Step</label>
              <input required type="number" min="0" value={scrapQty} onChange={(e) => setScrapQty(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Genealogy Lot Traceability (Optional)</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginTop: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Component Consumed</label>
                  <select value={componentProductId} onChange={(e) => setComponentProductId(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: 'var(--text-xs)', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                    <option value="">Select component...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Lot Number Consumed</label>
                  <input type="text" placeholder="e.g. LOT-RAM-101" value={lotNumberConsumed} onChange={(e) => setLotNumberConsumed(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: 'var(--text-xs)', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                </div>
              </div>
            </div>

            {/* Micro downtime */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Log Downtime Failure Code (If Any)</label>
              <select value={downtimeCode} onChange={(e) => setDowntimeCode(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: 'var(--text-xs)', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }}>
                <option value="">No Downtime Occurred</option>
                <option value="MECHANICAL">Mechanical Jam</option>
                <option value="ELECTRICAL">Power Interruption</option>
                <option value="TOOL_WEAR">Calibration Timeout</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setSelectedOp(null)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" disabled={submittingOp} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>
                {submittingOp ? 'Saving...' : 'Submit & Close Operation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
