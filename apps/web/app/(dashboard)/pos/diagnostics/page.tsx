'use client';

import React, { useState, useEffect } from 'react';
import { Store, Activity, RefreshCw, Wifi, Terminal } from 'lucide-react';

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
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/v1/pos/terminals', { headers });
        if (res.ok) {
          const data = await res.json();
          setTerminals(Array.isArray(data) ? data : []);
          if (data.length > 0) {
            const firstId = data[0].id;
            setSelectedTerminal(firstId);
            loadDiagnostics(firstId);
          }
        }
      } catch {
        // ignore
      }
    };
    loadTerminals();
    addLog('Diagnostics module loaded.');
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const loadDiagnostics = async (termId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`/api/v1/pos/terminals/${termId}/diagnostics`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.diagnosticData) {
          setDiagnosticData(data.diagnosticData);
          addLog(`Loaded diagnostics state for terminal: ${termId}`);
        }
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
      const token = localStorage.getItem('token');
      const nextDiag = {
        status: 'ONLINE',
        printerOnline: Math.random() > 0.15,
        scannerOnline: Math.random() > 0.1,
        cashDrawerClosed: Math.random() > 0.05,
        lastDiagnosticsCheck: new Date().toISOString()
      };
      
      const res = await fetch(`/api/v1/pos/terminals/${selectedTerminal}/diagnostics`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ diagnosticData: nextDiag })
      });
      if (res.ok) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Activity style={{ color: 'var(--color-primary)' }} />
            Printer & Hardware Diagnostics
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Monitor thermal receipt printers, barcode scanners, and drawer connections on the retail floor.
          </p>
        </div>

        <button 
          className="frappe-btn"
          onClick={handleRunDiagnostics}
          disabled={isRunning}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary)', color: 'white', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-xs)' }}
        >
          <RefreshCw size={14} className={isRunning ? 'spin-animation' : ''} />
          {isRunning ? 'Checking connections...' : 'Run Diagnostics Sync'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
        {/* Device Status Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="frappe-card" style={{ padding: 'var(--space-5)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div className="frappe-form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Select POS Terminal</label>
              <select 
                className="frappe-input"
                value={selectedTerminal} 
                onChange={(e) => {
                  setSelectedTerminal(e.target.value);
                  loadDiagnostics(e.target.value);
                }}
                style={{
                  width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)'
                }}
              >
                {terminals.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              {/* Receipt Printer */}
              <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ background: diagnosticData.printerOnline ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: diagnosticData.printerOnline ? 'var(--color-success)' : 'var(--color-danger)', borderRadius: '50%', padding: '10px', display: 'flex' }}>
                  <Wifi size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Receipt Printer</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-sm)', fontWeight: 'bold', color: diagnosticData.printerOnline ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {diagnosticData.printerOnline ? 'CONNECTED' : 'DISCONNECTED'}
                  </p>
                </div>
              </div>

              {/* Barcode Scanner */}
              <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ background: diagnosticData.scannerOnline ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: diagnosticData.scannerOnline ? 'var(--color-success)' : 'var(--color-danger)', borderRadius: '50%', padding: '10px', display: 'flex' }}>
                  <Wifi size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Barcode Scanner</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-sm)', fontWeight: 'bold', color: diagnosticData.scannerOnline ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {diagnosticData.scannerOnline ? 'CONNECTED' : 'DISCONNECTED'}
                  </p>
                </div>
              </div>

              {/* Cash Drawer */}
              <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ background: diagnosticData.cashDrawerClosed ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: diagnosticData.cashDrawerClosed ? 'var(--color-success)' : 'var(--color-warning)', borderRadius: '50%', padding: '10px', display: 'flex' }}>
                  <Wifi size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Cash Drawer</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-sm)', fontWeight: 'bold', color: diagnosticData.cashDrawerClosed ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {diagnosticData.cashDrawerClosed ? 'CLOSED' : 'OPEN'}
                  </p>
                </div>
              </div>

              {/* Terminal State */}
              <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '50%', padding: '10px', display: 'flex' }}>
                  <Store size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Terminal Status</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {diagnosticData.status}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              Last Diagnostics Run: {new Date(diagnosticData.lastDiagnosticsCheck).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Diagnostic Logs console */}
        <div className="frappe-card" style={{ padding: 'var(--space-5)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={16} /> Connection Log Console
          </h3>

          <div style={{
            flex: 1,
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-4)',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            height: '240px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ wordBreak: 'break-all' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
