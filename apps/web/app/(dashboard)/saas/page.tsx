"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cloud,
  Users,
  CreditCard,
  Activity,
  Package,
  ShieldCheck,
  Scale,
  Settings,
  Key,
  History,
  Download,
  Webhook,
  Headphones,
  Network,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, Spinner, Badge } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import type { SaasTab } from "@/components/saas/SaasTabLayout";

const SAAS_TABS: SaasTab[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/saas",
    icon: Cloud,
    description: "SaaS platform summary",
  },
  {
    id: "portal",
    label: "Portal & Subscription",
    href: "/saas/portal",
    icon: Sparkles,
    description: "Plan, seats, and subscription management",
  },
  {
    id: "team",
    label: "Team",
    href: "/saas/team",
    icon: Users,
    description: "Invite and manage workspace members",
  },
  {
    id: "org-hierarchy",
    label: "Org Hierarchy",
    href: "/saas/team/org-hierarchy",
    icon: Network,
    description: "Department and cost-center structure",
    advanced: true,
    group: "Team",
  },
  {
    id: "billing",
    label: "Billing",
    href: "/saas/billing",
    icon: CreditCard,
    description: "Invoices, payment methods, and revenue",
  },
  {
    id: "usage",
    label: "Usage",
    href: "/saas/usage",
    icon: Activity,
    description: "Resource consumption and quota alerts",
  },
  {
    id: "addons",
    label: "Add-ons",
    href: "/saas/addons",
    icon: Package,
    description: "Marketplace add-ons for your workspace",
  },
  {
    id: "security",
    label: "Security",
    href: "/saas/security",
    icon: ShieldCheck,
    description: "MFA, SSO, sessions, and API keys",
  },
  {
    id: "compliance",
    label: "Compliance",
    href: "/saas/compliance",
    icon: Scale,
    description: "GDPR, retention, and certifications",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/saas/settings",
    icon: Settings,
    description: "Branding, domains, and integrations",
  },
  {
    id: "support",
    label: "Support",
    href: "/saas/support",
    icon: Headphones,
    description: "Support tickets and help",
  },
  {
    id: "api-keys",
    label: "API Keys",
    href: "/saas/api-keys",
    icon: Key,
    description: "Programmatic access credentials",
    advanced: true,
    group: "Platform Admin",
  },
  {
    id: "webhooks",
    label: "Webhooks",
    href: "/saas/webhooks",
    icon: Webhook,
    description: "Outbound event subscriptions",
    advanced: true,
    group: "Platform Admin",
  },
  {
    id: "exports",
    label: "Data Export",
    href: "/saas/exports",
    icon: Download,
    description: "Bulk data export jobs",
    advanced: true,
    group: "Platform Admin",
  },
  {
    id: "audit-log",
    label: "Audit Log",
    href: "/saas/audit-log",
    icon: History,
    description: "Platform-wide activity trail",
    advanced: true,
    group: "Platform Admin",
  },
  {
    id: "admin",
    label: "Platform Admin",
    href: "/saas/admin",
    icon: ShieldAlert,
    description: "Plan templates, coupons, and platform MRR/ARR",
    advanced: true,
    group: "Platform Admin",
  },
];

interface SubscriptionSummary {
  planName?: string;
  status?: string;
  price?: number;
  currency?: string;
  interval?: string;
  currentUsers?: number;
  maxUsers?: number;
}

function SaasOverview() {
  const client = useApiClient();
  const [sub, setSub] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data =
          await client.get<SubscriptionSummary>("/saas/subscription");
        if (mounted) setSub(data);
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [client]);

  const quickLinks = [
    { href: "/saas/team", label: "Manage Team", icon: Users },
    { href: "/saas/billing", label: "View Billing", icon: CreditCard },
    { href: "/saas/security", label: "Security Settings", icon: ShieldCheck },
    { href: "/saas/support", label: "Get Support", icon: Headphones },
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <Card padding="lg">
        <div className="ui-flex-between ui-mb-4">
          <div>
            <h3 className="ui-heading-base">Current Plan</h3>
            <p className="ui-text-xs-muted">
              Subscription status for this workspace
            </p>
          </div>
          {sub?.status && (
            <Badge variant={sub.status === "ACTIVE" ? "success" : "warning"}>
              {sub.status}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="ui-center-pad">
            <Spinner size="md" />
          </div>
        ) : error || !sub ? (
          <div className="ui-empty-state">
            <Cloud size={32} className="ui-empty-state-icon" />
            <h4 className="ui-empty-state-title">No subscription found</h4>
            <p className="ui-empty-state-text">
              Visit the Portal tab to choose a plan for this workspace.
            </p>
            <Link href="/saas/portal" className="ui-btn ui-btn-primary">
              Go to Portal <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="ui-grid-3">
            <div className="ui-kv-pair">
              <span className="ui-text-xs-muted">Plan</span>
              <span className="font-semibold text-sm">
                {sub.planName || "—"}
              </span>
            </div>
            <div className="ui-kv-pair">
              <span className="ui-text-xs-muted">Price</span>
              <span className="font-semibold text-sm">
                {sub.price != null
                  ? `${sub.currency || "$"}${sub.price}/${sub.interval || "mo"}`
                  : "—"}
              </span>
            </div>
            <div className="ui-kv-pair">
              <span className="ui-text-xs-muted">Seats</span>
              <span className="font-semibold text-sm">
                {sub.currentUsers != null
                  ? `${sub.currentUsers} / ${sub.maxUsers ?? "∞"}`
                  : "—"}
              </span>
            </div>
          </div>
        )}
      </Card>

      <div>
        <h3 className="ui-heading-sm ui-mb-3">Quick Actions</h3>
        <div className="ui-grid-4">
          {quickLinks.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="ui-card-clickable"
              style={{ display: "block" }}
            >
              <Card padding="md">
                <div className="ui-hstack-3">
                  <q.icon size={18} className="ui-text-primary" />
                  <span className="font-medium text-sm">{q.label}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SaasHubPage() {
  return (
    <RouteGuard permission="saas.portal.read">
      <SaasOverview />
    </RouteGuard>
  );
}
