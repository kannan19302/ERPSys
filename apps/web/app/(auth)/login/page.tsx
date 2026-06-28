'use client';

import '../../landing.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Spinner } from '@unerp/ui';
import { Shield, Lock, Mail, ChevronRight, AlertCircle, Building, Eye, EyeOff } from 'lucide-react';
import { apiPost, apiGet, ApiRequestError } from '../../../src/lib/api';

const FEATURES = [
  { title: 'Unified Operations', desc: 'Finance, HR, CRM, Inventory — all in one platform.' },
  { title: 'Real-Time Analytics', desc: 'BI dashboards with drill-down into live source records.' },
  { title: 'Industry Modules', desc: 'Healthcare, Education, Real Estate, Field Service & more.' },
  { title: 'Zero-Code Builder', desc: 'Visual form builder, workflow engine & approval chains.' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      apiGet('/auth/me')
        .then(() => router.push('/apps'))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setChecking(false);
        });
    } else {
      setChecking(false);
    }
  }, [router]);

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % FEATURES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiPost<{ token: string; user: Record<string, unknown> }>('/auth/login', {
        email,
        password,
        tenantSlug: tenantSlug || undefined,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push('/apps');
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Connection to authentication service failed. Please ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || checking) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-sunken)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="auth-container">
      {/* Left Panel — Branding & Features */}
      <div className="auth-sidebar auth-sidebar-purple">
        {/* Animated background shapes */}
        <div className="auth-sidebar-shape" style={{ top: '-100px', right: '-100px', width: '400px', height: '400px', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="auth-sidebar-shape" style={{ bottom: '-60px', left: '-60px', width: '300px', height: '300px', animation: 'pulse 6s ease-in-out infinite reverse' }} />

        <div className="auth-sidebar-content">
          {/* Logo */}
          <div className="auth-logo-area">
            <div className="auth-logo-icon">
              <Shield size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>UniERP</h2>
              <p style={{ margin: 0, fontSize: '9px', opacity: 0.7, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#fff' }}>Enterprise Platform</p>
            </div>
          </div>

          <h1>Run your entire<br />business from one place.</h1>
          <p>
            A composable, multi-tenant ERP for Finance, HR, CRM, Inventory, Manufacturing, and beyond.
          </p>

          {/* Feature carousel */}
          <div className="auth-sidebar-features">
            {FEATURES.map((feat, i) => (
              <div
                key={i}
                className={`auth-sidebar-feature${i === activeFeature ? ' active' : ''}`}
                onClick={() => setActiveFeature(i)}
              >
                <h4>{feat.title}</h4>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="auth-main-panel">
        <div className="auth-form-wrapper">
          {/* Form Header */}
          <div className="auth-form-header">
            <h1>Welcome back</h1>
            <p>Sign in to access your business operations.</p>
          </div>

          {/* Form Card */}
          <div className="auth-card">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  background: 'var(--color-danger-light)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger-text)',
                  fontSize: 'var(--text-sm)',
                  animation: 'fadeInUp 0.2s ease-out',
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="auth-field-group">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    required
                    className="auth-input"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="auth-label">Password</label>
                  <a href="#" style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}>
                    Forgot password?
                  </a>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Organization Slug (Optional)</label>
                <div className="auth-input-wrapper">
                  <Building size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="acme"
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value)}
                  />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: '4px 0 0' }}>
                  Only needed if your email is registered under multiple tenants.
                </p>
              </div>

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)', width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="remember-me" style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}>
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                className="landing-btn-primary auth-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <><Spinner size="sm" /> Signing in...</>
                ) : (
                  <>Sign In <ChevronRight size={16} /></>
                )}
              </button>
            </form>

            {/* Social login divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or continue with</span>
              <div className="auth-divider-line" />
            </div>

            {/* Social buttons */}
            <div className="auth-social-grid">
              <button type="button" className="auth-social-btn">
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button type="button" className="auth-social-btn">
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M11.4 24H0V12.6L4.8 7.8h6.6v16.2zM24 24H12.6V7.8H24V24zM11.4 6.6H4.8L0 1.8V0h11.4v6.6zM24 6.6H12.6V0H24v6.6z" fill="#00A4EF"/></svg>
                Microsoft
              </button>
            </div>
          </div>

          <p style={{
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
          }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              Register Organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
