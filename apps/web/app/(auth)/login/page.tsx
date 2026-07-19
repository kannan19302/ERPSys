"use client";
import styles from "./page.module.css";
import "../../landing.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@unerp/ui";
import {
  Shield,
  Lock,
  Mail,
  ChevronRight,
  AlertCircle,
  Building,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  Check,
  X,
  KeyRound,
} from "lucide-react";
import { apiPost, apiGet, ApiRequestError } from "../../../src/lib/api";

/** Absolute API base for browser-navigation OAuth redirects (not fetch). */
const OAUTH_API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

const FEATURES = [
  {
    title: "Unified Operations",
    desc: "Finance, HR, CRM, Inventory — all in one platform.",
  },
  {
    title: "Real-Time Analytics",
    desc: "BI dashboards with drill-down into live source records.",
  },
  {
    title: "Industry Modules",
    desc: "Healthcare, Education, Real Estate, Field Service & more.",
  },
  {
    title: "Zero-Code Builder",
    desc: "Visual form builder, workflow engine & approval chains.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
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
  const [developerResetLink, setDeveloperResetLink] = useState<string | null>(
    null,
  );

  // Demo accounts states
  const [showDemoModal, setShowDemoModal] = useState(false);

  // CAPTCHA states
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaProvider, setCaptchaProvider] = useState<
    "hcaptcha" | "turnstile"
  >("hcaptcha");
  const [captchaSiteKey, setCaptchaSiteKey] = useState("");

  // Auto-resolve organization slug from email domain
  useEffect(() => {
    if (email && email.includes("@")) {
      const domain = email.split("@")[1];
      if (domain && domain.includes(".")) {
        const potentialSlug = domain.split(".")[0];
        const publicProviders = [
          "gmail",
          "yahoo",
          "hotmail",
          "outlook",
          "icloud",
        ];
        if (
          potentialSlug &&
          !publicProviders.includes(potentialSlug.toLowerCase()) &&
          !tenantSlug
        ) {
          setTenantSlug(potentialSlug.toLowerCase());
        }
      }
    }
  }, [email, tenantSlug]);

  useEffect(() => {
    if (!captchaRequired || !captchaSiteKey) return;

    // Define global callback
    (window as any).onCaptchaSuccess = (token: string) => {
      setCaptchaToken(token);
    };

    const scriptId = "captcha-script-loader";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src =
        captchaProvider === "turnstile"
          ? "https://challenges.cloudflare.com/turnstile/v0/api.js"
          : "https://js.hcaptcha.com/1/api.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    return () => {
      // Keep script loaded or cleanup callback
      delete (window as any).onCaptchaSuccess;
    };
  }, [captchaRequired, captchaProvider, captchaSiteKey]);

  // Real OAuth providers configured on the server (drives the social buttons)
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);
  useEffect(() => {
    apiGet<{ providers: string[] }>("/auth/oauth/providers")
      .then((res) => setOauthProviders(res.providers))
      .catch(() => setOauthProviders([]));
  }, []);

  // Surface errors bounced back from the OAuth callback redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      setError(oauthError);
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  // SSO configuration states
  const [isSsoConfigured, setIsSsoConfigured] = useState(false);
  const [ssoUrls, setSsoUrls] = useState<{
    saml: string | null;
    oidc: string | null;
  }>({ saml: null, oidc: null });

  // MFA validation states
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  // Push-approval: default to "check your phone" when the backend actually sent one;
  // manual code entry is always reachable via "Enter code manually" so it never blocks sign-in.
  const [pushSent, setPushSent] = useState(false);
  const [pushStatus, setPushStatus] = useState<
    "pending" | "denied" | "expired" | "timeout"
  >("pending");
  const [showManualCode, setShowManualCode] = useState(false);

  // Autoload token sync
  useEffect(() => {
    setMounted(true);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      apiGet("/auth/me")
        .then(() => router.push("/apps"))
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setChecking(false);
        });
    } else {
      setChecking(false);
    }
  }, [router]);

  // Auto-rotate sidebar features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
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
      apiGet<{
        configured: boolean;
        samlEntryPoint: string | null;
        oidcAuthorizationUrl: string | null;
      }>(`/auth/sso/config/${tenantSlug}`)
        .then((res) => {
          if (res.configured) {
            setIsSsoConfigured(true);
            setSsoUrls({
              saml: res.samlEntryPoint,
              oidc: res.oidcAuthorizationUrl,
            });
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
      setError("Please fill in your email address");
      return;
    }

    if (captchaRequired && !captchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (forgotPasswordMode) {
        const response = await apiPost<{
          message: string;
          developerResetLink?: string;
        }>("/auth/forgot-password", {
          email,
        });
        setRecoverySuccess(response.message);
        if (response.developerResetLink) {
          setDeveloperResetLink(response.developerResetLink);
        }
      } else if (isSsoConfigured) {
        // Mock SSO integration callback logic
        const result = await apiPost<{
          token: string;
          user: Record<string, unknown>;
        }>(`/auth/sso/oidc/callback/${tenantSlug}`, {
          email,
          firstName: "SSO",
          lastName: "User",
          code: "mock-code",
          redirectUri: window.location.origin,
        });
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        router.push("/apps");
      } else {
        const data = await apiPost<{
          token: string;
          user: Record<string, unknown>;
          mfaRequired?: boolean;
          challengeToken?: string;
          pushSent?: boolean;
        }>("/auth/login", {
          email,
          password,
          tenantSlug: tenantSlug || undefined,
          rememberMe,
          captchaToken: captchaToken || undefined,
        });

        if (data.mfaRequired) {
          setMfaRequired(true);
          setMfaChallengeToken(data.challengeToken || "");
          setPushSent(Boolean(data.pushSent));
          setPushStatus("pending");
          setShowManualCode(!data.pushSent);
          setLoading(false);
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        router.push("/apps");
      }
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        if (err.body?.captchaRequired) {
          setCaptchaRequired(true);
          setCaptchaProvider(err.body.provider);
          setCaptchaSiteKey(err.body.siteKey);
          setCaptchaToken(""); // reset token on request
        }
        // Highlight organization slug field if user needs it
        if (err.message.includes("Multiple accounts")) {
          const orgInput = document.getElementById("org-slug-input");
          if (orgInput) orgInput.focus();
        }
      } else {
        setError(
          "Connection to authentication service failed. Please check if the NestJS server is running.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode) {
      setError("Please enter the 6-digit MFA code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiPost<{
        token: string;
        user: Record<string, unknown>;
      }>("/auth/mfa/verify-login", {
        challengeToken: mfaChallengeToken,
        code: mfaCode,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/apps");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid MFA verification code",
      );
    } finally {
      setLoading(false);
    }
  };

  // Poll while "Check your phone" is showing; the backend finalizes the
  // session (and sets the auth cookie) the moment the push gets approved.
  useEffect(() => {
    if (!mfaRequired || !pushSent || showManualCode) return;
    let cancelled = false;
    let elapsedMs = 0;
    const intervalMs = 2000;
    const timeoutMs = 90000;

    const poll = async () => {
      try {
        const result = await apiPost<{
          status: string;
          token?: string;
          user?: Record<string, unknown>;
        }>("/auth/mfa/push/status", { challengeToken: mfaChallengeToken });
        if (cancelled) return;

        if (result.status === "approved" && result.token) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));
          router.push("/apps");
          return;
        }
        if (result.status === "denied") {
          setPushStatus("denied");
          setShowManualCode(true);
          return;
        }
        if (result.status === "expired") {
          setPushStatus("expired");
          setShowManualCode(true);
          return;
        }

        elapsedMs += intervalMs;
        if (elapsedMs >= timeoutMs) {
          setPushStatus("timeout");
          setShowManualCode(true);
          return;
        }
        setTimeout(poll, intervalMs);
      } catch {
        if (!cancelled) setTimeout(poll, intervalMs);
      }
    };

    const initial = setTimeout(poll, intervalMs);
    return () => {
      cancelled = true;
      clearTimeout(initial);
    };
  }, [mfaRequired, pushSent, showManualCode, mfaChallengeToken, router]);

  // The demo shortcut only ever creates a Super Admin on a shared dev
  // tenant — never a role picker. The API independently re-checks the host
  // header, but hiding the button itself is the first line of defense.
  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    setShowDemoModal(false);

    try {
      const data = await apiPost<{
        token: string;
        user: Record<string, unknown>;
      }>("/auth/login-demo");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/apps");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Demo login failed");
      setLoading(false);
    }
  };

  // Belt-and-suspenders: only render the demo entry point when this page is
  // actually being served from the local dev machine, regardless of what
  // NODE_ENV the bundle was built with.
  const [isLocalhost, setIsLocalhost] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsLocalhost(
      ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname),
    );
  }, []);
  const showDemoEntryPoint =
    process.env.NODE_ENV !== "production" && isLocalhost;

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
        <div className={`auth-sidebar-shape ${styles.s2}`} />
        <div className={`auth-sidebar-shape ${styles.s3}`} />

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

          <h1>
            Run your entire
            <br />
            business from one place.
          </h1>
          <p>
            A modular, multi-tenant workspace built for Finance, HR, CRM,
            Inventory, Manufacturing, and visual app building.
          </p>

          <div className="auth-sidebar-features">
            {FEATURES.map((feat, i) => (
              <div
                key={i}
                className={`auth-sidebar-feature${i === activeFeature ? " active" : ""}`}
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
            <h1>
              {mfaRequired
                ? "Security Verification"
                : forgotPasswordMode
                  ? "Recover Password"
                  : "Welcome back"}
            </h1>
            <p className={styles.s9}>
              {mfaRequired
                ? pushSent && !showManualCode
                  ? "We sent an approval request to your phone."
                  : "Enter the authenticator code associated with your admin profile."
                : forgotPasswordMode
                  ? "Enter your email address to reset access."
                  : "Sign in to access your business operations."}
            </p>
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
              pushSent && !showManualCode ? (
                <div className={styles.s11}>
                  <div className={styles.pushPanel}>
                    <div className={styles.pushIconRing}>
                      <Smartphone size={28} />
                    </div>
                    <p className={styles.pushTitle}>Check your phone</p>
                    <p className={styles.pushSubtitle}>
                      Tap <strong>Approve</strong> on the notification we sent
                      to your registered device.
                    </p>
                    <div className={styles.pushSpinnerRow}>
                      <Spinner size="sm" />
                      <span>Waiting for approval…</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowManualCode(true)}
                    className={styles.useCodeBtn}
                  >
                    <KeyRound size={14} /> Didn&apos;t get it? Enter code
                    manually
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMfaRequired(false);
                      setPushSent(false);
                      setMfaCode("");
                      setError(null);
                    }}
                    className={styles.s14}
                  >
                    Cancel & Back
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMfaVerify} className={styles.s11}>
                  {pushSent &&
                    (pushStatus === "denied" ||
                      pushStatus === "expired" ||
                      pushStatus === "timeout") && (
                      <div className={styles.pushFallbackNotice}>
                        {pushStatus === "denied" && (
                          <>
                            <X size={14} /> Approval was denied on your device.
                          </>
                        )}
                        {pushStatus === "expired" && (
                          <>
                            <AlertCircle size={14} /> The approval request
                            expired.
                          </>
                        )}
                        {pushStatus === "timeout" && (
                          <>
                            <AlertCircle size={14} /> No response from your
                            device yet.
                          </>
                        )}
                        <span> Enter your code below instead.</span>
                      </div>
                    )}
                  <div className="auth-field-group">
                    <label className="auth-label">
                      Authenticator code or recovery code
                    </label>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        required
                        maxLength={20}
                        className={`auth-input ${styles.s13}`}
                        placeholder="123456"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        autoComplete="one-time-code"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="landing-btn-primary auth-btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" /> Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Access <ChevronRight size={16} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMfaRequired(false);
                      setMfaCode("");
                      setPushSent(false);
                      setError(null);
                    }}
                    className={styles.s14}
                  >
                    Cancel & Back
                  </button>
                </form>
              )
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
                        <span className={styles.s18}>
                          [Dev Mode Recovery Link]
                        </span>
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
                        type={showPassword ? "text" : "password"}
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
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Organization Slug (Optional) — hidden in forgot password mode */}
                {!forgotPasswordMode && (
                  <div className="auth-field-group">
                    <label className="auth-label">
                      Organization Slug{" "}
                      {isSsoConfigured && (
                        <span className={styles.s23}>(SSO Enabled)</span>
                      )}
                    </label>
                    <div className="auth-input-wrapper">
                      <Building size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        id="org-slug-input"
                        className="auth-input"
                        placeholder="acme"
                        value={tenantSlug}
                        onChange={(e) => setTenantSlug(e.target.value)}
                        style={{
                          borderColor: isSsoConfigured
                            ? "var(--color-success)"
                            : undefined,
                        }}
                      />
                    </div>
                    <p className={styles.s24}>
                      {isSsoConfigured
                        ? "This organization uses Single Sign-On. You will be authenticated via OIDC/SAML."
                        : "Required if your email address is registered under multiple organizations."}
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

                {/* CAPTCHA widget */}
                {captchaRequired && captchaSiteKey && (
                  <div
                    style={{
                      marginBottom: "1rem",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {captchaProvider === "turnstile" ? (
                      <div
                        className="cf-turnstile"
                        data-sitekey={captchaSiteKey}
                        data-callback="onCaptchaSuccess"
                      />
                    ) : (
                      <div
                        className="h-captcha"
                        data-sitekey={captchaSiteKey}
                        data-callback="onCaptchaSuccess"
                      />
                    )}
                  </div>
                )}

                {/* Submit Buttons */}
                <button
                  type="submit"
                  className="landing-btn-primary auth-btn-submit"
                  disabled={loading}
                  style={{
                    background: isSsoConfigured
                      ? "var(--color-success)"
                      : undefined,
                    borderColor: isSsoConfigured
                      ? "var(--color-success)"
                      : undefined,
                  }}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" /> Processing...
                    </>
                  ) : forgotPasswordMode ? (
                    <>
                      Send Recovery Link <ChevronRight size={16} />
                    </>
                  ) : isSsoConfigured ? (
                    <>
                      Sign In with SSO{" "}
                      <Sparkles size={14} className={styles.s42} />
                    </>
                  ) : (
                    <>
                      Sign In <ChevronRight size={16} />
                    </>
                  )}
                </button>

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
                  <a
                    className="auth-social-btn"
                    aria-disabled={!oauthProviders.includes("google")}
                    style={
                      !oauthProviders.includes("google")
                        ? { opacity: 0.5, pointerEvents: "none" }
                        : undefined
                    }
                    href={`${OAUTH_API_BASE}/auth/oauth/google/start${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ""}`}
                    title={
                      oauthProviders.includes("google")
                        ? "Sign in with your Google account"
                        : "Google sign-in is not configured on this server"
                    }
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </a>
                  <a
                    className="auth-social-btn"
                    aria-disabled={!oauthProviders.includes("microsoft")}
                    style={
                      !oauthProviders.includes("microsoft")
                        ? { opacity: 0.5, pointerEvents: "none" }
                        : undefined
                    }
                    href={`${OAUTH_API_BASE}/auth/oauth/microsoft/start${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ""}`}
                    title={
                      oauthProviders.includes("microsoft")
                        ? "Sign in with your Microsoft account"
                        : "Microsoft sign-in is not configured on this server"
                    }
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path
                        d="M11.4 24H0V12.6L4.8 7.8h6.6v16.2zM24 24H12.6V7.8H24V24zM11.4 6.6H4.8L0 1.8V0h11.4v6.6zM24 6.6H12.6V0H24v6.6z"
                        fill="#00A4EF"
                      />
                    </svg>
                    Microsoft
                  </a>
                </div>

                {showDemoEntryPoint && (
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(true)}
                    style={{
                      marginTop: 10,
                      background: "none",
                      border: "none",
                      color: "var(--color-text-muted)",
                      fontSize: 12,
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    Developer demo login…
                  </button>
                )}
              </>
            )}
          </div>

          <p className={styles.s29}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className={styles.s45}>
              Register Organization
            </Link>
          </p>
        </div>
      </div>

      {/* Demo Login Modal — Super Admin only */}
      {showDemoModal && showDemoEntryPoint && (
        <div className={styles.s30}>
          <div className={styles.s31}>
            <div>
              <h2 className={styles.s32}>Login as Developer Demo User</h2>
              <p className={styles.s33}>
                Signs you into a shared local Super Admin account for
                development. Local machine only — this never runs in production.
              </p>
            </div>

            <div className={styles.s34}>
              <button
                type="button"
                onClick={() => handleDemoLogin()}
                className={`demo-persona-select-btn ${styles.s35}`}
              >
                <div className={styles.s36}>
                  <span className={styles.s37}>Super Admin</span>
                  <span className={styles.s38}>admin@unerp.dev</span>
                </div>
                <span className={styles.s39}>
                  Full administration permission keys (*).
                </span>
              </button>
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
