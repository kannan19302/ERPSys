// @ts-nocheck
"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Brain,
  RefreshCw,
  Loader2,
  Plus,
  BarChart3,
  AlertTriangle,
  Check,
  FileText,
  Search,
  Zap,
  MessageSquare,
  Play,
  X,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface ForecastScenario {
  id: string;
  scenarioName: string;
  type: string;
  active: boolean;
  createdAt: string;
  linesCount: number;
}

interface ForecastLine {
  id: string;
  scenarioId: string;
  accountName: string;
  period: string;
  forecastAmount: number;
  actualAmount: number | null;
}

interface AnomalyRun {
  id: string;
  runName: string;
  modelUsed: string;
  anomaliesFound: number;
  status: string;
  startedAt: string;
}

interface AnomalyResult {
  id: string;
  runId: string;
  accountName: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: string;
  reviewed: boolean;
}

interface GlCodingSuggestion {
  id: string;
  invoiceText: string;
  suggestedAccount: string;
  confidence: number;
  accepted: boolean | null;
}

interface NlpQuery {
  id: string;
  query: string;
  sqlGenerated: string;
  resultSummary: string;
  executedAt: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function AiAnalyticsPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "forecast") as string;

  const [scenarios, setScenarios] = useState<ForecastScenario[]>([]);
  const [forecastLines, setForecastLines] = useState<ForecastLine[]>([]);
  const [anomalyRuns, setAnomalyRuns] = useState<AnomalyRun[]>([]);
  const [anomalyResults, setAnomalyResults] = useState<AnomalyResult[]>([]);
  const [glSuggestions, setGlSuggestions] = useState<GlCodingSuggestion[]>([]);
  const [nlpQueries, setNlpQueries] = useState<NlpQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");

  const [showScenarioForm, setShowScenarioForm] = useState(false);
  const [showForecastLineForm, setShowForecastLineForm] = useState(false);
  const [showNlpForm, setShowNlpForm] = useState(false);
  const [showAnomalyForm, setShowAnomalyForm] = useState(false);

  const [scenarioForm, setScenarioForm] = useState({
    scenarioName: "",
    type: "REVENUE",
  });
  const [lineForm, setLineForm] = useState({
    accountName: "",
    period: "",
    forecastAmount: "",
  });
  const [anomalyForm, setAnomalyForm] = useState({
    runName: "",
    modelUsed: "ISOLATION_FOREST",
  });
  const [nlpForm, setNlpForm] = useState({ query: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, fl, ar, ars, gl, nq] = await Promise.all([
        client.get<ForecastScenario[]>(
          "/advanced-finance/ai-analytics/forecast-scenarios",
        ),
        client.get<ForecastLine[]>(
          "/advanced-finance/ai-analytics/forecast-lines",
        ),
        client.get<AnomalyRun[]>(
          "/advanced-finance/ai-analytics/anomaly-detection-runs",
        ),
        client.get<AnomalyResult[]>(
          "/advanced-finance/ai-analytics/anomaly-results",
        ),
        client.get<GlCodingSuggestion[]>(
          "/advanced-finance/ai-analytics/gl-coding-suggestions",
        ),
        client.get<NlpQuery[]>("/advanced-finance/ai-analytics/nlp-queries"),
      ]);
      setScenarios(s);
      setForecastLines(fl);
      setAnomalyRuns(ar);
      setAnomalyResults(ars);
      setGlSuggestions(gl);
      setNlpQueries(nq);
    } catch {
      setError("Failed to load AI analytics data.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateScenario = async () => {
    if (!scenarioForm.scenarioName) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/ai-analytics/forecast-scenarios",
        scenarioForm,
      );
      setSuccess("Forecast scenario created.");
      setShowScenarioForm(false);
      setScenarioForm({ scenarioName: "", type: "REVENUE" });
      fetchData();
    } catch {
      setError("Failed to create scenario.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateForecastLines = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/ai-analytics/forecast-scenarios/${id}/generate-lines`,
        {},
      );
      setSuccess("Forecast lines generated.");
      setSelectedScenarioId(id);
      fetchData();
    } catch {
      setError("Failed to generate forecast lines.");
    }
  };

  const handleActivateScenario = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/ai-analytics/forecast-scenarios/${id}/activate`,
        {},
      );
      setSuccess("Scenario activated.");
      fetchData();
    } catch {
      setError("Failed to activate scenario.");
    }
  };

  const handleCreateLine = async () => {
    if (!lineForm.accountName || !lineForm.period) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/ai-analytics/forecast-lines", {
        ...lineForm,
        forecastAmount: parseFloat(lineForm.forecastAmount),
      });
      setSuccess("Forecast line created.");
      setShowForecastLineForm(false);
      setLineForm({ accountName: "", period: "", forecastAmount: "" });
      fetchData();
    } catch {
      setError("Failed to create forecast line.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteAnomalyScan = async () => {
    if (!anomalyForm.runName) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/ai-analytics/anomaly-detection-runs",
        anomalyForm,
      );
      setSuccess("Anomaly scan executed.");
      setShowAnomalyForm(false);
      setAnomalyForm({ runName: "", modelUsed: "ISOLATION_FOREST" });
      fetchData();
    } catch {
      setError("Failed to execute scan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewResult = async (id: string) => {
    try {
      await client.patch(
        `/advanced-finance/ai-analytics/anomaly-results/${id}`,
        { reviewed: true },
      );
      setSuccess("Result reviewed.");
      fetchData();
    } catch {
      setError("Failed to update result.");
    }
  };

  const handleSuggestCoding = async () => {
    try {
      const data = await client.post<GlCodingSuggestion>(
        "/advanced-finance/ai-analytics/gl-coding-suggestions/generate",
        {},
      );
      setSuccess(`Coding suggestion generated for "${data.suggestedAccount}".`);
      fetchData();
    } catch {
      setError("Failed to generate suggestion.");
    }
  };

  const handleAcceptSuggestion = async (id: string, accept: boolean) => {
    try {
      await client.patch(
        `/advanced-finance/ai-analytics/gl-coding-suggestions/${id}`,
        { accepted: accept },
      );
      setSuccess(accept ? "Suggestion accepted." : "Suggestion rejected.");
      fetchData();
    } catch {
      setError("Failed to update suggestion.");
    }
  };

  const handleLogQuery = async () => {
    if (!nlpForm.query) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/ai-analytics/nlp-queries", {
        query: nlpForm.query,
      });
      setSuccess("NLP query logged.");
      setShowNlpForm(false);
      setNlpForm({ query: "" });
      fetchData();
    } catch {
      setError("Failed to log query.");
    } finally {
      setActionLoading(false);
    }
  };

  const activeScenarios = scenarios.filter((s) => s.active).length;
  const totalAnomalies = anomalyResults.filter((r) => !r.reviewed).length;
  const pendingSuggestions = glSuggestions.filter(
    (s) => s.accepted === null,
  ).length;

  return (
    <RouteGuard permission="finance.ai.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <nav className="ui-breadcrumb">
              <span>Finance</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span>Advanced</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span className="ui-breadcrumb-current">
                AI Financial Analytics
              </span>
            </nav>
            <div className="ui-title-section">
              <Brain className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">AI Financial Analytics</h1>
            </div>
            <p className="ui-page-subtitle">
              AI-powered forecast scenarios, anomaly detection, automated GL
              coding, and NLP query interface.
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

        <div className="ui-grid-3 mb-4">
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Active Scenarios
            </h3>
            <p className="text-2xl font-bold mt-1">{activeScenarios}</p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Unreviewed Anomalies
            </h3>
            <p className="text-2xl font-bold mt-1 text-red-600">
              {totalAnomalies}
            </p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Pending GL Suggestions
            </h3>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {pendingSuggestions}
            </p>
          </Card>
        </div>

        <div className="mb-4">
          <SubTabBar
            tabs={
              [
                {
                  id: "forecast",
                  label: "Forecast Scenarios",
                  href: "/finance/advanced/ai-analytics?subtab=forecast",
                  icon: BarChart3,
                },
                {
                  id: "anomaly",
                  label: "Anomaly Detection",
                  href: "/finance/advanced/ai-analytics?subtab=anomaly",
                  icon: AlertTriangle,
                },
                {
                  id: "glcoding",
                  label: "GL Coding",
                  href: "/finance/advanced/ai-analytics?subtab=glcoding",
                  icon: FileText,
                },
                {
                  id: "nlp",
                  label: "NLP Query Log",
                  href: "/finance/advanced/ai-analytics?subtab=nlp",
                  icon: MessageSquare,
                },
              ] as SubTab[]
            }
          />
        </div>

        {activeTab === "forecast" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button onClick={() => setShowScenarioForm(!showScenarioForm)}>
                  <Plus size={16} className="mr-1" /> Create Scenario
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowForecastLineForm(!showForecastLineForm)}
                >
                  <Plus size={16} className="mr-1" /> Add Line
                </Button>
              </div>
            </div>
            {showScenarioForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Forecast Scenario</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Scenario Name</label>
                    <input
                      className="ui-input"
                      value={scenarioForm.scenarioName}
                      onChange={(e) =>
                        setScenarioForm({
                          ...scenarioForm,
                          scenarioName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Type</label>
                    <select
                      className="ui-input"
                      value={scenarioForm.type}
                      onChange={(e) =>
                        setScenarioForm({
                          ...scenarioForm,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="REVENUE">Revenue Forecast</option>
                      <option value="EXPENSE">Expense Forecast</option>
                      <option value="CASH_FLOW">Cash Flow Forecast</option>
                      <option value="BALANCE_SHEET">
                        Balance Sheet Projection
                      </option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateScenario}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowScenarioForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            {showForecastLineForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Add Forecast Line</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Account Name</label>
                    <input
                      className="ui-input"
                      value={lineForm.accountName}
                      onChange={(e) =>
                        setLineForm({
                          ...lineForm,
                          accountName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Period</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. 2026-Q3"
                      value={lineForm.period}
                      onChange={(e) =>
                        setLineForm({ ...lineForm, period: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Forecast Amount ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={lineForm.forecastAmount}
                      onChange={(e) =>
                        setLineForm({
                          ...lineForm,
                          forecastAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateLine} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Add
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowForecastLineForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card mb-4">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Forecast Scenarios
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
                        key: "scenarioName",
                        header: "Scenario",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "type",
                        header: "Type",
                        render: (v) => String(v).replace(/_/g, " "),
                      },
                      {
                        key: "linesCount",
                        header: "Lines",
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
                      {
                        key: "id",
                        header: "Actions",
                        render: (v, row) => (
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                handleGenerateForecastLines(String(v))
                              }
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                            >
                              Generate Lines
                            </button>
                            {!row.active && (
                              <button
                                onClick={() =>
                                  handleActivateScenario(String(v))
                                }
                                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={scenarios as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No forecast scenarios"
                  emptyDescription="Create an AI-powered forecast scenario."
                />
              )}
            </Card>
            <Card className="ui-list-card">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Forecast Lines
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
                        key: "accountName",
                        header: "Account",
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
                        key: "forecastAmount",
                        header: "Forecast",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "actualAmount",
                        header: "Actual",
                        render: (v) => (v !== null ? fmt(Number(v)) : "—"),
                      },
                    ] as ListColumn[]
                  }
                  data={forecastLines as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No forecast lines"
                  emptyDescription="Add forecast lines or generate them from a scenario."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "anomaly" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button onClick={() => setShowAnomalyForm(!showAnomalyForm)}>
                  <Plus size={16} className="mr-1" /> Execute Scan
                </Button>
              </div>
            </div>
            {showAnomalyForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">
                  Execute Anomaly Detection Scan
                </h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Run Name</label>
                    <input
                      className="ui-input"
                      value={anomalyForm.runName}
                      onChange={(e) =>
                        setAnomalyForm({
                          ...anomalyForm,
                          runName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Model</label>
                    <select
                      className="ui-input"
                      value={anomalyForm.modelUsed}
                      onChange={(e) =>
                        setAnomalyForm({
                          ...anomalyForm,
                          modelUsed: e.target.value,
                        })
                      }
                    >
                      <option value="ISOLATION_FOREST">Isolation Forest</option>
                      <option value="LOF">Local Outlier Factor</option>
                      <option value="AUTOENCODER">Autoencoder (NN)</option>
                      <option value="SVM">One-Class SVM</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleExecuteAnomalyScan}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}
                    <Play size={14} className="mr-1" /> Execute Scan
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAnomalyForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card mb-4">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Detection Runs
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
                        key: "runName",
                        header: "Run",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "modelUsed",
                        header: "Model",
                        render: (v) => String(v).replace(/_/g, " "),
                      },
                      {
                        key: "anomaliesFound",
                        header: "Anomalies",
                        render: (v) => (
                          <span className="font-semibold">{String(v)}</span>
                        ),
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
                    ] as ListColumn[]
                  }
                  data={anomalyRuns as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No anomaly detection runs"
                  emptyDescription="Execute an AI-powered anomaly scan."
                />
              )}
            </Card>
            <Card className="ui-list-card">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Anomaly Results ({anomalyResults.length})
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
                        key: "accountName",
                        header: "Account",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "expectedValue",
                        header: "Expected",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "actualValue",
                        header: "Actual",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "deviation",
                        header: "Deviation",
                        render: (v) => (
                          <span
                            className={`font-semibold ${Math.abs(Number(v)) > 0.5 ? "text-red-600" : "text-amber-600"}`}
                          >
                            {(Number(v) * 100).toFixed(1)}%
                          </span>
                        ),
                      },
                      {
                        key: "severity",
                        header: "Severity",
                        render: (v) => (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${v === "HIGH" ? "bg-red-100 text-red-700" : v === "MEDIUM" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "reviewed",
                        header: "Reviewed",
                        render: (v) =>
                          v ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <span className="text-gray-400">No</span>
                          ),
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v, row) =>
                          !row.reviewed && (
                            <button
                              onClick={() => handleReviewResult(String(v))}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                            >
                              Mark Reviewed
                            </button>
                          ),
                      },
                    ] as ListColumn[]
                  }
                  data={anomalyResults as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No anomaly results"
                  emptyDescription="Execute an anomaly detection scan to see results."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "glcoding" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={handleSuggestCoding} disabled={actionLoading}>
                <Zap size={16} className="mr-1" /> Suggest GL Coding
              </Button>
            </div>
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
                        key: "invoiceText",
                        header: "Invoice Description",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "suggestedAccount",
                        header: "Suggested GL Account",
                        render: (v) => (
                          <span className="font-semibold text-blue-700">
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "confidence",
                        header: "Confidence",
                        render: (v) => (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 h-2 rounded-full">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${Number(v)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">
                              {Number(v).toFixed(0)}%
                            </span>
                          </div>
                        ),
                      },
                      {
                        key: "accepted",
                        header: "Status",
                        render: (v) => {
                          if (v === true)
                            return (
                              <span className="text-green-600 font-medium text-xs">
                                Accepted
                              </span>
                            );
                          if (v === false)
                            return (
                              <span className="text-red-500 font-medium text-xs">
                                Rejected
                              </span>
                            );
                          return (
                            <span className="text-gray-400 text-xs">
                              Pending
                            </span>
                          );
                        },
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v, row) =>
                          row.accepted === null && (
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  handleAcceptSuggestion(String(v), true)
                                }
                                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleAcceptSuggestion(String(v), false)
                                }
                                className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"
                              >
                                Reject
                              </button>
                            </div>
                          ),
                      },
                    ] as ListColumn[]
                  }
                  data={glSuggestions as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No GL coding suggestions"
                  emptyDescription="Click 'Suggest GL Coding' to generate AI-powered suggestions."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "nlp" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowNlpForm(!showNlpForm)}>
                <Plus size={16} className="mr-1" /> Log NLP Query
              </Button>
            </div>
            {showNlpForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Log NLP Query</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group col-span-2">
                    <label className="ui-label">Natural Language Query</label>
                    <textarea
                      className="ui-input"
                      rows={3}
                      placeholder="e.g. 'Show me total revenue for Q2 2026 by region'"
                      value={nlpForm.query}
                      onChange={(e) =>
                        setNlpForm({ ...nlpForm, query: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleLogQuery} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Log Query
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowNlpForm(false)}
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
                        key: "query",
                        header: "Query",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "sqlGenerated",
                        header: "Generated SQL",
                        render: (v) => (
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {String(v)}
                          </code>
                        ),
                      },
                      {
                        key: "resultSummary",
                        header: "Result",
                        render: (v) => String(v),
                      },
                      {
                        key: "executedAt",
                        header: "Executed",
                        render: (v) => new Date(String(v)).toLocaleString(),
                      },
                    ] as ListColumn[]
                  }
                  data={nlpQueries as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No NLP queries"
                  emptyDescription="Log a natural language query for AI execution."
                />
              )}
            </Card>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
