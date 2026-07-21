"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Settings,
  Zap,
  Users,
  BarChart3,
  Target,
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
  { id: "leads", label: "Leads", href: "/crm/leads", icon: Target },
  {
    id: "opportunities",
    label: "Opportunities",
    href: "/crm/opportunities",
    icon: Target,
  },
  {
    id: "automation",
    label: "Automation",
    href: "/crm/automation",
    icon: Activity,
  },
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

const AUTOMATION_TABS = [
  { id: "overview", label: "Overview" },
  { id: "assignment-rules", label: "Assignment Rules" },
  { id: "escalation-rules", label: "Escalation Rules" },
  { id: "scoring-models", label: "Scoring Models" },
  { id: "sequences", label: "Sequences" },
];

export default function CrmAutomationPage() {
  useCrmKeyMigration();
  const api = useApiClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/sales-automation/dashboard")
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
        moduleDescription="Sales automation & intelligence"
      >
        <PageHeader
          title="Sales Automation"
          description="Auto-assignment, escalation rules, scoring models, and sequences"
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
          {AUTOMATION_TABS.map((tab) => (
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
              icon={Zap}
              value={dashboard?.totalRules ?? 0}
              label="Total Rules"
            />
            <KpiCard
              icon={Activity}
              value={dashboard?.activeRules ?? 0}
              label="Active Rules"
            />
            <KpiCard
              icon={Target}
              value={dashboard?.totalSequences ?? 0}
              label="Sequences"
            />
            <KpiCard
              icon={Users}
              value={dashboard?.totalAssignments ?? 0}
              label="Assignments"
            />
          </div>
        )}
        {activeTab === "overview" && (
          <Card padding="lg">
            <p className="ui-text-muted">
              Sales automation overview dashboard. Configure assignment rules,
              escalation policies, scoring models, and sales sequences.
            </p>
          </Card>
        )}
      </CrmTabLayout>
    </RouteGuard>
  );
}
