"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import {
  Loader2,
  RefreshCw,
  Calculator,
  ShieldCheck,
  Plus,
  Calendar,
  Info,
  Scale,
  ArrowRightLeft,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface FxRevaluationDetail {
  id: string;
  accountId: string;
  entityType: string;
  entityId: string;
  balanceInForeign: number | string;
  originalAmountBase: number | string;
  revaluedAmountBase: number | string;
  unrealizedGainLoss: number | string;
  account?: {
    code: string;
    name: string;
  };
}

interface FxRevaluationRun {
  id: string;
  runDate: string;
  targetCurrency: string;
  status: string;
  notes: string | null;
  journalId: string | null;
  createdAt: string;
  details?: FxRevaluationDetail[];
}

const API_BASE = "/advanced-finance";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function FxRevaluationPage() {
  const client = useApiClient();
  const [runs, setRuns] = useState<FxRevaluationRun[]>([]);
  const [loading, setLoading] = useState(true);

  // New Run wizard state
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [runDate, setRunDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [targetCurrency, setTargetCurrency] = useState("EUR");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Preview details state
  const [draftRun, setDraftRun] = useState<FxRevaluationRun | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setRuns(
        await client.get<FxRevaluationRun[]>(`${API_BASE}/fx-revaluation/runs`),
      );
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await client.post<FxRevaluationRun>(
        `${API_BASE}/fx-revaluation/runs`,
        {
          runDate,
          targetCurrency,
          notes,
        },
      );
      if (data) {
        // Fetch full draft details
        setDraftRun(
          await client.get<FxRevaluationRun>(
            `${API_BASE}/fx-revaluation/runs/${data.id}/details`,
          ),
        );
        setShowNewRunModal(false);
        setShowPreviewModal(true);
      } else {
        alert("Failed to generate draft revaluation.");
      }
    } catch (e) {
      alert("Error creating FX revaluation draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostRun = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await client.post(
        `${API_BASE}/fx-revaluation/runs/${id}/post`,
      );
      if (res) {
        alert(
          "FX Revaluation Posted Successfully! Unrealized Gains/Losses logged in General Ledger.",
        );
        setShowPreviewModal(false);
        setDraftRun(null);
        loadData();
      } else {
        alert("Failed to post revaluation.");
      }
    } catch (e) {
    } finally {
      setSubmitting(false);
    }
  };

  const viewDetails = async (id: string) => {
    setLoading(true);
    try {
      setDraftRun(
        await client.get<FxRevaluationRun>(
          `${API_BASE}/fx-revaluation/runs/${id}/details`,
        ),
      );
      {
        setShowPreviewModal(true);
      }
    } catch (e) {
    } finally {
      setLoading(false);
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
    <RouteGuard permission="finance.fx-revaluation.read">
      <div className="p-8 ui-stack-6">
        {/* Header */}
        <div className="ui-flex-between ui-items-start">
          <div>
            <h1 className="text-3xl">FX Currency Revaluation</h1>
            <p className="ui-text-muted mt-1">
              Revalue foreign currency balances (open invoices, payments, and
              cash accounts) at period-end and post unrealized FX gain/loss
              entries.
            </p>
          </div>
          <div className="ui-flex ui-gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw size={16} />
            </Button>
            <Button variant="primary" onClick={() => setShowNewRunModal(true)}>
              <Plus size={16} className="mr-2" /> Run FX Revaluation
            </Button>
          </div>
        </div>

        {/* KPI Overview Cards */}
        <div className={`ui-grid-3 ${styles.s1}`}>
          {[
            {
              label: "Revaluation Runs Count",
              value: runs.length,
              icon: <Scale size={20} />,
              color: "var(--color-primary)",
              bg: "rgba(79,70,229,0.08)",
            },
            {
              label: "Posted Adjustments",
              value: runs.filter((r) => r.status === "POSTED").length,
              icon: <ShieldCheck size={20} />,
              color: "#22c55e",
              bg: "rgba(34,197,94,0.08)",
            },
            {
              label: "Draft Calculations",
              value: runs.filter((r) => r.status === "DRAFT").length,
              icon: <Calculator size={20} />,
              color: "#f59e0b",
              bg: "rgba(245,158,11,0.08)",
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

        {/* Runs history list */}
        <Card className="ui-card">
          <div className={styles.s5}>
            <h3 className="ui-heading-base">Revaluation Execution Logs</h3>
          </div>
          <ListPageTemplate
            columns={
              [
                {
                  key: "runDate",
                  header: "Revaluation Date",
                  render: (v) => (
                    <span className="font-semibold">
                      {new Date(String(v)).toLocaleDateString()}
                    </span>
                  ),
                },
                { key: "targetCurrency", header: "Target Currency" },
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
                      className={styles.s6}
                    >
                      {String(v)}
                    </span>
                  ),
                },
                {
                  key: "journalId",
                  header: "Linked Journal",
                  render: (v) =>
                    v ? (
                      <span className={styles.s7}>
                        <FileText size={14} /> GL ID:{" "}
                        {String(v).substring(0, 8)}
                      </span>
                    ) : (
                      "—"
                    ),
                },
                {
                  key: "notes",
                  header: "Notes",
                  render: (v) => (
                    <span className="ui-text-muted">{String(v || "—")}</span>
                  ),
                },
                {
                  key: "id",
                  header: "Action",
                  render: (v) => (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewDetails(String(v))}
                    >
                      View Details
                    </Button>
                  ),
                },
              ] as ListColumn[]
            }
            data={runs as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No revaluation runs"
            emptyDescription="No FX revaluation runs posted yet. Click Run FX Revaluation to configure a currency adjustment wizard."
          />
        </Card>

        {/* New Run Wizard Modal */}
        {showNewRunModal && (
          <div className={styles.s8}>
            <Card className={`ui-card ${styles.s9}`}>
              <div className={styles.s10}>
                <h3 className="ui-heading-lg">Execute FX Revaluation</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewRunModal(false)}
                >
                  Close
                </Button>
              </div>
              <form onSubmit={handleCreateDraft} className="p-5 ui-stack-4">
                <div className="ui-form-group">
                  <label className="ui-label ui-label">
                    Period-End Revaluation Date
                  </label>
                  <input
                    type="date"
                    className="ui-input w-full"
                    value={runDate}
                    onChange={(e) => setRunDate(e.target.value)}
                    required
                  />
                </div>

                <div className="ui-form-group">
                  <label className="ui-label ui-label">
                    Select Foreign Target Currency
                  </label>
                  <select
                    className="ui-input w-full"
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value)}
                    required
                  >
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                    <option value="JPY">JPY — Japanese Yen</option>
                  </select>
                </div>

                <div className="ui-form-group">
                  <label className="ui-label ui-label">
                    Notes / Audit Comments
                  </label>
                  <input
                    type="text"
                    className="ui-input w-full"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. June 2026 month-end revaluation check"
                  />
                </div>

                <div className="ui-flex-end ui-gap-2 mt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowNewRunModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? (
                      <Loader2 size={14} className="animate-spin mr-2" />
                    ) : null}
                    Calculate Adjustments
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Draft calculations Preview Modal */}
        {showPreviewModal && draftRun && (
          <div className={styles.s8}>
            <Card className={`ui-card ${styles.s11}`}>
              <div className={styles.s10}>
                <div>
                  <h3 className="ui-heading-lg">
                    Revaluation Details ({draftRun.targetCurrency} revalued to
                    USD)
                  </h3>
                  <p className={styles.s12}>
                    Run Date: {new Date(draftRun.runDate).toLocaleDateString()}{" "}
                    • Status:{" "}
                    <span className={styles.s13}>{draftRun.status}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setDraftRun(null);
                  }}
                >
                  Close
                </Button>
              </div>
              <div className="p-5 ui-stack-4">
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "account",
                        header: "GL Account",
                        render: (v, row) => (
                          <span>
                            <span className={styles.s13}>
                              {(v as any)?.code || "1200-AR"}
                            </span>{" "}
                            — {(v as any)?.name || "A/R"}
                          </span>
                        ),
                      },
                      { key: "entityType", header: "Entity Type" },
                      {
                        key: "balanceInForeign",
                        header: "Foreign Balance",
                        render: (v) =>
                          `${String(v)} ${draftRun!.targetCurrency}`,
                      },
                      {
                        key: "originalAmountBase",
                        header: "Original value (Base)",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "revaluedAmountBase",
                        header: "Revalued value (Base)",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "unrealizedGainLoss",
                        header: "Unrealized Gain/Loss",
                        render: (v) => (
                          <span
                            style={{
                              color: Number(v) >= 0 ? "#22c55e" : "#ef4444",
                            }}
                            className={styles.s14}
                          >
                            {Number(v) > 0 ? "+" : ""}
                            {fmt(Number(v))}
                          </span>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={
                    (draftRun.details || []) as unknown as Record<
                      string,
                      unknown
                    >[]
                  }
                  loading={false}
                  emptyTitle="No lines"
                  emptyDescription="No open foreign transactions found on this revaluation date."
                />

                {draftRun.status === "DRAFT" &&
                  draftRun.details &&
                  draftRun.details.length > 0 && (
                    <div className="ui-flex-end ui-gap-2 mt-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setShowPreviewModal(false);
                          setDraftRun(null);
                        }}
                      >
                        Discard Draft
                      </Button>
                      <Button
                        variant="primary"
                        type="button"
                        onClick={() => handlePostRun(draftRun.id)}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <Loader2 size={14} className="animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 size={14} className="mr-2" />
                        )}
                        Post Adjustments to General Ledger
                      </Button>
                    </div>
                  )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
