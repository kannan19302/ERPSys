'use client';

import '../../landing.css';
import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Spinner } from '@unerp/ui';
import { Building, Lock, Mail, ChevronRight, ChevronLeft, AlertCircle, User, Eye, EyeOff, Sparkles, CheckCircle2, Globe, Coins, ShieldAlert } from 'lucide-react';
import { apiPost, ApiRequestError } from '../../../src/lib/api';

const VALUE_PROPS = [
  { icon: '🏢', title: 'Multi-Tenant Isolation', desc: 'Every organization gets its own secure, isolated database space.' },
  { icon: '🔐', title: 'Enterprise Security', desc: 'Role-based access, field-level permissions, and change histories.' },
  { icon: '📊', title: 'Real-Time Analytics', desc: 'Live KPI charts, customized reports, and csv/xlsx exports.' },
  { icon: '🔧', title: 'Zero-Code Builder', desc: 'Build forms, workflow timelines, and pages dynamically.' },
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

interface SeedingStep {
  id: number;
  label: string;
  status: 'waiting' | 'loading' | 'done';
}

export default function RegisterPage() {
  const router = useRouter();
  
  // Wizard Step State
  const [step, setStep] = useState(1);

  // Step 1: Organization Data
  const [organizationName, setOrganizationName] = useState('');
  const [industry, setIndustry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');

  // Step 2: Administrator Profile Data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 3: Console Logs Seeding Simulation
  const [seedingLogs, setSeedingLogs] = useState<SeedingStep[]>([
    { id: 1, label: 'Generating secure organization slug...', status: 'waiting' },
    { id: 2, label: 'Creating isolated tenant partition...', status: 'waiting' },
    { id: 3, label: 'Bootstrapping system roles (Super Admin, Admin, Viewer)...', status: 'waiting' },
    { id: 4, label: 'Creating administrative credentials...', status: 'waiting' },
    { id: 5, label: 'Seeding department structures (Finance, HR, Sales, Ops)...', status: 'waiting' },
    { id: 6, label: 'Provisioning primary warehouse WH-MAIN...', status: 'waiting' },
    { id: 7, label: 'Finalizing setup & launching workspace...', status: 'waiting' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  // Setup progress based on wizard step
  const progressPct = useMemo(() => {
    if (step === 1) return 33;
    if (step === 2) return 66;
    return 100;
  }, [step]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!organizationName) {
        setError('Organization name is required');
        return;
      }
      setError(null);
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setError(null);
      setStep(1);
    }
  };

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

    // Customize logs based on chosen industry profile
    const customLogs = [
      { id: 1, label: 'Generating secure organization slug...', status: 'waiting' },
      { id: 2, label: 'Creating isolated tenant partition...', status: 'waiting' },
      { id: 3, label: 'Bootstrapping system roles (Super Admin, Admin, Viewer)...', status: 'waiting' },
      { id: 4, label: 'Creating administrative credentials...', status: 'waiting' },
      { id: 5, label: 'Seeding department structures (Finance, HR, Sales, Ops)...', status: 'waiting' },
      { id: 6, label: 'Provisioning primary warehouse WH-MAIN...', status: 'waiting' },
      { id: 7, label: 'Finalizing setup & launching workspace...', status: 'waiting' },
    ];

    if (industry === 'healthcare') {
      customLogs[4] = { id: 5, label: 'Seeding clinic directory and practitioner roster...', status: 'waiting' };
      customLogs[5] = { id: 6, label: 'Provisioning Patient EHR tables and EHR encryption keys...', status: 'waiting' };
    } else if (industry === 'education') {
      customLogs[4] = { id: 5, label: 'Seeding academic course registry and faculty lists...', status: 'waiting' };
      customLogs[5] = { id: 6, label: 'Provisioning Student Information Directory and fee catalogs...', status: 'waiting' };
    } else if (industry === 'real-estate') {
      customLogs[4] = { id: 5, label: 'Seeding property portfolios and leasing agent rosters...', status: 'waiting' };
      customLogs[5] = { id: 6, label: 'Provisioning Property Units registry and Rent ledger schemas...', status: 'waiting' };
    } else if (industry === 'manufacturing') {
      customLogs[4] = { id: 5, label: 'Seeding manufacturing operations and workstation centers...', status: 'waiting' };
      customLogs[5] = { id: 6, label: 'Provisioning BOM tables and scheduling cost rollups...', status: 'waiting' };
    } else if (industry === 'services') {
      customLogs[4] = { id: 5, label: 'Seeding client billing profiles and engineer teams...', status: 'waiting' };
      customLogs[5] = { id: 6, label: 'Provisioning project milestone boards and timesheet logs...', status: 'waiting' };
    }

    setSeedingLogs(customLogs as any);
    setStep(3);

    // Start logs animation sequence
    let currentLogIndex = 0;
    const updateLogInterval = setInterval(() => {
      setSeedingLogs(prev => prev.map((log, idx) => {
        if (idx === currentLogIndex) return { ...log, status: 'loading' };
        if (idx < currentLogIndex) return { ...log, status: 'done' };
        return log;
      }));
      
      if (currentLogIndex > 0) {
        setSeedingLogs(prev => prev.map((log, idx) => {
          if (idx === currentLogIndex - 1) return { ...log, status: 'done' };
          return log;
        }));
      }

      currentLogIndex++;
      if (currentLogIndex >= customLogs.length) {
        clearInterval(updateLogInterval);
      }
    }, 600);

    try {
      // 1. Post to API to register tenant and admin user
      const registerRes = await apiPost<{ user: { email: string }; tenant: { slug: string } }>('/auth/register', {
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        organizationName,
      });

      // 2. Wait for logs interval to complete (gives user that satisfying seeding console animation)
      await new Promise(resolve => setTimeout(resolve, 4500));

      // 3. Complete final log
      setSeedingLogs(prev => prev.map(log => ({ ...log, status: 'done' })));

      // 4. Perform silent background login
      const loginRes = await apiPost<{ token: string; user: Record<string, unknown> }>('/auth/login', {
        email,
        password,
        tenantSlug: registerRes.tenant.slug,
      });

      localStorage.setItem('token', loginRes.token);
      localStorage.setItem('user', JSON.stringify(loginRes.user));

      // 5. Navigate to Apps Workspace
      router.push('/apps');
    } catch (err: unknown) {
      clearInterval(updateLogInterval);
      setStep(2); // Kick back to details
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Organization registration failed.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Panel — Value Propositions */}
      <div className="auth-sidebar auth-sidebar-green">
        <div className="auth-sidebar-shape" style={{ top: '-80px', right: '-80px', width: '350px', height: '350px', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="auth-sidebar-shape" style={{ bottom: '-80px', left: '-40px', width: '280px', height: '280px', animation: 'pulse 6s ease-in-out infinite reverse' }} />

        <div className="auth-sidebar-content">
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
            Create a secure multi-tenant sandbox and initialize your workspace modules instantly.
          </p>

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

      {/* Right Panel — Setup Steps */}
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
              <Building size={24} />
            </div>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>UniERP</span>
          </div>

          <div className="auth-form-header">
            <h1>Register Organization</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Setup your isolated corporate workspace and system parameters.</p>
          </div>

          {/* Setup Progress */}
          <div className="auth-progress-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              <span>Step {step} of 3 — {step === 1 ? 'Organization Profile' : step === 2 ? 'Security Credentials' : 'Provisioning'}</span>
              <span style={{ fontWeight: 'var(--weight-semibold)' }}>{progressPct}%</span>
            </div>
            <div className="auth-progress-bar">
              <div
                className="auth-progress-fill"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100 ? 'var(--color-success)' : 'var(--color-primary)',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
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
                marginBottom: 'var(--space-4)',
                animation: 'fadeInUp 0.2s ease-out',
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: ORGANIZATION PARAMETERS */}
            {step === 1 && (
              <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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

                <div className="auth-field-group">
                  <label className="auth-label">Industry Profile (Optional)</label>
                  <select
                    className="auth-select"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    style={{ width: '100%', height: '38px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '0 var(--space-3)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
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
                    <label className="auth-label">Primary Currency</label>
                    <div className="auth-input-wrapper">
                      <Coins size={16} className="auth-input-icon" />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        style={{ width: '100%', height: '38px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '0 var(--space-3)', paddingLeft: 'var(--space-10)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="CAD">CAD ($)</option>
                      </select>
                    </div>
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-label">Workspace Timezone</label>
                    <div className="auth-input-wrapper">
                      <Globe size={16} className="auth-input-icon" />
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        style={{ width: '100%', height: '38px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '0 var(--space-3)', paddingLeft: 'var(--space-10)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                      >
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="EST">EST (GMT-5)</option>
                        <option value="PST">PST (GMT-8)</option>
                        <option value="IST">IST (GMT+5:30)</option>
                        <option value="GMT">GMT (GMT+0)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button type="submit" className="landing-btn-primary auth-btn-submit">
                  Next: Admin Credentials <ChevronRight size={16} />
                </button>
              </form>
            )}

            {/* STEP 2: ADMINISTRATOR PROFILE SETUP */}
            {step === 2 && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
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
                      style={{ paddingRight: '2.5rem' }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
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

                  {/* Password strength visual meter */}
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

                <div className="auth-field-group">
                  <label className="auth-label">Confirm Admin Password *</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="auth-input"
                      style={{
                        paddingRight: '2.5rem',
                        borderColor: !passwordsMatch ? 'var(--color-danger)' : undefined
                      }}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!passwordsMatch && (
                    <p style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 500 }}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)', width: 16, height: 16, cursor: 'pointer', marginTop: 2 }}
                  />
                  <label htmlFor="agree-terms" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', cursor: 'pointer', lineHeight: 1.5 }}>
                    I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</a>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="auth-btn-back"
                    style={{
                      background: 'none', border: '1px solid var(--color-border)',
                      padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px',
                      cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)'
                    }}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    className="landing-btn-primary auth-btn-submit"
                    disabled={loading || !agreedToTerms || !passwordsMatch || password.length < 8}
                    style={{ flex: 1 }}
                  >
                    Create Workspace <Sparkles size={14} style={{ marginLeft: 4 }} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: PROVISIONING / CONSOLE FEEDBACK */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'fadeInUp 0.3s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--color-bg-sunken)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                  <Spinner size="md" />
                  <div>
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: 0 }}>Provisioning isolated workspace partition...</h3>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>Seeding database structures and bootstrapping admin credentials.</p>
                  </div>
                </div>

                {/* Simulated Seeding Log Console */}
                <div style={{
                  background: '#0a0b10', border: '1px solid #1a1c23',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                  display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
                  fontFamily: 'monospace', fontSize: '11px'
                }}>
                  {seedingLogs.map(log => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: log.status === 'done' ? '#4ade80' : log.status === 'loading' ? 'var(--color-primary)' : '#4b5563' }}>
                      {log.status === 'done' ? (
                        <CheckCircle2 size={13} style={{ color: '#4ade80', flexShrink: 0 }} />
                      ) : log.status === 'loading' ? (
                        <span className="console-spinner" style={{ width: 13, height: 13, border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 13, height: 13, border: '1px solid #4b5563', borderRadius: '50%', flexShrink: 0 }} />
                      )}
                      <span>{log.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Animation rule overrides */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
