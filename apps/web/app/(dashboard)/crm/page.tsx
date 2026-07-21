"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Target,
  Handshake,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Building2,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import {
  PageHeader,
  Button,
  Card,
  DashboardChart,
  ListView,
  StatCard,
  Spinner,
  KpiCard,
} from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import {
  CrmTabLayout,
  useCrmKeyMigration,
  type CrmTab,
} from "@/components/crm/CrmTabLayout";

interface DashboardData {
  kpis: {
    totalLeads: number;
    totalOpportunities: number;
    totalCustomers: number;
    pipelineValue: number;
  };
}

const PAGES = [
  { id: "executive-overview", label: "Executive Overview", icon: BarChart3 },
  { id: "pipeline-analytics", label: "Pipeline Analytics", icon: TrendingUp },
  { id: "customer-health", label: "Customer Health", icon: Users },
  { id: "forecast", label: "Forecast & Revenue", icon: DollarSign },
  { id: "activity-stream", label: "Activity Stream", icon: Activity },
];

const TAB_DEFINITIONS: CrmTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/crm",
    icon: BarChart3,
    description: "CRM executive dashboard",
  },
  {
    id: "leads",
    label: "Leads",
    href: "/crm/leads",
    icon: UserPlus,
    description: "Lead management",
  },
  {
    id: "opportunities",
    label: "Opportunities",
    href: "/crm/opportunities",
    icon: Target,
    description: "Sales pipeline",
  },
  {
    id: "customers",
    label: "Customers",
    href: "/crm/customers",
    icon: Building2,
    description: "Customer management",
  },
  {
    id: "contacts",
    label: "Contacts",
    href: "/crm/contacts",
    icon: Users,
    description: "Contact directory",
  },
  {
    id: "marketing",
    label: "Marketing",
    href: "/crm/marketing-outreach",
    icon: PieChart,
    description: "Campaigns & outreach",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "automation",
    label: "Automation",
    href: "/crm/automation",
    icon: Activity,
    description: "Sales automation",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "customer-success",
    label: "Customer Success",
    href: "/crm/customer-success",
    icon: Handshake,
    description: "Health & retention",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/crm/settings",
    icon: Activity,
    description: "CRM configuration",
    advanced: true,
    group: "Settings",
  },
];

function KpiCardGroup({ data }: { data: DashboardData }) {
  const kpis = data?.kpis;
  return (
    <div className="ui-grid-4" style={{ marginBottom: "var(--space-4)" }}>
      <KpiCard
        icon={UserPlus}
        value={kpis?.totalLeads ?? 0}
        label="Total Leads"
      />
      <KpiCard
        icon={Target}
        value={kpis?.totalOpportunities ?? 0}
        label="Opportunities"
      />
      <KpiCard
        icon={Building2}
        value={kpis?.totalCustomers ?? 0}
        label="Customers"
      />
      <KpiCard
        icon={DollarSign}
        value={`$${(kpis?.pipelineValue ?? 0).toLocaleString()}`}
        label="Pipeline Value"
      />
    </div>
  );
}

function NavCard({
  label,
  href,
  icon: Icon,
}: {
  label: string;
  href: string;
  icon: any;
}) {
  return (
    <Link
      href={href}
      className="ui-card"
      style={{
        padding: "var(--space-4)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <Icon size={24} />
      <span className="ui-heading-sm">{label}</span>
    </Link>
  );
}

export default function CrmPage() {
  useCrmKeyMigration();
  const searchParams = useSearchParams();
  const activePage = searchParams.get("page") || "executive-overview";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      const res = await fetch(`${baseUrl}/crm/dashboard`, {
        credentials: "include",
      });
      if (res.ok) setData(await res.json());
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const currentPageIdx = PAGES.findIndex((p) => p.id === activePage);
  const prevPage = currentPageIdx > 0 ? PAGES[currentPageIdx - 1] : null;
  const nextPage =
    currentPageIdx < PAGES.length - 1 ? PAGES[currentPageIdx + 1] : null;

  return (
    <RouteGuard permission="crm.read">
      <CrmTabLayout
        tabs={TAB_DEFINITIONS}
        moduleId="crm"
        moduleLabel="CRM & Sales"
        moduleIcon={BarChart3}
        moduleDescription="Customer relationship management and sales pipeline"
      >
        <div style={{ position: "relative" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "var(--space-8)",
              }}
            >
              <Spinner />
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-4)",
                }}
              >
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  {PAGES.map((p) => (
                    <Link
                      key={p.id}
                      href={
                        p.id === "executive-overview"
                          ? "/crm"
                          : `/crm?page=${p.id}`
                      }
                      className="ui-btn"
                      style={{
                        background:
                          activePage === p.id
                            ? "var(--color-primary)"
                            : "transparent",
                        color: activePage === p.id ? "#fff" : "inherit",
                        border: "1px solid var(--color-border)",
                        padding: "var(--space-1) var(--space-3)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "var(--text-sm)",
                        textDecoration: "none",
                      }}
                    >
                      <p.icon size={14} style={{ marginRight: 4 }} />
                      {p.label}
                    </Link>
                  ))}
                </div>
                <button
                  onClick={fetchDashboard}
                  className="ui-btn"
                  style={{ padding: "var(--space-1) var(--space-3)" }}
                >
                  <RefreshCw size={14} style={{ marginRight: 4 }} />
                  Refresh
                </button>
              </div>

              {data && <KpiCardGroup data={data} />}

              {/* Page Navigation Arrows */}
              {prevPage && (
                <Link
                  href={
                    prevPage.id === "executive-overview"
                      ? "/crm"
                      : `/crm?page=${prevPage.id}`
                  }
                  style={{
                    position: "absolute",
                    left: -48,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "var(--color-warning)",
                    color: "#000",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    zIndex: 10,
                  }}
                >
                  <ChevronLeft size={20} />
                </Link>
              )}
              {nextPage && (
                <Link
                  href={`/crm?page=${nextPage.id}`}
                  style={{
                    position: "absolute",
                    right: -48,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "var(--color-warning)",
                    color: "#000",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    zIndex: 10,
                  }}
                >
                  <ChevronRight size={20} />
                </Link>
              )}
            </>
          )}
        </div>
      </CrmTabLayout>
    </RouteGuard>
  );
}
