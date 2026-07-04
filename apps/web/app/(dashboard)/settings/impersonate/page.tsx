'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Search, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

const API_BASE = '/api/v1/admin/security';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function ImpersonatePage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/v1/admin/users', { 
        headers: { 
          Authorization: `Bearer ${token}` 
        } 
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError(`Failed to fetch user directory: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Failed to load users', e);
      setError('Connection error loading users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const triggerImpersonation = async (userId: string) => {
    setImpersonatingId(userId);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/impersonate/${userId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        // Redirect to dashboard under the impersonated context
        window.location.href = '/admin';
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || `Impersonation failed: ${res.statusText}`);
        setImpersonatingId(null);
      }
    } catch (e) {
      console.error('Impersonation failed', e);
      setError('Connection error executing impersonation');
      setImpersonatingId(null);
    }
  };

  const filteredUsers = users.filter(
    u => u.email.toLowerCase().includes(searchUser.toLowerCase()) || 
         `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1000px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <UserCheck style={{ color: 'var(--color-primary)' }} />
          Administrative Impersonation
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Securely bypass authentication to view and operate the system as any tenant member. All operations executed during impersonation are audit-logged under your original admin account.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--color-warning-light)', color: 'var(--color-warning)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ display: 'block', marginBottom: '2px' }}>Audit Policy Enforcement</strong>
          <span>Any session started through administrative impersonation automatically triggers alerts. Please ensure you have explicit consent or authorization before proceeding.</span>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' }}>
            <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
            <input 
              value={searchUser} 
              onChange={e => setSearchUser(e.target.value)} 
              placeholder="Search users by name, email, or credentials..." 
              style={{ flex: 1, border: 'none', background: 'transparent', padding: 'var(--space-2.5) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} 
            />
          </div>
          <button 
            onClick={fetchUsers} 
            disabled={loading}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2.5)', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}
            title="Refresh Directory"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-6)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            No users match the search criteria or the directory is empty.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2.5)' }}>
            {filteredUsers.map(u => (
              <div 
                key={u.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: 'var(--space-3.5) var(--space-4)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'var(--color-bg)',
                  gap: 'var(--space-3)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                    {u.firstName} {u.lastName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontFamily: 'monospace' }}>{u.email}</span>
                    &bull; 
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: 'var(--weight-bold)', 
                      color: u.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)' 
                    }}>
                      {u.status}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => triggerImpersonation(u.id)} 
                  disabled={impersonatingId !== null} 
                  style={{
                    background: impersonatingId === u.id ? 'var(--color-primary-light)' : 'var(--color-primary)', 
                    color: impersonatingId === u.id ? 'var(--color-primary)' : '#fff', 
                    border: 'none',
                    padding: 'var(--space-2) var(--space-4)', 
                    borderRadius: 'var(--radius-md)',
                    cursor: impersonatingId !== null ? 'wait' : 'pointer', 
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-bold)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {impersonatingId === u.id ? (
                    <>
                      <RefreshCw size={12} className="spin" />
                      Loading...
                    </>
                  ) : (
                    'Impersonate'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
