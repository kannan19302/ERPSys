"use client";
import "../../landing.css";
import React, { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@unerp/ui";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  MailCheck,
  ChevronRight,
} from "lucide-react";
import { apiPost, ApiRequestError } from "../../../src/lib/api";

type Status = "verifying" | "success" | "error" | "missing";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "missing");
  const [error, setError] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // React 18 StrictMode double-invokes effects in dev; the token is single-use,
  // so guard against firing the verification call twice.
  const fired = useRef(false);

  useEffect(() => {
    if (!token || fired.current) return;
    fired.current = true;

    apiPost("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        setStatus("error");
        setError(
          err instanceof ApiRequestError || err instanceof Error
            ? err.message
            : "Verification failed. The link may have expired.",
        );
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLoading(true);
    setResendMessage(null);
    try {
      const res = await apiPost<{ message: string }>(
        "/auth/resend-verification",
        {
          email: resendEmail,
        },
      );
      setResendMessage(res.message);
    } catch (err: unknown) {
      setResendMessage(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Could not send verification email. Try again later.",
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-sidebar auth-sidebar-purple">
        <div className="auth-sidebar-content">
          <div className="auth-logo-area">
            <div className="auth-logo-icon">
              <MailCheck size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>UniERP</h2>
              <p style={{ margin: 0, opacity: 0.8 }}>Email verification</p>
            </div>
          </div>

          <h1>One quick step to secure your workspace.</h1>
          <p>
            Verifying your email protects account recovery and unlocks
            security-sensitive features for your organization.
          </p>
        </div>
      </div>

      <div className="auth-main-panel">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h1>Verify Email</h1>
            <p>Confirming the email address on your administrator profile.</p>
          </div>

          <div className="auth-card">
            {status === "verifying" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "24px 8px",
                }}
              >
                <Spinner size="md" />
                <span>Verifying your email address...</span>
              </div>
            )}

            {status === "success" && (
              <div style={{ textAlign: "center", padding: "16px 8px" }}>
                <CheckCircle2
                  size={40}
                  style={{ color: "var(--color-success)" }}
                />
                <h3 style={{ margin: "12px 0 4px" }}>Email verified!</h3>
                <p
                  style={{ marginBottom: 20, color: "var(--color-text-muted)" }}
                >
                  Your email address is confirmed. You can now sign in to your
                  workspace.
                </p>
                <Link
                  href="/login"
                  className="landing-btn-primary auth-btn-submit"
                >
                  Continue to Sign In <ChevronRight size={16} />
                </Link>
              </div>
            )}

            {(status === "error" || status === "missing") && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--color-danger)",
                    marginBottom: 16,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>
                    {status === "missing"
                      ? "Verification link is missing its token. Use the button in your email, or request a new link below."
                      : error}
                  </span>
                </div>

                <form onSubmit={handleResend}>
                  <div className="auth-field-group">
                    <label className="auth-label">
                      Resend verification link
                    </label>
                    <div className="auth-input-wrapper">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="email"
                        required
                        className="auth-input"
                        placeholder="admin@company.com"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="landing-btn-primary auth-btn-submit"
                    disabled={resendLoading || !resendEmail}
                  >
                    {resendLoading ? (
                      <>
                        <Spinner size="sm" /> Sending...
                      </>
                    ) : (
                      <>
                        Send New Link <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                  {resendMessage && (
                    <p
                      style={{
                        marginTop: 12,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {resendMessage}
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>

          <p style={{ textAlign: "center", marginTop: 16 }}>
            Back to <Link href="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <Spinner size="lg" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
