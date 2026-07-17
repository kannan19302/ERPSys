'use client';
import styles from './page.module.css';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Spinner } from '@unerp/ui';
import { LogIn, AlertCircle } from 'lucide-react';
import { portalPost, setPortalToken, PortalApiError } from '../../../../src/lib/portal-api';

export default function CustomerPortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await portalPost<{ token: string; customerId: string }>('/portal/auth/login', {
        email,
        password,
      });
      setPortalToken(result.token);
      router.push('/public/customer-portal/dashboard');
    } catch (e) {
      setError(e instanceof PortalApiError ? e.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.s1}>
      <Card className="ui-card" style={{ width: 380, padding: 24 }}>
        <h2 className={styles.s2}>Customer Portal</h2>
        <p className={styles.s3}>Sign in to view your quotes, orders, invoices and support cases.</p>

        {error && (
          <div className={`ui-alert ui-alert-error ${styles.s4}`} >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ui-form-group">
            <label className="ui-label">Email</label>
            <input
              className="ui-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Password</label>
            <input
              className="ui-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={submitting} style={{ width: '100%', marginTop: 8 }}>
            {submitting ? <Spinner size="sm" /> : <><LogIn size={16} /> Sign in</>}
          </Button>
        </form>
      </Card>
    </div>
  );
}
