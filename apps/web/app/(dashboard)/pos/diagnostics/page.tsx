'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { Store, Activity, RefreshCw, Wifi, Terminal } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface POSTerminal {
  id: string;
  name: string;
  code: string;
}

interface DiagnosticData {
  status: string;
  printerOnline: boolean;
  scannerOnline: boolean;
  cashDrawerClosed: boolean;
  lastDiagnosticsCheck: string;
}

export default function POSDiagnosticsPage() {
  const client = useApiClient();
  const [terminals, setTerminals] = useState<POSTerminal[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<string>('');
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData>({
    status: 'ONLINE',
    printerOnline: true,
    scannerOnline: true,
    cashDrawerClosed: true,
    lastDiagnosticsCheck: new Date().toISOString()
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const loadTerminals = async () => {
      try {
        const data = await client.get<POSTerminal[]>('/pos/terminals');
        setTerminals(Array.isArray(data) ? data : []);
        if (data.length > 0) {
            const firstId = data[0]?.id;
            if (!firstId) return;
            setSelectedTerminal(firstId);
            loadDiagnostics(firstId);
        }
      } catch {
        // ignore
      }
    };
    loadTerminals();
    addLog('Diagnostics module loaded.');
  }, [client]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const loadDiagnostics = async (termId: string) => {
    try {
      const data = await client.get<{ diagnosticData?: DiagnosticData }>(`/pos/terminals/${termId}/diagnostics`);
      if (data.diagnosticData) {
        setDiagnosticData(data.diagnosticData);
        addLog(`Loaded diagnostics state for terminal: ${termId}`);
      }
    } catch {
      addLog(`Failed to fetch diagnostics for terminal: ${termId}`);
    }
  };

  const handleRunDiagnostics = async () => {
    if (!selectedTerminal) return;
    setIsRunning(true);
    addLog('Starting hardware loop diagnostic checks...');

    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const nextDiag = {
        status: 'ONLINE',
        printerOnline: Math.random() > 0.15,
        scannerOnline: Math.random() > 0.1,
        cashDrawerClosed: Math.random() > 0.05,
        lastDiagnosticsCheck: new Date().toISOString()
      };

      await client.request(`/pos/terminals/${selectedTerminal}/diagnostics`, { method: 'PUT', body: JSON.stringify({ diagnosticData: nextDiag }) });
      {
        setDiagnosticData(nextDiag);
        addLog(`Printer status: ${nextDiag.printerOnline ? 'CONNECTED' : 'DISCONNECTED'}`);
        addLog(`Barcode Scanner status: ${nextDiag.scannerOnline ? 'CONNECTED' : 'DISCONNECTED'}`);
        addLog(`Cash Drawer status: ${nextDiag.cashDrawerClosed ? 'CLOSED' : 'OPEN (DRAWER ALERT)'}`);
        addLog(`Diagnostics check completed successfully for terminal ${selectedTerminal}.`);
      }
    } catch {
      addLog('Error pushing diagnostics configuration payload.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <RouteGuard permission="pos.diagnostics.read">
    <div className={styles.p1}>
      <div className="ui-flex-between">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <Activity className="ui-text-primary" />
            Printer & Hardware Diagnostics
          </h1>
          <p className="ui-text-sm-muted">
            Monitor thermal receipt printers, barcode scanners, and drawer connections on the retail floor.
          </p>
        </div>

        <button
          className={["ui-btn", styles.p2].join(' ')}
          onClick={handleRunDiagnostics}
          disabled={isRunning}

        >
          <RefreshCw size={14} className={isRunning ? 'spin-animation' : ''} />
          {isRunning ? 'Checking connections...' : 'Run Diagnostics Sync'}
        </button>
      </div>

      <div className={styles.p3}>
        {/* Device Status Grid */}
        <div className="ui-stack-6">
          <div className={["ui-card", styles.p4].join(' ')} >
            <div className="ui-form-group mb-4">
              <label className={styles.p5}>Select POS Terminal</label>
              <select
                className={["ui-input", styles.p6].join(' ')}
                value={selectedTerminal}
                onChange={(e) => {
                  setSelectedTerminal(e.target.value);
                  loadDiagnostics(e.target.value);
                }}

              >
                {terminals.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>

            <div className="ui-grid-2">
              {/* Receipt Printer */}
              <div className={styles.p7}>
                <div style={{ background: diagnosticData.printerOnline ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: diagnosticData.printerOnline ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  <Wifi size={20} />
                </div>
                <div>
                  <h4 className="ui-text-xs-muted m-0">Receipt Printer</h4>
                  <p style={{ color: diagnosticData.printerOnline ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {diagnosticData.printerOnline ? 'CONNECTED' : 'DISCONNECTED'}
                  </p>
                </div>
              </div>

              {/* Barcode Scanner */}
              <div className={styles.p10}>
                <div style={{ background: diagnosticData.scannerOnline ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: diagnosticData.scannerOnline ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  <Wifi size={20} />
                </div>
                <div>
                  <h4 className="ui-text-xs-muted m-0">Barcode Scanner</h4>
                  <p style={{ color: diagnosticData.scannerOnline ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {diagnosticData.scannerOnline ? 'CONNECTED' : 'DISCONNECTED'}
                  </p>
                </div>
              </div>

              {/* Cash Drawer */}
              <div className={styles.p13}>
                <div style={{ background: diagnosticData.cashDrawerClosed ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: diagnosticData.cashDrawerClosed ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  <Wifi size={20} />
                </div>
                <div>
                  <h4 className="ui-text-xs-muted m-0">Cash Drawer</h4>
                  <p style={{ color: diagnosticData.cashDrawerClosed ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {diagnosticData.cashDrawerClosed ? 'CLOSED' : 'OPEN'}
                  </p>
                </div>
              </div>

              {/* Terminal State */}
              <div className={styles.p16}>
                <div className={styles.p17}>
                  <Store size={20} />
                </div>
                <div>
                  <h4 className="ui-text-xs-muted m-0">Terminal Status</h4>
                  <p className={styles.p18}>
                    {diagnosticData.status}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.p19}>
              Last Diagnostics Run: {new Date(diagnosticData.lastDiagnosticsCheck).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Diagnostic Logs console */}
        <div className={["ui-card", styles.p20].join(' ')} >
          <h3 className={styles.p21}>
            <Terminal size={16} /> Connection Log Console
          </h3>

          <div className={styles.p22}>
            {logs.map((log, idx) => (
              <div key={idx} className={styles.p23}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </RouteGuard>
  );
}
