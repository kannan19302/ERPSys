"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  useToast,
  DataTable,
  type Column,
  type SortOrder,
} from "@unerp/ui";
import {
  Plus,
  X,
  DollarSign,
  Percent,
  Calculator,
  AlertCircle,
  Award,
  FileText,
  CheckCircle,
  Clock,
  CreditCard,
  Trash2,
  Trophy,
} from "lucide-react";
import { apiDelete, ApiRequestError } from "../../../../src/lib/api";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { CrmTabLayout, CRM_TABS } from "@/components/crm/CrmTabLayout";

interface CommissionRule {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FLAT" | "TIERED";
  rate: number;
  appliesTo: string;
  isActive: boolean;
  _count?: { entries: number };
  createdAt: string;
}

interface CommissionEntry {
  id: string;
  userId: string;
  userName?: string;
  opportunityId: string;
  opportunityName?: string;
  ruleId: string;
  ruleName?: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "PAID";
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export default function CommissionsPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "rules") as
    | "rules"
    | "earned"
    | "revops";
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [revopsMetrics, setRevopsMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Rule form
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState<"PERCENTAGE" | "FLAT" | "TIERED">(
    "PERCENTAGE",
  );
  const [ruleRate, setRuleRate] = useState(0);
  const [ruleAppliesTo, setRuleAppliesTo] = useState("ALL");

  // Calc form
  const [calcStart, setCalcStart] = useState("");
  const [calcEnd, setCalcEnd] = useState("");

  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, entriesRes, leaderboardRes, metricsRes] =
        await Promise.all([
          client.get<unknown>("/api/v1/crm/commissions/rules"),
          client.get<unknown>("/api/v1/crm/commissions/entries"),
          client.get<unknown>("/api/v1/crm/expansion/gamification-leaderboard"),
          client.get<unknown>("/api/v1/crm/expansion/revops-metrics"),
        ]);
      const list = <T,>(value: unknown): T[] =>
        Array.isArray(value)
          ? (value as T[])
          : typeof value === "object" &&
              value !== null &&
              "data" in value &&
              Array.isArray(value.data)
            ? (value.data as T[])
            : [];
      setRules(list<CommissionRule>(rulesRes));
      setEntries(list<CommissionEntry>(entriesRes));
      setLeaderboard(list(leaderboardRes));
      setRevopsMetrics(
        typeof metricsRes === "object" &&
          metricsRes !== null &&
          "data" in metricsRes
          ? metricsRes.data
          : metricsRes,
      );
    } catch (err) {
      setError("Could not load commission data. Please try again.");
      toast.error(
        "Could not load commissions",
        err instanceof Error ? err.message : undefined,
      );
      setRules([]);
      setEntries([]);
      setLeaderboard([]);
      setRevopsMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: ruleName,
      type: ruleType,
      rate: Number(ruleRate),
      appliesTo: ruleAppliesTo,
    };

    try {
      await client.post("/api/v1/crm/commissions/rules", payload);
      setModalSuccess(true);
      toast.success("Commission rule created", `"${ruleName}" has been added.`);
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
        loadData();
      }, 1200);
    } catch (err) {
      toast.error(
        "Could not create rule",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post("/api/v1/crm/commissions/calculate", {
        periodStart: calcStart,
        periodEnd: calcEnd,
      });
      setModalSuccess(true);
      toast.success(
        "Commissions calculated",
        "Entries generated for the selected period.",
      );
      setTimeout(() => {
        setIsCalcModalOpen(false);
        setModalSuccess(false);
        setCalcStart("");
        setCalcEnd("");
        loadData();
      }, 1200);
    } catch (err) {
      toast.error(
        "Could not calculate commissions",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRuleName("");
    setRuleType("PERCENTAGE");
    setRuleRate(0);
    setRuleAppliesTo("ALL");
    setModalSuccess(false);
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "PAID":
        return <Badge variant="success">Paid</Badge>;
      case "APPROVED":
        return <Badge variant="info">Approved</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case "PERCENTAGE":
        return <Badge variant="info">Percentage</Badge>;
      case "FLAT":
        return <Badge variant="default">Flat</Badge>;
      default:
        return <Badge variant="warning">Tiered</Badge>;
    }
  };

  const [ruleSortBy, setRuleSortBy] = useState("name");
  const [ruleSortOrder, setRuleSortOrder] = useState<SortOrder>("asc");
  const sortedRules = [...rules].sort((a, b) => {
    let cmp = 0;
    if (ruleSortBy === "name") cmp = a.name.localeCompare(b.name);
    else if (ruleSortBy === "rate") cmp = a.rate - b.rate;
    return ruleSortOrder === "desc" ? -cmp : cmp;
  });

  const [entrySortBy, setEntrySortBy] = useState("createdAt");
  const [entrySortOrder, setEntrySortOrder] = useState<SortOrder>("desc");
  const sortedEntries = [...entries].sort((a, b) => {
    let cmp = 0;
    if (entrySortBy === "amount") cmp = a.amount - b.amount;
    else if (entrySortBy === "createdAt")
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return entrySortOrder === "desc" ? -cmp : cmp;
  });

  const handleDeleteRule = async (r: CommissionRule) => {
    if (
      !window.confirm(
        `Delete commission rule "${r.name}"? This cannot be undone.`,
      )
    )
      return;
    try {
      await apiDelete(`/crm/commissions/rules/${r.id}`);
      toast.success("Commission rule deleted.");
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Failed to delete commission rule.";
      toast.error(message);
    }
  };

  const ruleColumns: Column<CommissionRule>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r) => <span className="font-semibold">{r.name}</span>,
    },
    { key: "type", header: "Type", render: (r) => getTypeBadge(r.type) },
    {
      key: "rate",
      header: "Rate",
      align: "right",
      sortable: true,
      render: (r) =>
        r.type === "PERCENTAGE" ? `${r.rate}%` : `$${r.rate.toLocaleString()}`,
    },
    { key: "appliesTo", header: "Applies To", render: (r) => r.appliesTo },
    {
      key: "isActive",
      header: "Active",
      align: "center",
      render: (r) =>
        r.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="danger">Inactive</Badge>
        ),
    },
    {
      key: "entries",
      header: "Entries",
      align: "right",
      render: (r) => r._count?.entries || 0,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      width: "80px",
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteRule(r);
          }}
          className={styles.p20}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  const entryColumns: Column<CommissionEntry>[] = [
    {
      key: "userName",
      header: "User",
      render: (e) => (
        <span className="font-semibold">{e.userName || e.userId}</span>
      ),
    },
    {
      key: "opportunityName",
      header: "Opportunity",
      render: (e) => e.opportunityName || e.opportunityId,
    },
    { key: "ruleName", header: "Rule", render: (e) => e.ruleName || e.ruleId },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (e) => (
        <span className={styles.p21}>${e.amount.toLocaleString()}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (e) => getStatusBadge(e.status),
    },
    {
      key: "period",
      header: "Period",
      render: (e) => (
        <span className="text-xs">
          {e.periodStart} - {e.periodEnd}
        </span>
      ),
    },
  ];

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--weight-semibold)",
    marginBottom: "var(--space-1.5)",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "38px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: "0 var(--space-3)",
  };
  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "var(--space-3) var(--space-4)",
    fontWeight: "var(--weight-semibold)",
    color: "var(--color-text-secondary)",
  };
  const tdStyle: React.CSSProperties = {
    padding: "var(--space-3.5) var(--space-4)",
  };

  return (
    <RouteGuard permission="crm.commissions.read">
      <CrmTabLayout
        tabs={CRM_TABS}
        moduleId="crm"
        moduleLabel="CRM & Sales"
        moduleIcon={DollarSign}
        moduleDescription="Configure commission rules and track earned commissions for your sales team"
      >
        <div className="ui-stack-6 ui-animate-in">
          <PageHeader
            title="Commissions"
            description="Configure commission rules and track earned commissions for your sales team."
            breadcrumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "CRM", href: "/crm" },
              { label: "Commissions" },
            ]}
            actions={
              <div className="ui-flex ui-gap-3">
                <Button
                  onClick={() => setIsCalcModalOpen(true)}
                  variant="secondary"
                  className="ui-hstack-2"
                >
                  <Calculator size={16} />
                  <span>Calculate</span>
                </Button>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  variant="primary"
                  className="ui-hstack-2"
                >
                  <Plus size={16} />
                  <span>New Rule</span>
                </Button>
              </div>
            }
          />

          {error && (
            <div className={styles.p22}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Tabs */}
          <SubTabBar
            tabs={
              [
                {
                  id: "rules",
                  label: "Rules",
                  href: "/crm/commissions?subtab=rules",
                  icon: Percent,
                },
                {
                  id: "earned",
                  label: "Earned Commissions",
                  href: "/crm/commissions?subtab=earned",
                  icon: DollarSign,
                },
                {
                  id: "revops",
                  label: "RevOps Leaderboard",
                  href: "/crm/commissions?subtab=revops",
                  icon: Trophy,
                },
              ] as SubTab[]
            }
          />

          {loading ? (
            <div className="ui-center-pad">
              <Spinner size="lg" />
            </div>
          ) : activeTab === "rules" ? (
            <Card>
              <DataTable<CommissionRule>
                columns={ruleColumns}
                data={sortedRules}
                rowKey={(r) => r.id}
                sortBy={ruleSortBy}
                sortOrder={ruleSortOrder}
                onSortChange={(key, order) => {
                  setRuleSortBy(key);
                  setRuleSortOrder(order);
                }}
                emptyTitle="No commission rules"
                emptyMessage="Configure a commission rule to get started."
              />
            </Card>
          ) : activeTab === "earned" ? (
            <Card>
              <DataTable<CommissionEntry>
                columns={entryColumns}
                data={sortedEntries}
                rowKey={(e) => e.id}
                sortBy={entrySortBy}
                sortOrder={entrySortOrder}
                onSortChange={(key, order) => {
                  setEntrySortBy(key);
                  setEntrySortOrder(order);
                }}
                emptyTitle="No commission entries"
                emptyMessage="Commission entries appear once opportunities close."
              />
            </Card>
          ) : (
            <div className="ui-stack-6">
              {revopsMetrics && (
                <div className={styles.p24}>
                  <Card>
                    <div className="p-5">
                      <div className={styles.p25}>Total Revenue</div>
                      <div className={styles.p26}>
                        $
                        {revopsMetrics.totalPipelineValue?.toLocaleString() ||
                          "0"}
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="p-5">
                      <div className={styles.p27}>Closed Won Amount</div>
                      <div className={styles.p28}>
                        ${revopsMetrics.closedWonValue?.toLocaleString() || "0"}
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="p-5">
                      <div className={styles.p29}>Win Rate</div>
                      <div className={styles.p210}>
                        {revopsMetrics.winRatePct?.toFixed(1) || "0"}%
                      </div>
                    </div>
                  </Card>
                </div>
              )}
              <Card>
                <div className="p-6">
                  <h3 className={styles.p211}>Gamification Leaderboard</h3>
                  {leaderboard.length > 0 ? (
                    <div className="ui-stack-3">
                      {leaderboard.map((user: any, index: number) => (
                        <div key={user.userId} className={styles.p212}>
                          <div className="ui-hstack-3">
                            <span className={styles.p213}>#{index + 1}</span>
                            <span>{user.name}</span>
                          </div>
                          <div className={styles.p214}>
                            <span>
                              Deals Won: <strong>{user.dealsWon}</strong>
                            </span>
                            <span>
                              Points:{" "}
                              <strong>
                                {user.points || user.dealsWon * 100}
                              </strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ui-text-muted">No leaderboard data found</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Create Rule Modal */}
          {isModalOpen && (
            <div className={styles.p215}>
              <div className={styles.p216}>
                <div className={styles.p217}>
                  <h3 className="ui-heading-base">New Commission Rule</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="ui-btn-icon ui-text-muted"
                  >
                    <X size={18} />
                  </button>
                </div>
                {modalSuccess ? (
                  <div className={styles.p218}>
                    <Award size={48} className={styles.p219} />
                    <div className="ui-heading-base">
                      Rule Created Successfully
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateRule} className="p-6 ui-stack-4">
                    <div>
                      <label style={labelStyle}>Rule Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Standard Sales Commission"
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        className="ui-input"
                        style={inputStyle}
                      />
                    </div>
                    <div className="ui-grid-2">
                      <div>
                        <label style={labelStyle}>Type</label>
                        <select
                          value={ruleType}
                          onChange={(e) =>
                            setRuleType(
                              e.target.value as
                                | "PERCENTAGE"
                                | "FLAT"
                                | "TIERED",
                            )
                          }
                          className="ui-input"
                          style={inputStyle}
                        >
                          <option value="PERCENTAGE">Percentage</option>
                          <option value="FLAT">Flat Amount</option>
                          <option value="TIERED">Tiered</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>
                          Rate {ruleType === "PERCENTAGE" ? "(%)" : "($)"}
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          step={ruleType === "PERCENTAGE" ? 0.5 : 1}
                          value={ruleRate}
                          onChange={(e) => setRuleRate(Number(e.target.value))}
                          className="ui-input"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Applies To</label>
                      <select
                        value={ruleAppliesTo}
                        onChange={(e) => setRuleAppliesTo(e.target.value)}
                        className="ui-input"
                        style={inputStyle}
                      >
                        <option value="ALL">All Opportunities</option>
                        <option value="ENTERPRISE">Enterprise Only</option>
                        <option value="SMB">SMB Only</option>
                        <option value="NEW_BUSINESS">New Business</option>
                        <option value="RENEWAL">Renewals</option>
                      </select>
                    </div>
                    <div className={styles.p220}>
                      <Button
                        variant="secondary"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={submitting}
                      >
                        {submitting ? "Creating..." : "Create Rule"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Calculate Modal */}
          {isCalcModalOpen && (
            <div className={styles.p221}>
              <div className={styles.p222}>
                <div className={styles.p223}>
                  <h3 className="ui-heading-base">Calculate Commissions</h3>
                  <button
                    onClick={() => setIsCalcModalOpen(false)}
                    className="ui-btn-icon ui-text-muted"
                  >
                    <X size={18} />
                  </button>
                </div>
                {modalSuccess ? (
                  <div className={styles.p224}>
                    <CheckCircle size={48} className={styles.p225} />
                    <div className="ui-heading-base">
                      Commissions Calculated
                    </div>
                    <div className="ui-text-sm-muted">
                      Check the Earned Commissions tab for results.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCalculate} className="p-6 ui-stack-4">
                    <div>
                      <label style={labelStyle}>Period Start</label>
                      <input
                        type="date"
                        required
                        value={calcStart}
                        onChange={(e) => setCalcStart(e.target.value)}
                        className="ui-input"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Period End</label>
                      <input
                        type="date"
                        required
                        value={calcEnd}
                        onChange={(e) => setCalcEnd(e.target.value)}
                        className="ui-input"
                        style={inputStyle}
                      />
                    </div>
                    <div className={styles.p226}>
                      <Button
                        variant="secondary"
                        onClick={() => setIsCalcModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={submitting}
                      >
                        {submitting ? "Calculating..." : "Calculate"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </CrmTabLayout>
    </RouteGuard>
  );
}
