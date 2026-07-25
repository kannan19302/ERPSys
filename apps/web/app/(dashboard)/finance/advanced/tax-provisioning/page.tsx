"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calculator,
  RefreshCw,
  Loader2,
  Plus,
  Play,
  Check,
  AlertTriangle,
  FileText,
  Scale,
  DollarSign,
  Shield,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface ProvisionRun {
  id: string;
  runName: string;
  period: string;
  jurisdiction: string;
  totalProvision: number;
  status: string;
  startedAt: string;
}

interface DeferredSchedule {
  id: string;
  accountName: string;
  temporaryDifference: number;
  taxRate: number;
  deferredTax: number;
  classification: string;
  period: string;
}

interface UncertainPosition {
  id: string;
  positionName: string;
  taxAuthority: string;
  exposureAmount: number;
  probabilityOfSuccess: number;
  status: string;
}

interface ValuationAllowance {
  id: string;
  entityName: string;
  deferredTaxAsset: number;
  allowanceAmount: number;
  rationale: string;
  period: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function TaxProvisioningPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "runs") as string;

  const [runs, setRuns] = useState<ProvisionRun[]>([]);
  const [schedules, setSchedules] = useState<DeferredSchedule[]>([]);
  const [positions, setPositions] = useState<UncertainPosition[]>([]);
  const [allowances, setAllowances] = useState<ValuationAllowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showRunForm, setShowRunForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [showAllowanceForm, setShowAllowanceForm] = useState(false);

  const [runForm, setRunForm] = useState({
    runName: "",
    period: "",
    jurisdiction: "US_Federal",
  });
  const [scheduleForm, setScheduleForm] = useState({
    accountName: "",
    temporaryDifference: "",
    taxRate: "21",
    classification: "LIABILITY",
    period: "",
  });
  const [positionForm, setPositionForm] = useState({
    positionName: "",
    taxAuthority: "",
    exposureAmount: "",
    probabilityOfSuccess: "50",
  });
  const [allowanceForm, setAllowanceForm] = useState({
    entityName: "",
    deferredTaxAsset: "",
    rationale: "",
    period: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r, s, p, a] = await Promise.all([
        client.get<ProvisionRun[]>(
          "/advanced-finance/tax-provision/provision-runs",
        ),
        client.get<DeferredSchedule[]>(
          "/advanced-finance/tax-provision/deferred-schedules",
        ),
        client.get<UncertainPosition[]>(
          "/advanced-finance/tax-provision/uncertain-positions",
        ),
        client.get<ValuationAllowance[]>(
          "/advanced-finance/tax-provision/valuation-allowances",
        ),
      ]);
      setRuns(r);
      setSchedules(s);
      setPositions(p);
      setAllowances(a);
    } catch {
      setError("Failed to load tax provision data.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRun = async () => {
    if (!runForm.runName || !runForm.period) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/tax-provision/provision-runs",
        runForm,
      );
      setSuccess("Provision run created.");
      setShowRunForm(false);
      setRunForm({ runName: "", period: "", jurisdiction: "US_Federal" });
      fetchData();
    } catch {
      setError("Failed to create provision run.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComputeProvision = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/tax-provision/provision-runs/${id}/compute`,
        {},
      );
      setSuccess("Provision computed.");
      fetchData();
    } catch {
      setError("Failed to compute provision.");
    }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleForm.accountName) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/tax-provision/deferred-schedules", {
        ...scheduleForm,
        temporaryDifference: parseFloat(scheduleForm.temporaryDifference),
        taxRate: parseFloat(scheduleForm.taxRate),
      });
      setSuccess("Deferred schedule created.");
      setShowScheduleForm(false);
      setScheduleForm({
        accountName: "",
        temporaryDifference: "",
        taxRate: "21",
        classification: "LIABILITY",
        period: "",
      });
      fetchData();
    } catch {
      setError("Failed to create deferred schedule.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEvaluatePosition = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/tax-provision/uncertain-positions/${id}/evaluate`,
        {},
      );
      setSuccess("Uncertain position evaluated.");
      fetchData();
    } catch {
      setError("Failed to evaluate position.");
    }
  };

  const handleCreatePosition = async () => {
    if (!positionForm.positionName) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/tax-provision/uncertain-positions", {
        ...positionForm,
        exposureAmount: parseFloat(positionForm.exposureAmount),
        probabilityOfSuccess: parseFloat(positionForm.probabilityOfSuccess),
      });
      setSuccess("Uncertain position created.");
      setShowPositionForm(false);
      setPositionForm({
        positionName: "",
        taxAuthority: "",
        exposureAmount: "",
        probabilityOfSuccess: "50",
      });
      fetchData();
    } catch {
      setError("Failed to create uncertain position.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssessAllowance = async () => {
    if (!allowanceForm.entityName) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/tax-provision/valuation-allowances",
        {
          ...allowanceForm,
          deferredTaxAsset: parseFloat(allowanceForm.deferredTaxAsset),
        },
      );
      setSuccess("Valuation allowance assessed.");
      setShowAllowanceForm(false);
      setAllowanceForm({
        entityName: "",
        deferredTaxAsset: "",
        rationale: "",
        period: "",
      });
      fetchData();
    } catch {
      setError("Failed to assess allowance.");
    } finally {
      setActionLoading(false);
    }
  };

  const totalProvision = runs.reduce((s, r) => s + r.totalProvision, 0);

  return (
    <RouteGuard permission="finance.tax.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <nav className="ui-breadcrumb">
              <span>Finance</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span>Advanced</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span className="ui-breadcrumb-current">
                ASC 740 Tax Provisioning
              </span>
            </nav>
            <div className="ui-title-section">
              <Calculator className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">ASC 740 Tax Provisioning</h1>
            </div>
            <p className="ui-page-subtitle">
              Manage provision runs, deferred tax schedules, uncertain tax
              positions, and valuation allowances.
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
              Total Provision
            </h3>
            <p className="text-2xl font-bold mt-1">{fmt(totalProvision)}</p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Deferred Schedules
            </h3>
            <p className="text-2xl font-bold mt-1">{schedules.length}</p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Uncertain Positions
            </h3>
            <p className="text-2xl font-bold mt-1">{positions.length}</p>
          </Card>
        </div>

        <div className="mb-4">
          <SubTabBar
            tabs={
              [
                {
                  id: "runs",
                  label: "Provision Runs",
                  href: "/finance/advanced/tax-provisioning?subtab=runs",
                  icon: Play,
                },
                {
                  id: "deferred",
                  label: "Deferred Tax",
                  href: "/finance/advanced/tax-provisioning?subtab=deferred",
                  icon: FileText,
                },
                {
                  id: "positions",
                  label: "Uncertain Positions",
                  href: "/finance/advanced/tax-provisioning?subtab=positions",
                  icon: Scale,
                },
                {
                  id: "allowances",
                  label: "Valuation Allowances",
                  href: "/finance/advanced/tax-provisioning?subtab=allowances",
                  icon: Shield,
                },
              ] as SubTab[]
            }
          />
        </div>

        {activeTab === "runs" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowRunForm(!showRunForm)}>
                <Plus size={16} className="mr-1" /> Create Run
              </Button>
            </div>
            {showRunForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Provision Run</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Run Name</label>
                    <input
                      className="ui-input"
                      value={runForm.runName}
                      onChange={(e) =>
                        setRunForm({ ...runForm, runName: e.target.value })
                      }
                    />
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
                  <div className="ui-form-group">
                    <label className="ui-label">Jurisdiction</label>
                    <select
                      className="ui-input"
                      value={runForm.jurisdiction}
                      onChange={(e) =>
                        setRunForm({ ...runForm, jurisdiction: e.target.value })
                      }
                    >
                      <option value="US_Federal">US Federal</option>
                      <option value="US_State">US State</option>
                      <option value="International">International</option>
                      <option value="Multi">Multi-Jurisdiction</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateRun} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
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
                        key: "runName",
                        header: "Run",
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
                        key: "jurisdiction",
                        header: "Jurisdiction",
                        render: (v) => String(v).replace(/_/g, " "),
                      },
                      {
                        key: "totalProvision",
                        header: "Provision",
                        render: (v) => fmt(Number(v)),
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
                        key: "id",
                        header: "Actions",
                        render: (v, row) =>
                          row.status === "DRAFT" && (
                            <button
                              onClick={() => handleComputeProvision(String(v))}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                            >
                              Compute Provision
                            </button>
                          ),
                      },
                    ] as ListColumn[]
                  }
                  data={runs as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No provision runs"
                  emptyDescription="Create your first ASC 740 provision run."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "deferred" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowScheduleForm(!showScheduleForm)}>
                <Plus size={16} className="mr-1" /> Create Deferred Schedule
              </Button>
            </div>
            {showScheduleForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Deferred Tax Schedule</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Account Name</label>
                    <input
                      className="ui-input"
                      value={scheduleForm.accountName}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          accountName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Temporary Difference ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={scheduleForm.temporaryDifference}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          temporaryDifference: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Tax Rate (%)</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={scheduleForm.taxRate}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          taxRate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Classification</label>
                    <select
                      className="ui-input"
                      value={scheduleForm.classification}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          classification: e.target.value,
                        })
                      }
                    >
                      <option value="LIABILITY">Deferred Tax Liability</option>
                      <option value="ASSET">Deferred Tax Asset</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Period</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. 2026-Q2"
                      value={scheduleForm.period}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          period: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateSchedule}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowScheduleForm(false)}
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
                        key: "accountName",
                        header: "Account",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "temporaryDifference",
                        header: "Temp Difference",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "taxRate",
                        header: "Rate %",
                        render: (v) => `${Number(v).toFixed(1)}%`,
                      },
                      {
                        key: "deferredTax",
                        header: "Deferred Tax",
                        render: (v) => (
                          <span className="font-semibold">
                            {fmt(Number(v))}
                          </span>
                        ),
                      },
                      {
                        key: "classification",
                        header: "Type",
                        render: (v) => (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${v === "LIABILITY" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={schedules as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No deferred schedules"
                  emptyDescription="Create a deferred tax schedule."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "positions" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowPositionForm(!showPositionForm)}>
                <Plus size={16} className="mr-1" /> Create Uncertain Position
              </Button>
            </div>
            {showPositionForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Uncertain Tax Position</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Position Name</label>
                    <input
                      className="ui-input"
                      value={positionForm.positionName}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          positionName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Tax Authority</label>
                    <input
                      className="ui-input"
                      value={positionForm.taxAuthority}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          taxAuthority: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Exposure Amount ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={positionForm.exposureAmount}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          exposureAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">
                      Probability of Success (%)
                    </label>
                    <input
                      className="ui-input"
                      type="number"
                      min="0"
                      max="100"
                      value={positionForm.probabilityOfSuccess}
                      onChange={(e) =>
                        setPositionForm({
                          ...positionForm,
                          probabilityOfSuccess: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreatePosition}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowPositionForm(false)}
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
                        key: "positionName",
                        header: "Position",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "taxAuthority",
                        header: "Authority",
                        render: (v) => String(v),
                      },
                      {
                        key: "exposureAmount",
                        header: "Exposure",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "probabilityOfSuccess",
                        header: "Success %",
                        render: (v) => `${Number(v)}%`,
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "EVALUATED" ? "ui-badge-green" : v === "UNDER_REVIEW" ? "ui-badge-yellow" : "ui-badge-gray"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v, row) =>
                          row.status !== "EVALUATED" && (
                            <button
                              onClick={() => handleEvaluatePosition(String(v))}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                            >
                              Evaluate
                            </button>
                          ),
                      },
                    ] as ListColumn[]
                  }
                  data={positions as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No uncertain positions"
                  emptyDescription="Add uncertain tax positions for evaluation."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "allowances" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowAllowanceForm(!showAllowanceForm)}>
                <Plus size={16} className="mr-1" /> Assess Allowance
              </Button>
            </div>
            {showAllowanceForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Assess Valuation Allowance</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Entity Name</label>
                    <input
                      className="ui-input"
                      value={allowanceForm.entityName}
                      onChange={(e) =>
                        setAllowanceForm({
                          ...allowanceForm,
                          entityName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Deferred Tax Asset ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={allowanceForm.deferredTaxAsset}
                      onChange={(e) =>
                        setAllowanceForm({
                          ...allowanceForm,
                          deferredTaxAsset: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Rationale</label>
                    <input
                      className="ui-input"
                      placeholder="Why partial allowance?"
                      value={allowanceForm.rationale}
                      onChange={(e) =>
                        setAllowanceForm({
                          ...allowanceForm,
                          rationale: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Period</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. 2026-Q2"
                      value={allowanceForm.period}
                      onChange={(e) =>
                        setAllowanceForm({
                          ...allowanceForm,
                          period: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleAssessAllowance}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Assess
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAllowanceForm(false)}
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
                        key: "deferredTaxAsset",
                        header: "DTA",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "allowanceAmount",
                        header: "Allowance",
                        render: (v) => (
                          <span className="font-semibold">
                            {fmt(Number(v))}
                          </span>
                        ),
                      },
                      {
                        key: "rationale",
                        header: "Rationale",
                        render: (v) => String(v) || "—",
                      },
                      {
                        key: "period",
                        header: "Period",
                        render: (v) => String(v),
                      },
                    ] as ListColumn[]
                  }
                  data={allowances as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No valuation allowances"
                  emptyDescription="Assess valuation allowances for deferred tax assets."
                />
              )}
            </Card>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
