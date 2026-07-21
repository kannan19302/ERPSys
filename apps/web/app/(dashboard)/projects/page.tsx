"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  Clock,
  Calendar,
  DollarSign,
  Activity,
  ShieldAlert,
  AlertCircle,
  Plus,
  FileText,
} from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  DashboardChart,
  Modal,
  TextField,
  FormField,
  Select,
  StatCardRow,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { useApiClient } from "@unerp/framework";

const PROJECT_TABS: SubTab[] = [
  { id: "dashboard", label: "Dashboard", href: "/projects?tab=dashboard" },
  { id: "tasks", label: "Tasks Checklist", href: "/projects?tab=tasks" },
  { id: "evm", label: "EVM & Billing", href: "/projects?tab=evm" },
  { id: "risks", label: "Risk Register", href: "/projects?tab=risks" },
  { id: "changes", label: "Change Control", href: "/projects?tab=changes" },
  {
    id: "job-costing",
    label: "Job Costing & WIP",
    href: "/projects?tab=job-costing",
  },
];

interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  baselineSchedule: string | null;
  overallHealth?: string | null;
  criticalPath?: string | null;
  tasks?: Task[];
}

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
}

interface EVMMetrics {
  plannedValue: number;
  actualCost: number;
  earnedValue: number;
  scheduleVariance: number;
  costVariance: number;
  cpi: number;
  spi: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  predictiveEndDate: string | null;
}

interface ProjectRisk {
  id: string;
  title: string;
  description: string | null;
  probability: string;
  impact: string;
  mitigationPlan: string | null;
  status: string;
}

interface ChangeRequest {
  id: string;
  title: string;
  description: string | null;
  requestedAmount: number;
  requestedScheduleDays: number;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

export default function ProjectsPage() {
  const client = useApiClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state from URL
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") || "dashboard") as
    | "dashboard"
    | "tasks"
    | "evm"
    | "risks"
    | "changes"
    | "job-costing";
  const [criticalPathIds, setCriticalPathIds] = useState<string[]>([]);
  const [projectHealth, setProjectHealth] = useState<string>("HEALTHY");
  const [evmMetrics, setEvmMetrics] = useState<EVMMetrics | null>(null);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);

  // Job Costing & WIP States
  interface ProjectCostEntry {
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string | null;
  }

  interface WipData {
    laborCost: number;
    materialCost: number;
    overheadCost: number;
    totalCost: number;
    estimatedCost: number;
    contractValue: number;
    percentComplete: number;
    recognizedRevenue: number;
    billedAmount: number;
    overUnderBilling: number;
    billingStatus: string;
  }

  const [costEntries, setCostEntries] = useState<ProjectCostEntry[]>([]);
  const [wipData, setWipData] = useState<WipData | null>(null);
  const [isLogCostModalOpen, setIsLogCostModalOpen] = useState(false);
  const [newCost, setNewCost] = useState({
    type: "LABOR",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  // New Project Form State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    code: "",
    description: "",
    budget: "",
    startDate: "",
    endDate: "",
    estimatedCost: "",
    contractValue: "",
  });

  // New Task Form State
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  // Log Time Form State
  const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [timeLog, setTimeLog] = useState({
    hours: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  // New Risk Form State
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [newRisk, setNewRisk] = useState({
    title: "",
    description: "",
    probability: "MEDIUM",
    impact: "MEDIUM",
    mitigationPlan: "",
  });

  // New Change Request Form State
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [newChange, setNewChange] = useState({
    title: "",
    description: "",
    requestedAmount: "",
    requestedScheduleDays: "",
  });

  useEffect(() => {
    fetchProjects();
  }, [client]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await client.get<Project[] | { data?: Project[] }>(
        "/projects",
      );
      const projectList = Array.isArray(data) ? data : data.data || [];
      setProjects(projectList);
      const initialProject = projectList[0];
      if (initialProject && !selectedProject) {
        void fetchProjectDetails(initialProject.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const data = await client.get<Project>(`/projects/${projectId}`);
      setSelectedProject(data);
      if (data.criticalPath) {
        try {
          setCriticalPathIds(JSON.parse(data.criticalPath));
        } catch {
          setCriticalPathIds([]);
        }
      } else {
        setCriticalPathIds([]);
      }
      setProjectHealth(data.overallHealth || "HEALTHY");

      // Fetch EVM, Risks, Changes
      void fetchEVMData(projectId);
      void fetchRisksData(projectId);
      void fetchChangesData(projectId);
      void fetchWipData(projectId);
      void fetchCostEntries(projectId);
    } catch {
      // Ignored
    }
  };

  const fetchEVMData = async (projectId: string) => {
    try {
      setEvmMetrics(await client.get<EVMMetrics>(`/projects/${projectId}/evm`));
    } catch {}
  };

  const fetchRisksData = async (projectId: string) => {
    try {
      const data = await client.get<ProjectRisk[] | { data?: ProjectRisk[] }>(
        `/projects/${projectId}/risks`,
      );
      setRisks(Array.isArray(data) ? data : data.data || []);
    } catch {}
  };

  const fetchChangesData = async (projectId: string) => {
    try {
      const data = await client.get<
        ChangeRequest[] | { data?: ChangeRequest[] }
      >(`/projects/${projectId}/change-requests`);
      setChangeRequests(Array.isArray(data) ? data : data.data || []);
    } catch {}
  };

  const fetchWipData = async (projectId: string) => {
    try {
      setWipData(await client.get<WipData>(`/projects/${projectId}/wip`));
    } catch {}
  };

  const fetchCostEntries = async (projectId: string) => {
    try {
      setCostEntries(
        await client.get<ProjectCostEntry[]>(`/projects/${projectId}/costs`),
      );
    } catch {}
  };

  const handleCalculateCriticalPath = async () => {
    if (!selectedProject) return;
    try {
      const data = await client.post<{
        criticalPathTaskIds: string[];
        overallHealth?: string;
      }>(`/projects/${selectedProject.id}/critical-path`);
      setCriticalPathIds(data.criticalPathTaskIds || []);
      setProjectHealth(data.overallHealth || "HEALTHY");
      alert(
        `Critical path calculated! Status is ${data.overallHealth}. ${data.criticalPathTaskIds.length} tasks on critical path.`,
      );
      void fetchProjectDetails(selectedProject.id);
    } catch {
      alert("Error calculating critical path");
    }
  };

  const handleSaveBaseline = async () => {
    if (!selectedProject) return;
    try {
      const baseline = JSON.stringify(
        selectedProject.tasks?.map((t) => ({
          taskId: t.id,
          dueDate: t.dueDate,
        })),
      );
      await client.post(`/projects/${selectedProject.id}/baseline`, {
        baselineSchedule: baseline,
      });
      alert("Baseline schedule captured successfully!");
      void fetchProjectDetails(selectedProject.id);
    } catch {
      alert("Error saving baseline schedule");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/projects", {
        ...newProject,
        budget: newProject.budget ? parseFloat(newProject.budget) : undefined,
        estimatedCost: newProject.estimatedCost
          ? parseFloat(newProject.estimatedCost)
          : undefined,
        contractValue: newProject.contractValue
          ? parseFloat(newProject.contractValue)
          : undefined,
      });

      setIsNewProjectModalOpen(false);
      setNewProject({
        name: "",
        code: "",
        description: "",
        budget: "",
        startDate: "",
        endDate: "",
        estimatedCost: "",
        contractValue: "",
      });
      void fetchProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      await client.post(`/projects/${selectedProject.id}/tasks`, newTask);

      setIsNewTaskModalOpen(false);
      setNewTask({
        name: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
      });
      void fetchProjectDetails(selectedProject.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employees = await client.get<
        Array<{ id: string }> | { data?: Array<{ id: string }> }
      >("/hr/employees");
      const employeeList = Array.isArray(employees)
        ? employees
        : employees.data || [];
      const employeeId = employeeList[0]?.id;

      if (!employeeId)
        throw new Error("No employee record found to log time against.");

      await client.post(`/projects/tasks/${selectedTaskId}/timesheets`, {
        employeeId,
        date: timeLog.date,
        hours: parseFloat(timeLog.hours),
        notes: timeLog.notes,
      });

      setIsLogTimeModalOpen(false);
      setTimeLog({
        hours: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
      if (selectedProject) void fetchProjectDetails(selectedProject.id);
      alert("Time logged successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to log time");
    }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await client.post(`/projects/${selectedProject.id}/risks`, newRisk);
      setIsRiskModalOpen(false);
      setNewRisk({
        title: "",
        description: "",
        probability: "MEDIUM",
        impact: "MEDIUM",
        mitigationPlan: "",
      });
      void fetchRisksData(selectedProject.id);
      alert("Risk logged successfully!");
    } catch {
      alert("Failed to log risk");
    }
  };

  const handleCreateChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await client.post(`/projects/${selectedProject.id}/change-requests`, {
        title: newChange.title,
        description: newChange.description,
        requestedAmount: parseFloat(newChange.requestedAmount),
        requestedScheduleDays: parseInt(newChange.requestedScheduleDays),
      });
      setIsChangeModalOpen(false);
      setNewChange({
        title: "",
        description: "",
        requestedAmount: "",
        requestedScheduleDays: "",
      });
      void fetchChangesData(selectedProject.id);
      alert("Change request submitted!");
    } catch {
      alert("Failed to submit change request");
    }
  };

  const handleApproveChangeRequest = async (changeRequestId: string) => {
    if (!selectedProject) return;
    try {
      await client.request(
        `/projects/change-requests/${changeRequestId}/approve`,
        { method: "PUT" },
      );
      void fetchProjectDetails(selectedProject.id);
      alert("Change request approved! Project budget and schedule adjusted.");
    } catch {
      alert("Error approving change request");
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedProject) return;
    try {
      const inv = await client.post<{
        invoiceNumber: string;
        totalAmount: number;
      }>(`/projects/${selectedProject.id}/invoice`);
      alert(
        `Invoice generated successfully! Invoice Number: ${inv.invoiceNumber}, Total Amount: $${Number(inv.totalAmount).toLocaleString()}`,
      );
      void fetchEVMData(selectedProject.id);
    } catch {
      alert("Error generating invoice");
    }
  };

  const handleLogCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await client.post(`/projects/${selectedProject.id}/costs`, {
        type: newCost.type,
        amount: parseFloat(newCost.amount),
        date: newCost.date,
        description: newCost.description || undefined,
      });
      setIsLogCostModalOpen(false);
      setNewCost({
        type: "LABOR",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      void fetchWipData(selectedProject.id);
      void fetchCostEntries(selectedProject.id);
      alert("Cost entry logged successfully!");
    } catch {
      alert("Error logging cost");
    }
  };

  const handleDeleteCostEntry = async (id: string) => {
    if (
      !selectedProject ||
      !confirm("Are you sure you want to delete this cost entry?")
    )
      return;
    try {
      await client.delete(`/projects/costs/${id}`);
      void fetchWipData(selectedProject.id);
      void fetchCostEntries(selectedProject.id);
      alert("Cost entry deleted!");
    } catch {
      alert("Error deleting cost entry");
    }
  };

  // Parse baseline dates
  let baselineMap: Record<string, string> = {};
  if (selectedProject?.baselineSchedule) {
    try {
      const parsed = JSON.parse(selectedProject.baselineSchedule);
      if (Array.isArray(parsed)) {
        parsed.forEach((item: { taskId?: string; dueDate?: string }) => {
          if (item.taskId && item.dueDate) {
            baselineMap[item.taskId] = item.dueDate;
          }
        });
      }
    } catch {}
  }

  return (
    <div className="ui-stack-6">
      {loading && <div className="ui-text-muted">Loading projects...</div>}
      {error && <div className="ui-text-danger">{error}</div>}

      {/* Page Header */}
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <Briefcase size={28} className="ui-text-primary" />
            Project Management
          </h1>
          <p className={styles.p2}>
            Orchestrate deliverables, track timelines, and log employee hours
          </p>
        </div>
        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className={styles.p3}
        >
          New Project
        </button>
      </div>

      {/* Grid Content */}
      <div className={styles.p4}>
        {/* Project Selector Left Panel */}
        <div className="ui-stack-4">
          <h3 className={styles.p5}>Projects</h3>
          <div className="ui-stack-2">
            {projects.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => fetchProjectDetails(proj.id)}
                  style={{
                    background: isSelected
                      ? "var(--color-primary-light)"
                      : "var(--color-bg-elevated)",
                    border: isSelected
                      ? "1px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                  }}
                  className={styles.s1}
                >
                  <p
                    style={{
                      color: isSelected
                        ? "var(--color-primary)"
                        : "var(--color-text)",
                    }}
                    className={styles.s2}
                  >
                    {proj.name}
                  </p>
                  <div className={styles.p6}>
                    <span>{proj.code}</span>
                    <span
                      style={{
                        background:
                          proj.status === "ACTIVE"
                            ? "var(--color-success-light)"
                            : "var(--color-bg-hover)",
                        color:
                          proj.status === "ACTIVE"
                            ? "var(--color-success)"
                            : "var(--color-text-secondary)",
                      }}
                      className={styles.s3}
                    >
                      {proj.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Project Details Right Panel */}
        {selectedProject ? (
          <div className={styles.p7}>
            {/* Project Header Metrics */}
            <div className={styles.p8}>
              <div className="ui-flex-between ui-items-start">
                <div>
                  <h2 className={styles.p9}>
                    {selectedProject.name} ({selectedProject.code})
                  </h2>
                  <p className={styles.p10}>
                    {selectedProject.description || "No description provided."}
                  </p>
                </div>
                <div className="ui-flex ui-gap-2">
                  <span
                    style={{
                      background:
                        projectHealth === "HEALTHY"
                          ? "var(--color-success-light)"
                          : "var(--color-danger-light)",
                      color:
                        projectHealth === "HEALTHY"
                          ? "var(--color-success)"
                          : "var(--color-danger)",
                    }}
                    className={styles.s4}
                  >
                    Health: {projectHealth}
                  </span>
                  <button onClick={handleSaveBaseline} className={styles.p11}>
                    Save Baseline
                  </button>
                  <button
                    onClick={handleCalculateCriticalPath}
                    className={styles.p12}
                  >
                    Calculate CPM
                  </button>
                </div>
              </div>

              <div className={styles.p13}>
                <div className="ui-hstack-2">
                  <Calendar size={16} className="ui-text-primary" />
                  <div>
                    <p className="ui-text-micro">DATES</p>
                    <p className="ui-text-xs-label">
                      {selectedProject.startDate
                        ? new Date(
                            selectedProject.startDate,
                          ).toLocaleDateString()
                        : "N/A"}{" "}
                      -{" "}
                      {selectedProject.endDate
                        ? new Date(selectedProject.endDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="ui-hstack-2">
                  <DollarSign size={16} className="ui-text-success" />
                  <div>
                    <p className="ui-text-micro">BUDGET</p>
                    <p className="ui-text-xs-label">
                      {selectedProject.budget
                        ? `$${Number(selectedProject.budget).toLocaleString()}`
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="ui-hstack-2">
                  <Activity size={16} className={styles.p14} />
                  <div>
                    <p className="ui-text-micro">STATUS</p>
                    <p className="ui-text-xs-label">{selectedProject.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <SubTabBar tabs={PROJECT_TABS} />

            {/* TAB 0: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className={styles.p16}>
                <StatCardRow
                  stats={[
                    {
                      label: "Task Completion",
                      value: `${selectedProject.tasks ? selectedProject.tasks.filter((t) => t.status === "DONE").length : 0} / ${selectedProject.tasks ? selectedProject.tasks.length : 0}`,
                      icon: <Activity size={16} />,
                      color: "var(--chart-1)",
                    },
                    {
                      label: "EVM CPI (Cost Performance)",
                      value: evmMetrics?.cpi
                        ? Number(evmMetrics.cpi).toFixed(2)
                        : "1.00",
                      icon: <DollarSign size={16} />,
                      color:
                        evmMetrics?.cpi && Number(evmMetrics.cpi) < 1
                          ? "var(--chart-4)"
                          : "var(--chart-2)",
                    },
                    {
                      label: "EVM SPI (Schedule Performance)",
                      value: evmMetrics?.spi
                        ? Number(evmMetrics.spi).toFixed(2)
                        : "1.00",
                      icon: <Clock size={16} />,
                      color:
                        evmMetrics?.spi && Number(evmMetrics.spi) < 1
                          ? "var(--chart-4)"
                          : "var(--chart-2)",
                    },
                    {
                      label: "Open Risks",
                      value: risks.filter((r) => r.status !== "MITIGATED")
                        .length,
                      icon: <ShieldAlert size={16} />,
                      color:
                        risks.length > 0 ? "var(--chart-4)" : "var(--chart-2)",
                    },
                  ]}
                />

                {/* Charts */}
                <div className={styles.p17}>
                  <DashboardChart
                    title="EVM Metrics Overview"
                    subtitle="Earned Value Management budget metrics"
                    data={[
                      {
                        name: "Planned Value",
                        value: evmMetrics?.plannedValue || 0,
                      },
                      {
                        name: "Earned Value",
                        value: evmMetrics?.earnedValue || 0,
                      },
                      {
                        name: "Actual Cost",
                        value: evmMetrics?.actualCost || 0,
                      },
                    ]}
                    config={{
                      xAxisKey: "name",
                      series: [
                        {
                          dataKey: "value",
                          name: "Value",
                          color: "var(--color-primary)",
                        },
                      ],
                    }}
                    defaultChartType="bar"
                    allowedChartTypes={["bar", "donut", "pie"]}
                    height={280}
                  />
                  <DashboardChart
                    title="Project Task Priorities"
                    subtitle="Tasks grouped by urgency levels"
                    data={(() => {
                      const counts: Record<string, number> = {};
                      selectedProject.tasks?.forEach((t) => {
                        counts[t.priority] = (counts[t.priority] || 0) + 1;
                      });
                      return Object.entries(counts).map(([name, value]) => ({
                        name,
                        value,
                      }));
                    })()}
                    config={{
                      xAxisKey: "name",
                      series: [{ dataKey: "value", name: "Tasks" }],
                      valueKey: "value",
                      nameKey: "name",
                    }}
                    defaultChartType="donut"
                    allowedChartTypes={["donut", "pie", "bar"]}
                    height={280}
                  />
                </div>
              </div>
            )}

            {/* TAB 1: TASKS CHECKLIST */}
            {activeTab === "tasks" && (
              <div className="ui-stack-4">
                <div className="ui-flex-between">
                  <h3 className={styles.p18}>Project Tasks</h3>
                  <button
                    onClick={() => setIsNewTaskModalOpen(true)}
                    className={styles.p19}
                  >
                    Add Task
                  </button>
                </div>

                {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                  <div className={styles.p20}>
                    {selectedProject.tasks.map((task) => {
                      const isCritical = criticalPathIds.includes(task.id);
                      const baselineDateStr = baselineMap[task.id];
                      let delayDays = 0;
                      if (baselineDateStr && task.dueDate) {
                        const diff =
                          new Date(task.dueDate).getTime() -
                          new Date(baselineDateStr).getTime();
                        delayDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      }

                      return (
                        <div
                          key={task.id}
                          style={{
                            background: isCritical
                              ? "rgba(239, 68, 68, 0.05)"
                              : "var(--color-bg)",
                            border: isCritical
                              ? "1px solid var(--color-danger)"
                              : "1px solid var(--color-border)",
                          }}
                          className={styles.s6}
                        >
                          <div>
                            <div className="ui-hstack-2">
                              <p className={styles.p21}>{task.name}</p>
                              {isCritical && (
                                <span className={styles.p22}>
                                  CRITICAL PATH
                                </span>
                              )}
                            </div>
                            <p className={styles.p23}>
                              {task.description || "No description."}
                            </p>

                            {/* Baseline comparison */}
                            {baselineDateStr && (
                              <div className={styles.p24}>
                                <span className="ui-text-tertiary">
                                  Baseline:{" "}
                                  {new Date(
                                    baselineDateStr,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="ui-text-tertiary">
                                  Live:{" "}
                                  {task.dueDate
                                    ? new Date(
                                        task.dueDate,
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                                {delayDays > 0 && (
                                  <span className={styles.p25}>
                                    <AlertCircle size={12} /> Delayed by{" "}
                                    {delayDays} days!
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="ui-hstack-3">
                            <span
                              style={{
                                background:
                                  task.priority === "HIGH" ||
                                  task.priority === "URGENT"
                                    ? "var(--color-danger-light)"
                                    : "var(--color-bg-hover)",
                                color:
                                  task.priority === "HIGH" ||
                                  task.priority === "URGENT"
                                    ? "var(--color-danger)"
                                    : "var(--color-text-secondary)",
                              }}
                              className={styles.s7}
                            >
                              {task.priority}
                            </span>
                            <span className="ui-text-xs-muted">
                              Status: <strong>{task.status}</strong>
                            </span>
                            {task.status !== "DONE" && (
                              <button
                                onClick={() => {
                                  setSelectedTaskId(task.id);
                                  setIsLogTimeModalOpen(true);
                                }}
                                className={styles.p26}
                              >
                                <Clock size={12} /> Log Time
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.p27}>No tasks defined.</div>
                )}
              </div>
            )}

            {/* TAB 2: EVM & BILLING */}
            {activeTab === "evm" && (
              <div className={styles.p28}>
                <div className="ui-flex-between">
                  <h3 className={styles.p29}>Earned Value Performance (EVM)</h3>
                  <button
                    onClick={handleGenerateInvoice}
                    className={styles.p30}
                  >
                    <FileText size={14} /> One-Click Auto-Bill Invoice
                  </button>
                </div>

                {evmMetrics ? (
                  <>
                    {/* Gauges */}
                    <div className={styles.p31}>
                      <div className={styles.p32}>
                        <span className={styles.p33}>
                          COST PERFORMANCE (CPI)
                        </span>
                        <span
                          style={{
                            color:
                              evmMetrics.cpi >= 1.0
                                ? "var(--color-success)"
                                : "var(--color-danger)",
                          }}
                          className={styles.s8}
                        >
                          {evmMetrics.cpi.toFixed(2)}
                        </span>
                        <span className={styles.p34}>
                          {evmMetrics.cpi >= 1.0
                            ? "Under Budget"
                            : "Over Budget"}
                        </span>
                      </div>
                      <div className={styles.p35}>
                        <span className={styles.p36}>SCHEDULE INDEX (SPI)</span>
                        <span
                          style={{
                            color:
                              evmMetrics.spi >= 1.0
                                ? "var(--color-success)"
                                : "var(--color-danger)",
                          }}
                          className={styles.s8}
                        >
                          {evmMetrics.spi.toFixed(2)}
                        </span>
                        <span className={styles.p37}>
                          {evmMetrics.spi >= 1.0
                            ? "Ahead of Schedule"
                            : "Behind Schedule"}
                        </span>
                      </div>
                      <div className={styles.p38}>
                        <span className={styles.p39}>COST VARIANCE (CV)</span>
                        <span
                          style={{
                            color:
                              evmMetrics.costVariance >= 0
                                ? "var(--color-success)"
                                : "var(--color-danger)",
                          }}
                          className={styles.s9}
                        >
                          ${Number(evmMetrics.costVariance).toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.p40}>
                        <span className={styles.p41}>
                          SCHEDULE VARIANCE (SV)
                        </span>
                        <span
                          style={{
                            color:
                              evmMetrics.scheduleVariance >= 0
                                ? "var(--color-success)"
                                : "var(--color-danger)",
                          }}
                          className={styles.s9}
                        >
                          $
                          {Number(evmMetrics.scheduleVariance).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Detailed rollups */}
                    <div className={styles.p42}>
                      <div className={styles.p43}>
                        <h4 className={styles.p44}>VALUE AGGREGATIONS</h4>
                        <div className="ui-flex-between text-xs">
                          <span>Planned Value (PV):</span>
                          <strong>
                            ${Number(evmMetrics.plannedValue).toLocaleString()}
                          </strong>
                        </div>
                        <div className="ui-flex-between text-xs">
                          <span>Earned Value (EV):</span>
                          <strong>
                            ${Number(evmMetrics.earnedValue).toLocaleString()}
                          </strong>
                        </div>
                        <div className="ui-flex-between text-xs">
                          <span>Actual Cost (AC):</span>
                          <strong>
                            ${Number(evmMetrics.actualCost).toLocaleString()}
                          </strong>
                        </div>
                      </div>

                      <div className={styles.p45}>
                        <h4 className={styles.p46}>FORECASTS & PREDICTIONS</h4>
                        <div className="ui-flex-between text-xs">
                          <span>Estimate at Completion (EAC):</span>
                          <strong>
                            $
                            {Number(
                              evmMetrics.estimateAtCompletion,
                            ).toLocaleString()}
                          </strong>
                        </div>
                        <div className="ui-flex-between text-xs">
                          <span>Estimate to Complete (ETC):</span>
                          <strong>
                            $
                            {Number(
                              evmMetrics.estimateToComplete,
                            ).toLocaleString()}
                          </strong>
                        </div>
                        <div className="ui-flex-between text-xs">
                          <span>Predictive End Date:</span>
                          <strong>
                            {evmMetrics.predictiveEndDate
                              ? new Date(
                                  evmMetrics.predictiveEndDate,
                                ).toLocaleDateString()
                              : "N/A"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>Calculating EVM values...</p>
                )}
              </div>
            )}

            {/* TAB 3: RISK REGISTER */}
            {activeTab === "risks" && (
              <div className="ui-stack-4">
                <div className="ui-flex-between">
                  <h3 className={styles.p47}>Project Risks & Mitigations</h3>
                  <button
                    onClick={() => setIsRiskModalOpen(true)}
                    className={styles.p48}
                  >
                    Log Risk Item
                  </button>
                </div>

                <div className="ui-stack-3">
                  {risks.length > 0 ? (
                    risks.map((risk) => (
                      <div key={risk.id} className={styles.p49}>
                        <div>
                          <h4 className={styles.p50}>
                            <ShieldAlert size={16} className="ui-text-danger" />
                            {risk.title}
                          </h4>
                          <p className={styles.p51}>
                            {risk.description || "No description provided."}
                          </p>
                          <p className={styles.p52}>
                            Mitigation Plan:{" "}
                            {risk.mitigationPlan || "None specified."}
                          </p>
                        </div>
                        <div className={styles.p53}>
                          <span
                            style={{
                              background:
                                risk.probability === "HIGH"
                                  ? "var(--color-danger-light)"
                                  : "var(--color-bg-hover)",
                              color:
                                risk.probability === "HIGH"
                                  ? "var(--color-danger)"
                                  : "var(--color-text-secondary)",
                            }}
                            className={styles.s10}
                          >
                            Prob: {risk.probability}
                          </span>
                          <span
                            style={{
                              background:
                                risk.impact === "HIGH"
                                  ? "var(--color-danger-light)"
                                  : "var(--color-bg-hover)",
                              color:
                                risk.impact === "HIGH"
                                  ? "var(--color-danger)"
                                  : "var(--color-text-secondary)",
                            }}
                            className={styles.s10}
                          >
                            Impact: {risk.impact}
                          </span>
                          <span
                            style={{
                              background:
                                risk.status === "OPEN"
                                  ? "var(--color-warning-light)"
                                  : "var(--color-success-light)",
                              color:
                                risk.status === "OPEN"
                                  ? "var(--color-warning)"
                                  : "var(--color-success)",
                            }}
                            className={styles.s11}
                          >
                            {risk.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.p54}>No risk items logged.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: CHANGE CONTROL */}
            {activeTab === "changes" && (
              <div className="ui-stack-4">
                <div className="ui-flex-between">
                  <h3 className={styles.p55}>Change Request Tracking Logs</h3>
                  <button
                    onClick={() => setIsChangeModalOpen(true)}
                    className={styles.p56}
                  >
                    Submit Change Request
                  </button>
                </div>

                <div className="ui-stack-3">
                  {changeRequests.length > 0 ? (
                    changeRequests.map((cr) => (
                      <div key={cr.id} className={styles.p57}>
                        <div>
                          <h4 className={styles.p58}>{cr.title}</h4>
                          <p className={styles.p59}>{cr.description}</p>
                          <div className={styles.p60}>
                            <span>
                              Budget Adjustment:{" "}
                              <strong>
                                +${Number(cr.requestedAmount).toLocaleString()}
                              </strong>
                            </span>
                            <span>
                              Timeline Adjustment:{" "}
                              <strong>+{cr.requestedScheduleDays} days</strong>
                            </span>
                          </div>
                        </div>
                        <div className={styles.p61}>
                          <span
                            style={{
                              background:
                                cr.status === "APPROVED"
                                  ? "var(--color-success-light)"
                                  : "var(--color-warning-light)",
                              color:
                                cr.status === "APPROVED"
                                  ? "var(--color-success)"
                                  : "var(--color-warning)",
                            }}
                            className={styles.s10}
                          >
                            {cr.status}
                          </span>
                          {cr.status === "PENDING" && (
                            <button
                              onClick={() => handleApproveChangeRequest(cr.id)}
                              className={styles.p62}
                            >
                              Approve Changes
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.p63}>No change requests filed.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: JOB COSTING & WIP */}
            {activeTab === "job-costing" && (
              <div className={styles.p64}>
                <div className="ui-flex-between">
                  <h3 className={styles.p65}>
                    Job Costing & Work-in-Progress (POC)
                  </h3>
                  <div className="ui-flex ui-gap-2">
                    <button
                      onClick={() => setIsLogCostModalOpen(true)}
                      className={styles.p66}
                    >
                      Log Project Cost
                    </button>
                  </div>
                </div>

                {wipData && (
                  <div className="ui-grid-auto">
                    <div className={styles.p67}>
                      <p className={styles.p68}>ESTIMATED COST</p>
                      <p className={styles.p69}>
                        $
                        {wipData.estimatedCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className={styles.p70}>
                      <p className={styles.p71}>TOTAL COST INCURRED</p>
                      <p className={styles.p72}>
                        $
                        {wipData.totalCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <div className={styles.p73}>
                        <span>L: ${wipData.laborCost.toLocaleString()}</span>
                        <span>M: ${wipData.materialCost.toLocaleString()}</span>
                        <span>O: ${wipData.overheadCost.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className={styles.p74}>
                      <p className={styles.p75}>CONTRACT VALUE</p>
                      <p className={styles.p76}>
                        $
                        {wipData.contractValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className={styles.p77}>
                      <p className={styles.p78}>REVENUE RECOGNIZED</p>
                      <p className={styles.p79}>
                        $
                        {wipData.recognizedRevenue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <span className="ui-text-micro ui-text-muted">
                        POC: {wipData.percentComplete}%
                      </span>
                    </div>
                    <div className={styles.p80}>
                      <p className={styles.p81}>TOTAL BILLED</p>
                      <p className={styles.p82}>
                        $
                        {wipData.billedAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div
                      style={{
                        background:
                          wipData.overUnderBilling >= 0
                            ? "var(--color-success-light)"
                            : "var(--color-danger-light)",
                      }}
                      className={styles.s12}
                    >
                      <p
                        style={{
                          color:
                            wipData.overUnderBilling >= 0
                              ? "var(--color-success)"
                              : "var(--color-danger)",
                        }}
                        className={styles.s13}
                      >
                        {wipData.overUnderBilling >= 0
                          ? "UNDERBILLED (WIP ASSET)"
                          : "OVERBILLED (DEFERRED LIAB)"}
                      </p>
                      <p
                        style={{
                          color:
                            wipData.overUnderBilling >= 0
                              ? "var(--color-success)"
                              : "var(--color-danger)",
                        }}
                        className={styles.s14}
                      >
                        $
                        {Math.abs(wipData.overUnderBilling).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className={styles.p83}>
                  <h4 className={styles.p84}>Project Cost Ledger</h4>
                  {costEntries.length > 0 ? (
                    <div className="builder-table-wrapper">
                      <table className={styles.p85}>
                        <thead>
                          <tr className={styles.p86}>
                            <th className={styles.p87}>Date</th>
                            <th className={styles.p88}>Cost Type</th>
                            <th className={styles.p89}>Description</th>
                            <th className={styles.p90}>Amount</th>
                            <th className={styles.p91}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {costEntries.map((ce) => (
                            <tr key={ce.id} className="border-b">
                              <td className={styles.p92}>
                                {new Date(ce.date).toLocaleDateString()}
                              </td>
                              <td className={styles.p93}>
                                <span
                                  style={{
                                    background:
                                      ce.type === "LABOR"
                                        ? "var(--color-info-light)"
                                        : ce.type === "MATERIAL"
                                          ? "var(--color-warning-light)"
                                          : "var(--color-primary-light)",
                                    color:
                                      ce.type === "LABOR"
                                        ? "var(--color-info)"
                                        : ce.type === "MATERIAL"
                                          ? "var(--color-warning)"
                                          : "var(--color-primary)",
                                  }}
                                  className={styles.s10}
                                >
                                  {ce.type}
                                </span>
                              </td>
                              <td className={styles.p94}>
                                {ce.description || "—"}
                              </td>
                              <td className={styles.p95}>
                                $
                                {Number(ce.amount).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className={styles.p96}>
                                <button
                                  onClick={() => handleDeleteCostEntry(ce.id)}
                                  className={styles.p97}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className={styles.p98}>
                      No cost entries logged for this project yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.p99}>
            <p className="ui-text-muted">
              Select or create a project to get started.
            </p>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className={styles.p100}>
          <form onSubmit={handleCreateProject} className={styles.p101}>
            <h3 className="ui-heading-lg">Create New Project</h3>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Project Name</label>
                <input
                  required
                  type="text"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  className={styles.p102}
                />
              </div>
              <div>
                <label className="ui-text-xs-label">Project Code</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. PRJ-001"
                  value={newProject.code}
                  onChange={(e) =>
                    setNewProject({ ...newProject, code: e.target.value })
                  }
                  className={styles.p103}
                />
              </div>
            </div>

            <div>
              <label className="ui-text-xs-label">Description</label>
              <textarea
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                className={styles.p104}
              />
            </div>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Start Date</label>
                <input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) =>
                    setNewProject({ ...newProject, startDate: e.target.value })
                  }
                  className={styles.p105}
                />
              </div>
              <div>
                <label className="ui-text-xs-label">End Date</label>
                <input
                  type="date"
                  value={newProject.endDate}
                  onChange={(e) =>
                    setNewProject({ ...newProject, endDate: e.target.value })
                  }
                  className={styles.p106}
                />
              </div>
            </div>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Budget</label>
                <input
                  type="number"
                  placeholder="Budget allocation"
                  value={newProject.budget}
                  onChange={(e) =>
                    setNewProject({ ...newProject, budget: e.target.value })
                  }
                  className={styles.p107}
                />
              </div>
              <div>
                <label className="ui-text-xs-label">Estimated Cost</label>
                <input
                  type="number"
                  placeholder="Internal est. cost"
                  value={newProject.estimatedCost}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      estimatedCost: e.target.value,
                    })
                  }
                  className={styles.p108}
                />
              </div>
            </div>

            <div>
              <label className="ui-text-xs-label">Contract Value</label>
              <input
                type="number"
                placeholder="Total contract value"
                value={newProject.contractValue}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    contractValue: e.target.value,
                  })
                }
                className={styles.p109}
              />
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className={styles.p110}
              >
                Cancel
              </button>
              <button type="submit" className={styles.p111}>
                Save Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Log Project Cost Modal */}
      {isLogCostModalOpen && (
        <div className={styles.p112}>
          <form onSubmit={handleLogCost} className={styles.p113}>
            <h3 className={styles.p114}>Log Project Cost</h3>

            <div>
              <label className={styles.p115}>Cost Type</label>
              <select
                value={newCost.type}
                onChange={(e) =>
                  setNewCost({ ...newCost, type: e.target.value })
                }
                className={styles.p116}
              >
                <option value="LABOR">Labor Cost</option>
                <option value="MATERIAL">Material Cost</option>
                <option value="OVERHEAD">Overhead Cost</option>
              </select>
            </div>

            <div>
              <label className={styles.p117}>Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newCost.amount}
                onChange={(e) =>
                  setNewCost({ ...newCost, amount: e.target.value })
                }
                placeholder="e.g. 250.00"
                className={styles.p118}
              />
            </div>

            <div>
              <label className={styles.p119}>Date</label>
              <input
                type="date"
                required
                value={newCost.date}
                onChange={(e) =>
                  setNewCost({ ...newCost, date: e.target.value })
                }
                className={styles.p120}
              />
            </div>

            <div>
              <label className={styles.p121}>Description</label>
              <input
                type="text"
                value={newCost.description}
                onChange={(e) =>
                  setNewCost({ ...newCost, description: e.target.value })
                }
                placeholder="e.g. Subcontractor invoice #12"
                className={styles.p122}
              />
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsLogCostModalOpen(false)}
                className={styles.p123}
              >
                Cancel
              </button>
              <button type="submit" className={styles.p124}>
                Submit Cost
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className={styles.p125}>
          <form onSubmit={handleCreateTask} className={styles.p126}>
            <h3 className="ui-heading-lg">Add Task</h3>

            <div>
              <label className="ui-text-xs-label">Task Name</label>
              <input
                required
                type="text"
                value={newTask.name}
                onChange={(e) =>
                  setNewTask({ ...newTask, name: e.target.value })
                }
                className={styles.p127}
              />
            </div>

            <div>
              <label className="ui-text-xs-label">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className={styles.p128}
              />
            </div>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                  className={styles.p129}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="ui-text-xs-label">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  className={styles.p130}
                />
              </div>
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className={styles.p131}
              >
                Cancel
              </button>
              <button type="submit" className={styles.p132}>
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Log Time Modal */}
      {isLogTimeModalOpen && (
        <div className={styles.p133}>
          <form onSubmit={handleLogTime} className={styles.p134}>
            <h3 className="ui-heading-lg">Log Time / Timesheet</h3>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Hours worked</label>
                <input
                  required
                  type="number"
                  step="0.5"
                  placeholder="e.g. 8"
                  value={timeLog.hours}
                  onChange={(e) =>
                    setTimeLog({ ...timeLog, hours: e.target.value })
                  }
                  className={styles.p135}
                />
              </div>
              <div>
                <label className="ui-text-xs-label">Date</label>
                <input
                  required
                  type="date"
                  value={timeLog.date}
                  onChange={(e) =>
                    setTimeLog({ ...timeLog, date: e.target.value })
                  }
                  className={styles.p136}
                />
              </div>
            </div>

            <div>
              <label className="ui-text-xs-label">Work Notes</label>
              <textarea
                placeholder="Specify what you completed..."
                value={timeLog.notes}
                onChange={(e) =>
                  setTimeLog({ ...timeLog, notes: e.target.value })
                }
                className={styles.p137}
              />
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsLogTimeModalOpen(false)}
                className={styles.p138}
              >
                Cancel
              </button>
              <button type="submit" className={styles.p139}>
                Log Time
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Log Risk Modal */}
      {isRiskModalOpen && (
        <div className={styles.p140}>
          <form onSubmit={handleCreateRisk} className={styles.p141}>
            <h3 className={styles.p142}>
              <ShieldAlert size={18} className="ui-text-danger" />
              Log Project Risk
            </h3>

            <div>
              <label className="ui-text-xs-label">Risk Title</label>
              <input
                required
                type="text"
                value={newRisk.title}
                onChange={(e) =>
                  setNewRisk({ ...newRisk, title: e.target.value })
                }
                className={styles.p143}
              />
            </div>

            <div>
              <label className="ui-text-xs-label">Risk Description</label>
              <textarea
                value={newRisk.description}
                onChange={(e) =>
                  setNewRisk({ ...newRisk, description: e.target.value })
                }
                className={styles.p144}
              />
            </div>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Probability</label>
                <select
                  value={newRisk.probability}
                  onChange={(e) =>
                    setNewRisk({ ...newRisk, probability: e.target.value })
                  }
                  className={styles.p145}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="ui-text-xs-label">Impact</label>
                <select
                  value={newRisk.impact}
                  onChange={(e) =>
                    setNewRisk({ ...newRisk, impact: e.target.value })
                  }
                  className={styles.p146}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="ui-text-xs-label">Mitigation Plan</label>
              <textarea
                value={newRisk.mitigationPlan}
                onChange={(e) =>
                  setNewRisk({ ...newRisk, mitigationPlan: e.target.value })
                }
                className={styles.p147}
              />
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsRiskModalOpen(false)}
                className={styles.p148}
              >
                Cancel
              </button>
              <button type="submit" className={styles.p149}>
                Log Risk
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Request Modal */}
      {isChangeModalOpen && (
        <div className={styles.p150}>
          <form onSubmit={handleCreateChangeRequest} className={styles.p151}>
            <h3 className={styles.p152}>
              <Plus size={18} className="ui-text-primary" />
              Submit Change Request
            </h3>

            <div>
              <label className="ui-text-xs-label">Change Scope Title</label>
              <input
                required
                type="text"
                value={newChange.title}
                onChange={(e) =>
                  setNewChange({ ...newChange, title: e.target.value })
                }
                className={styles.p153}
              />
            </div>

            <div>
              <label className="ui-text-xs-label">
                Justification / Details
              </label>
              <textarea
                value={newChange.description}
                onChange={(e) =>
                  setNewChange({ ...newChange, description: e.target.value })
                }
                className={styles.p154}
              />
            </div>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Requested Budget ($)</label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 5000"
                  value={newChange.requestedAmount}
                  onChange={(e) =>
                    setNewChange({
                      ...newChange,
                      requestedAmount: e.target.value,
                    })
                  }
                  className={styles.p155}
                />
              </div>
              <div>
                <label className="ui-text-xs-label">
                  Schedule Impact (Days)
                </label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 10"
                  value={newChange.requestedScheduleDays}
                  onChange={(e) =>
                    setNewChange({
                      ...newChange,
                      requestedScheduleDays: e.target.value,
                    })
                  }
                  className={styles.p156}
                />
              </div>
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsChangeModalOpen(false)}
                className={styles.p157}
              >
                Cancel
              </button>
              <button type="submit" className={styles.p158}>
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
