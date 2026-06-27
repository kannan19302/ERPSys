'use client';

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

  useEffect(() => {
    apiGet('/auth/me')
      .then(() => router.push('/apps'))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--color-bg-sunken)',
    }}>
      {/* Left Panel — Branding & Features */}
      <div style={{
        flex: '0 0 480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-10)',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated background shapes */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          animation: 'pulse 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          animation: 'pulse 6s ease-in-out infinite reverse',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-10)',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-xl)',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Shield size={26} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>UniERP</h2>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', opacity: 0.7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Enterprise Platform</p>
            </div>
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            lineHeight: 1.2,
            margin: '0 0 var(--space-3)',
            letterSpacing: '-0.03em',
          }}>
            Run your entire<br />business from one place.
          </h1>
          <p style={{
            fontSize: 'var(--text-md)',
            opacity: 0.75,
            lineHeight: 1.6,
            margin: '0 0 var(--space-8)',
            maxWidth: '380px',
          }}>
            A composable, multi-tenant ERP for Finance, HR, CRM, Inventory, Manufacturing, and beyond.
          </p>

          {/* Feature carousel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {FEATURES.map((feat, i) => (
              <div
                key={i}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  background: i === activeFeature ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === activeFeature ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.4s ease',
                  cursor: 'pointer',
                  transform: i === activeFeature ? 'translateX(4px)' : 'none',
                }}
                onClick={() => setActiveFeature(i)}
              >
                <h4 style={{
                  margin: '0 0 4px',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  opacity: i === activeFeature ? 1 : 0.7,
                }}>
                  {feat.title}
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: 'var(--text-xs)',
                  opacity: i === activeFeature ? 0.8 : 0.5,
                  lineHeight: 1.5,
                }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}>
        <div style={{
          maxWidth: '420px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          animation: 'fadeInUp 0.5s ease-out',
        }}>
          {/* Form Header */}
          <div>
            <h1 style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              margin: '0 0 var(--space-2)',
              color: 'var(--color-text)',
              letterSpacing: '-0.02em',
            }}>
              Welcome back
            </h1>
            <p style={{
              color: 'var(--color-text-secondary)',
              margin: 0,
              fontSize: 'var(--text-sm)',
            }}>
              Sign in to access your business operations.
            </p>
          </div>

          {/* Form Card */}
          <div className="frappe-card">
            <div className="frappe-card-body">
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

                <div className="frappe-form-group">
                  <label className="frappe-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input
                      type="email"
                      required
                      className="frappe-input"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: 'var(--space-10)' }}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="frappe-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="frappe-label">Password</label>
                    <a href="#" style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}>
                      Forgot password?
                    </a>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="frappe-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingLeft: 'var(--space-10)', paddingRight: 'var(--space-10)' }}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 'var(--space-3)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-tertiary)',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="frappe-form-group">
                  <label className="frappe-label">Organization Slug (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input
                      type="text"
                      className="frappe-input"
                      placeholder="acme"
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value)}
                      style={{ paddingLeft: 'var(--space-10)' }}
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
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
                  className="frappe-btn frappe-btn-primary"
                  style={{
                    marginTop: 'var(--space-1)',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: 'var(--space-3) var(--space-4)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                  }}
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                margin: 'var(--space-5) 0 var(--space-4)',
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              </div>

              {/* Social buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2-5) var(--space-4)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-sunken)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2-5) var(--space-4)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-sunken)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M11.4 24H0V12.6L4.8 7.8h6.6v16.2zM24 24H12.6V7.8H24V24zM11.4 6.6H4.8L0 1.8V0h11.4v6.6zM24 6.6H12.6V0H24v6.6z" fill="#00A4EF"/></svg>
                  Microsoft
                </button>
              </div>
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

      {/* CSS animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @media (max-width: 900px) {
          .auth-layout > div:first-child { display: none !important; }
        }
      `}</style>
    </div>
  );
}
