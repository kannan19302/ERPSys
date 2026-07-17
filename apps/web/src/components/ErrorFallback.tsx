'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, LogOut, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiPost } from '@/lib/api';

interface ErrorFallbackProps {
  statusCode?: number;
  title?: string;
  message?: string;
  error?: Error & { digest?: string; requestId?: string };
  reset?: () => void;
  /**
   * Hide the crash-report form + stack details (used by 404s, where there is
   * nothing to report) and show quick links to common destinations instead.
   */
  lightweight?: boolean;
}

const QUICK_LINKS: Array<{ label: string; href: string }> = [
  { label: 'All Apps', href: '/apps' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Finance', href: '/finance' },
  { label: 'CRM & Sales', href: '/crm' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Settings', href: '/settings' },
];

export function ErrorFallback({
  statusCode = 500,
  title = 'Something went wrong',
  message = 'An unexpected system error occurred.',
  error,
  reset,
  lightweight = false,
}: ErrorFallbackProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Determine user context and prefill details if logged in
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.firstName || parsed.lastName) {
          setName(`${parsed.firstName || ''} ${parsed.lastName || ''}`.trim());
        }
        if (parsed.tenantId) setTenantId(parsed.tenantId);
      }
    } catch {
      // Ignore errors reading local storage
    }
  }, []);

  const handleReload = () => {
    if (reset) {
      reset();
    } else {
      window.location.reload();
    }
  };

  const handleGoToDashboard = () => {
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('token');
    if (hasToken) {
      router.push('/apps');
    } else {
      router.push('/');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await apiPost('/public/error-reports', {
        message: error?.message || message || 'Unknown client crash',
        stack: error?.stack || null,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        description,
        userEmail: email || null,
        userName: name || null,
        requestId: error?.requestId || null,
        tenantId: tenantId || null,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to send report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorDetails = error?.stack || error?.message || message;
  const requestId = error?.requestId || error?.digest;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: 'var(--space-6)',
      backgroundColor: 'var(--color-bg)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div className="ui-card" style={{
        width: '100%',
        maxWidth: '650px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-bg-elevated)',
      }}>
        {/* Card Header with Soft Color Accent depending on status code */}
        <div className="ui-card-header" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-sunken)',
          padding: 'var(--space-4) var(--space-5)',
        }}>
          <AlertTriangle size={20} color={statusCode === 404 ? 'var(--color-warning)' : 'var(--color-danger)'} />
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
            {statusCode} — {title}
          </span>
        </div>

        <div className="ui-card-body" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Main message */}
          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-normal)',
          }}>
            {message}
          </p>

          {/* Quick Action Navigation Grid */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-2)',
          }}>
            <button className="ui-btn ui-btn-primary" onClick={handleReload}>
              <RefreshCw size={16} />
              Try Again
            </button>
            <button className="ui-btn ui-btn-secondary" onClick={handleGoToDashboard}>
              <Home size={16} />
              Go to Dashboard
            </button>
            <button className="ui-btn ui-btn-secondary" onClick={() => router.back()}>
              <ArrowLeft size={16} />
              Go Back
            </button>
            {email && (
              <button className="ui-btn ui-btn-secondary" onClick={handleSignOut} style={{ color: 'var(--color-danger-text)' }}>
                <LogOut size={16} />
                Sign Out
              </button>
            )}
          </div>

          {/* 404s get destination shortcuts instead of a crash report */}
          {lightweight && (
            <>
              <hr style={{ border: 0, borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                  Jump to a common destination
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {QUICK_LINKS.map((l) => (
                    <button
                      key={l.href}
                      className="ui-btn ui-btn-secondary"
                      style={{ fontSize: 'var(--text-sm)' }}
                      onClick={() => router.push(l.href)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                  Tip: press <kbd style={{ padding: '1px 5px', border: '1px solid var(--color-border)', borderRadius: 4 }}>Ctrl</kbd>+<kbd style={{ padding: '1px 5px', border: '1px solid var(--color-border)', borderRadius: 4 }}>K</kbd> anywhere to search every app, page, and record.
                </span>
              </div>
            </>
          )}

          {!lightweight && (<>
          <hr style={{ border: 0, borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />

          {/* Collapsible Technical Details (Developer/System Admin perspective) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-link)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 0,
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
              }}
            >
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showDetails ? 'Hide technical details' : 'Show technical details'}
            </button>

            {showDetails && (
              <div style={{
                backgroundColor: 'var(--color-bg-sunken)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text)',
                overflowX: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}>
                {requestId && (
                  <div>
                    <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>ID/Request ID:</span> {requestId}
                  </div>
                )}
                <div>
                  <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Timestamp:</span> {new Date().toISOString()}
                </div>
                <div>
                  <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Path:</span> {typeof window !== 'undefined' ? window.location.pathname : ''}
                </div>
                <pre style={{
                  marginTop: 'var(--space-2)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  color: 'var(--color-danger-text)',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  {errorDetails}
                </pre>
              </div>
            )}
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />

          {/* Contact Admin Report Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
              Report Issue to System Admin
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Describe what you were doing when the error occurred. This report will be logged directly for administrator review.
            </p>

            {isSubmitted ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                backgroundColor: 'var(--color-success-light)',
                border: '1px solid var(--color-success)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                color: 'var(--color-success-text)',
              }}>
                <CheckCircle size={20} color="var(--color-success)" />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Report submitted successfully. Thank you for your feedback!
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Email / User Metadata block */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="ui-form-group" style={{ marginBottom: 0 }}>
                    <label className="ui-label">Your Name</label>
                    <input
                      type="text"
                      className="ui-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Optional name"
                    />
                  </div>
                  <div className="ui-form-group" style={{ marginBottom: 0 }}>
                    <label className="ui-label">Your Email</label>
                    <input
                      type="email"
                      className="ui-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Optional email"
                    />
                  </div>
                </div>

                <div className="ui-form-group" style={{ marginBottom: 0 }}>
                  <label className="ui-label">What were you doing? (Required)</label>
                  <textarea
                    className="ui-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. I was trying to download the invoice list PDF when the screen crashed."
                    rows={4}
                    required
                    style={{ fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                  />
                </div>

                {submitError && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-text)' }}>
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  className="ui-btn ui-btn-primary"
                  disabled={isSubmitting || !description.trim()}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {isSubmitting ? 'Sending Report...' : 'Send Error Report'}
                </button>
              </form>
            )}
          </div>
          </>)}
        </div>
      </div>
    </div>
  );
}
