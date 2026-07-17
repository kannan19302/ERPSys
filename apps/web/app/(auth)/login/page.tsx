'use client';
import styles from './page.module.css';
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
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="auth-container">
      {/* Left Panel — Branding & Feature Carousel */}
      <div className="auth-sidebar auth-sidebar-purple">
        <div className={`auth-sidebar-shape ${styles.s2}`}  />
        <div className={`auth-sidebar-shape ${styles.s3}`}  />

        <div className="auth-sidebar-content">
          <div className="auth-logo-area">
            <div className="auth-logo-icon">
              <Shield size={22} className={styles.s40} />
            </div>
            <div>
              <h2 className={styles.s4}>UniERP</h2>
              <p className={styles.s5}>Enterprise Platform</p>
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
          <div className={styles.s6}>
            <div className={styles.s7}>
              <Shield size={24} />
            </div>
            <span className={styles.s8}>UniERP</span>
          </div>

          <div className="auth-form-header">
            <h1>{mfaRequired ? 'Security Verification' : forgotPasswordMode ? 'Recover Password' : 'Welcome back'}</h1>
            <p className={styles.s9}>{mfaRequired ? 'Enter the authenticator code associated with your admin profile.' : forgotPasswordMode ? 'Enter your email address to reset access.' : 'Sign in to access your business operations.'}</p>
          </div>

          <div className="auth-card">
            {error && (
              <div className={styles.s10}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* MFA INTERCEPT FORM */}
            {mfaRequired ? (
              <form onSubmit={handleMfaVerify} className={styles.s11}>
                <div className={styles.s12}>
                  <Sparkles size={12} className={styles.s41} />
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
                      className={`auth-input ${styles.s13}`}
                      placeholder="123456"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      
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
                  className={styles.s14}
                >
                  Cancel & Back
                </button>
              </form>
            ) : (
              /* REGULAR LOGIN FORM */
              <form onSubmit={handleSubmit} className={styles.s11}>
                {recoverySuccess && (
                  <div className={styles.s15}>
                    <div className={styles.s16}>
                      <Sparkles size={16} />
                      <span>{recoverySuccess}</span>
                    </div>
                    {developerResetLink && (
                      <div className={styles.s17}>
                        <span className={styles.s18}>[Dev Mode Recovery Link]</span>
                        <Link href={developerResetLink} className={styles.s44}>
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
                    <div className={styles.s19}>
                      <label className="auth-label">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordMode(true);
                          setError(null);
                          setRecoverySuccess(null);
                        }}
                        className={styles.s20}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className={`auth-input ${styles.s21}`}
                        
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className={`password-toggle-btn ${styles.s22}`}
                        onClick={() => setShowPassword(!showPassword)}
                        
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Organization Slug (Optional) — hidden in forgot password mode */}
                {!forgotPasswordMode && (
                  <div className="auth-field-group">
                    <label className="auth-label">Organization Slug {isSsoConfigured && <span className={styles.s23}>(SSO Enabled)</span>}</label>
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
                    <p className={styles.s24}>
                      {isSsoConfigured 
                        ? 'This organization uses Single Sign-On. You will be authenticated via OIDC/SAML.' 
                        : 'Required if your email address is registered under multiple organizations.'}
                    </p>
                  </div>
                )}

                {/* Remember me (hidden in forgot mode) */}
                {!forgotPasswordMode && !isSsoConfigured && (
                  <div className={styles.s16}>
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={styles.s25}
                    />
                    <label htmlFor="remember-me" className={styles.s26}>
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
                    <>Sign In with SSO <Sparkles size={14} className={styles.s42} /></>
                  ) : (
                    <>Sign In <ChevronRight size={16} /></>
                  )}
                </button>

                {/* Biometric Passkey trigger option */}
                {!forgotPasswordMode && !isSsoConfigured && (
                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    className={`passkey-login-btn ${styles.s27} ${styles.passkeyHover}`}
                  >
                    <Fingerprint size={16} className={styles.s43} />
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
                    className={`${styles.s28} ${styles.backHover}`}
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

          <p className={styles.s29}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className={styles.s45}>
              Register Organization
            </Link>
          </p>
        </div>
      </div>

      {/* Demo Persona Modal */}
      {showDemoModal && (
        <div className={styles.s30}>
          <div className={styles.s31}>
            <div>
              <h2 className={styles.s32}>Login as Developer Demo User</h2>
              <p className={styles.s33}>
                Select a pre-seeded organizational persona to log in and inspect pre-configured module access keys JIT.
              </p>
            </div>

            <div className={styles.s34}>
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
                  className={`demo-persona-select-btn ${styles.s35}`}
                  
                >
                  <div className={styles.s36}>
                    <span className={styles.s37}>{role.name}</span>
                    <span className={styles.s38}>{role.email}</span>
                  </div>
                  <span className={styles.s39}>{role.desc}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowDemoModal(false)}
              className={styles.s14}
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
