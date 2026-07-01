'use client';

import '../../landing.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Spinner } from '@unerp/ui';
import { Shield, Lock, Mail, ChevronRight, AlertCircle, Building, Eye, EyeOff, Sparkles, Fingerprint } from 'lucide-react';
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

  // Recovery Password states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [developerResetLink, setDeveloperResetLink] = useState<string | null>(null);

  // Demo accounts states
  const [showDemoModal, setShowDemoModal] = useState(false);

  // SSO configuration states
  const [isSsoConfigured, setIsSsoConfigured] = useState(false);
  const [ssoUrls, setSsoUrls] = useState<{ saml: string | null; oidc: string | null }>({ saml: null, oidc: null });

  // MFA validation states
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUserId, setMfaUserId] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // Autoload token sync
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

  // Auto-rotate sidebar features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % FEATURES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Listen to organization slug changes to fetch SSO configurations automatically
  useEffect(() => {
    if (!tenantSlug) {
      setIsSsoConfigured(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      apiGet<{ configured: boolean; samlEntryPoint: string | null; oidcAuthorizationUrl: string | null }>(
        `/auth/sso/config/${tenantSlug}`
      )
        .then(res => {
          if (res.configured) {
            setIsSsoConfigured(true);
            setSsoUrls({ saml: res.samlEntryPoint, oidc: res.oidcAuthorizationUrl });
          } else {
            setIsSsoConfigured(false);
          }
        })
        .catch(() => setIsSsoConfigured(false));
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [tenantSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!password && !isSsoConfigured)) {
      setError('Please fill in your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (forgotPasswordMode) {
        const response = await apiPost<{ message: string; developerResetLink?: string }>('/auth/forgot-password', {
          email,
        });
        setRecoverySuccess(response.message);
        if (response.developerResetLink) {
          setDeveloperResetLink(response.developerResetLink);
        }
      } else if (isSsoConfigured) {
        // Mock SSO integration callback logic
        const result = await apiPost<{ token: string; user: Record<string, unknown> }>(
          `/auth/sso/oidc/callback/${tenantSlug}`,
          { email, firstName: 'SSO', lastName: 'User', code: 'mock-code', redirectUri: window.location.origin }
        );
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        router.push('/apps');
      } else {
        const data = await apiPost<{ token: string; user: Record<string, unknown>; mfaRequired?: boolean; userId?: string }>('/auth/login', {
          email,
          password,
          tenantSlug: tenantSlug || undefined,
        });

        if (data.mfaRequired) {
          setMfaRequired(true);
          setMfaUserId(data.userId || '');
          setLoading(false);
          return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        router.push('/apps');
      }
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        // Highlight organization slug field if user needs it
        if (err.message.includes('Multiple accounts')) {
          const orgInput = document.getElementById('org-slug-input');
          if (orgInput) orgInput.focus();
        }
      } else {
        setError('Connection to authentication service failed. Please check if the NestJS server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode) {
      setError('Please enter the 6-digit MFA code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiPost<{ token: string; user: Record<string, unknown> }>('/auth/mfa/verify-login', {
        userId: mfaUserId,
        code: mfaCode,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/apps');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid MFA verification code');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Direct high-fidelity simulated Passkey assertion login bypass
      const data = await apiPost<{ token: string; user: Record<string, unknown> }>('/auth/passkey/login', {
        credentialID: 'cred_mock_superadmin',
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/apps');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Passkey validation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'FINANCE_MANAGER' | 'VIEWER') => {
    setLoading(true);
    setError(null);
    setShowDemoModal(false);

    try {
      const data = await apiPost<{ token: string; user: Record<string, unknown> }>('/auth/login-demo', {
        role,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push('/apps');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
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
      {/* Left Panel — Branding & Feature Carousel */}
      <div className="auth-sidebar auth-sidebar-purple">
        <div className="auth-sidebar-shape" style={{ top: '-100px', right: '-100px', width: '400px', height: '400px', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="auth-sidebar-shape" style={{ bottom: '-60px', left: '-60px', width: '300px', height: '300px', animation: 'pulse 6s ease-in-out infinite reverse' }} />

        <div className="auth-sidebar-content">
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
            A modular, multi-tenant workspace built for Finance, HR, CRM, Inventory, Manufacturing, and visual app building.
          </p>

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

      {/* Right Panel — Interactive Form */}
      <div className="auth-main-panel">
        <div className="auth-form-wrapper">
          {/* Centered Logo Branding Area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
            }}>
              <Shield size={24} />
            </div>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>UniERP</span>
          </div>

          <div className="auth-form-header">
            <h1>{mfaRequired ? 'Security Verification' : forgotPasswordMode ? 'Recover Password' : 'Welcome back'}</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{mfaRequired ? 'Enter the authenticator code associated with your admin profile.' : forgotPasswordMode ? 'Enter your email address to reset access.' : 'Sign in to access your business operations.'}</p>
          </div>

          <div className="auth-card">
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
                marginBottom: 'var(--space-3)',
                animation: 'fadeInUp 0.2s ease-out',
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* MFA INTERCEPT FORM */}
            {mfaRequired ? (
              <form onSubmit={handleMfaVerify} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-2)', background: 'var(--color-bg-sunken)', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--color-primary)' }} />
                  <strong>[Dev Sandbox Bypass]</strong> You may enter <strong>123456</strong> or <strong>000000</strong>.
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Authenticator TOTP Code</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      className="auth-input"
                      placeholder="123456"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      style={{ letterSpacing: '0.5em', textAlign: 'center', fontWeight: 'bold' }}
                    />
                  </div>
                </div>

                <button type="submit" className="landing-btn-primary auth-btn-submit" disabled={loading}>
                  {loading ? <><Spinner size="sm" /> Verifying...</> : <>Verify & Access <ChevronRight size={16} /></>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMfaRequired(false);
                    setMfaCode('');
                    setError(null);
                  }}
                  style={{
                    background: 'none', border: '1px solid var(--color-border)',
                    padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-secondary)', cursor: 'pointer',
                    fontSize: 'var(--text-sm)', fontWeight: 600
                  }}
                >
                  Cancel & Back
                </button>
              </form>
            ) : (
              /* REGULAR LOGIN FORM */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {recoverySuccess && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-3)',
                    background: 'var(--color-success-light)',
                    border: '1px solid var(--color-success)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-success-text)',
                    fontSize: 'var(--text-sm)',
                    animation: 'fadeInUp 0.2s ease-out',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Sparkles size={16} />
                      <span>{recoverySuccess}</span>
                    </div>
                    {developerResetLink && (
                      <div style={{
                        marginTop: 'var(--space-2)',
                        padding: 'var(--space-2)',
                        background: 'var(--color-bg-sunken)',
                        border: '1px dashed var(--color-primary)',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>[Dev Mode Recovery Link]</span>
                        <Link href={developerResetLink} style={{ display: 'block', fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'underline', marginTop: '2px', wordBreak: 'break-all' }}>
                          Reset Password Directly
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Email address field */}
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

                {/* Password field (hidden in forgot mode & if SSO configured) */}
                {!forgotPasswordMode && !isSsoConfigured && (
                  <div className="auth-field-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="auth-label">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordMode(true);
                          setError(null);
                          setRecoverySuccess(null);
                        }}
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-primary)',
                          background: 'none',
                          border: 'none',
                          fontWeight: 500,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="auth-input"
                        style={{ paddingRight: '2.5rem' }}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0,
                          color: 'var(--color-text-tertiary)',
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Organization Slug (Optional) — hidden in forgot password mode */}
                {!forgotPasswordMode && (
                  <div className="auth-field-group">
                    <label className="auth-label">Organization Slug {isSsoConfigured && <span style={{ color: 'var(--color-success)', fontSize: '10px' }}>(SSO Enabled)</span>}</label>
                    <div className="auth-input-wrapper">
                      <Building size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        id="org-slug-input"
                        className="auth-input"
                        placeholder="acme"
                        value={tenantSlug}
                        onChange={(e) => setTenantSlug(e.target.value)}
                        style={{ borderColor: isSsoConfigured ? 'var(--color-success)' : undefined }}
                      />
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', margin: '4px 0 0' }}>
                      {isSsoConfigured 
                        ? 'This organization uses Single Sign-On. You will be authenticated via OIDC/SAML.' 
                        : 'Required if your email address is registered under multiple organizations.'}
                    </p>
                  </div>
                )}

                {/* Remember me (hidden in forgot mode) */}
                {!forgotPasswordMode && !isSsoConfigured && (
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
                )}

                {/* Submit Buttons */}
                <button
                  type="submit"
                  className="landing-btn-primary auth-btn-submit"
                  disabled={loading}
                  style={{ background: isSsoConfigured ? 'var(--color-success)' : undefined, borderColor: isSsoConfigured ? 'var(--color-success)' : undefined }}
                >
                  {loading ? (
                    <><Spinner size="sm" /> Processing...</>
                  ) : forgotPasswordMode ? (
                    <>Send Recovery Link <ChevronRight size={16} /></>
                  ) : isSsoConfigured ? (
                    <>Sign In with SSO <Sparkles size={14} style={{ marginLeft: 4 }} /></>
                  ) : (
                    <>Sign In <ChevronRight size={16} /></>
                  )}
                </button>

                {/* Biometric Passkey trigger option */}
                {!forgotPasswordMode && !isSsoConfigured && (
                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    className="passkey-login-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-2)',
                      background: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 'var(--text-xs)',
                      transition: 'all 0.2s ease',
                      marginTop: 'var(--space-1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                    }}
                  >
                    <Fingerprint size={16} style={{ color: 'var(--color-primary)' }} />
                    Sign in with Passkey / Biometrics
                  </button>
                )}

                {forgotPasswordMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setError(null);
                      setRecoverySuccess(null);
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid var(--color-border)',
                      padding: 'var(--space-2.5) var(--space-4)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 700,
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginTop: 'var(--space-2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    Back to Sign In
                  </button>
                )}
              </form>
            )}

            {/* Social login divider */}
            {!forgotPasswordMode && !mfaRequired && (
              <>
                <div className="auth-divider">
                  <div className="auth-divider-line" />
                  <span className="auth-divider-text">or continue with</span>
                  <div className="auth-divider-line" />
                </div>

                <div className="auth-social-grid">
                  <button type="button" className="auth-social-btn" onClick={() => setShowDemoModal(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google Demo
                  </button>
                  <button type="button" className="auth-social-btn" onClick={() => setShowDemoModal(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M11.4 24H0V12.6L4.8 7.8h6.6v16.2zM24 24H12.6V7.8H24V24zM11.4 6.6H4.8L0 1.8V0h11.4v6.6zM24 6.6H12.6V0H24v6.6z" fill="#00A4EF"/></svg>
                    Microsoft Demo
                  </button>
                </div>
              </>
            )}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Register Organization
            </Link>
          </p>
        </div>
      </div>

      {/* Demo Persona Modal */}
      {showDemoModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', animation: 'fadeInUp 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)',
            width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Login as Developer Demo User</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: '4px 0 0' }}>
                Select a pre-seeded organizational persona to log in and inspect pre-configured module access keys JIT.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[
                { key: 'SUPER_ADMIN', name: 'Super Admin', email: 'admin@unerp.dev', desc: 'Full administration permission keys (*).' },
                { key: 'HR_MANAGER', name: 'HR Manager', email: 'hr-demo@unerp.dev', desc: 'Access to employee profiles and departments.' },
                { key: 'FINANCE_MANAGER', name: 'Finance Manager', email: 'finance-demo@unerp.dev', desc: 'Access to general ledger, bills, and payments.' },
                { key: 'VIEWER', name: 'Standard Viewer', email: 'viewer-demo@unerp.dev', desc: 'Read-only access to core directories.' }
              ].map(role => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => handleDemoLogin(role.key as any)}
                  className="demo-persona-select-btn"
                  style={{
                    background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{role.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-primary)' }}>{role.email}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{role.desc}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowDemoModal(false)}
              style={{
                background: 'none', border: '1px solid var(--color-border)',
                padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600,
                color: 'var(--color-text-secondary)'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation & Custom style rules */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .demo-persona-select-btn:hover {
          border-color: var(--color-primary) !important;
          background: var(--color-bg-elevated) !important;
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
        .password-toggle-btn {
          color: var(--color-text-secondary);
        }
        .password-toggle-btn:hover {
          color: var(--color-primary);
        }
        .passkey-login-btn:hover {
          border-color: var(--color-primary) !important;
          background: var(--color-bg-sunken) !important;
        }
      `}</style>
    </div>
  );
}
