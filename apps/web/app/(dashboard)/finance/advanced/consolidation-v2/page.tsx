"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  GitMerge,
  RefreshCw,
  Loader2,
  Plus,
  Play,
  Check,
  AlertTriangle,
  PieChart,
  Users,
  X,
  Trash2,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui/layout";

interface ConsolidationGroup {
  id: string;
  groupName: string;
  parentEntity: string;
  members: number;
  currency: string;
  status: string;
}

interface ConsolidationRun {
  id: string;
  groupId: string;
  groupName: string;
  period: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  entriesPosted: number;
}

interface EliminationRule {
  id: string;
  ruleName: string;
  fromEntity: string;
  toEntity: string;
  accountType: string;
  active: boolean;
}

interface MinorityInterest {
  id: string;
  entityName: string;
  minorityShare: number;
  netIncome: number;
  minorityInterestAmount: number;
  period: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function ConsolidationV2Page() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "groups") as string;

  const [groups, setGroups] = useState<ConsolidationGroup[]>([]);
  const [runs, setRuns] = useState<ConsolidationRun[]>([]);
  const [eliminationRules, setEliminationRules] = useState<EliminationRule[]>(
    [],
  );
  const [minorityInterests, setMinorityInterests] = useState<
    MinorityInterest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showRunForm, setShowRunForm] = useState(false);
  const [showElimForm, setShowElimForm] = useState(false);
  const [showMiForm, setShowMiForm] = useState(false);

  const [groupForm, setGroupForm] = useState({
    groupName: "",
    parentEntity: "",
    currency: "USD",
  });
  const [runForm, setRunForm] = useState({ groupId: "", period: "" });
  const [elimForm, setElimForm] = useState({
    ruleName: "",
    fromEntity: "",
    toEntity: "",
    accountType: "INTERCOMPANY",
  });
  const [miForm, setMiForm] = useState({
    entityName: "",
    minorityShare: "",
    netIncome: "",
    period: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [g, r, e, m] = await Promise.all([
        client.get<ConsolidationGroup[]>(
          "/advanced-finance/consolidation-v2/groups",
        ),
        client.get<ConsolidationRun[]>(
          "/advanced-finance/consolidation-v2/runs",
        ),
        client.get<EliminationRule[]>(
          "/advanced-finance/consolidation-v2/elimination-rules",
        ),
        client.get<MinorityInterest[]>(
          "/advanced-finance/consolidation-v2/minority-interest",
        ),
      ]);
      setGroups(g);
      setRuns(r);
      setEliminationRules(e);
      setMinorityInterests(m);
    } catch {
      setError("Failed to load consolidation data.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateGroup = async () => {
    if (!groupForm.groupName) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/consolidation-v2/groups", groupForm);
      setSuccess("Consolidation group created.");
      setShowGroupForm(false);
      setGroupForm({ groupName: "", parentEntity: "", currency: "USD" });
      fetchData();
    } catch {
      setError("Failed to create group.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMembers = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/consolidation-v2/groups/${id}/members`,
        { action: "add" },
      );
      setSuccess("Members added to group.");
      fetchData();
    } catch {
      setError("Failed to add members.");
    }
  };

  const handleExecuteRun = async () => {
    if (!runForm.groupId || !runForm.period) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/consolidation-v2/runs", runForm);
      setSuccess("Consolidation run executed.");
      setShowRunForm(false);
      setRunForm({ groupId: "", period: "" });
      fetchData();
    } catch {
      setError("Failed to execute run.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateElimination = async () => {
    if (!elimForm.ruleName) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/consolidation-v2/elimination-rules",
        elimForm,
      );
      setSuccess("Elimination rule created.");
      setShowElimForm(false);
      setElimForm({
        ruleName: "",
        fromEntity: "",
        toEntity: "",
        accountType: "INTERCOMPANY",
      });
      fetchData();
    } catch {
      setError("Failed to create elimination rule.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComputeMinorityInterest = async () => {
    if (!miForm.entityName) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/consolidation-v2/minority-interest",
        {
          entityName: miForm.entityName,
          minorityShare: parseFloat(miForm.minorityShare),
          netIncome: parseFloat(miForm.netIncome),
          period: miForm.period,
        },
      );
      setSuccess("Minority interest computed.");
      setShowMiForm(false);
      setMiForm({
        entityName: "",
        minorityShare: "",
        netIncome: "",
        period: "",
      });
      fetchData();
    } catch {
      setError("Failed to compute minority interest.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <RouteGuard permission="finance.consolidation.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <nav className="ui-breadcrumb">
              <span>Finance</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span>Advanced</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span className="ui-breadcrumb-current">
                Multi-GAAP Consolidation
              </span>
            </nav>
            <div className="ui-title-section">
              <GitMerge className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">Multi-GAAP Consolidation</h1>
            </div>
            <p className="ui-page-subtitle">
              Manage consolidation groups, execute runs, configure elimination
              rules, and compute minority interest.
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

        <div className="mb-4">
          <SubTabBar
            tabs={
              [
                {
                  id: "groups",
                  label: "Groups",
                  href: "/finance/advanced/consolidation-v2?subtab=groups",
                  icon: PieChart,
                },
                {
                  id: "runs",
                  label: "Runs",
                  href: "/finance/advanced/consolidation-v2?subtab=runs",
                  icon: Play,
                },
                {
                  id: "eliminations",
                  label: "Eliminations",
                  href: "/finance/advanced/consolidation-v2?subtab=eliminations",
                  icon: X,
                },
                {
                  id: "minority",
                  label: "Minority Interest",
                  href: "/finance/advanced/consolidation-v2?subtab=minority",
                  icon: Users,
                },
              ] as SubTab[]
            }
          />
        </div>

        {activeTab === "groups" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowGroupForm(!showGroupForm)}>
                <Plus size={16} className="mr-1" /> Create Group
              </Button>
            </div>
            {showGroupForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Create Consolidation Group</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Group Name</label>
                    <input
                      className="ui-input"
                      value={groupForm.groupName}
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          groupName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Parent Entity</label>
                    <input
                      className="ui-input"
                      value={groupForm.parentEntity}
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          parentEntity: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Currency</label>
                    <select
                      className="ui-input"
                      value={groupForm.currency}
                      onChange={(e) =>
                        setGroupForm({ ...groupForm, currency: e.target.value })
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateGroup} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowGroupForm(false)}
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
                        key: "groupName",
                        header: "Group",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "parentEntity",
                        header: "Parent",
                        render: (v) => String(v),
                      },
                      {
                        key: "members",
                        header: "Members",
                        render: (v) => String(v),
                      },
                      {
                        key: "currency",
                        header: "Currency",
                        render: (v) => String(v),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "ACTIVE" ? "ui-badge-green" : "ui-badge-gray"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v) => (
                          <button
                            onClick={() => handleAddMembers(String(v))}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Add Members
                          </button>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={groups as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No groups"
                  emptyDescription="Create a consolidation group to start."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "runs" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowRunForm(!showRunForm)}>
                <Plus size={16} className="mr-1" /> New Run
              </Button>
            </div>
            {showRunForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Execute Consolidation Run</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Group</label>
                    <select
                      className="ui-input"
                      value={runForm.groupId}
                      onChange={(e) =>
                        setRunForm({ ...runForm, groupId: e.target.value })
                      }
                    >
                      <option value="">Select group...</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.groupName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Period</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. 2026-Q2"
                      value={runForm.period}
                      onChange={(e) =>
                        setRunForm({ ...runForm, period: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleExecuteRun} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}
                    <Play size={14} className="mr-1" /> Execute Run
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowRunForm(false)}
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
                        key: "groupName",
                        header: "Group",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "period",
                        header: "Period",
                        render: (v) => String(v),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "COMPLETED" ? "ui-badge-green" : v === "RUNNING" ? "ui-badge-blue" : "ui-badge-yellow"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "startedAt",
                        header: "Started",
                        render: (v) => new Date(String(v)).toLocaleString(),
                      },
                      {
                        key: "entriesPosted",
                        header: "Entries",
                        render: (v) => String(v),
                      },
                    ] as ListColumn[]
                  }
                  data={runs as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No runs"
                  emptyDescription="Execute a consolidation run to see results."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "eliminations" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowElimForm(!showElimForm)}>
                <Plus size={16} className="mr-1" /> Create Elimination Rule
              </Button>
            </div>
            {showElimForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Elimination Rule</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Rule Name</label>
                    <input
                      className="ui-input"
                      value={elimForm.ruleName}
                      onChange={(e) =>
                        setElimForm({ ...elimForm, ruleName: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">From Entity</label>
                    <input
                      className="ui-input"
                      value={elimForm.fromEntity}
                      onChange={(e) =>
                        setElimForm({ ...elimForm, fromEntity: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">To Entity</label>
                    <input
                      className="ui-input"
                      value={elimForm.toEntity}
                      onChange={(e) =>
                        setElimForm({ ...elimForm, toEntity: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Account Type</label>
                    <select
                      className="ui-input"
                      value={elimForm.accountType}
                      onChange={(e) =>
                        setElimForm({
                          ...elimForm,
                          accountType: e.target.value,
                        })
                      }
                    >
                      <option value="INTERCOMPANY">Intercompany</option>
                      <option value="RECEIVABLE">Receivable</option>
                      <option value="PAYABLE">Payable</option>
                      <option value="REVENUE">Revenue</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateElimination}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowElimForm(false)}
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
                        key: "fromEntity",
                        header: "From",
                        render: (v) => String(v),
                      },
                      {
                        key: "toEntity",
                        header: "To",
                        render: (v) => String(v),
                      },
                      {
                        key: "accountType",
                        header: "Account Type",
                        render: (v) => String(v),
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
                  data={
                    eliminationRules as unknown as Record<string, unknown>[]
                  }
                  loading={false}
                  emptyTitle="No elimination rules"
                  emptyDescription="Create elimination rules for intercompany transactions."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "minority" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowMiForm(!showMiForm)}>
                <Plus size={16} className="mr-1" /> Compute Minority Interest
              </Button>
            </div>
            {showMiForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Compute Minority Interest</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Entity Name</label>
                    <input
                      className="ui-input"
                      value={miForm.entityName}
                      onChange={(e) =>
                        setMiForm({ ...miForm, entityName: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Minority Share (%)</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={miForm.minorityShare}
                      onChange={(e) =>
                        setMiForm({ ...miForm, minorityShare: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Net Income ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={miForm.netIncome}
                      onChange={(e) =>
                        setMiForm({ ...miForm, netIncome: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Period</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. 2026-Q2"
                      value={miForm.period}
                      onChange={(e) =>
                        setMiForm({ ...miForm, period: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleComputeMinorityInterest}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Compute
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowMiForm(false)}
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
                        key: "entityName",
                        header: "Entity",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "minorityShare",
                        header: "Share %",
                        render: (v) => `${Number(v)}%`,
                      },
                      {
                        key: "netIncome",
                        header: "Net Income",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "minorityInterestAmount",
                        header: "Minority Interest",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "period",
                        header: "Period",
                        render: (v) => String(v),
                      },
                    ] as ListColumn[]
                  }
                  data={
                    minorityInterests as unknown as Record<string, unknown>[]
                  }
                  loading={false}
                  emptyTitle="No minority interest data"
                  emptyDescription="Compute minority interest for your consolidation groups."
                />
              )}
            </Card>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
