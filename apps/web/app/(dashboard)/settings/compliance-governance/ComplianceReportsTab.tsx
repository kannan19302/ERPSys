'use client';
import styles from './ComplianceReportsTab.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Plus, RefreshCw, AlertTriangle, CheckCircle, ChevronRight, FileText } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

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

export default function ComplianceReportsTab() {
  const client = useApiClient();
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
      const data = await client.get<ComplianceReport[]>('/admin/security/compliance/reports');
      setComplianceReports(data);
      if (data.length > 0 && (selectFirst || !selectedReport)) setSelectedReport(data[0] ?? null);
    } catch (e) {
      console.error('Failed to load compliance reports', e);
      setError('Connection error loading reports');
    } finally {
      setLoading(false);
    }
  }, [client, selectedReport]);

  useEffect(() => { void fetchComplianceReports(); }, [fetchComplianceReports]);

  const generateReport = async () => {
    setGeneratingReport(true);
    setError(null);
    setSuccess(null);
    try {
      const newRep = await client.post<ComplianceReport>('/admin/security/compliance/generate');
      {
        setSelectedReport(newRep);
        setSuccess('New compliance analysis generated successfully');
        setTimeout(() => setSuccess(null), 3000);
        void fetchComplianceReports(true);
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
      case 'COMPLIANT': return 'var(--color-success)';
      case 'WARNING': return 'var(--color-warning)';
      default: return 'var(--color-error)';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'var(--color-success-light)';
      case 'WARNING': return 'var(--color-warning-light)';
      default: return 'var(--color-error-light)';
    }
  };

  return (
    <div className="ui-stack-6">
      {error && (
        <div className={styles.s1}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className={styles.s2}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className={styles.s3}>
        <div className={styles.s4}>
          <div className="ui-flex-between">
            <h3 className={styles.s5}>Report History</h3>
            <button
              onClick={generateReport}
              disabled={generatingReport}
              style={{ cursor: generatingReport ? 'wait' : 'pointer' }} className={styles.s6}
            >
              {generatingReport ? <RefreshCw size={12} className="spin" /> : <Plus size={12} />}
              {generatingReport ? 'Analyzing...' : 'Run Audit'}
            </button>
          </div>

          {loading && complianceReports.length === 0 ? (
            <div className={styles.s7}>
              <RefreshCw size={20} className="spin ui-text-muted" />
            </div>
          ) : complianceReports.length === 0 ? (
            <div className={styles.s8}>
              No compliance audits run yet.
            </div>
          ) : (
            <div className={styles.s9}>
              {complianceReports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  style={{ background: selectedReport?.id === rep.id ? 'var(--color-primary-light)' : 'var(--color-bg)', borderColor: selectedReport?.id === rep.id ? 'var(--color-primary)' : 'var(--color-border)' }} className={styles.s10}
                >
                  <div className={styles.s11}>
                    <span className="ui-heading-sm font-bold">Score: {rep.score}%</span>
                    <span style={{ background: getStatusBg(rep.status), color: getStatusColor(rep.status) }} className={styles.s12}
                    >
                      {rep.status}
                    </span>
                  </div>
                  <div className={styles.s13}>
                    <span>{new Date(rep.generatedAt).toLocaleDateString()} &bull; {new Date(rep.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <ChevronRight size={14} style={{ opacity: selectedReport?.id === rep.id ? 0.8 : 0.3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.s14}>
          {selectedReport ? (
            <>
              <div className={styles.s15}>
                <div>
                  <h3 className={styles.s16}>Security Audit Overview</h3>
                  <div className={styles.s17}>
                    Report ID: <span className="font-mono">{selectedReport.id}</span> &bull; Executed {new Date(selectedReport.generatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ color: getStatusColor(selectedReport.status) }} className={styles.s18}>
                    {selectedReport.score}%
                  </div>
                  <div className={styles.s19}>
                    Overall Rating
                  </div>
                </div>
              </div>

              <div className="ui-stack-3">
                {selectedReport.checks.map((check, idx) => (
                  <div key={idx} className={styles.s20}>
                    <div className="ui-flex-between">
                      <span className={styles.s21}>
                        {check.passed ? <CheckCircle size={16} className="ui-text-success" /> : <AlertTriangle size={16} className="ui-text-warning" />}
                        {check.name}
                      </span>
                      <span className={styles.s22}>
                        {check.score} / {check.maxScore} pts
                      </span>
                    </div>
                    <p className={styles.s23}>
                      {check.details}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.s24}>
              <FileText size={48} className={styles.s25} />
              <span className="text-sm">No compliance reports available. Click &quot;Run Audit&quot; to analyze your settings.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
