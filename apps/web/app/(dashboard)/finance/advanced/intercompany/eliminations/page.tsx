"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  Button,
  ListPageTemplate,
  type ListColumn,
  StatCardRow,
} from "@unerp/ui";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Scale,
  FileText,
  Plus,
  Trash2,
  Calendar,
  CheckSquare,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface IntercompanyTransaction {
  id: string;
  fromOrgId: string;
  toOrgId: string;
  date: string;
  description: string;
  amount: number | string;
  currency: string;
  status: string;
  fromInvoiceId: string | null;
  toInvoiceId: string | null;
  eliminationJournalId: string | null;
}

interface IntercompanyStats {
  totalTransactionsCount: number;
  eliminatedCount: number;
  matchedCount: number;
  pendingCount: number;
  totalNettedVolume: number;
  pendingNettingVolume: number;
  pendingMatchVolume: number;
}

interface EliminationRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sourceOrgId: string | null;
  destinationOrgId: string | null;
  matchingCriteria: string;
  toleranceDays: number;
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAccount: { name: string; code: string };
  destinationAccount: { name: string; code: string };
}

interface EliminationRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  runDate: string;
  status: string;
  totalEliminated: number | string;
  rulesAppliedCount: number;
  journalId: string | null;
  journal?: { entryNumber: string } | null;
}

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface Entity {
  id: string;
  name: string;
}

const API_BASE = "/api/v1/advanced-finance";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function IntercompanyEliminationsPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "ledger") as
    | "ledger"
    | "rules"
    | "runs";

  // Data States
  const [txs, setTxs] = useState<IntercompanyTransaction[]>([]);
  const [stats, setStats] = useState<IntercompanyStats | null>(null);
  const [rules, setRules] = useState<EliminationRule[]>([]);
  const [runs, setRuns] = useState<EliminationRun[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [runningBatch, setRunningBatch] = useState(false);

  // New Rule Form State
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    sourceOrgId: "",
    destinationOrgId: "",
    matchingCriteria: "AMOUNT_CURRENCY_DATE",
    toleranceDays: 10,
    sourceAccountId: "",
    destinationAccountId: "",
  });

  // Period Execution Form State
  const [runPeriod, setRunPeriod] = useState({
    periodStart: "",
    periodEnd: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, statsRes, rulesRes, runsRes, accountsRes, overviewRes] =
        await Promise.all([
          client.get<
            IntercompanyTransaction[] | { items?: IntercompanyTransaction[] }
          >(`${API_BASE}/intercompany/transactions`),
          client.get<IntercompanyStats>(`${API_BASE}/intercompany/stats`),
          client.get<EliminationRule[]>(
            `${API_BASE}/intercompany/elimination-rules`,
          ),
          client.get<EliminationRun[]>(
            `${API_BASE}/intercompany/elimination-runs`,
          ),
          client.get<Account[]>(`${API_BASE}/accounts`),
          client.get<{ entities?: Entity[] }>(
            `${API_BASE}/consolidation/overview`,
          ),
        ]);
      setTxs(Array.isArray(txRes) ? txRes : txRes.items || []);
      setStats(statsRes);
      setRules(rulesRes);
      setRuns(runsRes);
      setAccounts(accountsRes);
      setEntities(overviewRes.entities || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEliminate = async (id: string) => {
    setActingId(id);
    try {
      await client.post(`${API_BASE}/intercompany/eliminate/${id}`);
      alert("Netting elimination entry successfully posted to GL ledger.");
      loadData();
    } catch {
      alert("Error posting elimination entry");
    } finally {
      setActingId(null);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newRule.name ||
      !newRule.sourceAccountId ||
      !newRule.destinationAccountId
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      await client.post(`${API_BASE}/intercompany/elimination-rules`, {
        ...newRule,
        sourceOrgId: newRule.sourceOrgId || null,
        destinationOrgId: newRule.destinationOrgId || null,
      });
      alert("Elimination rule created successfully.");
      setShowRuleForm(false);
      setNewRule({
        name: "",
        description: "",
        sourceOrgId: "",
        destinationOrgId: "",
        matchingCriteria: "AMOUNT_CURRENCY_DATE",
        toleranceDays: 10,
        sourceAccountId: "",
        destinationAccountId: "",
      });
      loadData();
    } catch {
      alert("Error creating rule");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this elimination rule?"))
      return;

    try {
      await client.delete(`${API_BASE}/intercompany/elimination-rules/${id}`);
      alert("Elimination rule deleted successfully.");
      loadData();
    } catch {
      alert("Error deleting rule");
    }
  };

  const handleExecuteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runPeriod.periodStart || !runPeriod.periodEnd) {
      alert("Please select start and end period dates.");
      return;
    }

    setRunningBatch(true);
    try {
      await client.post(`${API_BASE}/intercompany/elimination-runs`, runPeriod);
      alert(
        "Period Auto-Elimination run executed as Draft. Review and approve the run to post entries to GL.",
      );
      setRunPeriod({ periodStart: "", periodEnd: "" });
      loadData();
    } catch {
      alert("Error executing elimination run");
    } finally {
      setRunningBatch(false);
    }
  };

  const handlePostRun = async (id: string) => {
    setActingId(id);
    try {
      await client.post(`${API_BASE}/intercompany/elimination-runs/${id}/post`);
      alert(
        "Auto-elimination period run approved and posted successfully to GL.",
      );
      loadData();
    } catch {
      alert("Error posting run");
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.intercompany.read">
      <div className="p-8 ui-stack-6">
        {/* Header */}
        <div className="ui-flex-between ui-items-start">
          <div>
            <h1 className="text-3xl">
              Intercompany Auto-Netting & Eliminations
            </h1>
            <p className="ui-text-muted mt-1">
              Configure elimination rules, run automated batch period close
              eliminations, and check the compliance offset ledger.
            </p>
          </div>
          <div>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>

        {stats && (
          <div className={`ui-grid-3 ${styles.s1}`}>
            {[
              {
                label: "Total Netting Volume (Eliminated)",
                value: fmt(stats.totalNettedVolume),
                icon: <Scale size={20} />,
                color: "#22c55e",
                bg: "rgba(34,197,94,0.08)",
              },
              {
                label: "Pending Netting Volume",
                value: fmt(stats.pendingNettingVolume),
                icon: <Loader2 size={20} />,
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.08)",
              },
              {
                label: "Active Rules Configured",
                value: `${rules.length} Rules`,
                icon: <ShieldCheck size={20} />,
                color: "var(--color-primary)",
                bg: "rgba(79,70,229,0.08)",
              },
            ].map((kpi) => (
              <Card key={kpi.label} className="ui-card p-5">
                <div className="ui-flex-between">
                  <div>
                    <p className={styles.s2}>{kpi.label}</p>
                    <p style={{ color: kpi.color }} className={styles.s3}>
                      {kpi.value}
                    </p>
                  </div>
                  <div
                    style={{ background: kpi.bg, color: kpi.color }}
                    className={styles.s4}
                  >
                    {kpi.icon}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <SubTabBar
          tabs={
            [
              {
                id: "ledger",
                label: "Ledger Entries",
                href: "/finance/advanced/intercompany/eliminations?subtab=ledger",
                icon: FileText,
              },
              {
                id: "rules",
                label: "Auto-Elimination Rules",
                href: "/finance/advanced/intercompany/eliminations?subtab=rules",
                icon: ShieldCheck,
              },
              {
                id: "runs",
                label: "Auto-Elimination Runs",
                href: "/finance/advanced/intercompany/eliminations?subtab=runs",
                icon: Calendar,
              },
            ] as SubTab[]
          }
        />

        {/* Ledger Entries Tab */}
        {activeTab === "ledger" && (
          <Card className="ui-card">
            <div className={styles.s7}>
              <h3 className="ui-heading-base">Intercompany Ledger Entries</h3>
              <span className="ui-text-xs-muted">
                Compliance log of matched transaction offsets
              </span>
            </div>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "date",
                    header: "Transaction Date",
                    render: (v) => (
                      <span className="font-semibold">
                        {new Date(String(v)).toLocaleDateString()}
                      </span>
                    ),
                  },
                  { key: "description", header: "Description" },
                  { key: "fromOrgId", header: "Seller Org" },
                  { key: "toOrgId", header: "Buyer Org" },
                  {
                    key: "amount",
                    header: "Amount",
                    render: (v) => (
                      <span className="font-semibold">{fmt(Number(v))}</span>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (v) => (
                      <span
                        style={{
                          background:
                            v === "ELIMINATED"
                              ? "rgba(34,197,94,0.1)"
                              : "rgba(245,158,11,0.1)",
                          color: v === "ELIMINATED" ? "#22c55e" : "#f59e0b",
                        }}
                        className={styles.s8}
                      >
                        {String(v)}
                      </span>
                    ),
                  },
                  {
                    key: "eliminationJournalId",
                    header: "Elimination Journal",
                    render: (v) =>
                      v ? (
                        <span className={styles.s9}>
                          <FileText size={14} /> ID: {String(v).substring(0, 8)}
                        </span>
                      ) : (
                        "—"
                      ),
                  },
                  {
                    key: "id",
                    header: "Action",
                    render: (v, row) =>
                      row.status === "MATCHED" ? (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actingId !== null}
                          onClick={() => handleEliminate(String(v))}
                          className={styles.s10}
                        >
                          {actingId === v ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            "Eliminate"
                          )}
                        </Button>
                      ) : (
                        <span className={styles.s11}>
                          <CheckCircle2 size={12} /> Post Eliminated
                        </span>
                      ),
                  },
                ] as ListColumn[]
              }
              data={txs as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No transactions"
              emptyDescription="No matched intercompany transactions found. Configure rules or run matching."
            />
          </Card>
        )}

        {/* Auto-Elimination Rules Tab */}
        {activeTab === "rules" && (
          <div className="ui-stack-6">
            <div className="ui-flex-end">
              <Button
                variant="primary"
                onClick={() => setShowRuleForm(!showRuleForm)}
              >
                <Plus size={16} className="mr-2" />
                {showRuleForm ? "Hide Form" : "New Elimination Rule"}
              </Button>
            </div>

            {showRuleForm && (
              <Card className="ui-card p-6">
                <h3 className={styles.s12}>
                  Create Intercompany Elimination Rule
                </h3>
                <form onSubmit={handleCreateRule} className="ui-stack-4">
                  <div className="ui-grid-2">
                    <div className="ui-form-group">
                      <label className={styles.s13}>Rule Name *</label>
                      <input
                        type="text"
                        className={`ui-input ${styles.s14}`}
                        required
                        placeholder="e.g. Corporate Management Fee Offsets"
                        value={newRule.name}
                        onChange={(e) =>
                          setNewRule({ ...newRule, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="ui-form-group">
                      <label className={styles.s13}>Description</label>
                      <input
                        type="text"
                        className={`ui-input ${styles.s14}`}
                        placeholder="Optional details"
                        value={newRule.description}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="ui-grid-2">
                    <div className="ui-form-group">
                      <label className={styles.s13}>
                        Source Organization (Seller)
                      </label>
                      <select
                        className={`ui-input ${styles.s14}`}
                        value={newRule.sourceOrgId}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            sourceOrgId: e.target.value,
                          })
                        }
                      >
                        <option value="">Any Seller Org</option>
                        {entities.map((ent) => (
                          <option key={ent.id} value={ent.id}>
                            {ent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ui-form-group">
                      <label className={styles.s13}>
                        Destination Organization (Buyer)
                      </label>
                      <select
                        className={`ui-input ${styles.s14}`}
                        value={newRule.destinationOrgId}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            destinationOrgId: e.target.value,
                          })
                        }
                      >
                        <option value="">Any Buyer Org</option>
                        {entities.map((ent) => (
                          <option key={ent.id} value={ent.id}>
                            {ent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ui-grid-2">
                    <div className="ui-form-group">
                      <label className={styles.s13}>
                        Source GL Account (IC Receivables) *
                      </label>
                      <select
                        className={`ui-input ${styles.s14}`}
                        required
                        value={newRule.sourceAccountId}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            sourceAccountId: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Account</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name} ({acc.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ui-form-group">
                      <label className={styles.s13}>
                        Destination GL Account (IC Payables) *
                      </label>
                      <select
                        className={`ui-input ${styles.s14}`}
                        required
                        value={newRule.destinationAccountId}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            destinationAccountId: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Account</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name} ({acc.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ui-grid-2">
                    <div className="ui-form-group">
                      <label className={styles.s13}>Matching Criteria</label>
                      <select
                        className={`ui-input ${styles.s14}`}
                        value={newRule.matchingCriteria}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            matchingCriteria: e.target.value,
                          })
                        }
                      >
                        <option value="AMOUNT_CURRENCY_DATE">
                          Amount, Currency & Date Tolerance
                        </option>
                        <option value="AMOUNT_ONLY">
                          Amount and Currency Only
                        </option>
                      </select>
                    </div>
                    <div className="ui-form-group">
                      <label className={styles.s13}>Date Tolerance Days</label>
                      <input
                        type="number"
                        className={`ui-input ${styles.s14}`}
                        min={0}
                        value={newRule.toleranceDays}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            toleranceDays: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.s15}>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setShowRuleForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                      Create Rule
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <Card className="ui-card">
              <div className={styles.s16}>
                <h3 className="ui-heading-base">Active Elimination Rules</h3>
              </div>
              <ListPageTemplate
                columns={
                  [
                    {
                      key: "name",
                      header: "Name",
                      render: (v, row) => (
                        <div>
                          <div className="font-semibold">{String(v)}</div>
                          {Boolean(row.description) && (
                            <div className="ui-text-caption ui-text-tertiary">
                              {String(row.description)}
                            </div>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: "sourceOrgId",
                      header: "Seller org",
                      render: (v) => String(v || "Any Seller"),
                    },
                    {
                      key: "destinationOrgId",
                      header: "Buyer org",
                      render: (v) => String(v || "Any Buyer"),
                    },
                    {
                      key: "sourceAccount",
                      header: "GL Accounts (Source → Destination)",
                      render: (v, row) => (
                        <div>
                          <div className={styles.s17}>
                            <span className="ui-text-primary">
                              ({(v as any)?.code})
                            </span>{" "}
                            {(v as any)?.name}
                          </div>
                          <div className={styles.s18}>
                            →{" "}
                            <span className={styles.s19}>
                              ({(row.destinationAccount as any)?.code})
                            </span>{" "}
                            {(row.destinationAccount as any)?.name}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "matchingCriteria",
                      header: "Criteria",
                      render: (v, row) => (
                        <span className={styles.s20}>
                          {String(v)} (±{String(row.toleranceDays)}d)
                        </span>
                      ),
                    },
                    {
                      key: "isActive",
                      header: "Status",
                      render: (v) => (
                        <span
                          style={{
                            background: v
                              ? "rgba(34,197,94,0.1)"
                              : "rgba(239,68,68,0.1)",
                            color: v ? "#22c55e" : "#ef4444",
                          }}
                          className={styles.s8}
                        >
                          {v ? "Active" : "Inactive"}
                        </span>
                      ),
                    },
                    {
                      key: "id",
                      header: "Action",
                      render: (v) => (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(String(v))}
                          className={styles.s21}
                        >
                          <Trash2 size={14} />
                        </Button>
                      ),
                    },
                  ] as ListColumn[]
                }
                data={rules as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No elimination rules"
                emptyDescription="No elimination rules configured yet. Create a rule to begin period-close automation."
              />
            </Card>
          </div>
        )}

        {/* Auto-Elimination Runs Tab */}
        {activeTab === "runs" && (
          <div className="ui-stack-6">
            <Card className="ui-card p-6">
              <h3 className={styles.s22}>
                <Calendar size={20} className="ui-text-primary" />
                Trigger Period close Auto-Elimination Run
              </h3>
              <form onSubmit={handleExecuteRun} className={styles.s23}>
                <div className="ui-form-group flex-1">
                  <label className={styles.s13}>Period Start Date</label>
                  <input
                    type="date"
                    className={`ui-input ${styles.s14}`}
                    required
                    value={runPeriod.periodStart}
                    onChange={(e) =>
                      setRunPeriod({
                        ...runPeriod,
                        periodStart: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="ui-form-group flex-1">
                  <label className={styles.s13}>Period End Date</label>
                  <input
                    type="date"
                    className={`ui-input ${styles.s14}`}
                    required
                    value={runPeriod.periodEnd}
                    onChange={(e) =>
                      setRunPeriod({ ...runPeriod, periodEnd: e.target.value })
                    }
                  />
                </div>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={runningBatch}
                  className={styles.s24}
                >
                  {runningBatch ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Run Auto-Elimination"
                  )}
                </Button>
              </form>
            </Card>

            <Card className="ui-card">
              <div className={styles.s16}>
                <h3 className="ui-heading-base">
                  Period Run Executions History
                </h3>
              </div>
              <ListPageTemplate
                columns={
                  [
                    {
                      key: "runDate",
                      header: "Run Date",
                      render: (v) => new Date(String(v)).toLocaleString(),
                    },
                    {
                      key: "periodStart",
                      header: "Period Range",
                      render: (v, row) => (
                        <span className="font-semibold">
                          {new Date(String(v)).toLocaleDateString()} –{" "}
                          {new Date(String(row.periodEnd)).toLocaleDateString()}
                        </span>
                      ),
                    },
                    {
                      key: "totalEliminated",
                      header: "Total Eliminated",
                      render: (v) => (
                        <span className="font-semibold">{fmt(Number(v))}</span>
                      ),
                    },
                    {
                      key: "rulesAppliedCount",
                      header: "Rules Applied",
                      render: (v) => `${String(v)} Rules`,
                    },
                    {
                      key: "journalId",
                      header: "Journal Entry",
                      render: (v, row) =>
                        v ? (
                          <span className={styles.s9}>
                            <FileText size={14} /> GL:{" "}
                            {(row.journal as any)?.entryNumber ||
                              String(v).substring(0, 8)}
                          </span>
                        ) : (
                          "—"
                        ),
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (v) => (
                        <span
                          style={{
                            background:
                              v === "POSTED"
                                ? "rgba(34,197,94,0.1)"
                                : "rgba(245,158,11,0.1)",
                            color: v === "POSTED" ? "#22c55e" : "#f59e0b",
                          }}
                          className={styles.s8}
                        >
                          {String(v)}
                        </span>
                      ),
                    },
                    {
                      key: "id",
                      header: "Action",
                      render: (v, row) =>
                        row.status === "DRAFT" ? (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actingId !== null}
                            onClick={() => handlePostRun(String(v))}
                            className={styles.s25}
                          >
                            {actingId === v ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CheckSquare size={12} />
                            )}{" "}
                            Approve &amp; Post
                          </Button>
                        ) : (
                          <span className={styles.s11}>
                            <CheckCircle2 size={12} /> GL Posted
                          </span>
                        ),
                    },
                  ] as ListColumn[]
                }
                data={runs as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No runs"
                emptyDescription="No auto-elimination close runs recorded yet. Select dates above to execute a run."
              />
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
