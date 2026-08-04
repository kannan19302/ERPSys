"use client";
import React, { useState, useEffect } from "react";
import {
  Sprout,
  ListTodo,
  BarChart3,
  Activity,
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
  { id: "backlog", label: "Backlog", href: "/projects/agile?tab=backlog" },
  { id: "board", label: "Sprint Board", href: "/projects/agile?tab=board" },
  { id: "burndown", label: "Burndown", href: "/projects/agile?tab=burndown" },
  { id: "velocity", label: "Velocity", href: "/projects/agile?tab=velocity" },
];

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: string;
  velocity?: number;
  capacity?: number;
  sprintItems?: {
    backlogItem: { title: string; storyPoints?: number };
    status: string;
  }[];
  retrospectives?: { id: string }[];
}
interface BacklogItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  storyPoints?: number;
  assigneeId?: string;
  epicId?: string;
  sprintId?: string;
}

export default function AgilePage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "backlog";
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [client]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const prjData = await client.get<
        { id: string }[] | { data?: { id: string }[] }
      >("/projects");
      const projects = Array.isArray(prjData) ? prjData : prjData.data || [];
      if (projects.length > 0 && projects[0]) {
        const pid = projects[0].id;
        const [sprintsData, backlogData] = await Promise.all([
          client.get<Sprint[] | { data?: Sprint[] }>(
            `/projects/${pid}/sprints`,
          ),
          client.get<BacklogItem[] | { data?: BacklogItem[] }>(
            `/projects/${pid}/backlog`,
          ),
        ]);
        setSprints(
          Array.isArray(sprintsData) ? sprintsData : sprintsData.data || [],
        );
        setBacklog(
          Array.isArray(backlogData) ? backlogData : backlogData.data || [],
        );
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

  const activeSprint = sprints.find((s) => s.status === "ACTIVE");
  const totalStoryPoints = sprints.reduce(
    (s, sp) =>
      s +
      (sp.sprintItems || []).reduce(
        (ss, si) => ss + (si.backlogItem.storyPoints || 0),
        0,
      ),
    0,
  );
  const avgVelocity =
    sprints.length > 0 ? Math.round(totalStoryPoints / sprints.length) : 0;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Agile / Scrum"
        description="Manage sprints, backlog, and velocity"
      />
      <div className="ui-flex-between">
        <SubTabBar tabs={SUB_TABS} />
        <div className="ui-hstack-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Add Backlog Item (API ready)")}
          >
            <Plus size={14} /> Add Story
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => alert("Create Sprint (API ready)")}
          >
            <Plus size={14} /> New Sprint
          </Button>
        </div>
      </div>
      {activeTab === "backlog" && (
        <>
          <StatCardRow
            stats={[
              {
                label: "Backlog Items",
                value: backlog.length,
                icon: <ListTodo size={16} />,
                color: "var(--chart-1)",
              },
              {
                label: "Ready",
                value: backlog.filter((b) => b.status === "READY").length,
                icon: <CheckCircle2 size={16} />,
                color: "var(--chart-2)",
              },
              {
                label: "In Progress",
                value: backlog.filter((b) => b.status === "IN_PROGRESS").length,
                icon: <Activity size={16} />,
                color: "var(--chart-3)",
              },
              {
                label: "Avg Velocity",
                value: avgVelocity,
                icon: <BarChart3 size={16} />,
                color: "var(--chart-4)",
              },
            ]}
          />
          <div className="ui-stack-3">
            {backlog.map((item) => (
              <Card key={item.id} className="ui-flex-between">
                <div>
                  <div className="ui-hstack-2">
                    <span
                      className={`ui-badge ui-badge-${item.type === "BUG" ? "danger" : item.type === "EPIC" ? "info" : "muted"}`}
                    >
                      {item.type || "STORY"}
                    </span>
                    <strong>{item.title}</strong>
                  </div>
                  <div className="ui-hstack-3 mt-1">
                    <span className="ui-text-micro">
                      Priority: {item.priority}
                    </span>
                    {item.storyPoints && (
                      <span className="ui-text-micro">
                        {item.storyPoints} pts
                      </span>
                    )}
                    <span className="ui-text-micro">Status: {item.status}</span>
                  </div>
                </div>
              </Card>
            ))}
            {backlog.length === 0 && (
              <p className="ui-text-muted">
                Backlog is empty. Add stories to get started.
              </p>
            )}
          </div>
        </>
      )}
      {activeTab === "board" && (
        <div className="ui-grid-3">
          {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => (
            <div key={status} className="ui-stack-3">
              <h3 className="ui-text-label">
                {status.replace("_", " ")} (
                {
                  backlog.filter(
                    (b) =>
                      b.status === status ||
                      (activeSprint?.sprintItems || []).filter(
                        (si) => si.status === status,
                      ).length,
                  ).length
                }
                )
              </h3>
              {backlog
                .filter((b) => b.status === status)
                .map((item) => (
                  <Card key={item.id} className="p-2">
                    <strong>{item.title}</strong>
                    <p className="ui-text-micro">{item.storyPoints || 0} pts</p>
                  </Card>
                ))}
            </div>
          ))}
        </div>
      )}
      {activeTab === "burndown" && (
        <div className="ui-stack-4">
          {activeSprint ? (
            <Card className="ui-stack-3">
              <h3 className="ui-text-label">
                Active Sprint: {activeSprint.name}
              </h3>
              <p className="ui-text-muted">
                Goal: {activeSprint.goal || "No goal set"}
              </p>
              <div className="ui-hstack-3">
                <span className="ui-text-micro">
                  Start: {new Date(activeSprint.startDate).toLocaleDateString()}
                </span>
                <span className="ui-text-micro">
                  End: {new Date(activeSprint.endDate).toLocaleDateString()}
                </span>
              </div>
              <StatCardRow
                stats={[
                  {
                    label: "Total Items",
                    value: activeSprint.sprintItems?.length || 0,
                    icon: <ListTodo size={16} />,
                    color: "var(--chart-1)",
                  },
                  {
                    label: "Completed",
                    value:
                      activeSprint.sprintItems?.filter(
                        (si) => si.status === "DONE",
                      ).length || 0,
                    icon: <CheckCircle2 size={16} />,
                    color: "var(--chart-2)",
                  },
                  {
                    label: "Remaining",
                    value:
                      activeSprint.sprintItems?.filter(
                        (si) => si.status !== "DONE",
                      ).length || 0,
                    icon: <Clock size={16} />,
                    color: "var(--chart-3)",
                  },
                ]}
              />
            </Card>
          ) : (
            <p className="ui-text-muted">
              No active sprint. Start a sprint to see burndown.
            </p>
          )}
        </div>
      )}
      {activeTab === "velocity" && (
        <div className="ui-grid-auto">
          {sprints.map((s) => (
            <Card key={s.id} className="ui-stack-2">
              <div className="ui-flex-between">
                <h4 className="ui-text-label">{s.name}</h4>
                <span
                  className={`ui-badge ${s.status === "COMPLETED" ? "ui-badge-success" : s.status === "ACTIVE" ? "ui-badge-info" : "ui-badge-muted"}`}
                >
                  {s.status}
                </span>
              </div>
              <p className="ui-text-micro">Velocity: {s.velocity || 0} pts</p>
              <p className="ui-text-micro">Capacity: {s.capacity || 0} hrs</p>
              <p className="ui-text-micro">
                Items: {s.sprintItems?.length || 0}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
