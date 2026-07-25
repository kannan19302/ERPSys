"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  ClipboardList,
  RefreshCw,
  Loader2,
  Plus,
  Calendar,
  AlertTriangle,
  Check,
  BarChart3,
  Clock,
  Flag,
  Trash2,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface TaskDependency {
  id: string;
  taskName: string;
  dependsOn: string;
  dependencyType: string;
  status: string;
}

interface SlaConfig {
  id: string;
  name: string;
  taskCategory: string;
  slaHours: number;
  escalationAfter: number;
  active: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  eventDate: string;
  eventType: string;
  assignee: string;
}

interface EscalationRule {
  id: string;
  ruleName: string;
  triggerCondition: string;
  escalateTo: string;
  priority: string;
  active: boolean;
}

interface CloseAnalytics {
  avgCloseDays: number;
  tasksCompleted: number;
  slaBreaches: number;
  escalationsResolved: number;
}

export default function CloseManagementPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "tasks") as string;

  const [tasks, setTasks] = useState<TaskDependency[]>([]);
  const [slas, setSlas] = useState<SlaConfig[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [analytics, setAnalytics] = useState<CloseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSlaForm, setShowSlaForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);

  const [taskForm, setTaskForm] = useState({
    taskName: "",
    dependsOn: "",
    dependencyType: "FINISH_TO_START",
  });
  const [slaForm, setSlaForm] = useState({
    name: "",
    taskCategory: "",
    slaHours: "24",
    escalationAfter: "48",
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    eventDate: "",
    eventType: "REVIEW",
    assignee: "",
  });
  const [ruleForm, setRuleForm] = useState({
    ruleName: "",
    triggerCondition: "SLA_BREACH",
    escalateTo: "",
    priority: "HIGH",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [t, s, e, r, a] = await Promise.all([
        client.get<TaskDependency[]>(
          "/advanced-finance/close-management/task-dependencies",
        ),
        client.get<SlaConfig[]>("/advanced-finance/close-management/slas"),
        client.get<CalendarEvent[]>(
          "/advanced-finance/close-management/calendar-events",
        ),
        client.get<EscalationRule[]>(
          "/advanced-finance/close-management/escalation-rules",
        ),
        client.get<CloseAnalytics>(
          "/advanced-finance/close-management/analytics",
        ),
      ]);
      setTasks(t);
      setSlas(s);
      setEvents(e);
      setRules(r);
      setAnalytics(a);
    } catch {
      setError("Failed to load close management data.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTask = async () => {
    if (!taskForm.taskName) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/close-management/task-dependencies",
        taskForm,
      );
      setSuccess("Task dependency added.");
      setShowTaskForm(false);
      setTaskForm({
        taskName: "",
        dependsOn: "",
        dependencyType: "FINISH_TO_START",
      });
      fetchData();
    } catch {
      setError("Failed to add dependency.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSla = async () => {
    if (!slaForm.name) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/close-management/slas", {
        ...slaForm,
        slaHours: parseInt(slaForm.slaHours),
        escalationAfter: parseInt(slaForm.escalationAfter),
      });
      setSuccess("SLA configured.");
      setShowSlaForm(false);
      setSlaForm({
        name: "",
        taskCategory: "",
        slaHours: "24",
        escalationAfter: "48",
      });
      fetchData();
    } catch {
      setError("Failed to configure SLA.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.eventDate) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/close-management/calendar-events",
        eventForm,
      );
      setSuccess("Calendar event added.");
      setShowEventForm(false);
      setEventForm({
        title: "",
        eventDate: "",
        eventType: "REVIEW",
        assignee: "",
      });
      fetchData();
    } catch {
      setError("Failed to add calendar event.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!ruleForm.ruleName) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/close-management/escalation-rules",
        ruleForm,
      );
      setSuccess("Escalation rule created.");
      setShowRuleForm(false);
      setRuleForm({
        ruleName: "",
        triggerCondition: "SLA_BREACH",
        escalateTo: "",
        priority: "HIGH",
      });
      fetchData();
    } catch {
      setError("Failed to create escalation rule.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <RouteGuard permission="finance.close.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <nav className="ui-breadcrumb">
              <span>Finance</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span>Advanced</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span className="ui-breadcrumb-current">
                Advanced Close Management
              </span>
            </nav>
            <div className="ui-title-section">
              <ClipboardList className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">Advanced Close Management</h1>
            </div>
            <p className="ui-page-subtitle">
              Task dependencies, SLAs, close calendar, escalations, and close
              analytics.
            </p>
          </div>
          <div className="ui-page-actions">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="ui-alert ui-alert-error mb-4">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="ui-alert ui-alert-success mb-4">
            <Check size={16} /> {success}
          </div>
        )}

        {analytics && (
          <div className="ui-grid-3 mb-4">
            <Card className="ui-card p-4">
              <h3 className="text-xs text-gray-500 uppercase font-semibold">
                Avg Close Days
              </h3>
              <p className="text-2xl font-bold mt-1">
                {analytics.avgCloseDays.toFixed(1)}
              </p>
            </Card>
            <Card className="ui-card p-4">
              <h3 className="text-xs text-gray-500 uppercase font-semibold">
                SLA Breaches
              </h3>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {analytics.slaBreaches}
              </p>
            </Card>
            <Card className="ui-card p-4">
              <h3 className="text-xs text-gray-500 uppercase font-semibold">
                Escalations Resolved
              </h3>
              <p className="text-2xl font-bold mt-1">
                {analytics.escalationsResolved}
              </p>
            </Card>
          </div>
        )}

        <div className="mb-4">
          <SubTabBar
            tabs={
              [
                {
                  id: "tasks",
                  label: "Tasks / SLAs",
                  href: "/finance/advanced/close-management?subtab=tasks",
                  icon: ClipboardList,
                },
                {
                  id: "calendar",
                  label: "Close Calendar",
                  href: "/finance/advanced/close-management?subtab=calendar",
                  icon: Calendar,
                },
                {
                  id: "escalations",
                  label: "Escalations",
                  href: "/finance/advanced/close-management?subtab=escalations",
                  icon: Flag,
                },
                {
                  id: "analytics",
                  label: "Close Analytics",
                  href: "/finance/advanced/close-management?subtab=analytics",
                  icon: BarChart3,
                },
              ] as SubTab[]
            }
          />
        </div>

        {activeTab === "tasks" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button onClick={() => setShowTaskForm(!showTaskForm)}>
                  <Plus size={16} className="mr-1" /> Add Dependency
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowSlaForm(!showSlaForm)}
                >
                  <Plus size={16} className="mr-1" /> Configure SLA
                </Button>
              </div>
            </div>

            {showTaskForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Add Task Dependency</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Task Name</label>
                    <input
                      className="ui-input"
                      value={taskForm.taskName}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, taskName: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Depends On</label>
                    <input
                      className="ui-input"
                      value={taskForm.dependsOn}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, dependsOn: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Dependency Type</label>
                    <select
                      className="ui-input"
                      value={taskForm.dependencyType}
                      onChange={(e) =>
                        setTaskForm({
                          ...taskForm,
                          dependencyType: e.target.value,
                        })
                      }
                    >
                      <option value="FINISH_TO_START">Finish → Start</option>
                      <option value="START_TO_START">Start → Start</option>
                      <option value="FINISH_TO_FINISH">Finish → Finish</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateTask} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Add
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowTaskForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {showSlaForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Configure SLA</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">SLA Name</label>
                    <input
                      className="ui-input"
                      value={slaForm.name}
                      onChange={(e) =>
                        setSlaForm({ ...slaForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Task Category</label>
                    <input
                      className="ui-input"
                      value={slaForm.taskCategory}
                      onChange={(e) =>
                        setSlaForm({ ...slaForm, taskCategory: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">SLA Hours</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={slaForm.slaHours}
                      onChange={(e) =>
                        setSlaForm({ ...slaForm, slaHours: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Escalate After (hrs)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={slaForm.escalationAfter}
                      onChange={(e) =>
                        setSlaForm({
                          ...slaForm,
                          escalationAfter: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateSla} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Configure
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowSlaForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <Card className="ui-list-card">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Task Dependencies
              </h3>
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "taskName",
                        header: "Task",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "dependsOn",
                        header: "Depends On",
                        render: (v) => String(v),
                      },
                      {
                        key: "dependencyType",
                        header: "Type",
                        render: (v) => (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                            {String(v).replace(/_/g, " → ")}
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "COMPLETED" ? "ui-badge-green" : "ui-badge-yellow"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={tasks as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No task dependencies"
                  emptyDescription="Add task dependencies to manage close workflows."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "calendar" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowEventForm(!showEventForm)}>
                <Plus size={16} className="mr-1" /> Add Calendar Event
              </Button>
            </div>
            {showEventForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Calendar Event</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Title</label>
                    <input
                      className="ui-input"
                      value={eventForm.title}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Event Date</label>
                    <input
                      className="ui-input"
                      type="date"
                      value={eventForm.eventDate}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          eventDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Type</label>
                    <select
                      className="ui-input"
                      value={eventForm.eventType}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          eventType: e.target.value,
                        })
                      }
                    >
                      <option value="REVIEW">Review</option>
                      <option value="DEADLINE">Deadline</option>
                      <option value="MEETING">Meeting</option>
                      <option value="APPROVAL">Approval</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Assignee</label>
                    <input
                      className="ui-input"
                      value={eventForm.assignee}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, assignee: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateEvent} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Add
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowEventForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "title",
                        header: "Event",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "eventDate",
                        header: "Date",
                        render: (v) => new Date(String(v)).toLocaleDateString(),
                      },
                      {
                        key: "eventType",
                        header: "Type",
                        render: (v) => (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "assignee",
                        header: "Assignee",
                        render: (v) => String(v) || "—",
                      },
                    ] as ListColumn[]
                  }
                  data={events as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No calendar events"
                  emptyDescription="Add close calendar events to stay on track."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "escalations" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowRuleForm(!showRuleForm)}>
                <Plus size={16} className="mr-1" /> Create Escalation Rule
              </Button>
            </div>
            {showRuleForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Escalation Rule</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Rule Name</label>
                    <input
                      className="ui-input"
                      value={ruleForm.ruleName}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, ruleName: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Trigger</label>
                    <select
                      className="ui-input"
                      value={ruleForm.triggerCondition}
                      onChange={(e) =>
                        setRuleForm({
                          ...ruleForm,
                          triggerCondition: e.target.value,
                        })
                      }
                    >
                      <option value="SLA_BREACH">SLA Breach</option>
                      <option value="TASK_OVERDUE">Task Overdue</option>
                      <option value="MANUAL">Manual Trigger</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Escalate To</label>
                    <input
                      className="ui-input"
                      value={ruleForm.escalateTo}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, escalateTo: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Priority</label>
                    <select
                      className="ui-input"
                      value={ruleForm.priority}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, priority: e.target.value })
                      }
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateRule} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowRuleForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "ruleName",
                        header: "Rule",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "triggerCondition",
                        header: "Trigger",
                        render: (v) => String(v).replace(/_/g, " "),
                      },
                      {
                        key: "escalateTo",
                        header: "Escalates To",
                        render: (v) => String(v),
                      },
                      {
                        key: "priority",
                        header: "Priority",
                        render: (v) => (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${v === "CRITICAL" ? "bg-red-100 text-red-700" : v === "HIGH" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "active",
                        header: "Active",
                        render: (v) =>
                          v ? (
                            <span className="text-green-600 font-medium">
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          ),
                      },
                    ] as ListColumn[]
                  }
                  data={rules as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No escalation rules"
                  emptyDescription="Create escalation rules to automate close issue resolution."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "analytics" && (
          <div className="ui-stack-4">
            <Card className="ui-card p-6">
              <h3 className="font-semibold text-lg mb-4">
                Close Process Analytics
              </h3>
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading
                  analytics...
                </div>
              ) : analytics ? (
                <div className="ui-grid-3">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-700">
                      {analytics.avgCloseDays.toFixed(1)}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">Avg Close Days</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-700">
                      {analytics.tasksCompleted}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Tasks Completed
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-700">
                      {analytics.slaBreaches}
                    </p>
                    <p className="text-sm text-red-600 mt-1">SLA Breaches</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No analytics data available.</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
