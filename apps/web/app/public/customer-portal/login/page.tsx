'use client';

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
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-secondary, #f4f5f7)' }}>
      <Card className="frappe-card" style={{ width: 380, padding: 24 }}>
        <h2 style={{ marginBottom: 4 }}>Customer Portal</h2>
        <p style={{ opacity: 0.65, marginBottom: 20 }}>Sign in to view your quotes, orders, invoices and support cases.</p>

        {error && (
          <div className="frappe-alert frappe-alert-error" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="frappe-form-group">
            <label className="frappe-label">Email</label>
            <input
              className="frappe-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="frappe-form-group">
            <label className="frappe-label">Password</label>
            <input
              className="frappe-input"
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
