"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Settings,
  Users,
  BarChart3,
  Target,
  Heart,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { PageHeader, Button, Card, Spinner, KpiCard } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import {
  CrmTabLayout,
  useCrmKeyMigration,
  type CrmTab,
} from "@/components/crm/CrmTabLayout";

const TAB_DEFINITIONS: CrmTab[] = [
  { id: "overview", label: "Dashboard", href: "/crm", icon: BarChart3 },
  { id: "customers", label: "Customers", href: "/crm/customers", icon: Users },
  {
    id: "customer-success",
    label: "Customer Success",
    href: "/crm/customer-success",
    icon: Users,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/crm/settings",
    icon: Settings,
    advanced: true,
    group: "Settings",
  },
];

const CS_TABS = [
  { id: "overview", label: "Overview" },
  { id: "health-scores", label: "Health Scores" },
  { id: "nps-surveys", label: "NPS Surveys" },
  { id: "onboarding", label: "Onboarding" },
  { id: "retention", label: "Retention" },
];

export default function CrmCustomerSuccessPage() {
  useCrmKeyMigration();
  const api = useApiClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/customer-success/dashboard")
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  return (
    <RouteGuard permission="crm.read">
      <CrmTabLayout
        tabs={TAB_DEFINITIONS}
        moduleId="crm"
        moduleLabel="CRM & Sales"
        moduleIcon={Activity}
        moduleDescription="Customer success & retention"
      >
        <PageHeader
          title="Customer Success"
          description="Health scores, NPS surveys, onboarding checklists, and retention campaigns"
        />
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            marginBottom: "var(--space-4)",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "var(--space-2)",
          }}
        >
          {CS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="ui-btn"
              style={{
                background:
                  activeTab === tab.id ? "var(--color-primary)" : "transparent",
                color: activeTab === tab.id ? "#fff" : "inherit",
                border: "none",
                padding: "var(--space-1) var(--space-3)",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <div className="ui-grid-4" style={{ marginBottom: "var(--space-4)" }}>
            <KpiCard
              icon={Heart}
              value={dashboard?.avgHealthScore?.toFixed(1) ?? 0}
              label="Avg Health Score"
            />
            <KpiCard
              icon={MessageSquare}
              value={dashboard?.totalSurveys ?? 0}
              label="NPS Surveys"
            />
            <KpiCard
              icon={ClipboardList}
              value={dashboard?.activeChecklists ?? 0}
              label="Active Onboarding"
            />
            <KpiCard
              icon={Target}
              value={dashboard?.retentionRate?.toFixed(1) ?? 0}
              label="Retention Rate %"
            />
          </div>
        )}
        {activeTab === "overview" && (
          <Card padding="lg">
            <p className="ui-text-muted">
              Customer success dashboard. Manage health score configurations,
              NPS surveys, onboarding checklists, and retention campaigns.
            </p>
          </Card>
        )}
      </CrmTabLayout>
    </RouteGuard>
  );
}
