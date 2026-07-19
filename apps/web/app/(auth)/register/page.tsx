"use client";
import styles from "./page.module.css";
import "../../landing.css";
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@unerp/ui";
import {
  Building,
  Lock,
  Mail,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Globe,
  Coins,
  Upload,
  ImageIcon,
  X,
  Check,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { apiGet, apiPost, ApiRequestError } from "../../../src/lib/api";
import {
  COUNTRIES,
  CURRENCIES,
  LANGUAGES,
  BUSINESS_TYPES,
  INDUSTRIES,
  getTimezones,
  getDefaultCurrency,
  getDetectedTimezone,
  getCountryFromTimezone,
} from "../../../src/lib/lookups";
import { resizeImageFile } from "../../../src/lib/imageResize";

const VALUE_PROPS = [
  {
    icon: "🏢",
    title: "Multi-Tenant Isolation",
    desc: "Every organization gets its own secure, isolated database space.",
  },
  {
    icon: "🔐",
    title: "Enterprise Security",
    desc: "Role-based access, field-level permissions, and change histories.",
  },
  {
    icon: "📊",
    title: "Real-Time Analytics",
    desc: "Live KPI charts, customized reports, and csv/xlsx exports.",
  },
  {
    icon: "🔧",
    title: "Zero-Code Builder",
    desc: "Build forms, workflow timelines, and pages dynamically.",
  },
];

const STEP_LABELS = ["Organization", "Admin Account", "Provisioning"];

/** Password requirement checklist items */
function getPasswordChecks(password: string) {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "var(--color-danger)" };
  if (score <= 2)
    return { score, label: "Fair", color: "var(--color-warning)" };
  if (score <= 3) return { score, label: "Good", color: "#f59e0b" };
  if (score <= 4)
    return { score, label: "Strong", color: "var(--color-success)" };
  return { score, label: "Excellent", color: "#22c55e" };
}

interface SeedingStep {
  id: number;
  label: string;
  status: "waiting" | "loading" | "done";
}

/** Id of the (optional) "Seeding sample data" provisioning log step — kept
 * separate from the bulk "mark all logs done" pass so it can reflect the
 * real POST /auth/onboarding/seed-demo outcome instead of a fake delay. */
const DEMO_DATA_LOG_ID = 8;

export default function RegisterPage() {
  const router = useRouter();

  // Wizard Step State
  const [step, setStep] = useState(1);
  const [provisioningComplete, setProvisioningComplete] = useState(false);

  // Auto-detect timezone & country on mount
  const detectedTz = useMemo(() => getDetectedTimezone(), []);
  const detectedCountry = useMemo(
    () => getCountryFromTimezone(detectedTz),
    [detectedTz],
  );
  const detectedCurrency = useMemo(
    () => getDefaultCurrency(detectedCountry),
    [detectedCountry],
  );

  // Step 1: Organization Data
  const [organizationName, setOrganizationName] = useState("");
  const [industry, setIndustry] = useState("");
  const [currency, setCurrency] = useState(detectedCurrency);
  const [timezone, setTimezone] = useState(detectedTz);
  const timezones = useMemo(() => getTimezones(), []);
  const [businessType, setBusinessType] = useState("");
  const [country, setCountry] = useState(detectedCountry);
  const [language, setLanguage] = useState("en");
  const [estimatedUsers, setEstimatedUsers] = useState(1);
  const [loadSampleData, setLoadSampleData] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [logoDragging, setLogoDragging] = useState(false);

  // Country → Currency auto-mapping
  const handleCountryChange = useCallback((newCountry: string) => {
    setCountry(newCountry);
    const defaultCurr = getDefaultCurrency(newCountry);
    setCurrency(defaultCurr);
  }, []);

  const handleLogoFileSelected = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setLogoError("Choose an image file (PNG, JPG, GIF, SVG, WebP).");
      return;
    }
    setLogoError(null);
    try {
      const resized = await resizeImageFile(file);
      setLogoUrl(resized);
    } catch (err) {
      setLogoError(
        err instanceof Error ? err.message : "Could not process that image.",
      );
    }
  };

  const handleLogoInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleLogoFileSelected(file);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setLogoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoFileSelected(file);
  };

  // Step 2: Administrator Profile Data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Real-time email validation
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAvailable(null);
      return;
    }
    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    emailCheckTimer.current = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const res = await apiGet<{ available: boolean }>(
          `/auth/check-email?email=${encodeURIComponent(email)}`,
        );
        setEmailAvailable(res.available);
      } catch {
        // Endpoint may not exist yet — don't block registration
        setEmailAvailable(null);
      } finally {
        setEmailChecking(false);
      }
    }, 600);
    return () => {
      if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    };
  }, [email]);

  // Step 3: Console Logs Seeding Simulation
  const [seedingLogs, setSeedingLogs] = useState<SeedingStep[]>([
    {
      id: 1,
      label: "Generating secure organization slug...",
      status: "waiting",
    },
    {
      id: 2,
      label: "Creating isolated tenant partition...",
      status: "waiting",
    },
    {
      id: 3,
      label: "Bootstrapping system roles (Super Admin, Admin, Viewer)...",
      status: "waiting",
    },
    {
      id: 4,
      label: "Creating administrative credentials...",
      status: "waiting",
    },
    {
      id: 5,
      label: "Seeding department structures (Finance, HR, Sales, Ops)...",
      status: "waiting",
    },
    {
      id: 6,
      label: "Provisioning primary warehouse WH-MAIN...",
      status: "waiting",
    },
    {
      id: 7,
      label: "Finalizing setup & launching workspace...",
      status: "waiting",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stash login data from the registration response so we can navigate
  // to the SaaS portal after the user clicks the success-state CTA
  // (instead of auto-redirecting).
  const pendingLoginRef = useRef<{
    token: string;
    user: Record<string, unknown>;
  } | null>(null);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );
  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!organizationName) {
        setError("Organization name is required");
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

  const handleGoToWorkspace = () => {
    if (pendingLoginRef.current) {
      localStorage.setItem("token", pendingLoginRef.current.token);
      localStorage.setItem(
        "user",
        JSON.stringify(pendingLoginRef.current.user),
      );
    }
    router.push("/saas/portal?onboarding=1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !organizationName
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service");
      return;
    }

    setLoading(true);
    setError(null);

    // Customize logs based on chosen industry profile
    const customLogs: SeedingStep[] = [
      {
        id: 1,
        label: "Generating secure organization slug...",
        status: "waiting",
      },
      {
        id: 2,
        label: "Creating isolated tenant partition...",
        status: "waiting",
      },
      {
        id: 3,
        label: "Bootstrapping system roles (Super Admin, Admin, Viewer)...",
        status: "waiting",
      },
      {
        id: 4,
        label: "Creating administrative credentials...",
        status: "waiting",
      },
      {
        id: 5,
        label: "Seeding department structures (Finance, HR, Sales, Ops)...",
        status: "waiting",
      },
      {
        id: 6,
        label: "Provisioning primary warehouse WH-MAIN...",
        status: "waiting",
      },
      {
        id: 7,
        label: "Finalizing setup & launching workspace...",
        status: "waiting",
      },
    ];

    if (industry === "healthcare") {
      customLogs[4] = {
        id: 5,
        label: "Seeding clinic directory and practitioner roster...",
        status: "waiting",
      };
      customLogs[5] = {
        id: 6,
        label: "Provisioning Patient EHR tables and EHR encryption keys...",
        status: "waiting",
      };
    } else if (industry === "education") {
      customLogs[4] = {
        id: 5,
        label: "Seeding academic course registry and faculty lists...",
        status: "waiting",
      };
      customLogs[5] = {
        id: 6,
        label: "Provisioning Student Information Directory and fee catalogs...",
        status: "waiting",
      };
    } else if (industry === "real-estate") {
      customLogs[4] = {
        id: 5,
        label: "Seeding property portfolios and leasing agent rosters...",
        status: "waiting",
      };
      customLogs[5] = {
        id: 6,
        label:
          "Provisioning Property Units registry and Rent ledger schemas...",
        status: "waiting",
      };
    } else if (industry === "manufacturing") {
      customLogs[4] = {
        id: 5,
        label: "Seeding manufacturing operations and workstation centers...",
        status: "waiting",
      };
      customLogs[5] = {
        id: 6,
        label: "Provisioning BOM tables and scheduling cost rollups...",
        status: "waiting",
      };
    } else if (industry === "services") {
      customLogs[4] = {
        id: 5,
        label: "Seeding client billing profiles and engineer teams...",
        status: "waiting",
      };
      customLogs[5] = {
        id: 6,
        label: "Provisioning project milestone boards and timesheet logs...",
        status: "waiting",
      };
    }

    if (loadSampleData) {
      customLogs.push({
        id: DEMO_DATA_LOG_ID,
        label: "Seeding sample data to explore the app...",
        status: "waiting",
      });
    }

    // Real UUID only — the API validates tenantId as a UUID (registerSchema).
    const tempTenantId =
      typeof window !== "undefined" && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : undefined;

    setStep(3);
    setProvisioningComplete(false);
    setSeedingLogs(customLogs);

    // Start real-time provisioning progress polling
    const pollInterval: ReturnType<typeof setInterval> | undefined =
      tempTenantId
        ? setInterval(async () => {
            try {
              const statusData = await apiGet<{
                progress: number;
                currentStep: string;
                status: string;
                error?: string;
              }>(`/auth/provisioning/${tempTenantId}/status`);

              setSeedingLogs((prev) =>
                prev.map((log, idx) => {
                  let expectedPct = 15;
                  if (idx === 1) expectedPct = 30;
                  if (idx === 2) expectedPct = 50;
                  if (idx === 3) expectedPct = 65;
                  if (idx === 4) expectedPct = 80;
                  if (idx === 5) expectedPct = 90;
                  if (idx === 6) expectedPct = 95;

                  if (statusData.progress >= expectedPct) {
                    return { ...log, status: "done" };
                  }
                  if (statusData.progress >= expectedPct - 15) {
                    return { ...log, status: "loading" };
                  }
                  return log;
                }),
              );
            } catch {
              // Ignore polling errors silently
            }
          }, 300)
        : undefined;

    try {
      // 1. Post to API to register tenant and admin user
      const registerRes = await apiPost<{
        user: { email: string };
        tenant: { slug: string };
      }>("/auth/register", {
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        organizationName,
        businessType: businessType || undefined,
        country: country || undefined,
        language: language || undefined,
        estimatedUsers: parseInt(String(estimatedUsers), 10) || 1,
        logoUrl: logoUrl || undefined,
        industry: industry || undefined,
        currency: currency || undefined,
        timezone: timezone || undefined,
        tenantId: tempTenantId,
        termsAccepted: agreedToTerms || undefined,
      });

      // 2. Stop polling and complete all logs (the demo-data log, if present,
      // reflects the real seed call below instead of this bulk pass).
      clearInterval(pollInterval);
      setSeedingLogs((prev) =>
        prev.map((log) =>
          log.id === DEMO_DATA_LOG_ID ? log : { ...log, status: "done" },
        ),
      );

      // 3. Perform silent background login and stash credentials — needed
      // now (not just at the success-screen CTA) so the seed-demo call
      // below is authenticated.
      const loginRes = await apiPost<{
        token: string;
        user: Record<string, unknown>;
      }>("/auth/login", {
        email,
        password,
        tenantSlug: registerRes.tenant.slug,
      });

      pendingLoginRef.current = loginRes;
      localStorage.setItem("token", loginRes.token);
      localStorage.setItem("user", JSON.stringify(loginRes.user));

      // 3b. Seed sample data if requested — reflects the real outcome of
      // POST /auth/onboarding/seed-demo, not a simulated delay.
      if (loadSampleData) {
        setSeedingLogs((prev) =>
          prev.map((log) =>
            log.id === DEMO_DATA_LOG_ID ? { ...log, status: "loading" } : log,
          ),
        );
        try {
          await apiPost("/auth/onboarding/seed-demo", {});
          setSeedingLogs((prev) =>
            prev.map((log) =>
              log.id === DEMO_DATA_LOG_ID ? { ...log, status: "done" } : log,
            ),
          );
        } catch {
          // Non-fatal — sample data can still be loaded later from the SaaS portal.
          setSeedingLogs((prev) =>
            prev.map((log) =>
              log.id === DEMO_DATA_LOG_ID
                ? {
                    ...log,
                    status: "done",
                    label:
                      "Sample data seeding failed — retry later from the SaaS portal",
                  }
                : log,
            ),
          );
        }
      }

      // 4. Show success state instead of auto-redirecting
      setProvisioningComplete(true);
      setLoading(false);
    } catch (err: unknown) {
      clearInterval(pollInterval);
      setStep(2); // Kick back to details
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Organization registration failed.",
        );
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Panel — Value Propositions */}
      <div className="auth-sidebar auth-sidebar-green">
        <div className={`auth-sidebar-shape ${styles.s1}`} />
        <div className={`auth-sidebar-shape ${styles.s2}`} />

        <div className="auth-sidebar-content">
          <div className="auth-logo-area">
            <div className="auth-logo-icon">
              <Building size={22} className={styles.sidebarIcon} />
            </div>
            <div>
              <h2 className={styles.sidebarTitle}>UniERP</h2>
              <p className={styles.sidebarSubtitle}>New Organization</p>
            </div>
          </div>

          <h1>
            Start running your
            <br />
            business in minutes.
          </h1>
          <p>
            Create a secure multi-tenant sandbox and initialize your workspace
            modules instantly.
          </p>

          <div className="auth-sidebar-features">
            {VALUE_PROPS.map((prop, i) => (
              <div
                key={i}
                className={`auth-sidebar-feature ${styles.featureItem}`}
              >
                <h4 className={styles.featureTitle}>
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
          <div className={styles.brandArea}>
            <div className={styles.brandIcon}>
              <Building size={24} />
            </div>
            <span className={styles.brandName}>UniERP</span>
          </div>

          <div className="auth-form-header">
            <h1>Register Organization</h1>
            <p className={styles.headerSubtext}>
              Setup your isolated corporate workspace and system parameters.
            </p>
          </div>

          {/* Free Trial Badge */}
          <div className={styles.trialBadge}>
            <Sparkles size={14} />
            <span>30-day free trial · No credit card required</span>
          </div>

          {/* Step Indicator — Connected Circles */}
          <div className={styles.stepIndicator}>
            {STEP_LABELS.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isComplete = step > stepNum;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <div
                      className={`${styles.stepLine} ${isComplete ? styles.stepLineComplete : ""}`}
                    />
                  )}
                  <div className={styles.stepItem}>
                    <div
                      className={`${styles.stepCircle} ${isActive ? styles.stepCircleActive : ""} ${isComplete ? styles.stepCircleComplete : ""}`}
                    >
                      {isComplete ? (
                        <Check size={14} />
                      ) : (
                        <span>{stepNum}</span>
                      )}
                    </div>
                    <span
                      className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ""}`}
                    >
                      {label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div className="auth-card">
            {error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: ORGANIZATION PARAMETERS */}
            {step === 1 && (
              <form onSubmit={handleNextStep} className={styles.formStack}>
                <div className="auth-field-group">
                  <label className="auth-label">
                    Organization / Company Name *
                  </label>
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
                  <label className="auth-label">
                    Industry Profile (Optional)
                  </label>
                  <select
                    className={`auth-select ${styles.selectField}`}
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">— Select Industry —</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.termsRow}>
                  <input
                    type="checkbox"
                    id="load-sample-data"
                    checked={loadSampleData}
                    onChange={(e) => setLoadSampleData(e.target.checked)}
                    className={styles.termsCheckbox}
                  />
                  <label
                    htmlFor="load-sample-data"
                    className={styles.termsLabel}
                  >
                    Load sample data to explore the app
                  </label>
                </div>

                <div className={`ui-grid-2 ${styles.gridGap}`}>
                  <div className="auth-field-group">
                    <label className="auth-label">Country</label>
                    <select
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className={`auth-select ${styles.selectWithIcon}`}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-label">Primary Currency</label>
                    <div className="auth-input-wrapper">
                      <Coins size={16} className="auth-input-icon" />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className={styles.selectWithIcon}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} ({c.symbol}) — {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className={`ui-grid-2 ${styles.gridGap}`}>
                  <div className="auth-field-group">
                    <label className="auth-label">Workspace Timezone</label>
                    <div className="auth-input-wrapper">
                      <Globe size={16} className="auth-input-icon" />
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className={styles.selectWithIcon}
                      >
                        {timezones.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-label">Primary Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className={`auth-select ${styles.selectWithIcon}`}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`ui-grid-2 ${styles.gridGap}`}>
                  <div className="auth-field-group">
                    <label className="auth-label">Business Type</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className={`auth-select ${styles.selectWithIcon}`}
                    >
                      <option value="">— Select Type —</option>
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-label">Estimated Users</label>
                    <input
                      type="number"
                      min="1"
                      className="auth-input"
                      value={estimatedUsers}
                      onChange={(e) =>
                        setEstimatedUsers(
                          Math.max(1, parseInt(e.target.value) || 1),
                        )
                      }
                    />
                  </div>
                </div>

                {/* Logo Upload — Drag & Drop Zone */}
                <div className="auth-field-group">
                  <label className="auth-label">
                    Organization Logo (Optional)
                  </label>
                  {logoUrl ? (
                    <div className={styles.logoPreviewContainer}>
                      <div className={styles.logoPreview}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrl}
                          alt="Logo preview"
                          className={styles.logoPreviewImg}
                        />
                        <button
                          type="button"
                          className={styles.logoRemoveBtn}
                          onClick={() => setLogoUrl("")}
                          title="Remove logo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className={styles.logoPreviewInfo}>
                        <span className={styles.logoPreviewLabel}>
                          Logo uploaded
                        </span>
                        <button
                          type="button"
                          className={styles.logoChangeBtn}
                          onClick={() => logoFileInputRef.current?.click()}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`${styles.logoDropZone} ${logoDragging ? styles.logoDropZoneActive : ""}`}
                      onClick={() => logoFileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setLogoDragging(true);
                      }}
                      onDragLeave={() => setLogoDragging(false)}
                      onDrop={handleLogoDrop}
                    >
                      <div className={styles.logoDropIcon}>
                        {logoDragging ? (
                          <ImageIcon size={24} />
                        ) : (
                          <Upload size={24} />
                        )}
                      </div>
                      <span className={styles.logoDropText}>
                        {logoDragging
                          ? "Drop your logo here"
                          : "Click or drag & drop your logo"}
                      </span>
                      <span className={styles.logoDropHint}>
                        PNG, JPG, SVG · Any size — resized automatically
                      </span>
                    </div>
                  )}
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleLogoInputChange}
                  />
                  {logoError && (
                    <p className={styles.logoErrorText}>{logoError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="landing-btn-primary auth-btn-submit"
                >
                  Next: Admin Credentials <ChevronRight size={16} />
                </button>
              </form>
            )}

            {/* STEP 2: ADMINISTRATOR PROFILE SETUP */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className={styles.formStack}>
                <div className={styles.nameGrid}>
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
                      className={`auth-input ${styles.inputWithTrailing}`}
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                    {emailChecking && (
                      <span className={styles.inputTrailingIcon}>
                        <Spinner size="sm" />
                      </span>
                    )}
                    {!emailChecking && emailAvailable === true && (
                      <span
                        className={styles.inputTrailingIcon}
                        style={{ color: "var(--color-success)" }}
                      >
                        <CheckCircle2 size={16} />
                      </span>
                    )}
                    {!emailChecking && emailAvailable === false && (
                      <span
                        className={styles.inputTrailingIcon}
                        style={{ color: "var(--color-danger)" }}
                      >
                        <AlertCircle size={16} />
                      </span>
                    )}
                  </div>
                  {emailAvailable === false && (
                    <p className={styles.fieldError}>
                      This email is already registered
                    </p>
                  )}
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">System Admin Password *</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className={`auth-input ${styles.inputWithTrailing}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.passwordToggle}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Requirements Checklist */}
                  {password && (
                    <div className={styles.pwdChecklist}>
                      {passwordChecks.map((check, i) => (
                        <div
                          key={i}
                          className={`${styles.pwdCheckItem} ${check.met ? styles.pwdCheckMet : ""}`}
                        >
                          {check.met ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <div className={styles.pwdCheckDot} />
                          )}
                          <span>{check.label}</span>
                        </div>
                      ))}
                      <div className={styles.pwdStrengthRow}>
                        <div className={styles.pwdStrengthBar}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              style={{
                                background:
                                  passwordStrength.score >= level
                                    ? passwordStrength.color
                                    : "var(--color-bg-sunken)",
                              }}
                              className={styles.pwdStrengthSegment}
                            />
                          ))}
                        </div>
                        <span
                          style={{ color: passwordStrength.color }}
                          className={styles.pwdStrengthLabel}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Confirm Admin Password *</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className={`auth-input ${styles.inputWithTrailing}`}
                      style={{
                        borderColor: !passwordsMatch
                          ? "var(--color-danger)"
                          : undefined,
                      }}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className={styles.passwordToggle}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {!passwordsMatch && (
                    <p className={styles.fieldError}>Passwords do not match</p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div className={styles.termsRow}>
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className={styles.termsCheckbox}
                  />
                  <label htmlFor="agree-terms" className={styles.termsLabel}>
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.termsLink}
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.termsLink}
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <div className={styles.buttonRow}>
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className={`auth-btn-back ${styles.backBtn}`}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    className={`landing-btn-primary auth-btn-submit ${styles.submitBtn}`}
                    disabled={
                      loading ||
                      !agreedToTerms ||
                      !passwordsMatch ||
                      password.length < 8
                    }
                  >
                    Create Workspace{" "}
                    <Sparkles size={14} className={styles.sparkleIcon} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: PROVISIONING / CONSOLE FEEDBACK */}
            {step === 3 && !provisioningComplete && (
              <div className={styles.provisioningContainer}>
                <div className={styles.provisioningHeader}>
                  <Spinner size="md" />
                  <div>
                    <h3 className={styles.provisioningTitle}>
                      Provisioning isolated workspace partition...
                    </h3>
                    <p className={styles.provisioningDesc}>
                      Seeding database structures and bootstrapping admin
                      credentials.
                    </p>
                  </div>
                </div>

                {/* Seeding Log Console */}
                <div className={styles.seedingConsole}>
                  {seedingLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        color:
                          log.status === "done"
                            ? "#4ade80"
                            : log.status === "loading"
                              ? "var(--color-primary)"
                              : "#4b5563",
                      }}
                      className={styles.seedingLogRow}
                    >
                      {log.status === "done" ? (
                        <CheckCircle2
                          size={13}
                          className={styles.seedingCheckIcon}
                        />
                      ) : log.status === "loading" ? (
                        <span
                          className={`console-spinner ${styles.consoleSpinner}`}
                        />
                      ) : (
                        <div className={styles.seedingDot} />
                      )}
                      <span>{log.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS STATE */}
            {step === 3 && provisioningComplete && (
              <div className={styles.successContainer}>
                <div className={styles.successIconRing}>
                  <CheckCircle2 size={48} />
                </div>
                <h2 className={styles.successTitle}>
                  Your workspace is ready!
                </h2>
                <p className={styles.successDesc}>
                  <strong>{organizationName}</strong> has been provisioned with
                  all modules. Your 30-day free trial starts now.
                </p>
                <div className={styles.successActions}>
                  <button
                    onClick={handleGoToWorkspace}
                    className={`landing-btn-primary auth-btn-submit ${styles.successPrimaryBtn}`}
                  >
                    <Rocket size={16} />
                    Choose a Plan & Set Up
                  </button>
                  <button
                    onClick={() => {
                      if (pendingLoginRef.current) {
                        localStorage.setItem(
                          "token",
                          pendingLoginRef.current.token,
                        );
                        localStorage.setItem(
                          "user",
                          JSON.stringify(pendingLoginRef.current.user),
                        );
                      }
                      router.push("/apps");
                    }}
                    className={styles.successSecondaryBtn}
                  >
                    Explore First <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className={styles.footerLink}>
            Already have an account?{" "}
            <Link href="/login" className={styles.footerLinkAnchor}>
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
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
