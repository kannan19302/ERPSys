"use client";
import styles from "./OnboardingChecklist.module.css";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Circle,
  Rocket,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useApiClient } from "@unerp/framework";

/**
 * Single source of truth for the onboarding checklist widget — replaces the
 * two local implementations that previously lived in
 * apps/web/app/(dashboard)/apps/page.tsx and
 * apps/web/app/(dashboard)/saas/portal/page.tsx. Both fetch/post via the same
 * `GET /auth/onboarding` and `PUT /auth/onboarding/complete/:key` endpoints,
 * whose response now also carries an industry-personalized `checklistOrder`.
 */

export const ONBOARDING_CHECKLIST_KEYS = [
  "profile",
  "logo",
  "invite",
  "app",
  "plan",
  "dashboard",
] as const;
export type OnboardingChecklistKey = (typeof ONBOARDING_CHECKLIST_KEYS)[number];

export interface OnboardingChecklistResponse {
  profile: boolean;
  logo: boolean;
  invite: boolean;
  app: boolean;
  plan: boolean;
  dashboard: boolean;
  checklistOrder: OnboardingChecklistKey[];
  priorityAppSlugs: string[];
}

const DEFAULT_STATE: OnboardingChecklistResponse = {
  profile: false,
  logo: false,
  invite: false,
  app: false,
  plan: false,
  dashboard: false,
  checklistOrder: [...ONBOARDING_CHECKLIST_KEYS],
  priorityAppSlugs: [],
};

interface ItemMeta {
  key: OnboardingChecklistKey;
  label: string;
  hint: string;
  href: string;
  scrollToId?: string;
}

const ITEM_META: Record<OnboardingChecklistKey, ItemMeta> = {
  profile: {
    key: "profile",
    label: "Complete your profile",
    hint: "Add your name, avatar, and preferences",
    href: "/profile",
  },
  logo: {
    key: "logo",
    label: "Upload organization logo",
    hint: "Brand your workspace for your team",
    href: "/settings/general",
  },
  invite: {
    key: "invite",
    label: "Invite your first team member",
    hint: "Collaborate with your team",
    href: "/saas/portal",
    scrollToId: "invite-section",
  },
  app: {
    key: "app",
    label: "Install your first app",
    hint: "Extend your ERP with modules",
    href: "/apps/store",
  },
  plan: {
    key: "plan",
    label: "Choose a subscription plan",
    hint: "Pick the right plan for your needs",
    href: "/saas/portal",
    scrollToId: "plans-section",
  },
  dashboard: {
    key: "dashboard",
    label: "Explore the dashboard",
    hint: "Start managing your business",
    href: "/apps",
  },
};

export interface OnboardingChecklistProps {
  /** "compact" = collapsible icon+label widget (Apps hub). "full" = detailed
   * grid with hints and the sandbox demo-data callout (SaaS Portal). */
  variant: "compact" | "full";
  /** External gate on top of "not all steps complete" (e.g. trial status). */
  show?: boolean;
  /** Compact variant only: auto-completes the "dashboard" step on mount. */
  autoCompleteDashboard?: boolean;
  /** Full variant only: called after a successful demo-data seed so the
   * parent page can refresh data that the seed may have changed (usage, etc). */
  onDemoDataSeeded?: () => void;
  className?: string;
}

export function OnboardingChecklist({
  variant,
  show = true,
  autoCompleteDashboard = false,
  onDemoDataSeeded,
  className,
}: OnboardingChecklistProps) {
  const client = useApiClient();
  const [checklist, setChecklist] =
    useState<OnboardingChecklistResponse>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const [demoLoaded, setDemoLoaded] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [justCompleted, setJustCompleted] = useState<
    Set<OnboardingChecklistKey>
  >(new Set());
  const [justFinishedAll, setJustFinishedAll] = useState(false);
  const prevChecklistRef = React.useRef<OnboardingChecklistResponse | null>(
    null,
  );

  const applyChecklist = React.useCallback(
    (res: OnboardingChecklistResponse) => {
      const prev = prevChecklistRef.current;
      if (prev) {
        const newlyDone = ONBOARDING_CHECKLIST_KEYS.filter(
          (k) => !prev[k] && res[k],
        );
        if (newlyDone.length > 0) {
          setJustCompleted(new Set(newlyDone));
          window.setTimeout(() => setJustCompleted(new Set()), 1400);
        }
        const prevProgress = ONBOARDING_CHECKLIST_KEYS.filter(
          (k) => prev[k],
        ).length;
        const nextProgress = ONBOARDING_CHECKLIST_KEYS.filter(
          (k) => res[k],
        ).length;
        if (
          prevProgress < ONBOARDING_CHECKLIST_KEYS.length &&
          nextProgress === ONBOARDING_CHECKLIST_KEYS.length
        ) {
          setJustFinishedAll(true);
          window.setTimeout(() => setJustFinishedAll(false), 3200);
        }
      }
      prevChecklistRef.current = res;
      setChecklist(res);
    },
    [],
  );

  const fetchState = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setSyncing(true);
      try {
        const res =
          await client.get<OnboardingChecklistResponse>("/auth/onboarding");
        if (!res) return;
        applyChecklist(res);
        if (autoCompleteDashboard && !res.dashboard) {
          const updated = await client
            .put<OnboardingChecklistResponse>(
              "/auth/onboarding/complete/dashboard",
              {},
            )
            .catch(() => null);
          if (updated) applyChecklist(updated);
        }
      } catch {
        // Keep previous state — the widget simply won't render fresh progress.
      } finally {
        setLoaded(true);
        setSyncing(false);
      }
    },
    [client, autoCompleteDashboard, applyChecklist],
  );

  useEffect(() => {
    let cancelled = false;
    fetchState();
    if (variant === "full") {
      client
        .get<any>("/auth/me")
        .then((me) => {
          if (!cancelled && me?.tenant)
            setDemoLoaded(!!me.tenant.demoDataLoaded);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, variant]);

  // Steps are server-derived (uploaded a logo in another tab, an admin
  // accepted an invite, etc.) — re-sync silently whenever the user returns
  // to this tab so the checkmarks flip live without a manual refresh.
  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.visibilityState === "hidden") return;
      fetchState({ silent: true });
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [fetchState]);

  const orderedKeys = useMemo(() => {
    const order = checklist.checklistOrder?.length
      ? checklist.checklistOrder
      : [...ONBOARDING_CHECKLIST_KEYS];
    // Keep it defensive against unexpected/legacy payloads.
    const known = order.filter((k) => ITEM_META[k]);
    const missing = ONBOARDING_CHECKLIST_KEYS.filter((k) => !known.includes(k));
    return [...known, ...missing];
  }, [checklist.checklistOrder]);

  const total = ONBOARDING_CHECKLIST_KEYS.length;
  const progress = useMemo(
    () => ONBOARDING_CHECKLIST_KEYS.filter((k) => checklist[k]).length,
    [checklist],
  );

  // Only "dashboard" is manually completable (see onboarding.service.ts) —
  // the other five keys are derived from real backend state and refresh via
  // fetchState, never via a fake client-side "click to complete".
  const markItem = async (key: OnboardingChecklistKey) => {
    if (key !== "dashboard" || checklist[key]) return;
    try {
      const res = await client.put<OnboardingChecklistResponse>(
        `/auth/onboarding/complete/${key}`,
        {},
      );
      if (res) applyChecklist(res);
    } catch {
      // Non-fatal — the checklist is a UX nudge, not a blocking action.
    }
  };

  const handleItemClick = (item: ItemMeta) => {
    markItem(item.key);
    if (item.scrollToId) {
      document
        .getElementById(item.scrollToId)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSeedDemoData = async () => {
    setSeedingDemo(true);
    setSeedError(null);
    try {
      const res = await client.post<{ success: boolean; message: string }>(
        "/auth/onboarding/seed-demo",
        {},
      );
      if (res?.success) {
        setDemoLoaded(true);
        onDemoDataSeeded?.();
      }
    } catch (err: any) {
      setSeedError(err?.message || "Failed to load demo data");
    } finally {
      setSeedingDemo(false);
    }
  };

  // The compact widget (Apps hub) hides itself once every step is done; the
  // full widget (SaaS Portal) stays visible for the whole trial-onboarding
  // banner, matching each page's original behavior pre-consolidation.
  if (!loaded || !show) return null;
  if (variant === "compact" && progress >= total) return null;

  if (variant === "compact") {
    return (
      <div className={`${styles.widget} ui-animate-in ${className || ""}`}>
        <div className={styles.header} onClick={() => setExpanded(!expanded)}>
          <div className={styles.titleArea}>
            <Sparkles
              size={16}
              style={{ color: "var(--color-warning, #f59e0b)" }}
            />
            <span className={styles.title}>Get Started with UniERP</span>
            <span className={`${styles.badge} ${styles.badgePulse}`}>
              {progress} / {total} completed
            </span>
            {syncing && (
              <span className={styles.syncIndicator} title="Syncing status…">
                <Loader2 size={13} />
              </span>
            )}
          </div>
          <button type="button" className={styles.collapseBtn}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {expanded && (
          <div className="ui-animate-in">
            <div className={styles.progressBg}>
              <div
                className={styles.progressBar}
                style={{ width: `${(progress / total) * 100}%` }}
              />
            </div>

            <div className={styles.grid}>
              {orderedKeys.map((key) => {
                const item = ITEM_META[key];
                const done = checklist[key];
                return (
                  <Link
                    key={key}
                    href={item.href}
                    onClick={() => markItem(key)}
                    className={`${styles.item} ${done ? styles.itemCompleted : styles.itemActive} ${justCompleted.has(key) ? styles.itemJustCompleted : ""}`}
                  >
                    {done ? (
                      <CircleCheck
                        size={16}
                        className={
                          justCompleted.has(key) ? styles.checkPop : undefined
                        }
                      />
                    ) : (
                      <Circle size={16} />
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            {justFinishedAll && (
              <div className={`${styles.celebrateBanner} ui-animate-in`}>
                <Sparkles size={14} /> All set — your workspace is fully
                configured!
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // variant === "full"
  return (
    <div className={className}>
      <div className={styles.fullProgressRow}>
        <div className={styles.progressBg}>
          <div
            className={styles.progressBar}
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
        <span className={styles.progressText}>
          {progress} / {total} completed
        </span>
        {syncing && (
          <span className={styles.syncIndicator} title="Syncing status…">
            <Loader2 size={13} />
          </span>
        )}
      </div>

      {!demoLoaded && (
        <div className={`${styles.demoBox} ui-animate-in`}>
          <div className={styles.demoBoxLeft}>
            <div className={styles.demoBoxIcon}>
              <Rocket size={18} />
            </div>
            <div>
              <div className={styles.demoBoxTitle}>
                Explore with Sandbox Demo Data
              </div>
              <div className={styles.demoBoxDesc}>
                Populate the workspace with sample products, crm contacts, and
                transaction documents.
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={seedingDemo}
            onClick={handleSeedDemoData}
            className={`ui-btn ui-btn-primary ui-btn-sm ${styles.demoBoxBtn}`}
          >
            {seedingDemo ? "Seeding..." : "Load Demo Data"}
          </button>
        </div>
      )}
      {seedError && (
        <div className={styles.demoError}>
          <AlertCircle size={14} /> {seedError}
        </div>
      )}

      <div className={styles.fullGrid}>
        {orderedKeys.map((key) => {
          const item = ITEM_META[key];
          const done = checklist[key];
          return (
            <Link
              key={key}
              href={item.href}
              onClick={() => handleItemClick(item)}
              className={`${styles.fullItem} ${done ? styles.fullItemDone : ""} ${justCompleted.has(key) ? styles.itemJustCompleted : ""}`}
            >
              <span className={styles.fullItemIcon}>
                {done ? (
                  <CircleCheck
                    size={20}
                    className={
                      justCompleted.has(key) ? styles.checkPop : undefined
                    }
                  />
                ) : (
                  <Circle size={20} />
                )}
              </span>
              <div>
                <span className={styles.fullItemLabel}>{item.label}</span>
                <span className={styles.fullItemHint}>{item.hint}</span>
              </div>
            </Link>
          );
        })}
      </div>
      {justFinishedAll && (
        <div className={`${styles.celebrateBanner} ui-animate-in`}>
          <Sparkles size={14} /> All set — your workspace is fully configured!
        </div>
      )}
    </div>
  );
}
