'use client';

import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, RefreshCw } from 'lucide-react';

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  maxAge: number;
}

const API_BASE = '/api/v1/admin/security';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function PasswordPolicyPage() {
  const [policy, setPolicy] = useState<PasswordPolicy>({ minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecial: false, maxAge: 90 });
  const [loading, setLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/password-policy`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPolicy(data);
      }
    } catch (e) {
      console.error('Error fetching password policy', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const savePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPolicySaving(true);
    setPolicySaved(false);
    try {
      const res = await fetch(`${API_BASE}/password-policy`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(policy),
      });
      if (res.ok) {
        setPolicySaved(true);
        setTimeout(() => setPolicySaved(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save password policy', e);
    } finally {
      setPolicySaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Key style={{ color: 'var(--color-primary)' }} />
          Password Policy Rules
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Set standard complexity requirements, length validations, and expiration intervals for tenant user passwords.
        </p>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : (
          <form onSubmit={savePolicy} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>Password Rules Configuration</h3>

            {/* Min length slider */}
            <div style={{ padding: 'var(--space-2.5) 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Minimum Password Length</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Minimum number of characters required for validity</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="range" min={6} max={24} value={policy.minLength}
                  onChange={e => setPolicy({ ...policy, minLength: +e.target.value })}
                  style={{ width: '120px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', minWidth: '24px', textAlign: 'center' }}>{policy.minLength}</span>
              </div>
            </div>

            {/* Max age */}
            <div style={{ padding: 'var(--space-2.5) 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Maximum Password Lifetime (Days)</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Force passwords to change after this amount of time (0 = unlimited age)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="number" min={0} max={365} value={policy.maxAge}
                  onChange={e => setPolicy({ ...policy, maxAge: +e.target.value })}
                  style={{ width: '80px', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', textAlign: 'center' }}
                />
              </div>
            </div>

            {/* Toggles */}
            {[
              { key: 'requireUppercase' as const, label: 'Require Uppercase Letters', desc: 'At least one uppercase A-Z character required' },
              { key: 'requireNumbers' as const, label: 'Require Digits', desc: 'At least one 0-9 numeric value required' },
              { key: 'requireSpecial' as const, label: 'Require Special Characters', desc: 'At least one special punctuation symbol required' },
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

            {/* Action buttons */}
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="submit" disabled={policySaving} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                cursor: policySaving ? 'wait' : 'pointer', fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)'
              }}>
                {policySaving ? 'Saving...' : 'Apply Password Policy'}
              </button>
              {policySaved && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <CheckCircle size={12} /> Password rules saved
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
