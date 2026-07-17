'use client';
import styles from './page.module.css';
import '../../landing.css';
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@unerp/ui';
import { Lock, ChevronRight, AlertCircle, Sparkles, Shield, Eye, EyeOff } from 'lucide-react';
import { apiPost, ApiRequestError } from '../../../src/lib/api';

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

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  useEffect(() => {
    if (!token) {
      setError('Password recovery token is missing. Please request a new link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Password recovery token is missing. Cannot reset password.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiPost('/auth/reset-password', {
        token,
        password,
        confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to reset password. Token may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Panel — Branding Sidebar */}
      <div className="auth-sidebar auth-sidebar-purple">
        <div className={`auth-sidebar-shape ${styles.s1}`}  />
        <div className={`auth-sidebar-shape ${styles.s2}`}  />

        <div className="auth-sidebar-content">
          <div className="auth-logo-area">
            <div className="auth-logo-icon">
              <Shield size={22} className={styles.s19} />
            </div>
            <div>
              <h2 className={styles.s3}>UniERP</h2>
              <p className={styles.s4}>Security center</p>
            </div>
          </div>

          <h1>Secure your account credentials.</h1>
          <p>
            Choose a strong password combining letters, numbers, and special symbols to prevent unauthorized access.
          </p>
        </div>
      </div>

      {/* Right Panel — Form Card */}
      <div className="auth-main-panel">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h1>Reset Password</h1>
            <p>Setup a new password for your administrator profile account.</p>
          </div>

          <div className="auth-card">
            {success ? (
              <div className={styles.s5}>
                <div className={styles.s6}>
                  <Sparkles size={32} />
                </div>
                <h3 className={styles.s7}>
                  Password Reset Complete!
                </h3>
                <p className={styles.s8}>
                  Your password was successfully updated. Redirecting to login portal...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.s9}>
                {error && (
                  <div className={styles.s10}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Password Input */}
                <div className="auth-field-group">
                  <label className="auth-label">New Password *</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={!token}
                      className="auth-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.s11}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength visual meter */}
                  {password && (
                    <div className={styles.s12}>
                      <div className={styles.s13}>
                        {[1, 2, 3, 4, 5].map(level => (
                          <div
                            key={level}
                            style={{ background: passwordStrength.score >= level ? passwordStrength.color : 'var(--color-bg-sunken)' }} className={styles.s14}
                          />
                        ))}
                      </div>
                      <span style={{ color: passwordStrength.color }} className={styles.s15}>
                        {passwordStrength.label}
                        {password.length > 0 && password.length < 8 && ' — min 8 characters'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="auth-field-group">
                  <label className="auth-label">Confirm New Password *</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      disabled={!token}
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
                      className={styles.s11}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!passwordsMatch && (
                    <p className={styles.s16}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="landing-btn-primary auth-btn-submit"
                  disabled={loading || !token || !passwordsMatch || password.length < 8}
                >
                  {loading ? (
                    <><Spinner size="sm" /> Updating...</>
                  ) : (
                    <>Update Password <ChevronRight size={16} /></>
                  )}
                </button>
              </form>
            )}
          </div>

          <p className={styles.s17}>
            Back to{' '}
            <Link href="/login" className={styles.s20}>
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.s18}>
        <Spinner size="lg" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
