"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Leaf,
  RefreshCw,
  Loader2,
  Plus,
  BarChart3,
  FileText,
  Target,
  Check,
  AlertTriangle,
  TrendingDown,
  ClipboardList,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface EmissionRecord {
  id: string;
  scope: string;
  category: string;
  tons: number;
  period: string;
  verified: boolean;
}

interface OffsetCredit {
  id: string;
  projectName: string;
  credits: number;
  vintage: string;
  retired: boolean;
}

interface KpiDefinition {
  id: string;
  kpiName: string;
  unit: string;
  targetValue: number;
  category: string;
}

interface KpiValue {
  id: string;
  kpiId: string;
  kpiName: string;
  value: number;
  period: string;
}

interface ReportTemplate {
  id: string;
  templateName: string;
  framework: string;
  lastGenerated: string | null;
}

interface DisclosureMapping {
  id: string;
  standard: string;
  requirement: string;
  mappedKpi: string;
  status: string;
}

interface SustainabilityTarget {
  id: string;
  targetName: string;
  targetYear: number;
  baselineValue: number;
  targetValue: number;
  category: string;
  status: string;
}

const fmtNum = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 1 });

export default function EsgAccountingPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "emissions") as string;

  const [emissions, setEmissions] = useState<EmissionRecord[]>([]);
  const [offsets, setOffsets] = useState<OffsetCredit[]>([]);
  const [kpiDefs, setKpiDefs] = useState<KpiDefinition[]>([]);
  const [kpiValues, setKpiValues] = useState<KpiValue[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [disclosures, setDisclosures] = useState<DisclosureMapping[]>([]);
  const [targets, setTargets] = useState<SustainabilityTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showEmissionForm, setShowEmissionForm] = useState(false);
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [showKpiValueForm, setShowKpiValueForm] = useState(false);
  const [showDisclosureForm, setShowDisclosureForm] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);

  const [emissionForm, setEmissionForm] = useState({
    scope: "1",
    category: "",
    tons: "",
    period: "",
  });
  const [kpiDefForm, setKpiDefForm] = useState({
    kpiName: "",
    unit: "",
    targetValue: "",
    category: "ENVIRONMENTAL",
  });
  const [kpiValueForm, setKpiValueForm] = useState({
    kpiId: "",
    value: "",
    period: "",
  });
  const [disclosureForm, setDisclosureForm] = useState({
    standard: "GRI",
    requirement: "",
    mappedKpi: "",
  });
  const [targetForm, setTargetForm] = useState({
    targetName: "",
    targetYear: "2030",
    baselineValue: "",
    targetValue: "",
    category: "EMISSIONS",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [e, o, kd, kv, rt, dm, st] = await Promise.all([
        client.get<EmissionRecord[]>("/advanced-finance/esg/emissions"),
        client.get<OffsetCredit[]>("/advanced-finance/esg/offset-credits"),
        client.get<KpiDefinition[]>("/advanced-finance/esg/kpi-definitions"),
        client.get<KpiValue[]>("/advanced-finance/esg/kpi-values"),
        client.get<ReportTemplate[]>("/advanced-finance/esg/report-templates"),
        client.get<DisclosureMapping[]>(
          "/advanced-finance/esg/disclosure-mappings",
        ),
        client.get<SustainabilityTarget[]>("/advanced-finance/esg/targets"),
      ]);
      setEmissions(e);
      setOffsets(o);
      setKpiDefs(kd);
      setKpiValues(kv);
      setTemplates(rt);
      setDisclosures(dm);
      setTargets(st);
    } catch {
      setError("Failed to load ESG data.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecordEmission = async () => {
    if (!emissionForm.category) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/esg/emissions", {
        ...emissionForm,
        tons: parseFloat(emissionForm.tons),
      });
      setSuccess("Emission recorded.");
      setShowEmissionForm(false);
      setEmissionForm({ scope: "1", category: "", tons: "", period: "" });
      fetchData();
    } catch {
      setError("Failed to record emission.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetireOffset = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/esg/offset-credits/${id}/retire`,
        {},
      );
      setSuccess("Offset credit retired.");
      fetchData();
    } catch {
      setError("Failed to retire offset.");
    }
  };

  const handleDefineKpi = async () => {
    if (!kpiDefForm.kpiName) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/esg/kpi-definitions", {
        ...kpiDefForm,
        targetValue: parseFloat(kpiDefForm.targetValue),
      });
      setSuccess("KPI defined.");
      setShowKpiForm(false);
      setKpiDefForm({
        kpiName: "",
        unit: "",
        targetValue: "",
        category: "ENVIRONMENTAL",
      });
      fetchData();
    } catch {
      setError("Failed to define KPI.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordKpiValue = async () => {
    if (!kpiValueForm.kpiId || !kpiValueForm.value) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/esg/kpi-values", {
        kpiId: kpiValueForm.kpiId,
        value: parseFloat(kpiValueForm.value),
        period: kpiValueForm.period,
      });
      setSuccess("KPI value recorded.");
      setShowKpiValueForm(false);
      setKpiValueForm({ kpiId: "", value: "", period: "" });
      fetchData();
    } catch {
      setError("Failed to record KPI value.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/esg/report-templates/${id}/generate`,
        {},
      );
      setSuccess("Report generated.");
      fetchData();
    } catch {
      setError("Failed to generate report.");
    }
  };

  const handleCreateDisclosure = async () => {
    if (!disclosureForm.requirement) return;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/esg/disclosure-mappings",
        disclosureForm,
      );
      setSuccess("Disclosure mapping created.");
      setShowDisclosureForm(false);
      setDisclosureForm({ standard: "GRI", requirement: "", mappedKpi: "" });
      fetchData();
    } catch {
      setError("Failed to create disclosure mapping.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetTarget = async () => {
    if (!targetForm.targetName) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/esg/targets", {
        ...targetForm,
        targetYear: parseInt(targetForm.targetYear),
        baselineValue: parseFloat(targetForm.baselineValue),
        targetValue: parseFloat(targetForm.targetValue),
      });
      setSuccess("Sustainability target set.");
      setShowTargetForm(false);
      setTargetForm({
        targetName: "",
        targetYear: "2030",
        baselineValue: "",
        targetValue: "",
        category: "EMISSIONS",
      });
      fetchData();
    } catch {
      setError("Failed to set target.");
    } finally {
      setActionLoading(false);
    }
  };

  const totalEmissions = emissions.reduce((s, e) => s + e.tons, 0);
  const totalOffsets = offsets.reduce((s, o) => s + o.credits, 0);

  return (
    <RouteGuard permission="finance.esg.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <nav className="ui-breadcrumb">
              <span>Finance</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span>Advanced</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span className="ui-breadcrumb-current">
                ESG & Sustainability Accounting
              </span>
            </nav>
            <div className="ui-title-section">
              <Leaf className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">ESG & Sustainability Accounting</h1>
            </div>
            <p className="ui-page-subtitle">
              Track emissions, sustainability KPIs, ESG reports and disclosures,
              and sustainability targets.
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
              Total Emissions (tCO2e)
            </h3>
            <p className="text-2xl font-bold mt-1">{fmtNum(totalEmissions)}</p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Offset Credits
            </h3>
            <p className="text-2xl font-bold mt-1">{fmtNum(totalOffsets)}</p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Active Targets
            </h3>
            <p className="text-2xl font-bold mt-1">
              {targets.filter((t) => t.status === "ACTIVE").length}
            </p>
          </Card>
        </div>

        <div className="mb-4">
          <SubTabBar
            tabs={
              [
                {
                  id: "emissions",
                  label: "Emissions",
                  href: "/finance/advanced/esg-accounting?subtab=emissions",
                  icon: TrendingDown,
                },
                {
                  id: "kpis",
                  label: "KPIs",
                  href: "/finance/advanced/esg-accounting?subtab=kpis",
                  icon: BarChart3,
                },
                {
                  id: "reports",
                  label: "Reports & Disclosures",
                  href: "/finance/advanced/esg-accounting?subtab=reports",
                  icon: FileText,
                },
                {
                  id: "targets",
                  label: "Sustainability Targets",
                  href: "/finance/advanced/esg-accounting?subtab=targets",
                  icon: Target,
                },
              ] as SubTab[]
            }
          />
        </div>

        {activeTab === "emissions" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowEmissionForm(!showEmissionForm)}>
                <Plus size={16} className="mr-1" /> Record Emission
              </Button>
            </div>
            {showEmissionForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Record Emission</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Scope</label>
                    <select
                      className="ui-input"
                      value={emissionForm.scope}
                      onChange={(e) =>
                        setEmissionForm({
                          ...emissionForm,
                          scope: e.target.value,
                        })
                      }
                    >
                      <option value="1">Scope 1 (Direct)</option>
                      <option value="2">Scope 2 (Indirect)</option>
                      <option value="3">Scope 3 (Supply Chain)</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Category</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. Natural Gas, Electricity, Travel"
                      value={emissionForm.category}
                      onChange={(e) =>
                        setEmissionForm({
                          ...emissionForm,
                          category: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Tons CO2e</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={emissionForm.tons}
                      onChange={(e) =>
                        setEmissionForm({
                          ...emissionForm,
                          tons: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Period</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. 2026-Q2"
                      value={emissionForm.period}
                      onChange={(e) =>
                        setEmissionForm({
                          ...emissionForm,
                          period: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleRecordEmission}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Record
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowEmissionForm(false)}
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
                        key: "scope",
                        header: "Scope",
                        render: (v) => (
                          <span className="font-medium">Scope {String(v)}</span>
                        ),
                      },
                      {
                        key: "category",
                        header: "Category",
                        render: (v) => String(v),
                      },
                      {
                        key: "tons",
                        header: "tCO2e",
                        render: (v) => (
                          <span className="font-semibold">
                            {fmtNum(Number(v))}
                          </span>
                        ),
                      },
                      {
                        key: "period",
                        header: "Period",
                        render: (v) => String(v),
                      },
                      {
                        key: "verified",
                        header: "Verified",
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
                  data={emissions as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No emissions recorded"
                  emptyDescription="Record your first emission entry."
                />
              )}
            </Card>
            <Card className="ui-list-card mt-4">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Offset Credits
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
                        key: "projectName",
                        header: "Project",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "credits",
                        header: "Credits",
                        render: (v) => fmtNum(Number(v)),
                      },
                      {
                        key: "vintage",
                        header: "Vintage",
                        render: (v) => String(v),
                      },
                      {
                        key: "retired",
                        header: "Retired",
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
                        render: (v, row) =>
                          !row.retired && (
                            <button
                              onClick={() => handleRetireOffset(String(v))}
                              className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                            >
                              Retire
                            </button>
                          ),
                      },
                    ] as ListColumn[]
                  }
                  data={offsets as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No offset credits"
                  emptyDescription="Offset credit data will appear here."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "kpis" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button onClick={() => setShowKpiForm(!showKpiForm)}>
                  <Plus size={16} className="mr-1" /> Define KPI
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowKpiValueForm(!showKpiValueForm)}
                >
                  <Plus size={16} className="mr-1" /> Record Value
                </Button>
              </div>
            </div>
            {showKpiForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Define KPI</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">KPI Name</label>
                    <input
                      className="ui-input"
                      value={kpiDefForm.kpiName}
                      onChange={(e) =>
                        setKpiDefForm({
                          ...kpiDefForm,
                          kpiName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Unit</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. tCO2e, kWh, m³"
                      value={kpiDefForm.unit}
                      onChange={(e) =>
                        setKpiDefForm({ ...kpiDefForm, unit: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Target Value</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={kpiDefForm.targetValue}
                      onChange={(e) =>
                        setKpiDefForm({
                          ...kpiDefForm,
                          targetValue: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Category</label>
                    <select
                      className="ui-input"
                      value={kpiDefForm.category}
                      onChange={(e) =>
                        setKpiDefForm({
                          ...kpiDefForm,
                          category: e.target.value,
                        })
                      }
                    >
                      <option value="ENVIRONMENTAL">Environmental</option>
                      <option value="SOCIAL">Social</option>
                      <option value="GOVERNANCE">Governance</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleDefineKpi} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Define
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowKpiForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            {showKpiValueForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Record KPI Value</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">KPI</label>
                    <select
                      className="ui-input"
                      value={kpiValueForm.kpiId}
                      onChange={(e) =>
                        setKpiValueForm({
                          ...kpiValueForm,
                          kpiId: e.target.value,
                        })
                      }
                    >
                      <option value="">Select KPI...</option>
                      {kpiDefs.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.kpiName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Value</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={kpiValueForm.value}
                      onChange={(e) =>
                        setKpiValueForm({
                          ...kpiValueForm,
                          value: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Period</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. 2026-Q2"
                      value={kpiValueForm.period}
                      onChange={(e) =>
                        setKpiValueForm({
                          ...kpiValueForm,
                          period: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleRecordKpiValue}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Record
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowKpiValueForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card mb-4">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                KPI Definitions
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
                        key: "kpiName",
                        header: "KPI",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      { key: "unit", header: "Unit", render: (v) => String(v) },
                      {
                        key: "targetValue",
                        header: "Target",
                        render: (v) => fmtNum(Number(v)),
                      },
                      {
                        key: "category",
                        header: "Category",
                        render: (v) => (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                            {String(v)}
                          </span>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={kpiDefs as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No KPI definitions"
                  emptyDescription="Define your first sustainability KPI."
                />
              )}
            </Card>
            <Card className="ui-list-card">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                KPI Values
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
                        key: "kpiName",
                        header: "KPI",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "value",
                        header: "Value",
                        render: (v) => (
                          <span className="font-semibold">
                            {fmtNum(Number(v))}
                          </span>
                        ),
                      },
                      {
                        key: "period",
                        header: "Period",
                        render: (v) => String(v),
                      },
                    ] as ListColumn[]
                  }
                  data={kpiValues as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No KPI values"
                  emptyDescription="Record KPI measurement values."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "reports" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={() => setShowDisclosureForm(!showDisclosureForm)}
              >
                <Plus size={16} className="mr-1" /> Create Disclosure Mapping
              </Button>
            </div>
            {showDisclosureForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Disclosure Mapping</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Standard</label>
                    <select
                      className="ui-input"
                      value={disclosureForm.standard}
                      onChange={(e) =>
                        setDisclosureForm({
                          ...disclosureForm,
                          standard: e.target.value,
                        })
                      }
                    >
                      <option value="GRI">GRI</option>
                      <option value="SASB">SASB</option>
                      <option value="TCFD">TCFD</option>
                      <option value="IFRS_S1">IFRS S1</option>
                      <option value="IFRS_S2">IFRS S2</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Requirement</label>
                    <input
                      className="ui-input"
                      placeholder="e.g. GRI 305-1"
                      value={disclosureForm.requirement}
                      onChange={(e) =>
                        setDisclosureForm({
                          ...disclosureForm,
                          requirement: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Mapped KPI</label>
                    <input
                      className="ui-input"
                      placeholder="KPI name or ID"
                      value={disclosureForm.mappedKpi}
                      onChange={(e) =>
                        setDisclosureForm({
                          ...disclosureForm,
                          mappedKpi: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateDisclosure}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowDisclosureForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card mb-4">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Report Templates
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
                        key: "templateName",
                        header: "Template",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "framework",
                        header: "Framework",
                        render: (v) => (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "lastGenerated",
                        header: "Last Generated",
                        render: (v) =>
                          v ? new Date(String(v)).toLocaleDateString() : "—",
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v) => (
                          <button
                            onClick={() => handleGenerateReport(String(v))}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Generate Report
                          </button>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={templates as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No report templates"
                  emptyDescription="Report templates will appear here."
                />
              )}
            </Card>
            <Card className="ui-list-card">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Disclosure Mappings
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
                        key: "standard",
                        header: "Standard",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "requirement",
                        header: "Requirement",
                        render: (v) => String(v),
                      },
                      {
                        key: "mappedKpi",
                        header: "Mapped KPI",
                        render: (v) => String(v),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "MAPPED" ? "ui-badge-green" : "ui-badge-yellow"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={disclosures as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No disclosure mappings"
                  emptyDescription="Map KPIs to reporting standards."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "targets" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowTargetForm(!showTargetForm)}>
                <Plus size={16} className="mr-1" /> Set Target
              </Button>
            </div>
            {showTargetForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Set Sustainability Target</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Target Name</label>
                    <input
                      className="ui-input"
                      value={targetForm.targetName}
                      onChange={(e) =>
                        setTargetForm({
                          ...targetForm,
                          targetName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Target Year</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={targetForm.targetYear}
                      onChange={(e) =>
                        setTargetForm({
                          ...targetForm,
                          targetYear: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Baseline Value</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={targetForm.baselineValue}
                      onChange={(e) =>
                        setTargetForm({
                          ...targetForm,
                          baselineValue: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Target Value</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={targetForm.targetValue}
                      onChange={(e) =>
                        setTargetForm({
                          ...targetForm,
                          targetValue: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Category</label>
                    <select
                      className="ui-input"
                      value={targetForm.category}
                      onChange={(e) =>
                        setTargetForm({
                          ...targetForm,
                          category: e.target.value,
                        })
                      }
                    >
                      <option value="EMISSIONS">Emissions</option>
                      <option value="ENERGY">Energy</option>
                      <option value="WATER">Water</option>
                      <option value="WASTE">Waste</option>
                      <option value="DIVERSITY">Diversity</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleSetTarget} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Set Target
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowTargetForm(false)}
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
                        key: "targetName",
                        header: "Target",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "targetYear",
                        header: "Year",
                        render: (v) => String(v),
                      },
                      {
                        key: "baselineValue",
                        header: "Baseline",
                        render: (v) => fmtNum(Number(v)),
                      },
                      {
                        key: "targetValue",
                        header: "Target",
                        render: (v) => fmtNum(Number(v)),
                      },
                      {
                        key: "category",
                        header: "Category",
                        render: (v) => (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "ACTIVE" ? "ui-badge-green" : v === "ACHIEVED" ? "ui-badge-blue" : "ui-badge-gray"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={targets as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No sustainability targets"
                  emptyDescription="Set your first sustainability target."
                />
              )}
            </Card>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
