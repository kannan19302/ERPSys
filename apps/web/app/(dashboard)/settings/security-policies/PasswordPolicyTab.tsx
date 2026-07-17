'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Key, CheckCircle, RefreshCw } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './PasswordPolicyTab.module.css';

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  maxAge: number;
}

export default function PasswordPolicyTab() {
  const client = useApiClient();
  const [policy, setPolicy] = useState<PasswordPolicy>({ minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecial: false, maxAge: 90 });
  const [loading, setLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);

  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    try {
      setPolicy(await client.get<PasswordPolicy>('/admin/security/password-policy'));
    } catch {
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { void fetchPolicy(); }, [fetchPolicy]);

  const savePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPolicySaving(true);
    setPolicySaved(false);
    try {
      await client.post('/admin/security/password-policy', policy);
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 3000);
    } catch {
    } finally {
      setPolicySaving(false);
    }
  };

  return (
    <div className={styles.s1}>
      <div className="ui-card p-5">
        {loading ? (
          <div className="ui-flex-center p-8">
            <RefreshCw size={24} className="spin ui-text-muted" />
          </div>
        ) : (
          <form onSubmit={savePolicy} className="ui-stack-4">
            <h3 className={styles.s2}>Password Rules Configuration</h3>

            <div className={styles.s3}>
              <div>
                <div className="ui-heading-sm">Minimum Password Length</div>
                <div className="ui-text-caption">Minimum number of characters required for validity</div>
              </div>
              <div className="ui-hstack-2">
                <input
                  type="range" min={6} max={24} value={policy.minLength}
                  onChange={(e) => setPolicy({ ...policy, minLength: +e.target.value })}
                  className={styles.s4}
                />
                <span className={styles.s5}>{policy.minLength}</span>
              </div>
            </div>

            <div className={styles.s6}>
              <div>
                <div className="ui-heading-sm">Maximum Password Lifetime (Days)</div>
                <div className="ui-text-caption">Force passwords to change after this amount of time (0 = unlimited age)</div>
              </div>
              <div className="ui-hstack-2">
                <input
                  type="number" min={0} max={365} value={policy.maxAge}
                  onChange={(e) => setPolicy({ ...policy, maxAge: +e.target.value })}
                  className={styles.s7}
                />
              </div>
            </div>

            {[
              { key: 'requireUppercase' as const, label: 'Require Uppercase Letters', desc: 'At least one uppercase A-Z character required' },
              { key: 'requireNumbers' as const, label: 'Require Digits', desc: 'At least one 0-9 numeric value required' },
              { key: 'requireSpecial' as const, label: 'Require Special Characters', desc: 'At least one special punctuation symbol required' },
            ].map((opt, i) => (
              <div key={opt.key} className={styles.s8} style={{borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
                <div>
                  <div className="ui-heading-sm">{opt.label}</div>
                  <div className="ui-text-caption">{opt.desc}</div>
                </div>
                <div
                  onClick={() => setPolicy({ ...policy, [opt.key]: !policy[opt.key] })}
                  className={styles.s9} style={{background: policy[opt.key] ? 'var(--color-primary)' : 'var(--color-border)'}}
                >
                  <div className={styles.s10} style={{left: policy[opt.key] ? '20px' : '2px'}} />
                </div>
              </div>
            ))}

            <div className={styles.s11}>
              <button type="submit" disabled={policySaving} className={styles.s12} style={{cursor: policySaving ? 'wait' : 'pointer'}}
              >
                {policySaving ? 'Saving...' : 'Apply Password Policy'}
              </button>
              {policySaved && (
                <span className={styles.s13}>
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
