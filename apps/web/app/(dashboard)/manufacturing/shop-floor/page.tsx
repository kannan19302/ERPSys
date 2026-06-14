'use client';

import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Cpu } from 'lucide-react';

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

export default function ShopFloorTerminal() {
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string>('');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Operator Entry Panel State
  const [activeWO, setActiveWO] = useState<WorkOrder | null>(null);
  const [scrapQty, setScrapQty] = useState('0');
  const [yieldQty, setYieldQty] = useState('0');
  const [lotNumber, setLotNumber] = useState('');
  const [downtimeCode, setDowntimeCode] = useState('');
  const [downtimeNotes, setDowntimeNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkstations();
  }, []);

  useEffect(() => {
    if (selectedWorkstationId) {
      fetchWorkOrders();
    }
  }, [selectedWorkstationId]);

  const fetchWorkstations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/workstations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkstations(data);
        if (data.length > 0) setSelectedWorkstationId(data[0].id);
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
        // Filter by workstation
        const filtered = data.filter((w) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED');
        setWorkOrders(filtered);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleStartOrder = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/manufacturing/work-orders/${id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to start run');
      fetchWorkOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleOpenReportPanel = (wo: WorkOrder) => {
    setActiveWO(wo);
    setYieldQty(String(Number(wo.quantity)));
    setScrapQty('0');
    setLotNumber(wo.lotNumber || `LOT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${wo.workOrderNumber}`);
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWO) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      // Log yield, scrap, and lot numbers
      const resOee = await fetch(`http://localhost:3001/api/v1/manufacturing/work-orders/${activeWO.id}/oee`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oeeScore: 90.0, // calculated mock OEE
          scrapQuantity: parseFloat(scrapQty),
          lotNumber: lotNumber,
        }),
      });

      if (!resOee.ok) throw new Error('Failed to log yield details');

      // Log machine downtime if selected
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
            startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // mock 30 mins ago
            endTime: new Date().toISOString(),
            notes: downtimeNotes,
          }),
        });
      }

      // Complete work order status
      const resStatus = await fetch(`http://localhost:3001/api/v1/manufacturing/work-orders/${activeWO.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!resStatus.ok) throw new Error('Failed to complete work order');

      alert('Production run submitted and complete!');
      setActiveWO(null);
      setDowntimeCode('');
      setDowntimeNotes('');
      fetchWorkOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error logging details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: activeWO ? '1.5fr 1fr' : '1fr', gap: 'var(--space-6)', minHeight: '80vh' }}>
      {/* Main Terminal panel */}
      <div style={{ background: '#1e293b', color: 'white', borderRadius: 'var(--radius-3xl)', padding: 'var(--space-8)', border: '2px solid #334155', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Terminal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Cpu size={32} style={{ color: 'var(--color-primary)' }} />
              Shop Floor MES Terminal
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
              Real-time kiosk interface for shop floor operators.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span style={{ background: '#334155', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%' }}></span>
              SYS ONLINE
            </span>
          </div>
        </div>

        {/* Workstation Select */}
        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: '#94a3b8' }}>ACTIVE MACHINE / WORKSTATION</label>
          <select
            value={selectedWorkstationId}
            onChange={(e) => setSelectedWorkstationId(e.target.value)}
            style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3)', color: 'white', fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: 'var(--space-2)', cursor: 'pointer' }}
          >
            {workstations.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name} ({ws.code})</option>
            ))}
          </select>
        </div>

        {/* Scheduled Runs */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: '#94a3b8', marginBottom: 'var(--space-4)' }}>Pending Operations</h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Querying dispatcher schedule...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {workOrders.map((wo) => (
                <div
                  key={wo.id}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 'var(--space-5)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 'var(--space-4)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div>
                    <span style={{
                      float: 'right',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      background: wo.status === 'IN_PROGRESS' ? 'var(--color-primary-light)' : '#1e293b',
                      color: wo.status === 'IN_PROGRESS' ? 'var(--color-primary)' : '#94a3b8',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {wo.status}
                    </span>
                    <p style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{wo.workOrderNumber}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: '#94a3b8', marginTop: '4px' }}>BOM: {wo.bom.name}</p>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '8px' }}>Target: {Number(wo.quantity)} units</p>
                  </div>

                  <div>
                    {wo.status === 'PLANNED' ? (
                      <button
                        onClick={() => handleStartOrder(wo.id)}
                        style={{
                          width: '100%',
                          background: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          padding: 'var(--space-3)',
                          borderRadius: 'var(--radius-xl)',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: 'var(--text-sm)'
                        }}
                      >
                        <Play size={16} fill="white" /> Check In & Start Job
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenReportPanel(wo)}
                        style={{
                          width: '100%',
                          background: 'var(--color-success)',
                          color: 'white',
                          border: 'none',
                          padding: 'var(--space-3)',
                          borderRadius: 'var(--radius-xl)',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: 'var(--text-sm)'
                        }}
                      >
                        <CheckCircle2 size={16} /> Report Yield & Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {workOrders.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 'var(--space-12)', border: '2px dashed #334155', borderRadius: 'var(--radius-2xl)', color: '#94a3b8' }}>
                  No active work orders allocated to this workstation at this time.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Operator Report Sidebar Panel */}
      {activeWO && (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-3xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>Submit Production Run</h3>
            <button onClick={() => setActiveWO(null)} style={{ background: 'none', border: 'none', fontSize: 'var(--text-lg)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>&times;</button>
          </div>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Submit metrics and close job for <strong>{activeWO.workOrderNumber}</strong>.
          </p>

          <form onSubmit={handleSaveProgress} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>GOOD YIELD QUANTITY</label>
              <input required type="number" min="0" value={yieldQty} onChange={(e) => setYieldQty(e.target.value)} style={{ width: '100%', padding: 'var(--space-2.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontSize: 'var(--text-lg)', fontWeight: 'bold' }} />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>SCRAP / WASTE COUNT</label>
              <input required type="number" min="0" value={scrapQty} onChange={(e) => setScrapQty(e.target.value)} style={{ width: '100%', padding: 'var(--space-2.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-danger)' }} />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>TRACKING BATCH LOT NUMBER</label>
              <input required type="text" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} style={{ width: '100%', padding: 'var(--space-2.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', fontWeight: 'semibold' }} />
            </div>

            {/* Micro Downtime log block */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Log Machine Downtime (If Any)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <select
                  value={downtimeCode}
                  onChange={(e) => setDowntimeCode(e.target.value)}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)' }}
                >
                  <option value="">No Downtime Logged</option>
                  <option value="ELECTRICAL">Electrical Interruption</option>
                  <option value="MECHANICAL">Mechanical Failure</option>
                  <option value="TOOL_WEAR">Tool Wear / Blade Swap</option>
                  <option value="NO_OPERATOR">No Operator Assigned</option>
                </select>
                {downtimeCode && (
                  <textarea
                    placeholder="Describe failure notes..."
                    value={downtimeNotes}
                    onChange={(e) => setDowntimeNotes(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', height: '60px' }}
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'var(--color-success)',
                color: 'white',
                border: 'none',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: 'var(--space-2)',
                fontSize: 'var(--text-sm)'
              }}
            >
              <CheckCircle2 size={16} /> {submitting ? 'Submitting...' : 'Submit Run Results'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
