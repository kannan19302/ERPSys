"use client";
import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Layers,
  TrendingUp,
  DollarSign,
  Plus,
  Target,
} from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  StatCardRow,
  useToast,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/projects/programs?tab=overview",
  },
  {
    id: "projects",
    label: "Projects",
    href: "/projects/programs?tab=projects",
  },
  {
    id: "benefits",
    label: "Benefits",
    href: "/projects/programs?tab=benefits",
  },
  {
    id: "financials",
    label: "Financials",
    href: "/projects/programs?tab=financials",
  },
];

interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  budget?: number;
  actualSpend?: number;
  strategicAlignment?: string;
  programProjects?: { project: { id: string; name: string; status: string } }[];
  programBenefits?: {
    id: string;
    name: string;
    status: string;
    metric?: string;
    targetValue?: number;
    actualValue?: number;
  }[];
  programFinancials?: {
    id: string;
    fiscalYear: string;
    category: string;
    amount: number;
    period?: string;
  }[];
}

export default function ProgramsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, [client]);
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const data = await client.get<Program[] | { data?: Program[] }>(
        "/projects/programs",
      );
      setPrograms(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      notifyError("Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="ui-alert ui-alert-danger">{error}</div>;

  const totalBudget = programs.reduce((s, p) => s + Number(p.budget || 0), 0);
  const totalSpend = programs.reduce(
    (s, p) => s + Number(p.actualSpend || 0),
    0,
  );
  const activePrograms = programs.filter((p) => p.status === "ACTIVE").length;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Program Management"
        description="Oversee program governance, benefits, and financials"
      />
      <div className="ui-flex-between">
        <SubTabBar tabs={SUB_TABS} />
        <Button
          variant="primary"
          size="sm"
          onClick={() => alert("Create Program (API ready)")}
        >
          <Plus size={14} /> New Program
        </Button>
      </div>
      {activeTab === "overview" && (
        <>
          <StatCardRow
            stats={[
              {
                label: "Total Programs",
                value: programs.length,
                icon: <Layers size={16} />,
                color: "var(--chart-1)",
              },
              {
                label: "Active Programs",
                value: activePrograms,
                icon: <Target size={16} />,
                color: "var(--chart-2)",
              },
              {
                label: "Total Budget",
                value: `$${totalBudget.toLocaleString()}`,
                icon: <DollarSign size={16} />,
                color: "var(--chart-3)",
              },
              {
                label: "Budget Utilization",
                value:
                  totalBudget > 0
                    ? `${Math.round((totalSpend / totalBudget) * 100)}%`
                    : "0%",
                icon: <TrendingUp size={16} />,
                color: "var(--chart-4)",
              },
            ]}
          />
          <div className="ui-grid-auto">
            {programs.map((p) => (
              <Card key={p.id} className="ui-stack-3">
                <div className="ui-flex-between">
                  <h3 className="ui-text-label">
                    {p.name} ({p.code})
                  </h3>
                  <span
                    className={`ui-badge ui-badge-${p.status === "ACTIVE" ? "success" : p.status === "PLANNED" ? "info" : "muted"}`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="ui-text-small ui-text-muted">
                  {p.description || "No description"}
                </p>
                <div className="ui-hstack-3">
                  <span className="ui-text-micro">
                    Alignment: {p.strategicAlignment || "MEDIUM"}
                  </span>
                  <span className="ui-text-micro">
                    Projects: {p.programProjects?.length || 0}
                  </span>
                  <span className="ui-text-micro">
                    Benefits: {p.programBenefits?.length || 0}
                  </span>
                </div>
              </Card>
            ))}
            {programs.length === 0 && (
              <p className="ui-text-muted">
                No programs found. Create a program to get started.
              </p>
            )}
          </div>
        </>
      )}
      {activeTab === "projects" && (
        <div className="ui-stack-4">
          {programs.flatMap((p) =>
            (p.programProjects || []).map((pp) => (
              <Card
                key={`${p.id}-${pp.project.id}`}
                className="ui-flex-between p-3"
              >
                <div>
                  <strong>{pp.project.name}</strong>
                  <span className="ui-text-muted ml-2">({p.name})</span>
                </div>
                <span className="ui-badge">{pp.project.status}</span>
              </Card>
            )),
          )}
          {programs.every((p) => !p.programProjects?.length) && (
            <p className="ui-text-muted">No projects linked to programs.</p>
          )}
        </div>
      )}
      {activeTab === "benefits" && (
        <div className="ui-grid-auto">
          {programs.flatMap((p) =>
            (p.programBenefits || []).map((b) => (
              <Card key={b.id} className="ui-stack-2">
                <div className="ui-flex-between">
                  <h4 className="ui-text-label">{b.name}</h4>
                  <span
                    className={`ui-badge ui-badge-${b.status === "ACHIEVED" ? "success" : b.status === "AT_RISK" ? "warning" : "info"}`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="ui-hstack-3">
                  <span className="ui-text-micro">
                    Metric: {b.metric || "ROI"}
                  </span>
                </div>
              </Card>
            )),
          )}
          {programs.every((p) => !p.programBenefits?.length) && (
            <p className="ui-text-muted">No benefits tracked yet.</p>
          )}
        </div>
      )}
      {activeTab === "financials" && (
        <div className="ui-stack-4">
          {programs.map((p) => (
            <Card key={p.id} className="ui-stack-3">
              <h4 className="ui-text-label">{p.name} - Financials</h4>
              <div className="ui-grid-3">
                {(p.programFinancials || []).map((f) => (
                  <div key={f.id} className="ui-card p-2">
                    <p className="ui-text-micro">
                      {f.fiscalYear} {f.period ? `- ${f.period}` : ""}
                    </p>
                    <p className="ui-text-label">
                      ${Number(f.amount).toLocaleString()}
                    </p>
                    <span className="ui-text-micro">{f.category}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
