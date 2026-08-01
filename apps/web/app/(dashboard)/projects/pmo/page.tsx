"use client";
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  CheckSquare,
  ShieldCheck,
  Plus,
  Target,
  AlertTriangle,
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
  { id: "overview", label: "Overview", href: "/projects/pmo?tab=overview" },
  {
    id: "scorecards",
    label: "Scorecards",
    href: "/projects/pmo?tab=scorecards",
  },
  { id: "gates", label: "Stage Gates", href: "/projects/pmo?tab=gates" },
  {
    id: "compliance",
    label: "Compliance",
    href: "/projects/pmo?tab=compliance",
  },
];

interface Scorecard {
  id: string;
  projectId: string;
  scorecardDate: string;
  overallScore?: number;
  healthColor: string;
  assessedBy?: string;
  notes?: string;
  dimensions?: {
    id: string;
    dimension: string;
    score?: number;
    status: string;
  }[];
}
interface StageGate {
  id: string;
  gateName: string;
  gateNumber: number;
  status: string;
  decision?: string;
  score?: number;
  reviewDate?: string;
  gateChecklists?: { id: string; item: string; isCompleted: boolean }[];
}
interface PMODashboard {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  healthScore: { green: number; yellow: number; red: number };
  totalBudget: number;
  totalCost: number;
  costPerformance?: number;
  totalRisks: number;
  openRisks: number;
  stageGatesPassed: number;
  stageGatesFailed: number;
  totalScorecards: number;
}

export default function PmoPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [pmo, setPmo] = useState<PMODashboard | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [gates, setGates] = useState<StageGate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [client]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const [pmoData, gatesData] = await Promise.all([
        client.get<PMODashboard>("/projects/pmo-dashboard"),
        client.get<StageGate[] | { data?: StageGate[] }>(
          "/projects/portfolio-heatmap",
        ),
      ]);
      setPmo(pmoData);
      const pid = (await client.get<any[]>("/projects"))?.[0]?.id;
      if (pid) {
        const [scData, sgData] = await Promise.all([
          client.get<Scorecard[] | { data?: Scorecard[] }>(
            `/projects/${pid}/scorecards`,
          ),
          client.get<StageGate[] | { data?: StageGate[] }>(
            `/projects/${pid}/stage-gates`,
          ),
        ]);
        setScorecards(Array.isArray(scData) ? scData : scData.data || []);
        setGates(Array.isArray(sgData) ? sgData : sgData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      notifyError("Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="ui-alert ui-alert-danger">{error}</div>;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="PMO Dashboard"
        description="Governance, health scorecards, stage gates, and compliance"
      />
      <SubTabBar tabs={SUB_TABS} />
      {activeTab === "overview" && pmo && (
        <>
          <StatCardRow
            stats={[
              {
                label: "Total Projects",
                value: pmo.totalProjects,
                icon: <BarChart3 size={16} />,
                color: "var(--chart-1)",
              },
              {
                label: "Active",
                value: pmo.activeProjects,
                icon: <Target size={16} />,
                color: "var(--chart-2)",
              },
              {
                label: "Completed",
                value: pmo.completedProjects,
                icon: <CheckSquare size={16} />,
                color: "var(--chart-3)",
              },
              {
                label: "Open Risks",
                value: pmo.openRisks,
                icon: <AlertTriangle size={16} />,
                color: pmo.openRisks > 0 ? "var(--chart-4)" : "var(--chart-2)",
              },
            ]}
          />
          <div className="ui-grid-3">
            <Card className="ui-stack-2">
              <h4 className="ui-text-label">Health Distribution</h4>
              <div className="ui-hstack-3">
                <span className="ui-badge ui-badge-success">
                  Green: {pmo.healthScore.green}
                </span>
                <span className="ui-badge ui-badge-warning">
                  Yellow: {pmo.healthScore.yellow}
                </span>
                <span className="ui-badge ui-badge-danger">
                  Red: {pmo.healthScore.red}
                </span>
              </div>
            </Card>
            <Card className="ui-stack-2">
              <h4 className="ui-text-label">Financial</h4>
              <p className="ui-text-micro">
                Budget: ${pmo.totalBudget.toLocaleString()}
              </p>
              <p className="ui-text-micro">
                Cost: ${pmo.totalCost.toLocaleString()}
              </p>
              <p className="ui-text-micro">
                Performance: {pmo.costPerformance}%
              </p>
            </Card>
            <Card className="ui-stack-2">
              <h4 className="ui-text-label">Stage Gates</h4>
              <p className="ui-text-micro">Passed: {pmo.stageGatesPassed}</p>
              <p className="ui-text-micro">Failed: {pmo.stageGatesFailed}</p>
              <p className="ui-text-micro">Scorecards: {pmo.totalScorecards}</p>
            </Card>
          </div>
        </>
      )}
      {activeTab === "scorecards" && (
        <div className="ui-stack-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Create Scorecard (API ready)")}
          >
            <Plus size={14} /> New Scorecard
          </Button>
          <div className="ui-grid-auto">
            {scorecards.map((sc) => (
              <Card key={sc.id} className="ui-stack-2">
                <div className="ui-flex-between">
                  <h4 className="ui-text-label">
                    Scorecard {new Date(sc.scorecardDate).toLocaleDateString()}
                  </h4>
                  <span
                    className={`ui-badge ${sc.healthColor === "GREEN" ? "ui-badge-success" : sc.healthColor === "YELLOW" ? "ui-badge-warning" : "ui-badge-danger"}`}
                  >
                    {sc.healthColor}
                  </span>
                </div>
                {sc.overallScore && (
                  <p className="ui-text-lg">
                    Score: {Number(sc.overallScore).toFixed(1)}/100
                  </p>
                )}
                <div className="ui-stack-2">
                  {(sc.dimensions || []).map((d) => (
                    <div key={d.id} className="ui-flex-between">
                      <span className="ui-text-micro">{d.dimension}</span>
                      <span
                        className={`ui-badge ${d.status === "ON_TRACK" ? "ui-badge-success" : d.status === "AT_RISK" ? "ui-badge-warning" : "ui-badge-danger"}`}
                      >
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      {activeTab === "gates" && (
        <div className="ui-stack-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Assess Stage Gate (API ready)")}
          >
            <Plus size={14} /> Assess Gate
          </Button>
          <div className="ui-grid-auto">
            {gates.map((g) => (
              <Card key={g.id} className="ui-stack-2">
                <div className="ui-flex-between">
                  <h4 className="ui-text-label">
                    {g.gateName} #{g.gateNumber}
                  </h4>
                  <span
                    className={`ui-badge ${g.status === "PASSED" ? "ui-badge-success" : g.status === "FAILED" ? "ui-badge-danger" : "ui-badge-warning"}`}
                  >
                    {g.status}
                  </span>
                </div>
                {g.score && (
                  <p className="ui-text-micro">Score: {g.score}/100</p>
                )}
                {g.decision && (
                  <p className="ui-text-micro">Decision: {g.decision}</p>
                )}
                {(g.gateChecklists || []).length > 0 && (
                  <p className="ui-text-micro">
                    {g.gateChecklists?.filter((c) => c.isCompleted).length}/
                    {g.gateChecklists?.length} items complete
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
      {activeTab === "compliance" && (
        <Card className="ui-stack-3">
          <h3 className="ui-text-label">Compliance Tracking</h3>
          <p className="ui-text-muted">
            Track project compliance against organizational standards and gate
            requirements.
          </p>
          <div className="ui-grid-auto">
            <Card>
              <h4 className="ui-text-micro">Stage Gates Passed</h4>
              <p className="ui-text-lg">{pmo?.stageGatesPassed || 0}</p>
            </Card>
            <Card>
              <h4 className="ui-text-micro">Stage Gates Failed</h4>
              <p className="ui-text-lg">{pmo?.stageGatesFailed || 0}</p>
            </Card>
            <Card>
              <h4 className="ui-text-micro">Projects On Track</h4>
              <p className="ui-text-lg">{pmo?.healthScore?.green || 0}</p>
            </Card>
          </div>
        </Card>
      )}
    </div>
  );
}
