'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Gauge, AlertTriangle, Settings, Wrench, Search, RefreshCw, Layers } from 'lucide-react';

interface DiagnosticSensor {
  machineName: string;
  temperature: number;
  vibration: number;
  vibrationStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE';
}

interface OeeDetails {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  downtimeLogs: Array<{
    id: string;
    workstationName: string;
    downtimeCode: string;
    durationMinutes: number;
    startTime: string;
  }>;
}

interface GenealogyResult {
  lotNumber: string;
  downstream: Array<{
    workOrderId: string;
    workOrderNumber: string;
    finishedProductName: string;
    finishedProductLot: string;
    quantityConsumed: number;
  }>;
  upstream: {
    workOrderNumber: string;
    quantityProduced: number;
    components: Array<{
      productId: string;
      productName: string;
      sku: string;
      consumedLot: string;
      quantityConsumed: number;
    }>;
  } | null;
}

export default function MESDiagnosticsPage() {
  const [loading, setLoading] = useState(true);
  
  // OEE State
  const [oeeData, setOeeData] = useState<OeeDetails | null>(null);

  // Genealogy Search State
  const [searchLot, setSearchLot] = useState('LOT-CHASSIS-CNC-2026');
  const [genealogy, setGenealogy] = useState<GenealogyResult | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  // IoT Sensor Telemetry simulation
  const [sensors, setSensors] = useState<DiagnosticSensor[]>([
    { machineName: 'CNC Cutting Machine', temperature: 62.4, vibration: 1.8, vibrationStatus: 'NORMAL', status: 'ONLINE' },
    { machineName: 'Assembly Line A', temperature: 48.1, vibration: 0.9, vibrationStatus: 'NORMAL', status: 'ONLINE' },
    { machineName: 'Packaging Station', temperature: 35.6, vibration: 0.4, vibrationStatus: 'NORMAL', status: 'ONLINE' },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLog, setSimLog] = useState<string[]>(['System diagnostics monitoring active.', 'No active anomalies detected.']);

  useEffect(() => {
    fetchOeeData();
    handleSearchGenealogy();
  }, []);

  const fetchOeeData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/diagnostics/oee', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOeeData(await res.json());
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleSearchGenealogy = async () => {
    if (!searchLot) return;
    try {
      setGenLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/manufacturing/diagnostics/genealogy/${searchLot}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setGenealogy(await res.json());
      }
    } catch {
      // Ignored
    } finally {
      setGenLoading(false);
    }
  };

  const handleTriggerSimulation = () => {
    setIsSimulating(true);
    let runCount = 0;
    const interval = setInterval(() => {
      setSensors((prev) =>
        prev.map((s) => {
          const tempDelta = (Math.random() - 0.4) * 5;
          const vibDelta = (Math.random() - 0.4) * 0.4;
          const nextTemp = Math.round((s.temperature + tempDelta) * 10) / 10;
          const nextVib = Math.round((s.vibration + vibDelta) * 10) / 10;
          const nextVibStatus = nextVib > 2.5 ? 'CRITICAL' : nextVib > 1.8 ? 'WARNING' : 'NORMAL';
          return {
            ...s,
            temperature: nextTemp,
            vibration: nextVib,
            vibrationStatus: nextVibStatus,
          };
        })
      );

      const logMsg = `IoT Diagnostic check ${++runCount}: CNC Temp: ${(Math.random() * 5 + 60).toFixed(1)}°C, Vibration within safe limits.`;
      setSimLog((prev) => [logMsg, ...prev.slice(0, 4)]);

      if (runCount >= 5) {
        clearInterval(interval);
        setIsSimulating(false);
        setSimLog((prev) => ['IoT Simulation cycle complete. Status green.', ...prev]);
      }
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Settings size={28} style={{ color: 'var(--color-primary)' }} />
            MES Diagnostics & Telemetry
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Real-time OEE breakdowns, equipment cycle telemetry, and upstream/downstream material genealogy lot tracking.
          </p>
        </div>
        <button
          onClick={fetchOeeData}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading diagnostics...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Detailed OEE breakdowns row */}
          {oeeData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <Gauge size={40} style={{ color: 'var(--color-success)' }} />
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Overall Equipment Effectiveness (OEE)</p>
                  <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)', marginTop: '2px' }}>{oeeData.oee}%</p>
                </div>
              </div>
              <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <Activity size={32} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Availability Rate</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: '2px' }}>{oeeData.availability}%</p>
                </div>
              </div>
              <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <Settings size={32} style={{ color: 'var(--color-warning)' }} />
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Performance Rate</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: '2px' }}>{oeeData.performance}%</p>
                </div>
              </div>
              <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <AlertTriangle size={32} style={{ color: 'var(--color-danger)' }} />
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Quality Rate</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: '2px' }}>{oeeData.quality}%</p>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
            
            {/* LOT GENEALOGY EXPLORER */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={18} style={{ color: 'var(--color-primary)' }} />
                Material Genealogy Explorer
              </h3>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Enter Lot Number to trace (e.g. LOT-CHASSIS-CNC-2026)..."
                  value={searchLot}
                  onChange={(e) => setSearchLot(e.target.value)}
                  style={{ flex: 1, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
                <button
                  onClick={handleSearchGenealogy}
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Search size={14} /> Trace Lot
                </button>
              </div>

              {genLoading ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>Tracing lot genealogy...</div>
              ) : genealogy ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                  
                  {/* Upstream Components (Recipe Ingredients) */}
                  <div>
                    <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Upstream Genealogy (Component Ingredients)</h4>
                    {genealogy.upstream ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                          Produced via WO: {genealogy.upstream.workOrderNumber} (Yield: {genealogy.upstream.quantityProduced} units)
                        </div>
                        {genealogy.upstream.components.map((c, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', background: 'var(--color-bg-hover)', padding: '6px 12px', borderRadius: '6px' }}>
                            <span>{c.productName} ({c.sku})</span>
                            <span style={{ fontWeight: 'bold' }}>Lot: {c.consumedLot}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                        No upstream history. This lot is a purchased raw material component.
                      </p>
                    )}
                  </div>

                  {/* Downstream Consumption */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                    <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Downstream Genealogy (Finished Assemblies Consumed In)</h4>
                    {genealogy.downstream && genealogy.downstream.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {genealogy.downstream.map((d, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--color-bg-hover)', padding: '8px 12px', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                              <span>Assembly: {d.finishedProductName}</span>
                              <span style={{ color: 'var(--color-success)' }}>Resulting Lot: {d.finishedProductLot}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                              Consumed in WO: {d.workOrderNumber} | Qty Consumed: {d.quantityConsumed} units
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                        This lot has not been consumed in any downstream manufacturing WOs.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* IoT Sensor telemetry card */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Wrench size={18} style={{ color: 'var(--color-primary)' }} /> IoT Sensor Monitoring
                </h3>
                <button
                  onClick={handleTriggerSimulation}
                  disabled={isSimulating}
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-primary)',
                    padding: 'var(--space-1.5) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    cursor: isSimulating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSimulating ? 'Simulating...' : 'Trigger IoT Telemetry'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {sensors.map((sens, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', alignItems: 'center', padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{sens.machineName}</p>
                    <div>
                      <p style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>TEMP</p>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'semibold', marginTop: '2px' }}>{sens.temperature}°C</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>VIB SPEED</p>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'semibold', color: sens.vibrationStatus !== 'NORMAL' ? 'var(--color-warning)' : 'var(--color-text)', marginTop: '2px' }}>
                        {sens.vibration} mm/s
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{
                        fontSize: '9px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '3px',
                        background: sens.status === 'ONLINE' ? 'var(--color-success-light)' : 'var(--color-bg-hover)',
                        color: sens.status === 'ONLINE' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                      }}>
                        {sens.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simulation logs stream */}
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', flex: 1, minHeight: '100px' }}>
                <p style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)', textTransform: 'uppercase' }}>Diagnostics Telemetry Logs</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {simLog.map((log, index) => (
                    <p key={index} style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                      &gt; {log}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
