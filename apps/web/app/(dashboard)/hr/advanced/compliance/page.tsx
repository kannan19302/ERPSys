'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { Play, ShieldAlert, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ComplianceCheck {
  id: string;
  checkType: string;
  status: string; // PASSED, WARNING, FAILED
  message: string;
  checkedAt: string;
}

export default function CompliancePage() {
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/compliance/checks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setChecks(await res.json());
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunAudit = async () => {
    setScanning(true);
    setMsg('');
    try {
      const res = await fetch('/api/v1/advanced-hr/compliance/run-checks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg('Compliance audit executed successfully.');
        setChecks(await res.json());
      } else {
        setMsg('Audit execution failed.');
      }
    } catch {
      setMsg('Audit execution error.');
    } finally {
      setScanning(false);
    }
  };

  // Status counters
  const failures = checks.filter(c => c.status === 'FAILED').length;
  const warnings = checks.filter(c => c.status === 'WARNING').length;
  const passed = checks.filter(c => c.status === 'PASSED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Labor Compliance"
        description="Verify compliance rules across employee data. Audits verify FLSA minimum wages, document expirations, and GDPR compliance."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Compliance' }]}
        actions={
          <Button variant="primary" onClick={handleRunAudit} disabled={scanning} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {scanning ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />} Run Compliance Scanner
          </Button>
        }
      />

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {/* Compliance indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        <Card style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Compliance Breaches</span>
            <ShieldAlert size={16} className="text-danger" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0', color: 'var(--color-danger-text)' }}>{failures}</h4>
        </Card>
        <Card style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Warnings</span>
            <AlertTriangle size={16} className="text-warning" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0', color: 'var(--color-warning-text)' }}>{warnings}</h4>
        </Card>
        <Card style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Passed Checks</span>
            <CheckCircle size={16} className="text-success" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0', color: 'var(--color-success-text)' }}>{passed}</h4>
        </Card>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4)' }}>Audit Area</th>
                <th style={{ padding: 'var(--space-4)' }}>Check Message</th>
                <th style={{ padding: 'var(--space-4)' }}>Status</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Scanned At</th>
              </tr>
            </thead>
            <tbody>
              {checks.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No compliance records logged. Trigger a scan above to audit employee profiles.
                  </td>
                </tr>
              ) : (
                checks.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{c.checkType.replace('_', ' ')}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{c.message}</td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'bold',
                        background: c.status === 'PASSED' ? 'var(--color-success-light)' : c.status === 'WARNING' ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
                        color: c.status === 'PASSED' ? 'var(--color-success-text)' : c.status === 'WARNING' ? 'var(--color-warning-text)' : 'var(--color-danger-text)'
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--color-text-tertiary)' }}>{new Date(c.checkedAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
