'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, Search, Key, Smartphone,
  Globe, Monitor, AlertTriangle, CheckCircle, LogOut,
  XCircle, CreditCard, RefreshCw, ChevronLeft, ChevronRight, Lock, UserCheck, ShieldCheck, Trash2, Plus
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string | null;
  changes: any;
  createdAt: string;
}

interface ActiveSession {
  id: string;
  userId: string;
  device: string | null;
  browser: string | null;
  ipAddress: string | null;
  location: string | null;
  startedAt: string;
  lastActivityAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  maxAge: number;
}

interface SsoConfig {
  id: string;
  providerType: string;
  name: string;
  clientId: string | null;
  clientSecret: string | null;
  issuerUrl: string | null;
  isActive: boolean;
}

interface MfaSettings {
  enabled: boolean;
  mfaType: string;
  enforced: boolean;
}

interface IpRestriction {
  id: string;
  ipRange: string;
  description: string | null;
  ruleType: string;
  isActive: boolean;
  createdAt: string;
}

interface DataRetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  action: string;
  isActive: boolean;
}

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

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

const API_BASE = '/api/v1/admin/security';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'password' | 'sso' | 'mfa' | 'ip' | 'sessions' | 'impersonate' | 'retention' | 'compliance'>('audit');

  /* Audit logs state */
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditMeta, setAuditMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditLoading, setAuditLoading] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Sessions state */
  const [sessions, setSessions] = useState<ActiveSession[]>([]);

  /* Password policy state */
  const [policy, setPolicy] = useState<PasswordPolicy>({ minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecial: false, maxAge: 90 });
  const [policySaving, setPolicySaving] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);

  /* SSO configurations state */
  const [ssoConfigs, setSsoConfigs] = useState<SsoConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'SAML' | 'OIDC'>('OIDC');
  const [ssoForm, setSsoForm] = useState({
    name: 'Google Workspace',
    clientId: '',
    clientSecret: '',
    issuerUrl: '',
    authorizationUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    samlEntryPoint: '',
    samlIssuer: '',
    samlCert: '',
    isActive: true,
  });
  const [ssoSaving, setSsoSaving] = useState(false);
  const [ssoSaved, setSsoSaved] = useState(false);

  /* MFA state */
  const [mfaSettings, setMfaSettings] = useState<MfaSettings>({ enabled: false, mfaType: 'TOTP', enforced: false });
  const [mfaSaving, setMfaSaving] = useState(false);
  const [mfaSaved, setMfaSaved] = useState(false);

  /* IP Restrictions state */
  const [ipRestrictions, setIpRestrictions] = useState<IpRestriction[]>([]);
  const [newIpRange, setNewIpRange] = useState('');
  const [newIpDesc, setNewIpDesc] = useState('');
  const [newIpRuleType, setNewIpRuleType] = useState('ALLOW');
  const [ipSaving, setIpSaving] = useState(false);

  /* Impersonate state */
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  /* Data Retention state */
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([]);
  const [retentionEntity, setRetentionEntity] = useState('AuditLog');
  const [retentionDays, setRetentionDays] = useState(180);
  const [retentionAction, setRetentionAction] = useState('archive');
  const [retentionSaving, setRetentionSaving] = useState(false);

  /* Compliance state */
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);

  /* ---- Fetch audit logs ---- */
  const fetchAuditLogs = useCallback(async (page = 1) => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (auditSearch) params.set('search', auditSearch);
      if (auditFilter !== 'ALL') params.set('severity', auditFilter);

      const res = await apiFetch<{ data: AuditLog[]; meta: PaginationMeta }>(`/audit-logs?${params}`);
      setAuditLogs(res.data);
      setAuditMeta(res.meta);
    } catch (e) {
      console.error('Error fetching audit logs', e);
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearch, auditFilter]);

  /* ---- Fetch sessions ---- */
  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiFetch<ActiveSession[]>('/sessions');
      setSessions(res);
    } catch (e) {
      console.error('Error fetching sessions', e);
    }
  }, []);

  /* ---- Revoke session ---- */
  const revokeSession = async (id: string) => {
    try {
      await apiFetch(`/sessions/${id}`, { method: 'DELETE' });
      fetchSessions();
    } catch (e) {
      console.error('Failed to revoke session', e);
    }
  };

  /* ---- Fetch password policy ---- */
  const fetchPolicy = useCallback(async () => {
    try {
      const res = await apiFetch<PasswordPolicy>('/password-policy');
      setPolicy(res);
    } catch (e) {
      console.error('Error fetching password policy', e);
    }
  }, []);

  /* ---- Save password policy ---- */
  const savePolicy = async () => {
    setPolicySaving(true);
    setPolicySaved(false);
    try {
      await apiFetch('/password-policy', { method: 'POST', body: JSON.stringify(policy) });
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 3000);
    } catch (e) {
      console.error('Failed to save password policy', e);
    } finally {
      setPolicySaving(false);
    }
  };

  /* ---- Fetch SSO config ---- */
  const fetchSsoConfigs = useCallback(async () => {
    try {
      const res = await apiFetch<SsoConfig[]>('/sso');
      setSsoConfigs(res);
      const active = res.find(c => c.providerType === selectedProvider);
      if (active) {
        setSsoForm({
          name: active.name,
          clientId: active.clientId || '',
          clientSecret: active.clientSecret || '',
          issuerUrl: active.issuerUrl || '',
          authorizationUrl: '',
          tokenUrl: '',
          userInfoUrl: '',
          samlEntryPoint: '',
          samlIssuer: '',
          samlCert: '',
          isActive: active.isActive,
        });
      } else {
        setSsoForm({
          name: selectedProvider === 'OIDC' ? 'Google Workspace' : 'Okta Enterprise',
          clientId: '',
          clientSecret: '',
          issuerUrl: '',
          authorizationUrl: '',
          tokenUrl: '',
          userInfoUrl: '',
          samlEntryPoint: '',
          samlIssuer: '',
          samlCert: '',
          isActive: true,
        });
      }
    } catch (e) {
      console.error('Failed to load SSO configuration', e);
    }
  }, [selectedProvider]);

  /* ---- Save SSO config ---- */
  const saveSsoConfig = async () => {
    setSsoSaving(true);
    setSsoSaved(false);
    try {
      await apiFetch('/sso', {
        method: 'POST',
        body: JSON.stringify({
          providerType: selectedProvider,
          ...ssoForm,
        }),
      });
      setSsoSaved(true);
      setTimeout(() => setSsoSaved(false), 3000);
      fetchSsoConfigs();
    } catch (e) {
      console.error('Failed to save SSO config', e);
    } finally {
      setSsoSaving(false);
    }
  };

  /* ---- Fetch MFA settings ---- */
  const fetchMfaSettings = useCallback(async () => {
    try {
      const res = await apiFetch<MfaSettings>('/mfa');
      setMfaSettings(res);
    } catch (e) {
      console.error('Error fetching MFA settings', e);
    }
  }, []);

  /* ---- Save MFA settings ---- */
  const saveMfaSettings = async () => {
    setMfaSaving(true);
    setMfaSaved(false);
    try {
      await apiFetch('/mfa', { method: 'POST', body: JSON.stringify(mfaSettings) });
      setMfaSaved(true);
      setTimeout(() => setMfaSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save MFA settings', e);
    } finally {
      setMfaSaving(false);
    }
  };

  /* ---- Fetch IP restrictions ---- */
  const fetchIpRestrictions = useCallback(async () => {
    try {
      const res = await apiFetch<IpRestriction[]>('/ip-restrictions');
      setIpRestrictions(res);
    } catch (e) {
      console.error('Failed to load IP rules', e);
    }
  }, []);

  /* ---- Add IP restriction rule ---- */
  const addIpRestriction = async () => {
    if (!newIpRange) return;
    setIpSaving(true);
    try {
      await apiFetch('/ip-restrictions', {
        method: 'POST',
        body: JSON.stringify({ ipRange: newIpRange, description: newIpDesc, ruleType: newIpRuleType }),
      });
      setNewIpRange('');
      setNewIpDesc('');
      fetchIpRestrictions();
    } catch (e) {
      console.error('Failed to add IP rule', e);
    } finally {
      setIpSaving(false);
    }
  };

  /* ---- Delete IP restriction rule ---- */
  const deleteIpRestriction = async (id: string) => {
    try {
      await apiFetch(`/ip-restrictions/${id}`, { method: 'DELETE' });
      fetchIpRestrictions();
    } catch (e) {
      console.error('Failed to delete IP rule', e);
    }
  };

  /* ---- Fetch data retention policies ---- */
  const fetchRetentionPolicies = useCallback(async () => {
    try {
      const res = await apiFetch<DataRetentionPolicy[]>('/data-retention');
      setRetentionPolicies(res);
    } catch (e) {
      console.error('Failed to load retention policies', e);
    }
  }, []);

  /* ---- Save data retention policy ---- */
  const saveRetentionPolicy = async () => {
    setRetentionSaving(true);
    try {
      await apiFetch('/data-retention', {
        method: 'POST',
        body: JSON.stringify({ entityType: retentionEntity, retentionDays, action: retentionAction }),
      });
      fetchRetentionPolicies();
    } catch (e) {
      console.error('Failed to save retention policy', e);
    } finally {
      setRetentionSaving(false);
    }
  };

  /* ---- Delete data retention policy ---- */
  const deleteRetentionPolicy = async (id: string) => {
    try {
      await apiFetch(`/data-retention/${id}`, { method: 'DELETE' });
      fetchRetentionPolicies();
    } catch (e) {
      console.error('Failed to delete policy', e);
    }
  };

  /* ---- Fetch compliance reports ---- */
  const fetchComplianceReports = useCallback(async () => {
    try {
      const res = await apiFetch<ComplianceReport[]>('/compliance/reports');
      setComplianceReports(res);
      if (res.length > 0 && !selectedReport) {
        setSelectedReport(res[0]);
      }
    } catch (e) {
      console.error('Failed to load compliance reports', e);
    }
  }, [selectedReport]);

  /* ---- Generate compliance report ---- */
  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await apiFetch<ComplianceReport>('/compliance/generate', { method: 'POST' });
      setSelectedReport(res);
      fetchComplianceReports();
    } catch (e) {
      console.error('Failed to generate report', e);
    } finally {
      setGeneratingReport(false);
    }
  };

  /* ---- Fetch user directory for impersonation ---- */
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to load users', e);
    }
  }, []);

  /* ---- Trigger Impersonation ---- */
  const triggerImpersonation = async (userId: string) => {
    setImpersonatingId(userId);
    try {
      const res = await apiFetch<{ token: string }>(`/impersonate/${userId}`, { method: 'POST' });
      localStorage.setItem('token', res.token);
      window.location.href = '/admin'; // reload into dashboard under impersonated context
    } catch (e) {
      console.error('Impersonation failed', e);
      setImpersonatingId(null);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab && ['audit', 'password', 'sso', 'mfa', 'ip', 'sessions', 'impersonate', 'retention', 'compliance'].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  /* ---- Initial load ---- */
  useEffect(() => {
    fetchAuditLogs();
    fetchSessions();
    fetchPolicy();
    fetchSsoConfigs();
    fetchMfaSettings();
    fetchIpRestrictions();
    fetchRetentionPolicies();
    fetchComplianceReports();
    fetchUsers();
  }, [fetchAuditLogs, fetchSessions, fetchPolicy, fetchSsoConfigs, fetchMfaSettings, fetchIpRestrictions, fetchRetentionPolicies, fetchComplianceReports, fetchUsers]);

  /* ---- 30s auto-refresh for audit logs ---- */
  useEffect(() => {
    if (activeTab === 'audit') {
      refreshTimerRef.current = setInterval(() => { fetchAuditLogs(auditMeta.page); }, 30000);
    }
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [activeTab, fetchAuditLogs, auditMeta.page]);

  /* ---- Debounced search ---- */
  useEffect(() => {
    const t = setTimeout(() => { fetchAuditLogs(1); }, 400);
    return () => clearTimeout(t);
  }, [auditSearch, auditFilter, fetchAuditLogs]);

  /* ---- Helpers ---- */
  const getSeverity = (log: AuditLog): string => {
    if (log.changes?.severity) return log.changes.severity;
    if (['LOGIN_FAILED', 'UNAUTHORIZED'].includes(log.action)) return 'CRITICAL';
    if (['DELETE', 'PERMISSION_CHANGE'].includes(log.action)) return 'WARNING';
    return 'INFO';
  };

  const getDetails = (log: AuditLog): string => {
    if (log.changes?.details) return log.changes.details;
    return `${log.action} on ${log.entityType} ${log.entityId}`;
  };

  const severityStyles = (s: string) => {
    const map: Record<string, { color: string; background: string }> = {
      INFO: { color: 'var(--color-primary)', background: 'var(--color-primary-light)' },
      WARNING: { color: 'var(--color-warning)', background: 'var(--color-warning-light)' },
      CRITICAL: { color: 'var(--color-error)', background: 'var(--color-error-light)' },
    };
    return map[s] || { color: 'var(--color-text)', background: 'var(--color-bg)' };
  };

  const tabs = [
    { id: 'audit' as const, label: 'Audit Logs', icon: <Search size={14} /> },
    { id: 'password' as const, label: 'Password Policy', icon: <Lock size={14} /> },
    { id: 'sso' as const, label: 'SSO Config', icon: <Key size={14} /> },
    { id: 'mfa' as const, label: 'MFA settings', icon: <Smartphone size={14} /> },
    { id: 'ip' as const, label: 'IP Restrictions', icon: <Globe size={14} /> },
    { id: 'sessions' as const, label: 'Sessions', icon: <Monitor size={14} /> },
    { id: 'impersonate' as const, label: 'Impersonation', icon: <UserCheck size={14} /> },
    { id: 'retention' as const, label: 'Data Retention', icon: <Trash2 size={14} /> },
    { id: 'compliance' as const, label: 'Compliance Reports', icon: <ShieldCheck size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Shield style={{ color: 'var(--color-primary)' }} />
          Security Control Hub
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Manage identity providers, password policies, Multi-Factor Authentication, active user sessions, network restriction lists, and user impersonation sandbox.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)', whiteSpace: 'nowrap',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ============ Audit Logs ============ */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' }}>
              <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              <input value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="Search by user, action, entity, or details..." style={{ flex: 1, border: 'none', background: 'transparent', padding: 'var(--space-2.5) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
            </div>
            <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)' }}>
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <button onClick={() => fetchAuditLogs(auditMeta.page)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }} title="Refresh">
              <RefreshCw size={16} style={auditLoading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  {['Severity', 'Timestamp', 'User', 'Action', 'Entity', 'IP', 'Details'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No audit logs found.</td></tr>
                )}
                {auditLogs.map(l => {
                  const sev = getSeverity(l);
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)', ...severityStyles(sev) }}>{sev}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{l.userId}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <code style={{ fontSize: '11px', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{l.action}</code>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{l.entityType} ({l.entityId})</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{l.ipAddress || '—'}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getDetails(l)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {auditMeta.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <span>Showing page {auditMeta.page} of {auditMeta.totalPages} ({auditMeta.total} total)</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button disabled={auditMeta.page <= 1} onClick={() => fetchAuditLogs(auditMeta.page - 1)} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-2)', cursor: auditMeta.page <= 1 ? 'default' : 'pointer', opacity: auditMeta.page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', color: 'var(--color-text)' }}>
                  <ChevronLeft size={14} /> Prev
                </button>
                <button disabled={auditMeta.page >= auditMeta.totalPages} onClick={() => fetchAuditLogs(auditMeta.page + 1)} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-2)', cursor: auditMeta.page >= auditMeta.totalPages ? 'default' : 'pointer', opacity: auditMeta.page >= auditMeta.totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', color: 'var(--color-text)' }}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ Password Policy ============ */}
      {activeTab === 'password' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Password Policy Settings</h3>

            {/* Min length slider */}
            <div style={{ padding: 'var(--space-2.5) 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Minimum Length</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Minimum number of characters required</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="range" min={6} max={24} value={policy.minLength}
                  onChange={e => setPolicy({ ...policy, minLength: +e.target.value })}
                  style={{ width: '100px' }}
                />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', minWidth: '24px', textAlign: 'center' }}>{policy.minLength}</span>
              </div>
            </div>

            {/* Max age */}
            <div style={{ padding: 'var(--space-2.5) 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Max Password Age (days)</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Force password change after this many days (0 = never)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="number" min={0} max={365} value={policy.maxAge}
                  onChange={e => setPolicy({ ...policy, maxAge: +e.target.value })}
                  style={{ width: '70px', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)', textAlign: 'center' }}
                />
              </div>
            </div>

            {/* Toggles */}
            {[
              { key: 'requireUppercase' as const, label: 'Require Uppercase Letter', desc: 'At least one A-Z character' },
              { key: 'requireNumbers' as const, label: 'Require Numbers', desc: 'At least one 0-9 digit' },
              { key: 'requireSpecial' as const, label: 'Require Special Characters', desc: 'At least one special symbol' },
            ].map((opt, i) => (
              <div key={opt.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
                </div>
                <div
                  onClick={() => setPolicy({ ...policy, [opt.key]: !policy[opt.key] })}
                  style={{ width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', background: policy[opt.key] ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative', transition: 'background 0.2s' }}
                >
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: policy[opt.key] ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}

            {/* Save button */}
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button onClick={savePolicy} disabled={policySaving} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                cursor: policySaving ? 'wait' : 'pointer', fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)', opacity: policySaving ? 0.7 : 1,
              }}>
                {policySaving ? 'Saving...' : 'Save Policy'}
              </button>
              {policySaved && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <CheckCircle size={12} /> Saved successfully
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ SSO CONFIG ============ */}
      {activeTab === 'sso' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Single Sign-On (SSO) Integration</h3>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <button onClick={() => setSelectedProvider('OIDC')} style={{
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                background: selectedProvider === 'OIDC' ? 'var(--color-primary)' : 'transparent',
                color: selectedProvider === 'OIDC' ? '#fff' : 'var(--color-text)', cursor: 'pointer',
                fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)'
              }}>OpenID Connect (OIDC)</button>
              <button onClick={() => setSelectedProvider('SAML')} style={{
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                background: selectedProvider === 'SAML' ? 'var(--color-primary)' : 'transparent',
                color: selectedProvider === 'SAML' ? '#fff' : 'var(--color-text)', cursor: 'pointer',
                fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)'
              }}>SAML 2.0 Identity Provider</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Provider Name</label>
                <input value={ssoForm.name} onChange={e => setSsoForm({ ...ssoForm, name: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>

              {selectedProvider === 'OIDC' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Client ID</label>
                    <input value={ssoForm.clientId} onChange={e => setSsoForm({ ...ssoForm, clientId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Client Secret</label>
                    <input type="password" value={ssoForm.clientSecret} onChange={e => setSsoForm({ ...ssoForm, clientSecret: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Issuer Discovery URL</label>
                    <input value={ssoForm.issuerUrl} onChange={e => setSsoForm({ ...ssoForm, issuerUrl: e.target.value })} placeholder="https://accounts.google.com" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>SAML Entry Point (SSO URL)</label>
                    <input value={ssoForm.samlEntryPoint} onChange={e => setSsoForm({ ...ssoForm, samlEntryPoint: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>SAML Issuer / Entity ID</label>
                    <input value={ssoForm.samlIssuer} onChange={e => setSsoForm({ ...ssoForm, samlIssuer: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>X.509 Public Certificate</label>
                    <textarea value={ssoForm.samlCert} onChange={e => setSsoForm({ ...ssoForm, samlCert: e.target.value })} rows={4} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'monospace', fontSize: '11px' }} />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <input type="checkbox" id="sso-active" checked={ssoForm.isActive} onChange={e => setSsoForm({ ...ssoForm, isActive: e.target.checked })} />
                <label htmlFor="sso-active" style={{ fontSize: 'var(--text-sm)' }}>Enable this Single Sign-On Identity Provider</label>
              </div>

              <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <button onClick={saveSsoConfig} disabled={ssoSaving} style={{
                  background: 'var(--color-primary)', color: '#fff', border: 'none',
                  padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                  cursor: ssoSaving ? 'wait' : 'pointer', fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)'
                }}>{ssoSaving ? 'Saving...' : 'Save Configuration'}</button>
                {ssoSaved && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><CheckCircle size={12} /> Saved</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MFA SETTINGS ============ */}
      {activeTab === 'mfa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Multi-Factor Authentication (MFA) Control</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>Enable MFA</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Allow users to set up two-factor authorization profiles</div>
              </div>
              <input type="checkbox" checked={mfaSettings.enabled} onChange={e => setMfaSettings({ ...mfaSettings, enabled: e.target.checked })} style={{ width: '18px', height: '18px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>Enforce MFA for all users</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Force every user to configure MFA at their next login session</div>
              </div>
              <input type="checkbox" checked={mfaSettings.enforced} onChange={e => setMfaSettings({ ...mfaSettings, enforced: e.target.checked })} style={{ width: '18px', height: '18px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>Primary MFA Type</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Verification code delivery method</div>
              </div>
              <select value={mfaSettings.mfaType} onChange={e => setMfaSettings({ ...mfaSettings, mfaType: e.target.value })} style={{ padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="TOTP">Authenticator App (TOTP)</option>
                <option value="EMAIL">Email Verification Code</option>
                <option value="SMS">SMS Message (Twilio integration)</option>
              </select>
            </div>

            <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button onClick={saveMfaSettings} disabled={mfaSaving} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                cursor: mfaSaving ? 'wait' : 'pointer', fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)'
              }}>{mfaSaving ? 'Saving...' : 'Save MFA Policy'}</button>
              {mfaSaved && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><CheckCircle size={12} /> Saved</span>}
            </div>
          </div>
        </div>
      )}

      {/* ============ IP Restrictions ============ */}
      {activeTab === 'ip' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Network IP Restrictions</h3>
            
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <input value={newIpRange} onChange={e => setNewIpRange(e.target.value)} placeholder="IP Range (e.g. 192.168.1.0/24 or 203.0.113.50)" style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
              <input value={newIpDesc} onChange={e => setNewIpDesc(e.target.value)} placeholder="Description / Location label" style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
              <select value={newIpRuleType} onChange={e => setNewIpRuleType(e.target.value)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}>
                <option value="ALLOW">ALLOW Access</option>
                <option value="DENY">DENY Access</option>
              </select>
              <button onClick={addIpRestriction} disabled={ipSaving} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{ipSaving ? 'Adding...' : 'Add Rule'}</button>
            </div>

            {ipRestrictions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-4)' }}>No custom IP rules active. Anyone can log in from any network location.</div>
            ) : (
              ipRestrictions.map(rule => (
                <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Globe size={16} style={{ color: rule.ruleType === 'ALLOW' ? 'var(--color-success)' : 'var(--color-error)' }} />
                    <div>
                      <code style={{ fontSize: '12px', fontWeight: 'var(--weight-semibold)' }}>{rule.ipRange}</code>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{rule.description || 'No description'} — <span style={{ fontWeight: 'var(--weight-bold)', color: rule.ruleType === 'ALLOW' ? 'var(--color-success)' : 'var(--color-error)' }}>{rule.ruleType}</span></div>
                    </div>
                  </div>
                  <button onClick={() => deleteIpRestriction(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}><XCircle size={16} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============ Sessions ============ */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Active Sessions ({sessions.length})</h3>
            <button onClick={fetchSessions} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><RefreshCw size={14} /></button>
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-6)' }}>No active database sessions tracked.</div>
          ) : (
            sessions.map(s => {
              const email = s.user?.email || 'N/A';
              const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown';
              return (
                <div key={s.id} style={{
                  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Monitor size={20} style={{ color: 'var(--color-text-secondary)' }} />
                    <div>
                      <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
                        {s.device || 'Unknown Device'} — {s.browser || 'Unknown Browser'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{name} ({email}) • {s.ipAddress || '—'} • {s.location || '—'}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Started: {new Date(s.startedAt).toLocaleString()} • Last Activity: {new Date(s.lastActivityAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <button onClick={() => revokeSession(s.id)} style={{ background: 'none', border: '1px solid var(--color-error)', padding: '4px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={12} /> Revoke
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============ IMPERSONATION ============ */}
      {activeTab === 'impersonate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Login-As Sandbox Impersonation</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              Administrators can securely log in as any user in this tenant to reproduce errors, configure settings, or troubleshoot permissions. All actions are logged under your admin identity.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Filter users by name or email..." style={{ flex: 1, border: 'none', background: 'transparent', padding: 'var(--space-2.5) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {users
                .filter(u => u.email.toLowerCase().includes(searchUser.toLowerCase()) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchUser.toLowerCase()))
                .map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)' }}>
                    <div>
                      <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{u.email} • Status: <span style={{ textTransform: 'lowercase', color: u.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>{u.status}</span></div>
                    </div>
                    <button onClick={() => triggerImpersonation(u.id)} disabled={impersonatingId !== null} style={{
                      background: 'var(--color-primary)', color: '#fff', border: 'none',
                      padding: 'var(--space-1.5) var(--space-4)', borderRadius: 'var(--radius-md)',
                      cursor: impersonatingId === u.id ? 'wait' : 'pointer', fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--weight-semibold)'
                    }}>{impersonatingId === u.id ? 'Loading...' : 'Impersonate'}</button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ DATA RETENTION ============ */}
      {activeTab === 'retention' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Data Retention Policies</h3>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <select value={retentionEntity} onChange={e => setRetentionEntity(e.target.value)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', flex: 1 }}>
                <option value="AuditLog">Audit Logs</option>
                <option value="UserSession">User Sessions</option>
                <option value="Invoice">Invoices & Finance Records</option>
                <option value="Activity">CRM Activity Logs</option>
              </select>
              <input type="number" value={retentionDays} onChange={e => setRetentionDays(parseInt(e.target.value) || 180)} placeholder="Days to Keep" style={{ width: '120px', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
              <select value={retentionAction} onChange={e => setRetentionAction(e.target.value)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}>
                <option value="archive">Archive to S3/Drive</option>
                <option value="delete">Hard Delete Permanently</option>
              </select>
              <button onClick={saveRetentionPolicy} disabled={retentionSaving} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
              }}>{retentionSaving ? 'Saving...' : 'Add/Update Policy'}</button>
            </div>

            {retentionPolicies.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-4)' }}>No custom data retention policies configured. Default system policies apply.</div>
            ) : (
              retentionPolicies.map(policy => (
                <div key={policy.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', background: 'var(--color-bg)' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{policy.entityType}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Retain for {policy.retentionDays} days, then <span style={{ textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{policy.action}</span></div>
                  </div>
                  <button onClick={() => deleteRetentionPolicy(policy.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}><Trash2 size={16} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============ COMPLIANCE REPORTS ============ */}
      {activeTab === 'compliance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-4)' }}>
          {/* Left panel: history */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Report History</h3>
              <button onClick={generateReport} disabled={generatingReport} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: '11px', fontWeight: 'var(--weight-semibold)',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <Plus size={12} /> Generate
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '500px', overflowY: 'auto' }}>
              {complianceReports.map(rep => (
                <div key={rep.id} onClick={() => setSelectedReport(rep)} style={{
                  padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: selectedReport?.id === rep.id ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  borderColor: selectedReport?.id === rep.id ? 'var(--color-primary)' : 'var(--color-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>Score: {rep.score}%</span>
                    <span style={{
                      fontSize: '9px', padding: '1px 6px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)',
                      background: rep.status === 'COMPLIANT' ? 'var(--color-success-light)' : rep.status === 'WARNING' ? 'var(--color-warning-light)' : 'var(--color-error-light)',
                      color: rep.status === 'COMPLIANT' ? 'var(--color-success)' : rep.status === 'WARNING' ? 'var(--color-warning)' : 'var(--color-error)',
                    }}>{rep.status}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{new Date(rep.generatedAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: report details */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {selectedReport ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Compliance Analysis</h3>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Report ID: {selectedReport.id} • Generated at: {new Date(selectedReport.generatedAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: selectedReport.status === 'COMPLIANT' ? 'var(--color-success)' : selectedReport.status === 'WARNING' ? 'var(--color-warning)' : 'var(--color-error)' }}>{selectedReport.score}%</div>
                    <div style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>OVERALL COMPLIANCE</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {selectedReport.checks.map((check, idx) => (
                    <div key={idx} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          {check.passed ? <CheckCircle size={16} style={{ color: 'var(--color-success)' }} /> : <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />}
                          {check.name}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>{check.score} / {check.maxScore} pts</span>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginLeft: 'var(--space-6)' }}>{check.details}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
                <ShieldCheck size={48} style={{ opacity: 0.5, marginBottom: 'var(--space-3)' }} />
                <span>No compliance reports available. Click "Generate" to create one.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
