"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  RefreshCw,
  Loader2,
  Plus,
  TrendingUp,
  Users,
  BarChart3,
  AlertTriangle,
  Check,
  Activity,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface Scorecard {
  id: string;
  customerName: string;
  score: number;
  rating: string;
  lastComputed: string;
  factors: string;
}

interface VendorAssessment {
  id: string;
  vendorName: string;
  riskScore: number;
  category: string;
  status: string;
  lastReview: string;
}

interface MarketExposure {
  id: string;
  instrument: string;
  exposureAmount: number;
  hedged: boolean;
  counterparty: string;
  maturityDate: string;
}

interface RiskEvent {
  id: string;
  eventType: string;
  description: string;
  severity: string;
  status: string;
  occurredAt: string;
}

interface ControlMeasure {
  id: string;
  controlName: string;
  controlType: string;
  owner: string;
  effectiveness: string;
  lastTested: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function RiskManagementPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "scorecards") as string;

  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [assessments, setAssessments] = useState<VendorAssessment[]>([]);
  const [exposures, setExposures] = useState<MarketExposure[]>([]);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [controls, setControls] = useState<ControlMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showScorecardForm, setShowScorecardForm] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showControlForm, setShowControlForm] = useState(false);

  const [scorecardForm, setScorecardForm] = useState({
    customerName: "",
    factors: "",
  });
  const [assessmentForm, setAssessmentForm] = useState({
    vendorName: "",
    category: "FINANCIAL",
  });
  const [controlForm, setControlForm] = useState({
    controlName: "",
    controlType: "PREVENTIVE",
    owner: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, a, e, ev, c] = await Promise.all([
        client.get<Scorecard[]>("/advanced-finance/risk-management/scorecards"),
        client.get<VendorAssessment[]>(
          "/advanced-finance/risk-management/vendor-assessments",
        ),
        client.get<MarketExposure[]>(
          "/advanced-finance/risk-management/market-exposures",
        ),
        client.get<RiskEvent[]>(
          "/advanced-finance/risk-management/risk-events",
        ),
        client.get<ControlMeasure[]>(
          "/advanced-finance/risk-management/control-measures",
        ),
      ]);
      setScorecards(s);
      setAssessments(a);
      setExposures(e);
      setEvents(ev);
      setControls(c);
    } catch {
      setError("Failed to load risk management data.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateScorecard = async () => {
    if (!scorecardForm.customerName) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/risk-management/scorecards",
        scorecardForm,
      );
      setSuccess("Scorecard created.");
      setShowScorecardForm(false);
      setScorecardForm({ customerName: "", factors: "" });
      fetchData();
    } catch {
      setError("Failed to create scorecard.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComputeScore = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/risk-management/scorecards/${id}/compute`,
        {},
      );
      setSuccess("Credit score computed.");
      fetchData();
    } catch {
      setError("Failed to compute score.");
    }
  };

  const handleCreateAssessment = async () => {
    if (!assessmentForm.vendorName) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/risk-management/vendor-assessments",
        assessmentForm,
      );
      setSuccess("Vendor assessment created.");
      setShowAssessmentForm(false);
      setAssessmentForm({ vendorName: "", category: "FINANCIAL" });
      fetchData();
    } catch {
      setError("Failed to create assessment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHedge = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/risk-management/market-exposures/${id}/hedge`,
        {},
      );
      setSuccess("Exposure hedged.");
      fetchData();
    } catch {
      setError("Failed to hedge exposure.");
    }
  };

  const handleCloseExposure = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/risk-management/market-exposures/${id}/close`,
        {},
      );
      setSuccess("Exposure closed.");
      fetchData();
    } catch {
      setError("Failed to close exposure.");
    }
  };

  const handleResolveEvent = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/risk-management/risk-events/${id}/resolve`,
        {},
      );
      setSuccess("Risk event resolved.");
      fetchData();
    } catch {
      setError("Failed to resolve event.");
    }
  };

  const handleCreateControl = async () => {
    if (!controlForm.controlName) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/risk-management/control-measures",
        controlForm,
      );
      setSuccess("Control measure created.");
      setShowControlForm(false);
      setControlForm({ controlName: "", controlType: "PREVENTIVE", owner: "" });
      fetchData();
    } catch {
      setError("Failed to create control.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestControl = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/risk-management/control-measures/${id}/test`,
        {},
      );
      setSuccess("Control tested successfully.");
      fetchData();
    } catch {
      setError("Failed to test control.");
    }
  };

  const pendingEvents = events.filter((e) => e.status === "OPEN").length;
  const unhedgedExposures = exposures.filter((e) => !e.hedged).length;

  return (
    <RouteGuard permission="finance.risk.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <nav className="ui-breadcrumb">
              <span>Finance</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span>Advanced</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span className="ui-breadcrumb-current">
                Financial Risk Management
              </span>
            </nav>
            <div className="ui-title-section">
              <ShieldAlert className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">Financial Risk Management</h1>
            </div>
            <p className="ui-page-subtitle">
              Credit scorecards, vendor risk, market exposures, operational risk
              events, and control measures.
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
              Open Risk Events
            </h3>
            <p className="text-2xl font-bold mt-1 text-red-600">
              {pendingEvents}
            </p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Unhedged Exposures
            </h3>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {unhedgedExposures}
            </p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Total Scorecards
            </h3>
            <p className="text-2xl font-bold mt-1">{scorecards.length}</p>
          </Card>
        </div>

        <div className="mb-4">
          <SubTabBar
            tabs={
              [
                {
                  id: "scorecards",
                  label: "Credit Scorecards",
                  href: "/finance/advanced/risk-management?subtab=scorecards",
                  icon: TrendingUp,
                },
                {
                  id: "vendors",
                  label: "Vendor Risk",
                  href: "/finance/advanced/risk-management?subtab=vendors",
                  icon: Users,
                },
                {
                  id: "market",
                  label: "Market Risk",
                  href: "/finance/advanced/risk-management?subtab=market",
                  icon: BarChart3,
                },
                {
                  id: "operational",
                  label: "Operational Risk",
                  href: "/finance/advanced/risk-management?subtab=operational",
                  icon: Activity,
                },
              ] as SubTab[]
            }
          />
        </div>

        {activeTab === "scorecards" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowScorecardForm(!showScorecardForm)}>
                <Plus size={16} className="mr-1" /> Create Scorecard
              </Button>
            </div>
            {showScorecardForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Credit Scorecard</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Customer Name</label>
                    <input
                      className="ui-input"
                      value={scorecardForm.customerName}
                      onChange={(e) =>
                        setScorecardForm({
                          ...scorecardForm,
                          customerName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Scoring Factors</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. payment_history:0.4,debt_ratio:0.3"
                      value={scorecardForm.factors}
                      onChange={(e) =>
                        setScorecardForm({
                          ...scorecardForm,
                          factors: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateScorecard}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowScorecardForm(false)}
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
                        key: "customerName",
                        header: "Customer",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "score",
                        header: "Score",
                        render: (v) => (
                          <span className="font-semibold">{Number(v)}</span>
                        ),
                      },
                      {
                        key: "rating",
                        header: "Rating",
                        render: (v) => (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${v === "LOW" ? "bg-green-100 text-green-700" : v === "MEDIUM" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "lastComputed",
                        header: "Last Computed",
                        render: (v) =>
                          v ? new Date(String(v)).toLocaleDateString() : "—",
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v) => (
                          <button
                            onClick={() => handleComputeScore(String(v))}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Compute Score
                          </button>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={scorecards as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No scorecards"
                  emptyDescription="Create a credit scorecard to assess customer risk."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "vendors" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={() => setShowAssessmentForm(!showAssessmentForm)}
              >
                <Plus size={16} className="mr-1" /> Create Vendor Assessment
              </Button>
            </div>
            {showAssessmentForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Vendor Risk Assessment</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Vendor Name</label>
                    <input
                      className="ui-input"
                      value={assessmentForm.vendorName}
                      onChange={(e) =>
                        setAssessmentForm({
                          ...assessmentForm,
                          vendorName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Category</label>
                    <select
                      className="ui-input"
                      value={assessmentForm.category}
                      onChange={(e) =>
                        setAssessmentForm({
                          ...assessmentForm,
                          category: e.target.value,
                        })
                      }
                    >
                      <option value="FINANCIAL">Financial</option>
                      <option value="OPERATIONAL">Operational</option>
                      <option value="COMPLIANCE">Compliance</option>
                      <option value="REPUTATIONAL">Reputational</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateAssessment}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAssessmentForm(false)}
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
                        key: "vendorName",
                        header: "Vendor",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "riskScore",
                        header: "Risk Score",
                        render: (v) => (
                          <span className="font-semibold">{Number(v)}</span>
                        ),
                      },
                      {
                        key: "category",
                        header: "Category",
                        render: (v) => String(v),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "COMPLETED" ? "ui-badge-green" : v === "IN_REVIEW" ? "ui-badge-yellow" : "ui-badge-red"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "lastReview",
                        header: "Last Review",
                        render: (v) =>
                          v ? new Date(String(v)).toLocaleDateString() : "—",
                      },
                    ] as ListColumn[]
                  }
                  data={assessments as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No vendor assessments"
                  emptyDescription="Assess vendor risk to manage supply chain exposure."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "market" && (
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
                      key: "instrument",
                      header: "Instrument",
                      render: (v) => (
                        <span className="font-medium">{String(v)}</span>
                      ),
                    },
                    {
                      key: "exposureAmount",
                      header: "Exposure",
                      render: (v) => fmt(Number(v)),
                    },
                    {
                      key: "hedged",
                      header: "Hedged",
                      render: (v) =>
                        v ? (
                          <span className="text-green-600 font-medium">
                            Yes
                          </span>
                        ) : (
                          <span className="text-red-500 font-medium">No</span>
                        ),
                    },
                    {
                      key: "counterparty",
                      header: "Counterparty",
                      render: (v) => String(v),
                    },
                    {
                      key: "maturityDate",
                      header: "Maturity",
                      render: (v) => new Date(String(v)).toLocaleDateString(),
                    },
                    {
                      key: "id",
                      header: "Actions",
                      render: (v, row) => (
                        <div className="flex gap-1">
                          {!row.hedged && (
                            <button
                              onClick={() => handleHedge(String(v))}
                              className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                            >
                              Hedge
                            </button>
                          )}
                          <button
                            onClick={() => handleCloseExposure(String(v))}
                            className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                          >
                            Close
                          </button>
                        </div>
                      ),
                    },
                  ] as ListColumn[]
                }
                data={exposures as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No market exposures"
                emptyDescription="Market exposure data will appear here."
              />
            )}
          </Card>
        )}

        {activeTab === "operational" && (
          <div className="ui-stack-4">
            <Card className="ui-list-card">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Risk Events ({events.length})
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
                        key: "eventType",
                        header: "Type",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "description",
                        header: "Description",
                        render: (v) => String(v),
                      },
                      {
                        key: "severity",
                        header: "Severity",
                        render: (v) => (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${v === "CRITICAL" ? "bg-red-100 text-red-700" : v === "HIGH" ? "bg-orange-100 text-orange-700" : v === "MEDIUM" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "RESOLVED" ? "ui-badge-green" : "ui-badge-red"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "occurredAt",
                        header: "Date",
                        render: (v) => new Date(String(v)).toLocaleDateString(),
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v, row) =>
                          row.status !== "RESOLVED" && (
                            <button
                              onClick={() => handleResolveEvent(String(v))}
                              className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                            >
                              Resolve
                            </button>
                          ),
                      },
                    ] as ListColumn[]
                  }
                  data={events as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No risk events"
                  emptyDescription="No operational risk events recorded."
                />
              )}
            </Card>

            <Card className="ui-list-card">
              <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <h3 className="font-semibold text-sm">
                  Control Measures ({controls.length})
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowControlForm(!showControlForm)}
                >
                  <Plus size={14} className="mr-1" /> Create Control
                </Button>
              </div>
              {showControlForm && (
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="ui-form-grid">
                    <div className="ui-form-group">
                      <label className="ui-label">Control Name</label>
                      <input
                        className="ui-input"
                        value={controlForm.controlName}
                        onChange={(e) =>
                          setControlForm({
                            ...controlForm,
                            controlName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Type</label>
                      <select
                        className="ui-input"
                        value={controlForm.controlType}
                        onChange={(e) =>
                          setControlForm({
                            ...controlForm,
                            controlType: e.target.value,
                          })
                        }
                      >
                        <option value="PREVENTIVE">Preventive</option>
                        <option value="DETECTIVE">Detective</option>
                        <option value="CORRECTIVE">Corrective</option>
                      </select>
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Owner</label>
                      <input
                        className="ui-input"
                        value={controlForm.owner}
                        onChange={(e) =>
                          setControlForm({
                            ...controlForm,
                            owner: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="ui-form-actions pt-2">
                      <Button
                        size="sm"
                        onClick={handleCreateControl}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : null}{" "}
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowControlForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "controlName",
                        header: "Control",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "controlType",
                        header: "Type",
                        render: (v) => (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "owner",
                        header: "Owner",
                        render: (v) => String(v),
                      },
                      {
                        key: "effectiveness",
                        header: "Effectiveness",
                        render: (v) => (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${v === "HIGH" ? "bg-green-100 text-green-700" : v === "MEDIUM" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "lastTested",
                        header: "Last Tested",
                        render: (v) =>
                          v ? new Date(String(v)).toLocaleDateString() : "—",
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v) => (
                          <button
                            onClick={() => handleTestControl(String(v))}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Test Control
                          </button>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={controls as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No controls"
                  emptyDescription="Create control measures to mitigate risks."
                />
              )}
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
