"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Plus,
  Layers,
  CheckCircle,
  Archive,
  FileEdit,
  Loader2,
  BarChart3,
} from "lucide-react";
import { Card, Button, Badge } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface ForecastScenario {
  id: string;
  name: string;
  description?: string;
  status: "DRAFT" | "APPROVED" | "ARCHIVED";
  createdAt: string;
  budgets?: Budget[];
}

interface Budget {
  id: string;
  amount: number;
  startDate: string;
  endDate: string;
  account?: { name: string; code: string };
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

const API = "/advanced-finance";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  APPROVED: "success",
  ARCHIVED: "info",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFT: <FileEdit size={12} />,
  APPROVED: <CheckCircle size={12} />,
  ARCHIVED: <Archive size={12} />,
};

export default function ForecastScenariosPage() {
  const client = useApiClient();
  const [scenarios, setScenarios] = useState<ForecastScenario[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<ForecastScenario | null>(null);
  const [saving, setSaving] = useState(false);

  const [scenarioForm, setScenarioForm] = useState({
    name: "",
    description: "",
    status: "DRAFT",
  });
  const [budgetForm, setBudgetForm] = useState({
    accountId: "",
    amount: "",
    startDate: "",
    endDate: "",
  });
  const [addingBudget, setAddingBudget] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [scnRes, accRes] = await Promise.all([
        client.get<ForecastScenario[]>(`${API}/forecast-scenarios`),
        client.get<GLAccount[]>(`${API}/accounts`),
      ]);
      setScenarios(scnRes);
      setAccounts(
        accRes.filter((a) => a.type === "REVENUE" || a.type === "EXPENSE"),
      );
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post(`${API}/forecast-scenarios`, scenarioForm);
      {
        setShowNew(false);
        setScenarioForm({ name: "", description: "", status: "DRAFT" });
        await fetchData();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const addBudgetLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await client.post(`${API}/budgets`, {
        accountId: budgetForm.accountId,
        amount: parseFloat(budgetForm.amount),
        startDate: budgetForm.startDate,
        endDate: budgetForm.endDate,
        forecastScenarioId: selected.id,
      });
      {
        setBudgetForm({
          accountId: "",
          amount: "",
          startDate: "",
          endDate: "",
        });
        setAddingBudget(false);
        await fetchData();
        // Re-select updated scenario
        const list = await client.get<ForecastScenario[]>(
          `${API}/forecast-scenarios`,
        );
        setSelected(list.find((s) => s.id === selected.id) || null);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const totalBudget = (s: ForecastScenario) =>
    (s.budgets || []).reduce((sum, b) => sum + b.amount, 0);

  if (loading) {
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className={`animate-spin ${styles.s1}`} />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.forecast-scenarios.read">
      <div className="p-8 ui-stack-6">
        {/* Header */}
        <div className="ui-flex-between ui-items-start">
          <div>
            <h1 className={styles.s2}>
              <TrendingUp className="ui-text-primary" />
              Rolling Forecasts & Scenarios
            </h1>
            <p className="ui-text-muted mt-1">
              Model financial futures with multiple planning scenarios. Compare
              forecasts vs. actuals.
            </p>
          </div>
          <Button onClick={() => setShowNew(true)}>
            <Plus size={16} className="mr-2" /> New Scenario
          </Button>
        </div>

        {/* New Scenario Form */}
        {showNew && (
          <Card>
            <div className="p-6">
              <h3 className={styles.s3}>Create Forecast Scenario</h3>
              <form onSubmit={createScenario} className="ui-stack-4">
                <div className="ui-grid-2">
                  <div className="ui-form-group">
                    <label className="ui-label">Scenario Name *</label>
                    <input
                      className="ui-input"
                      required
                      placeholder="e.g. Base Case 2026, Upside, Stress Test"
                      value={scenarioForm.name}
                      onChange={(e) =>
                        setScenarioForm({
                          ...scenarioForm,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Status</label>
                    <select
                      className="ui-input"
                      value={scenarioForm.status}
                      onChange={(e) =>
                        setScenarioForm({
                          ...scenarioForm,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="APPROVED">Approved</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Description</label>
                  <textarea
                    className="ui-input"
                    rows={2}
                    placeholder="Assumptions, key drivers, or notes for this scenario…"
                    value={scenarioForm.description}
                    onChange={(e) =>
                      setScenarioForm({
                        ...scenarioForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNew(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <Loader2 size={14} className="animate-spin mr-2" />
                    ) : null}
                    Create Scenario
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        <div className={`ui-grid-2 ${styles.s4}`}>
          {/* Scenario List */}
          <div className="ui-stack-3">
            <h2 className={styles.s5}>
              {scenarios.length} Scenario{scenarios.length !== 1 ? "s" : ""}
            </h2>

            {scenarios.length === 0 && (
              <Card>
                <div className={styles.s6}>
                  <BarChart3 size={40} className={styles.s7} />
                  <p className="font-medium">No forecast scenarios yet</p>
                  <p className={styles.s8}>
                    Create a scenario to start modeling your financial future.
                  </p>
                </div>
              </Card>
            )}

            {scenarios.map((s) => (
              <Card
                key={s.id}
                onClick={() => setSelected(s)}
                style={{
                  border:
                    selected?.id === s.id
                      ? "2px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                }}
                className={styles.s9}
              >
                <div className="p-5">
                  <div className={styles.s10}>
                    <div className="ui-hstack-2">
                      <Layers size={16} className={styles.s11} />
                      <span className="ui-heading-sm">{s.name}</span>
                    </div>
                    <Badge
                      variant={
                        STATUS_COLORS[s.status] as
                          | "default"
                          | "success"
                          | "info"
                      }
                    >
                      <span className="ui-flex ui-items-center ui-gap-1">
                        {STATUS_ICONS[s.status]} {s.status}
                      </span>
                    </Badge>
                  </div>
                  {s.description && (
                    <p className={styles.s12}>{s.description}</p>
                  )}
                  <div className={styles.s13}>
                    <span>
                      {(s.budgets || []).length} budget line
                      {(s.budgets || []).length !== 1 ? "s" : ""}
                    </span>
                    <span className={styles.s14}>
                      $
                      {totalBudget(s).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                      })}{" "}
                      total
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Scenario Detail Panel */}
          {selected ? (
            <Card>
              <div className="p-6">
                <div className={styles.s15}>
                  <div>
                    <h2 className="ui-heading-lg">{selected.name}</h2>
                    {selected.description && (
                      <p className={styles.s16}>{selected.description}</p>
                    )}
                  </div>
                  <Badge
                    variant={
                      STATUS_COLORS[selected.status] as
                        | "default"
                        | "success"
                        | "info"
                    }
                  >
                    {selected.status}
                  </Badge>
                </div>

                {/* Budget Lines */}
                <div className="mb-4">
                  <div className={styles.s17}>
                    <h3 className={styles.s18}>BUDGET LINES</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddingBudget(!addingBudget)}
                    >
                      <Plus size={12} className="mr-1" /> Add Line
                    </Button>
                  </div>

                  {addingBudget && (
                    <form onSubmit={addBudgetLine} className={styles.s19}>
                      <div className="ui-form-group">
                        <label className="ui-label">GL Account *</label>
                        <select
                          className="ui-input"
                          required
                          value={budgetForm.accountId}
                          onChange={(e) =>
                            setBudgetForm({
                              ...budgetForm,
                              accountId: e.target.value,
                            })
                          }
                        >
                          <option value="">Select account…</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} — {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="ui-grid-3">
                        <div className="ui-form-group">
                          <label className="ui-label">Amount *</label>
                          <input
                            className="ui-input"
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            value={budgetForm.amount}
                            onChange={(e) =>
                              setBudgetForm({
                                ...budgetForm,
                                amount: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ui-form-group">
                          <label className="ui-label">From *</label>
                          <input
                            className="ui-input"
                            type="date"
                            required
                            value={budgetForm.startDate}
                            onChange={(e) =>
                              setBudgetForm({
                                ...budgetForm,
                                startDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ui-form-group">
                          <label className="ui-label">To *</label>
                          <input
                            className="ui-input"
                            type="date"
                            required
                            value={budgetForm.endDate}
                            onChange={(e) =>
                              setBudgetForm({
                                ...budgetForm,
                                endDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="ui-flex-end ui-gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAddingBudget(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={saving}>
                          {saving ? (
                            <Loader2 size={12} className="animate-spin mr-1" />
                          ) : null}
                          Save Line
                        </Button>
                      </div>
                    </form>
                  )}

                  {(selected.budgets || []).length === 0 ? (
                    <div className={styles.s20}>
                      No budget lines yet. Add revenue and expense projections
                      to build your forecast.
                    </div>
                  ) : (
                    <div className="ui-stack-2">
                      {(selected.budgets || []).map((b) => (
                        <div key={b.id} className={styles.s21}>
                          <div>
                            <span className="font-medium">
                              {b.account?.name || "Account"}
                            </span>
                            <span className={styles.s22}>
                              {new Date(b.startDate).toLocaleDateString()} –{" "}
                              {new Date(b.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={styles.s23}>
                            $
                            {b.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      ))}

                      {/* Totals */}
                      <div className={styles.s24}>
                        <span>Total Forecast</span>
                        <span className="ui-text-primary">
                          $
                          {totalBudget(selected).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className={styles.s25}>
                <Layers size={36} className={styles.s26} />
                <p className="text-sm">
                  Select a scenario to view its budget lines and projections.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
