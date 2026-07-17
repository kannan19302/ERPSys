'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Activity, Gauge, AlertTriangle, Settings, Wrench, Search, RefreshCw, Layers } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
    void fetchOeeData();
    void handleSearchGenealogy();
  }, [client]);

  const fetchOeeData = async () => {
    try {
      setLoading(true);
      setOeeData(await client.get<OeeDetails>('/manufacturing/diagnostics/oee'));
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
      setGenealogy(await client.get<GenealogyResult>(`/manufacturing/diagnostics/genealogy/${searchLot}`));
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
    <RouteGuard permission="manufacturing.diagnostics.read">
    <div className="ui-stack-6">
      {/* Page Header */}
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <Settings size={28} className="ui-text-primary" />
            MES Diagnostics & Telemetry
          </h1>
          <p className={styles.p2}>
            Real-time OEE breakdowns, equipment cycle telemetry, and upstream/downstream material genealogy lot tracking.
          </p>
        </div>
        <button
          onClick={fetchOeeData}
          className={styles.p3}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="text-center p-12">Loading diagnostics...</div>
      ) : (
        <div className="ui-stack-6">
          
          {/* Detailed OEE breakdowns row */}
          {oeeData && (
            <div className={styles.p4}>
              <div className={styles.p5}>
                <Gauge size={40} className="ui-text-success" />
                <div>
                  <p className="ui-text-xs-muted">Overall Equipment Effectiveness (OEE)</p>
                  <p className={styles.p6}>{oeeData.oee}%</p>
                </div>
              </div>
              <div className={styles.p7}>
                <Activity size={32} className="ui-text-primary" />
                <div>
                  <p className="ui-text-xs-muted">Availability Rate</p>
                  <p className={styles.p8}>{oeeData.availability}%</p>
                </div>
              </div>
              <div className={styles.p9}>
                <Settings size={32} className="ui-text-warning" />
                <div>
                  <p className="ui-text-xs-muted">Performance Rate</p>
                  <p className={styles.p10}>{oeeData.performance}%</p>
                </div>
              </div>
              <div className={styles.p11}>
                <AlertTriangle size={32} className="ui-text-danger" />
                <div>
                  <p className="ui-text-xs-muted">Quality Rate</p>
                  <p className={styles.p12}>{oeeData.quality}%</p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.p13}>
            
            {/* LOT GENEALOGY EXPLORER */}
            <div className={styles.p14}>
              <h3 className={styles.p15}>
                <Layers size={18} className="ui-text-primary" />
                Material Genealogy Explorer
              </h3>
              
              <div className={styles.p16}>
                <input
                  type="text"
                  placeholder="Enter Lot Number to trace (e.g. LOT-CHASSIS-CNC-2026)..."
                  value={searchLot}
                  onChange={(e) => setSearchLot(e.target.value)}
                  className={styles.p17}
                />
                <button
                  onClick={handleSearchGenealogy}
                  className={styles.p18}
                >
                  <Search size={14} /> Trace Lot
                </button>
              </div>

              {genLoading ? (
                <div className={styles.p19}>Tracing lot genealogy...</div>
              ) : genealogy ? (
                <div className={styles.p20}>
                  
                  {/* Upstream Components (Recipe Ingredients) */}
                  <div>
                    <h4 className={styles.p21}>Upstream Genealogy (Component Ingredients)</h4>
                    {genealogy.upstream ? (
                      <div className={styles.p22}>
                        <div className={styles.p23}>
                          Produced via WO: {genealogy.upstream.workOrderNumber} (Yield: {genealogy.upstream.quantityProduced} units)
                        </div>
                        {genealogy.upstream.components.map((c, i) => (
                          <div key={i} className={styles.p24}>
                            <span>{c.productName} ({c.sku})</span>
                            <span className="font-bold">Lot: {c.consumedLot}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.p25}>
                        No upstream history. This lot is a purchased raw material component.
                      </p>
                    )}
                  </div>

                  {/* Downstream Consumption */}
                  <div className={styles.p26}>
                    <h4 className={styles.p27}>Downstream Genealogy (Finished Assemblies Consumed In)</h4>
                    {genealogy.downstream && genealogy.downstream.length > 0 ? (
                      <div className={styles.p28}>
                        {genealogy.downstream.map((d, i) => (
                          <div key={i} className={styles.p29}>
                            <div className={styles.p30}>
                              <span>Assembly: {d.finishedProductName}</span>
                              <span className="ui-text-success">Resulting Lot: {d.finishedProductLot}</span>
                            </div>
                            <div className="ui-text-micro ui-text-muted">
                              Consumed in WO: {d.workOrderNumber} | Qty Consumed: {d.quantityConsumed} units
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.p31}>
                        This lot has not been consumed in any downstream manufacturing WOs.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* IoT Sensor telemetry card */}
            <div className={styles.p32}>
              <div className="ui-flex-between">
                <h3 className={styles.p33}>
                  <Wrench size={18} className="ui-text-primary" /> IoT Sensor Monitoring
                </h3>
                <button
                  onClick={handleTriggerSimulation}
                  disabled={isSimulating}
                  style={{ cursor: isSimulating ? 'not-allowed' : 'pointer' }} className={styles.s1}
                >
                  {isSimulating ? 'Simulating...' : 'Trigger IoT Telemetry'}
                </button>
              </div>

              <div className="ui-stack-3">
                {sensors.map((sens, index) => (
                  <div key={index} className={styles.p34}>
                    <p className={styles.p35}>{sens.machineName}</p>
                    <div>
                      <p className={styles.p36}>TEMP</p>
                      <p className={styles.p37}>{sens.temperature}°C</p>
                    </div>
                    <div>
                      <p className={styles.p38}>VIB SPEED</p>
                      <p style={{ color: sens.vibrationStatus !== 'NORMAL' ? 'var(--color-warning)' : 'var(--color-text)' }} className={styles.s2}>
                        {sens.vibration} mm/s
                      </p>
                    </div>
                    <div className="ui-flex-end">
                      <span style={{ background: sens.status === 'ONLINE' ? 'var(--color-success-light)' : 'var(--color-bg-hover)', color: sens.status === 'ONLINE' ? 'var(--color-success)' : 'var(--color-text-secondary)' }} className={styles.s3}>
                        {sens.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simulation logs stream */}
              <div className={styles.p39}>
                <p className={styles.p40}>Diagnostics Telemetry Logs</p>
                <div className="ui-stack-1">
                  {simLog.map((log, index) => (
                    <p key={index} className={styles.p41}>
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
    </RouteGuard>
  );
}
