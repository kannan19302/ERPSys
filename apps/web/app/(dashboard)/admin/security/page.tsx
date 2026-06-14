'use client';

import React, { useState } from 'react';
import {
  Shield, Search, Key, Smartphone,
  Globe, Monitor, AlertTriangle, CheckCircle, LogOut,
  XCircle, CreditCard
} from 'lucide-react';

interface AuditLog {
  id: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  ip: string;
  timestamp: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

interface ActiveSession {
  id: string;
  user: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  startedAt: string;
  lastActivity: string;
  current: boolean;
}

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'mfa' | 'ip' | 'sessions' | 'billing'>('audit');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('ALL');

  const [auditLogs] = useState<AuditLog[]>([
    { id: 'al-1', user: 'admin@unerp.dev', action: 'LOGIN', entity: 'Session', entityId: 'sess-4521', ip: '192.168.1.100', timestamp: '2026-06-14 14:32:00', details: 'Successful login via password', severity: 'INFO' },
    { id: 'al-2', user: 'jane@acme.com', action: 'UPDATE', entity: 'Invoice', entityId: 'INV-0198', ip: '10.0.0.45', timestamp: '2026-06-14 14:28:00', details: 'Changed status from DRAFT to SENT', severity: 'INFO' },
    { id: 'al-3', user: 'mike@acme.com', action: 'DELETE', entity: 'Employee', entityId: 'emp-0023', ip: '10.0.0.52', timestamp: '2026-06-14 14:15:00', details: 'Deleted employee record — James Wilson', severity: 'WARNING' },
    { id: 'al-4', user: 'unknown', action: 'LOGIN_FAILED', entity: 'Session', entityId: 'N/A', ip: '203.45.67.89', timestamp: '2026-06-14 13:45:00', details: 'Failed login attempt — invalid credentials (3 attempts)', severity: 'CRITICAL' },
    { id: 'al-5', user: 'admin@unerp.dev', action: 'PERMISSION_CHANGE', entity: 'Role', entityId: 'role-admin', ip: '192.168.1.100', timestamp: '2026-06-14 12:30:00', details: 'Added finance.write scope to Admin role', severity: 'WARNING' },
    { id: 'al-6', user: 'sarah@acme.com', action: 'EXPORT', entity: 'Report', entityId: 'rpt-0045', ip: '10.0.0.38', timestamp: '2026-06-14 11:20:00', details: 'Exported Financial Report as CSV (4,521 rows)', severity: 'INFO' },
  ]);

  const [sessions] = useState<ActiveSession[]>([
    { id: 'ses-1', user: 'admin@unerp.dev', device: 'Windows 11', browser: 'Chrome 126', ip: '192.168.1.100', location: 'New York, US', startedAt: '2026-06-14 08:00', lastActivity: '2 min ago', current: true },
    { id: 'ses-2', user: 'admin@unerp.dev', device: 'iPhone 16', browser: 'Safari Mobile', ip: '172.16.0.5', location: 'New York, US', startedAt: '2026-06-14 10:30', lastActivity: '45 min ago', current: false },
    { id: 'ses-3', user: 'jane@acme.com', device: 'macOS 15', browser: 'Firefox 130', ip: '10.0.0.45', location: 'San Francisco, US', startedAt: '2026-06-14 09:15', lastActivity: '12 min ago', current: false },
    { id: 'ses-4', user: 'mike@acme.com', device: 'Ubuntu 24', browser: 'Chrome 126', ip: '10.0.0.52', location: 'London, UK', startedAt: '2026-06-14 06:00', lastActivity: '3 hrs ago', current: false },
  ]);

  const filteredLogs = auditLogs.filter(l => {
    if (auditFilter !== 'ALL' && l.severity !== auditFilter) return false;
    if (auditSearch && !l.user.includes(auditSearch) && !l.action.includes(auditSearch.toUpperCase()) && !l.entity.includes(auditSearch) && !l.details.toLowerCase().includes(auditSearch.toLowerCase())) return false;
    return true;
  });

  const severityStyles = (s: string) => {
    const map: Record<string, { color: string; bg: string }> = {
      INFO: { color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
      WARNING: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
      CRITICAL: { color: 'var(--color-error)', bg: 'var(--color-error-light)' },
    };
    return map[s] || { color: 'var(--color-text)', bg: 'var(--color-bg)' };
  };

  const tabs = [
    { id: 'audit' as const, label: 'Audit Logs', icon: <Search size={14} /> },
    { id: 'mfa' as const, label: 'MFA / 2FA', icon: <Smartphone size={14} /> },
    { id: 'ip' as const, label: 'IP Allowlist', icon: <Globe size={14} /> },
    { id: 'sessions' as const, label: 'Sessions', icon: <Monitor size={14} /> },
    { id: 'billing' as const, label: 'Tenant Billing', icon: <CreditCard size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Shield style={{ color: 'var(--color-primary)' }} />
          Security & Administration
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Searchable audit logs, MFA enforcement, IP allowlisting, session management, and tenant billing.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)', whiteSpace: 'nowrap'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Audit Logs */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
                {filteredLogs.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)', ...severityStyles(l.severity) }}>{l.severity}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{l.user}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <code style={{ fontSize: '11px', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{l.action}</code>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{l.entity} ({l.entityId})</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{l.ip}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MFA / 2FA */}
      {activeTab === 'mfa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <CheckCircle size={28} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>72%</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>MFA Enrollment Rate</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <Key size={28} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>TOTP</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Primary Method</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <AlertTriangle size={28} style={{ color: 'var(--color-warning)', margin: '0 auto var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>7</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Users Without MFA</div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>MFA Enforcement Policy</h3>
            {[
              { label: 'Enforce MFA for All Users', desc: 'Require all users to set up MFA at next login', enabled: true },
              { label: 'TOTP Authenticator App', desc: 'Google Authenticator, Authy, Microsoft Authenticator', enabled: true },
              { label: 'SMS One-Time Password', desc: 'Send verification code via SMS to registered phone', enabled: true },
              { label: 'Hardware Security Key (FIDO2)', desc: 'Support YubiKey and other FIDO2 compatible keys', enabled: false },
              { label: 'Recovery Codes', desc: 'Generate 10 single-use recovery codes during setup', enabled: true },
              { label: 'Remember Trusted Devices', desc: 'Skip MFA for 30 days on trusted devices', enabled: true },
            ].map((opt, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) 0', borderBottom: i < 5 ? '1px solid var(--color-border)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
                </div>
                <div style={{ width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', background: opt.enabled ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: opt.enabled ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IP Allowlist */}
      {activeTab === 'ip' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>IP Allowlist Rules</h3>
              <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Add Rule</button>
            </div>
            {[
              { cidr: '192.168.1.0/24', label: 'Office Network', enabled: true },
              { cidr: '10.0.0.0/16', label: 'VPN Range', enabled: true },
              { cidr: '172.16.0.0/12', label: 'Cloud Infrastructure', enabled: true },
              { cidr: '203.45.67.0/24', label: 'Partner Office', enabled: false },
            ].map((rule, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', opacity: rule.enabled ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Globe size={16} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <code style={{ fontSize: '12px', fontWeight: 'var(--weight-semibold)' }}>{rule.cidr}</code>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{rule.label}</div>
                  </div>
                </div>
                <div style={{ width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', background: rule.enabled ? 'var(--color-success)' : 'var(--color-border)', position: 'relative' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: rule.enabled ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Active Sessions ({sessions.length})</h3>
            <button style={{ background: 'var(--color-error)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <LogOut size={14} /> Revoke All Others
            </button>
          </div>
          {sessions.map(s => (
            <div key={s.id} style={{
              background: 'var(--color-bg-elevated)', border: s.current ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Monitor size={20} style={{ color: s.current ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
                <div>
                  <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {s.device} — {s.browser}
                    {s.current && <span style={{ fontSize: '9px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>Current</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{s.user} • {s.ip} • {s.location}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Started: {s.startedAt} • Last: {s.lastActivity}</div>
                </div>
              </div>
              {!s.current && (
                <button style={{ background: 'none', border: '1px solid var(--color-error)', padding: '4px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <XCircle size={12} /> Revoke
                </button>
              )}
            </div>
          ))}

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Session Policy</h3>
            {[
              { label: 'Max Concurrent Sessions', value: '5' },
              { label: 'Session Timeout (idle)', value: '30 min' },
              { label: 'Absolute Session Lifetime', value: '8 hours' },
              { label: 'Force Logout on Password Change', value: 'Enabled' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{p.label}</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tenant Billing */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Current Plan</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>Business</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>$199/mo • 25 users</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Current Usage</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>18 / 25</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Active users this month</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Next Invoice</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>$199.00</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Due: Jul 1, 2026</div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Invoice History</h3>
            {[
              { date: 'Jun 1, 2026', amount: '$199.00', status: 'PAID' },
              { date: 'May 1, 2026', amount: '$199.00', status: 'PAID' },
              { date: 'Apr 1, 2026', amount: '$149.00', status: 'PAID' },
              { date: 'Mar 1, 2026', amount: '$149.00', status: 'PAID' },
            ].map((inv, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) 0', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <CreditCard size={14} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>{inv.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{inv.amount}</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-success)', background: 'var(--color-success-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{inv.status}</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '11px' }}>Download</button>
                </div>
              </div>
            ))}
          </div>

          <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', alignSelf: 'flex-start' }}>
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  );
}
