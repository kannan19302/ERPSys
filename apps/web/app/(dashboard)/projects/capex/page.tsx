"use client";
import React, { useState, useEffect } from "react";
import {
  Building2,
  DollarSign,
  ClipboardCheck,
  TrendingUp,
  Plus,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  StatCardRow,
  useToast,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui/layout";
import { useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  { id: "projects", label: "Projects", href: "/projects/capex?tab=projects" },
  { id: "budgets", label: "Budgets", href: "/projects/capex?tab=budgets" },
  { id: "gates", label: "Gate Reviews", href: "/projects/capex?tab=gates" },
  { id: "reports", label: "Reports", href: "/projects/capex?tab=reports" },
];

interface CapexProject {
  id: string;
  name: string;
  code: string;
  status: string;
  category?: string;
  totalBudget: number;
  approvedBudget?: number;
  spentToDate?: number;
  budgetLines?: {
    id: string;
    category: string;
    description: string;
    requested: number;
    approved?: number;
  }[];
  gateReviews?: {
    id: string;
    gateName: string;
    status: string;
    reviewDate?: string;
    score?: number;
  }[];
  capitalizations?: { id: string; assetName: string; capitalAmount: number }[];
  project?: { name: string };
}

export default function CapexPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "projects";
  const [projects, setProjects] = useState<CapexProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [client]);
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await client.get<CapexProject[] | { data?: CapexProject[] }>(
        "/projects/capex",
      );
      setProjects(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      notifyError("Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="ui-alert ui-alert-danger">{error}</div>;

  const totalBudget = projects.reduce((s, p) => s + Number(p.totalBudget), 0);
  const totalSpent = projects.reduce(
    (s, p) => s + Number(p.spentToDate || 0),
    0,
  );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="CAPEX Projects"
        description="Track capital expenditure, budgets, and asset capitalization"
      />
      <div className="ui-flex-between">
        <SubTabBar tabs={SUB_TABS} />
        <Button
          variant="primary"
          size="sm"
          onClick={() => alert("Create CAPEX Project (API ready)")}
        >
          <Plus size={14} /> New CAPEX
        </Button>
      </div>
      {activeTab === "projects" && (
        <>
          <StatCardRow
            stats={[
              {
                label: "Total Projects",
                value: projects.length,
                icon: <Building2 size={16} />,
                color: "var(--chart-1)",
              },
              {
                label: "Pending Approval",
                value: projects.filter((p) => p.status === "PENDING_APPROVAL")
                  .length,
                icon: <Clock size={16} />,
                color: "var(--chart-3)",
              },
              {
                label: "Approved",
                value: projects.filter(
                  (p) => p.status === "APPROVED" || p.status === "IN_PROGRESS",
                ).length,
                icon: <CheckCircle2 size={16} />,
                color: "var(--chart-2)",
              },
              {
                label: "Total Budget",
                value: `$${totalBudget.toLocaleString()}`,
                icon: <DollarSign size={16} />,
                color: "var(--chart-1)",
              },
            ]}
          />
          <div className="ui-grid-auto">
            {projects.map((p) => (
              <Card key={p.id} className="ui-stack-3">
                <div className="ui-flex-between">
                  <h3 className="ui-text-label">
                    {p.name} ({p.code})
                  </h3>
                  <span
                    className={`ui-badge ${p.status === "APPROVED" || p.status === "IN_PROGRESS" ? "ui-badge-success" : p.status === "PENDING_APPROVAL" ? "ui-badge-warning" : "ui-badge-muted"}`}
                  >
                    {p.status}
                  </span>
                </div>
                {p.category && (
                  <span className="ui-badge ui-badge-info">{p.category}</span>
                )}
                <p className="ui-text-micro">
                  Budget: ${Number(p.totalBudget).toLocaleString()} · Spent: $
                  {Number(p.spentToDate || 0).toLocaleString()}
                </p>
                <div className="ui-hstack-3">
                  <span className="ui-text-micro">
                    Gate Reviews: {p.gateReviews?.length || 0}
                  </span>
                  <span className="ui-text-micro">
                    Capitalizations: {p.capitalizations?.length || 0}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      {activeTab === "budgets" && (
        <div className="ui-stack-4">
          {projects.map((p) => (
            <Card key={p.id} className="ui-stack-3">
              <h4 className="ui-text-label">{p.name} - Budget Lines</h4>
              <div className="ui-stack-2">
                {(p.budgetLines || []).map((bl) => (
                  <div key={bl.id} className="ui-flex-between ui-card p-2">
                    <div>
                      <strong>{bl.description}</strong>
                      <span className="ui-text-micro ml-2">
                        ({bl.category})
                      </span>
                    </div>
                    <span className="ui-text-label">
                      ${Number(bl.requested).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      {activeTab === "gates" && (
        <div className="ui-stack-4">
          {projects.flatMap((p) =>
            (p.gateReviews || []).map((g) => (
              <Card key={g.id} className="ui-flex-between">
                <div>
                  <strong>{g.gateName}</strong>
                  <span className="ui-text-micro ml-2">({p.name})</span>
                </div>
                <div className="ui-hstack-3">
                  <span
                    className={`ui-badge ${g.status === "PASSED" ? "ui-badge-success" : "ui-badge-danger"}`}
                  >
                    {g.status}
                  </span>
                  {g.score && (
                    <span className="ui-text-micro">Score: {g.score}/100</span>
                  )}
                </div>
              </Card>
            )),
          )}
        </div>
      )}
      {activeTab === "reports" && (
        <div className="ui-stack-4">
          <StatCardRow
            stats={[
              {
                label: "Total Budget",
                value: `$${totalBudget.toLocaleString()}`,
                icon: <DollarSign size={16} />,
                color: "var(--chart-1)",
              },
              {
                label: "Total Spent",
                value: `$${totalSpent.toLocaleString()}`,
                icon: <TrendingUp size={16} />,
                color: "var(--chart-3)",
              },
              {
                label: "Utilization",
                value:
                  totalBudget > 0
                    ? `${Math.round((totalSpent / totalBudget) * 100)}%`
                    : "0%",
                icon: <ClipboardCheck size={16} />,
                color: "var(--chart-2)",
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
