'use client';

import '../../landing.css';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Spinner } from '@unerp/ui';
import { Building, Lock, Mail, ChevronRight, AlertCircle, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { apiPost, ApiRequestError } from '../../../src/lib/api';

const VALUE_PROPS = [
  { icon: '🏢', title: 'Multi-Tenant Isolation', desc: 'Every organization gets its own secure, isolated data space.' },
  { icon: '🔐', title: 'Enterprise Security', desc: 'Role-based access, field-level permissions, and audit trails.' },
  { icon: '📊', title: 'Real-Time Dashboards', desc: 'Live KPIs, drill-down analytics, and exportable reports.' },
  { icon: '🔧', title: 'Zero-Code Builder', desc: 'Create custom forms, workflows, and pages without writing code.' },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'var(--color-danger)' };
  if (score <= 2) return { score, label: 'Fair', color: 'var(--color-warning)' };
  if (score <= 3) return { score, label: 'Good', color: '#f59e0b' };
  if (score <= 4) return { score, label: 'Strong', color: 'var(--color-success)' };
  return { score, label: 'Excellent', color: '#22c55e' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  // Password match check
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  // Calculate progress (how many fields filled)
  const filledFields = [organizationName, firstName, lastName, email, password, confirmPassword].filter(Boolean).length;
  const progressPct = Math.round((filledFields / 6) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword || !organizationName) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiPost('/auth/register', {
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        organizationName,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        const message = err instanceof Error ? err.message : 'Failed to connect to the organization setup service.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Panel — Branding */}
      <div className="auth-sidebar auth-sidebar-green">
        {/* Animated background shapes */}
        <div className="auth-sidebar-shape" style={{ top: '-80px', right: '-80px', width: '350px', height: '350px', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="auth-sidebar-shape" style={{ bottom: '-80px', left: '-40px', width: '280px', height: '280px', animation: 'pulse 6s ease-in-out infinite reverse' }} />

        <div className="auth-sidebar-content">
          {/* Logo */}
          <div className="auth-logo-area">
            <div className="auth-logo-icon">
              <Building size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>UniERP</h2>
              <p style={{ margin: 0, fontSize: '9px', opacity: 0.7, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#fff' }}>New Organization</p>
            </div>
          </div>

          <h1>Start running your<br />business in minutes.</h1>
          <p>
            Create a fully isolated tenant with admin access. Your data is yours — always.
          </p>

          {/* Value propositions */}
          <div className="auth-sidebar-features">
            {VALUE_PROPS.map((prop, i) => (
              <div key={i} className="auth-sidebar-feature" style={{ cursor: 'default' }}>
                <h4 style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>{prop.icon}</span> {prop.title}
                </h4>
                <p>{prop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Registration Form */}
      <div className="auth-main-panel">
        <div className="auth-form-wrapper">
          {/* Form Header */}
          <div className="auth-form-header">
            <h1>Register Organization</h1>
            <p>Create a new isolated system tenant and bootstrap your admin.</p>
          </div>

          {/* Progress bar */}
          <div className="auth-progress-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              <span>Setup progress</span>
              <span style={{ fontWeight: 'var(--weight-semibold)' }}>{progressPct}%</span>
            </div>
            <div className="auth-progress-bar">
              <div
                className="auth-progress-fill"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100 ? 'var(--color-success)' : 'var(--color-primary)'
                }}
              />
            </div>
          </div>

          {/* Form Card */}
          <div className="auth-card">
            {success ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', animation: 'fadeInUp 0.3s ease-out' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-success-light)',
                  color: 'var(--color-success)',
                  marginBottom: 'var(--space-4)',
                }}>
                  <Sparkles size={32} />
                </div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 var(--space-2)' }}>
                  Tenant Created Successfully!
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 'var(--text-sm)' }}>
                  Redirecting you to the sign-in portal…
                </p>
              </div>
            ) : (
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
                  <label className="auth-label">Organization / Company Name *</label>
                  <div className="auth-input-wrapper">
                    <Building size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      required
                      className="auth-input"
                      placeholder="Acme Corporation"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Industry selector */}
                <div className="auth-field-group">
                  <label className="auth-label">Industry (Optional)</label>
                  <select
                    className="auth-select"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">— Select Industry —</option>
                    <option value="technology">Technology & SaaS</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="real-estate">Real Estate</option>
                    <option value="retail">Retail & E-Commerce</option>
                    <option value="services">Professional Services</option>
                    <option value="finance">Financial Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                  <div className="auth-field-group">
                    <label className="auth-label">First Name *</label>
                    <div className="auth-input-wrapper">
                      <User size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        required
                        className="auth-input"
                        placeholder="Jane"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={{ paddingLeft: 'var(--space-10)' }}
                      />
                    </div>
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-label">Last Name *</label>
                    <div className="auth-input-wrapper">
                      <User size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        required
                        className="auth-input"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={{ paddingLeft: 'var(--space-10)' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Admin Email *</label>
                  <div className="auth-input-wrapper">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      required
                      className="auth-input"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">System Admin Password *</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="auth-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password strength meter */}
                  {password && (
                    <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map(level => (
                          <div
                            key={level}
                            style={{
                              flex: 1,
                              height: 3,
                              borderRadius: 'var(--radius-full)',
                              background: passwordStrength.score >= level ? passwordStrength.color : 'var(--color-bg-sunken)',
                              transition: 'background 0.2s ease',
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: passwordStrength.color }}>
                        {passwordStrength.label}
                        {password.length > 0 && password.length < 8 && ' — min 8 characters'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="auth-field-group">
                  <label className="auth-label">Confirm Password *</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="auth-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ borderColor: !passwordsMatch ? 'var(--color-danger)' : undefined }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!passwordsMatch && (
                    <p style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 500 }}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Terms of service */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{
                      accentColor: 'var(--color-primary)',
                      width: 16,
                      height: 16,
                      cursor: 'pointer',
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  />
                  <label htmlFor="agree-terms" style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    lineHeight: 1.5,
                  }}>
                    I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</a>
                  </label>
                </div>

                <button
                  type="submit"
                  className="landing-btn-primary auth-btn-submit"
                  disabled={loading || !agreedToTerms || !passwordsMatch}
                >
                  {loading ? (
                    <><Spinner size="sm" /> Creating Tenant...</>
                  ) : (
                    <>Create Tenant & Account <ChevronRight size={16} /></>
                  )}
                </button>
              </form>
            )}
          </div>

          <p style={{
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
          }}>
            Already have an account?{' '}
            <Link href="/login" style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              Sign in here
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          div:has(> .frappe-card) { flex: 1 !important; }
        }
      `}</style>
    </div>
  );
}

