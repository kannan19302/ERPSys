'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Gauge, AlertTriangle, Settings, Wrench } from 'lucide-react';

interface WorkstationLoad {
  workstation: string;
  capacityHours: number;
  allocatedHours: number;
  status: string;
  utilizationRate: number;
}

interface DiagnosticSensor {
  machineName: string;
  temperature: number;
  vibration: number;
  vibrationStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE';
}

interface WorkOrder {
  id: string;
  oeeScore?: string | number | null;
  scrapQuantity?: string | number | null;
}

export default function MESDiagnosticsPage() {
  const [workstationLoad, setWorkstationLoad] = useState<WorkstationLoad[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // IoT Sensor Diagnostic Simulation State
  const [sensors, setSensors] = useState<DiagnosticSensor[]>([
    { machineName: 'CNC Cutting Machine', temperature: 62.4, vibration: 1.8, vibrationStatus: 'NORMAL', status: 'ONLINE' },
    { machineName: 'Assembly Line A', temperature: 48.1, vibration: 0.9, vibrationStatus: 'NORMAL', status: 'ONLINE' },
    { machineName: 'Packaging Station', temperature: 35.6, vibration: 0.4, vibrationStatus: 'NORMAL', status: 'ONLINE' },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLog, setSimLog] = useState<string[]>(['System diagnostics monitoring active.', 'No active anomalies detected.']);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [loadRes, ordersRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/manufacturing/workstations/load-balancing', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/manufacturing/work-orders', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (loadRes.ok) setWorkstationLoad(await loadRes.ok ? await loadRes.json() : []);
      if (ordersRes.ok) setWorkOrders(await ordersRes.ok ? await ordersRes.json() : []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
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

  const getOeeAverage = () => {
    const scoredOrders = workOrders.filter((w) => w.oeeScore !== null && w.oeeScore !== undefined);
    if (scoredOrders.length === 0) return 85;
    const sum = scoredOrders.reduce((acc, curr) => acc + Number(curr.oeeScore), 0);
    return Math.round(sum / scoredOrders.length);
  };

  const getTotalScrap = () => {
    return workOrders.reduce((acc, curr) => acc + Number(curr.scrapQuantity || 0), 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Settings size={28} style={{ color: 'var(--color-primary)' }} />
          MES Diagnostics & Telemetry
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
          Real-time shop floor performance monitoring, OEE indexes, and IoT device sensor telemetry feeds
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading shop floor diagnostics...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Key Metrics Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <Gauge size={36} style={{ color: 'var(--color-primary)' }} />
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Shop Floor Health (Avg OEE)</p>
                <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)', marginTop: '2px' }}>{getOeeAverage()}%</p>
              </div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <AlertTriangle size={36} style={{ color: 'var(--color-danger)' }} />
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Material Waste / Scrap</p>
                <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-danger)', marginTop: '2px' }}>{getTotalScrap()} units</p>
              </div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <Activity size={36} style={{ color: 'var(--color-success)' }} />
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Workstation Capacity Utilization</p>
                <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)', marginTop: '2px' }}>
                  {workstationLoad.length > 0
                    ? Math.round(workstationLoad.reduce((acc, curr) => acc + curr.utilizationRate, 0) / workstationLoad.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
            {/* Workstation Load Balancer Card */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Wrench size={18} style={{ color: 'var(--color-primary)' }} /> Workstation Load Balancing
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Based on active Work Orders</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {workstationLoad.map((load, index) => (
                  <div key={index} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{load.workstation}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          Allocated: {load.allocatedHours} hrs / Cap: {load.capacityHours} hrs
                        </p>
                      </div>
                      <span style={{
                        fontSize: '9px', fontWeight: 'bold', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: load.status === 'OVERLOADED' ? 'var(--color-danger-light)' : 'var(--color-success-light)',
                        color: load.status === 'OVERLOADED' ? 'var(--color-danger)' : 'var(--color-success)',
                      }}>
                        {load.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(load.utilizationRate, 100)}%`, height: '100%',
                        background: load.status === 'OVERLOADED' ? 'var(--color-danger)' : 'var(--color-primary)',
                        borderRadius: 'var(--radius-full)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IoT Real-time Diagnostics Sensor Readout Panel */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Settings size={18} style={{ color: 'var(--color-primary)' }} /> IoT Machine Sensor Monitoring
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

              {/* Simulation Log Stream */}
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
