'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Plus, RefreshCw, AlertTriangle, CheckCircle, ChevronRight, FileText } from 'lucide-react';

interface ComplianceCheck {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details: string;
}

interface ComplianceReport {
  id: string;
  generatedBy: string;
  generatedAt: string;
  score: number;
  status: string;
  checks: ComplianceCheck[];
}

const API_BASE = '/api/v1/admin/security';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function CompliancePage() {
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchComplianceReports = useCallback(async (selectFirst = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/compliance/reports`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json() as ComplianceReport[];
        setComplianceReports(data);
        if (data.length > 0 && (selectFirst || !selectedReport)) {
          setSelectedReport(data[0] ?? null);
        }
      } else {
        setError(`Failed to fetch compliance reports: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Failed to load compliance reports', e);
      setError('Connection error loading reports');
    } finally {
      setLoading(false);
    }
  }, [selectedReport]);

  useEffect(() => {
    fetchComplianceReports();
  }, []);

  const generateReport = async () => {
    setGeneratingReport(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/compliance/generate`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const newRep = await res.json() as ComplianceReport;
        setSelectedReport(newRep);
        setSuccess('New compliance analysis generated successfully');
        setTimeout(() => setSuccess(null), 3000);
        fetchComplianceReports(true);
      } else {
        setError(`Failed to generate compliance report: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Failed to generate report', e);
      setError('Connection error generating report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'var(--color-success)';
      case 'WARNING':
        return 'var(--color-warning)';
      default:
        return 'var(--color-error)';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'var(--color-success-light)';
      case 'WARNING':
        return 'var(--color-warning-light)';
      default:
        return 'var(--color-error-light)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ShieldCheck style={{ color: 'var(--color-primary)' }} />
          Compliance & Security Audits
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Audit tenant configuration settings against standard security benchmarks, password rules, and network restrictions.
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-success-light)', color: 'var(--color-success)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: 'var(--space-4)', alignItems: 'start' }}>
        
        {/* Left Panel: Report History */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>Report History</h3>
            <button 
              onClick={generateReport} 
              disabled={generatingReport} 
              style={{
                background: 'var(--color-primary)', 
                color: '#fff', 
                border: 'none',
                padding: 'var(--space-1.5) var(--space-3)', 
                borderRadius: 'var(--radius-md)',
                cursor: generatingReport ? 'wait' : 'pointer', 
                fontSize: '11px', 
                fontWeight: 'var(--weight-bold)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px'
              }}
            >
              {generatingReport ? (
                <RefreshCw size={12} className="spin" />
              ) : (
                <Plus size={12} />
              )}
              {generatingReport ? 'Analyzing...' : 'Run Audit'}
            </button>
          </div>

          {loading && complianceReports.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
              <RefreshCw size={20} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          ) : complianceReports.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-4)', fontSize: 'var(--text-xs)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              No compliance audits run yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '550px', overflowY: 'auto' }}>
              {complianceReports.map(rep => (
                <div 
                  key={rep.id} 
                  onClick={() => setSelectedReport(rep)} 
                  style={{
                    padding: 'var(--space-3)', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: 'var(--radius-md)', 
                    cursor: 'pointer',
                    background: selectedReport?.id === rep.id ? 'var(--color-primary-light)' : 'var(--color-bg)',
                    borderColor: selectedReport?.id === rep.id ? 'var(--color-primary)' : 'var(--color-border)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>Score: {rep.score}%</span>
                    <span style={{
                      fontSize: '9px', 
                      padding: '1px 6px', 
                      borderRadius: 'var(--radius-full)', 
                      fontWeight: 'var(--weight-bold)',
                      background: getStatusBg(rep.status),
                      color: getStatusColor(rep.status),
                    }}>
                      {rep.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{new Date(rep.generatedAt).toLocaleDateString()} &bull; {new Date(rep.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <ChevronRight size={14} style={{ opacity: selectedReport?.id === rep.id ? 0.8 : 0.3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: Report Details */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minHeight: '400px' }}>
          {selectedReport ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>Security Audit Overview</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Report ID: <span style={{ fontFamily: 'monospace' }}>{selectedReport.id}</span> &bull; Executed {new Date(selectedReport.generatedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: getStatusColor(selectedReport.status), lineHeight: 1 }}>
                    {selectedReport.score}%
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', marginTop: '4px', textTransform: 'uppercase' }}>
                    Overall Rating
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {selectedReport.checks.map((check, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: 'var(--space-3.5)', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'var(--color-bg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text)' }}>
                        {check.passed ? (
                          <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                        ) : (
                          <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                        )}
                        {check.name}
                      </span>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>
                        {check.score} / {check.maxScore} pts
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '24px', lineHeight: '1.4' }}>
                      {check.details}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-8)' }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-3)' }} />
              <span style={{ fontSize: 'var(--text-sm)' }}>No compliance reports available. Click "Run Audit" to analyze your settings.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
