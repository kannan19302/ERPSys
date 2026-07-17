'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Search, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

export default function ImpersonatePage() {
  const client = useApiClient();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await client.get<UserSummary[]>('/admin/users'));
    } catch (e) {
      console.error('Failed to load users', e);
      setError('Connection error loading users');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const triggerImpersonation = async (userId: string) => {
    setImpersonatingId(userId);
    setError(null);
    try {
      const data = await client.post<{ token: string }>(`/admin/security/impersonate/${userId}`);
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Redirect to dashboard under the impersonated context
        window.location.href = '/settings';
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
    <div className={styles.p1}>
      <div>
        <h1 className="text-2xl ui-hstack-2">
          <UserCheck className="ui-text-primary" />
          Administrative Impersonation
        </h1>
        <p className="ui-text-sm-muted">
          Securely bypass authentication to view and operate the system as any tenant member. All operations executed during impersonation are audit-logged under your original admin account.
        </p>
      </div>

      <div className={styles.p2}>
        <ShieldAlert size={20} className={styles.p3} />
        <div>
          <strong className={styles.p4}>Audit Policy Enforcement</strong>
          <span>Any session started through administrative impersonation automatically triggers alerts. Please ensure you have explicit consent or authorization before proceeding.</span>
        </div>
      </div>

      {error && (
        <div className={styles.p5}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="ui-card p-5">
        <div className={styles.p6}>
          <div className={styles.p7}>
            <Search size={16} className="ui-text-tertiary" />
            <input 
              value={searchUser} 
              onChange={e => setSearchUser(e.target.value)} 
              placeholder="Search users by name, email, or credentials..." 
              className={styles.p8}
            />
          </div>
          <button 
            onClick={fetchUsers} 
            disabled={loading}
            className={styles.p9}
            title="Refresh Directory"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="ui-flex-center p-8">
            <RefreshCw size={24} className="spin ui-text-muted" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.p10}>
            No users match the search criteria or the directory is empty.
          </div>
        ) : (
          <div className={styles.p11}>
            {filteredUsers.map(u => (
              <div 
                key={u.id} 
                className={styles.p12}
              >
                <div>
                  <div className={styles.p13}>
                    {u.firstName} {u.lastName}
                  </div>
                  <div className={styles.p14}>
                    <span className="font-mono">{u.email}</span>
                    &bull; 
                    <span style={{ color: u.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)' }} className={styles.s1}>
                      {u.status}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => triggerImpersonation(u.id)} 
                  disabled={impersonatingId !== null} 
                  style={{ background: impersonatingId === u.id ? 'var(--color-primary-light)' : 'var(--color-primary)', color: impersonatingId === u.id ? 'var(--color-primary)' : 'var(--color-primary-text)', cursor: impersonatingId !== null ? 'wait' : 'pointer' }} className={styles.s2}
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
