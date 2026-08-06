"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  RefreshCw,
  Loader2,
  Plus,
  Check,
  AlertTriangle,
  ShoppingCart,
  Route,
  CreditCard,
  Play,
  Search,
  Zap,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui/layout";

interface CaptureBatch {
  id: string;
  batchName: string;
  invoiceCount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface CaptureResult {
  id: string;
  batchId: string;
  vendorName: string;
  invoiceNumber: string;
  amount: number;
  confidence: number;
  validated: boolean;
}

interface MatchRule {
  id: string;
  ruleName: string;
  matchType: string;
  tolerance: number;
  priority: number;
  active: boolean;
}

interface ApprovalRule {
  id: string;
  ruleName: string;
  condition: string;
  approver: string;
  threshold: number;
  active: boolean;
}

interface PaymentOptimization {
  id: string;
  recommendation: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  recommendedRail: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function ApAutomationV2Page() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "capture") as string;

  const [batches, setBatches] = useState<CaptureBatch[]>([]);
  const [results, setResults] = useState<CaptureResult[]>([]);
  const [matchRules, setMatchRules] = useState<MatchRule[]>([]);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [optimizations, setOptimizations] = useState<PaymentOptimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const [showBatchForm, setShowBatchForm] = useState(false);
  const [showMatchRuleForm, setShowMatchRuleForm] = useState(false);
  const [showApprovalRuleForm, setShowApprovalRuleForm] = useState(false);

  const [batchForm, setBatchForm] = useState({
    batchName: "",
    invoiceCount: "1",
    totalAmount: "",
  });
  const [matchRuleForm, setMatchRuleForm] = useState({
    ruleName: "",
    matchType: "THREE_WAY",
    tolerance: "5",
    priority: "1",
  });
  const [approvalRuleForm, setApprovalRuleForm] = useState({
    ruleName: "",
    condition: "AMOUNT_EXCEEDS",
    approver: "",
    threshold: "10000",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [b, r, mr, ar, po] = await Promise.all([
        client.get<CaptureBatch[]>(
          "/advanced-finance/ap-automation/capture-batches",
        ),
        client.get<CaptureResult[]>(
          "/advanced-finance/ap-automation/capture-results",
        ),
        client.get<MatchRule[]>("/advanced-finance/ap-automation/match-rules"),
        client.get<ApprovalRule[]>(
          "/advanced-finance/ap-automation/approval-rules",
        ),
        client.get<PaymentOptimization[]>(
          "/advanced-finance/ap-automation/payment-optimizations",
        ),
      ]);
      setBatches(b);
      setResults(r);
      setMatchRules(mr);
      setApprovalRules(ar);
      setOptimizations(po);
    } catch {
      setError("Failed to load AP automation data.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateBatch = async () => {
    if (!batchForm.batchName) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/ap-automation/capture-batches", {
        ...batchForm,
        invoiceCount: parseInt(batchForm.invoiceCount),
        totalAmount: parseFloat(batchForm.totalAmount || "0"),
      });
      setSuccess("Capture batch created.");
      setShowBatchForm(false);
      setBatchForm({ batchName: "", invoiceCount: "1", totalAmount: "" });
      fetchData();
    } catch {
      setError("Failed to create batch.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessBatch = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/ap-automation/capture-batches/${id}/process`,
        {},
      );
      setSuccess("Batch processed.");
      fetchData();
    } catch {
      setError("Failed to process batch.");
    }
  };

  const handleValidateResult = async (id: string, valid: boolean) => {
    try {
      await client.patch(
        `/advanced-finance/ap-automation/capture-results/${id}`,
        { validated: valid },
      );
      setSuccess(`Result ${valid ? "validated" : "rejected"}.`);
      fetchData();
    } catch {
      setError("Failed to update result.");
    }
  };

  const handleCreateMatchRule = async () => {
    if (!matchRuleForm.ruleName) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/ap-automation/match-rules", {
        ...matchRuleForm,
        tolerance: parseFloat(matchRuleForm.tolerance),
        priority: parseInt(matchRuleForm.priority),
      });
      setSuccess("Match rule created.");
      setShowMatchRuleForm(false);
      setMatchRuleForm({
        ruleName: "",
        matchType: "THREE_WAY",
        tolerance: "5",
        priority: "1",
      });
      fetchData();
    } catch {
      setError("Failed to create match rule.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateApprovalRule = async () => {
    if (!approvalRuleForm.ruleName) return;
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/ap-automation/approval-rules", {
        ...approvalRuleForm,
        threshold: parseFloat(approvalRuleForm.threshold),
      });
      setSuccess("Approval rule created.");
      setShowApprovalRuleForm(false);
      setApprovalRuleForm({
        ruleName: "",
        condition: "AMOUNT_EXCEEDS",
        approver: "",
        threshold: "10000",
      });
      fetchData();
    } catch {
      setError("Failed to create approval rule.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecommendRail = async () => {
    try {
      await client.post(
        "/advanced-finance/ap-automation/payment-optimizations/recommend",
        {},
      );
      setSuccess("Payment rail recommendation generated.");
      fetchData();
    } catch {
      setError("Failed to recommend rail.");
    }
  };

  const handleExecuteOptimization = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/ap-automation/payment-optimizations/${id}/execute`,
        {},
      );
      setSuccess("Optimization executed.");
      fetchData();
    } catch {
      setError("Failed to execute optimization.");
    }
  };

  const filteredResults = selectedBatchId
    ? results.filter((r) => r.batchId === selectedBatchId)
    : results;
  const totalSavings = optimizations.reduce((s, o) => s + o.savings, 0);

  return (
    <RouteGuard permission="finance.ap.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <nav className="ui-breadcrumb">
              <span>Finance</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span>Advanced</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span className="ui-breadcrumb-current">AP Automation</span>
            </nav>
            <div className="ui-title-section">
              <ShoppingCart className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">AP Automation</h1>
            </div>
            <p className="ui-page-subtitle">
              Invoice capture, match rules, approval routing, and payment rail
              optimization.
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
              Capture Batches
            </h3>
            <p className="text-2xl font-bold mt-1">{batches.length}</p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Active Rules
            </h3>
            <p className="text-2xl font-bold mt-1">
              {matchRules.filter((r) => r.active).length +
                approvalRules.filter((r) => r.active).length}
            </p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Potential Savings
            </h3>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {fmt(totalSavings)}
            </p>
          </Card>
        </div>

        <div className="mb-4">
          <SubTabBar
            tabs={
              [
                {
                  id: "capture",
                  label: "Invoice Capture",
                  href: "/finance/advanced/ap-automation-v2?subtab=capture",
                  icon: FileText,
                },
                {
                  id: "match",
                  label: "Match Rules",
                  href: "/finance/advanced/ap-automation-v2?subtab=match",
                  icon: Search,
                },
                {
                  id: "approval",
                  label: "Approval Routing",
                  href: "/finance/advanced/ap-automation-v2?subtab=approval",
                  icon: Route,
                },
                {
                  id: "payment",
                  label: "Payment Rail Optimization",
                  href: "/finance/advanced/ap-automation-v2?subtab=payment",
                  icon: Zap,
                },
              ] as SubTab[]
            }
          />
        </div>

        {activeTab === "capture" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button onClick={() => setShowBatchForm(!showBatchForm)}>
                  <Plus size={16} className="mr-1" /> Create Batch
                </Button>
                {batches.length > 0 && (
                  <select
                    className="ui-input max-w-[200px]"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                  >
                    <option value="">All Batches</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            {showBatchForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Capture Batch</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Batch Name</label>
                    <input
                      className="ui-input"
                      value={batchForm.batchName}
                      onChange={(e) =>
                        setBatchForm({
                          ...batchForm,
                          batchName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Invoice Count</label>
                    <input
                      className="ui-input"
                      type="number"
                      min="1"
                      value={batchForm.invoiceCount}
                      onChange={(e) =>
                        setBatchForm({
                          ...batchForm,
                          invoiceCount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Total Amount ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={batchForm.totalAmount}
                      onChange={(e) =>
                        setBatchForm({
                          ...batchForm,
                          totalAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateBatch} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowBatchForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card mb-4">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Capture Batches
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
                        key: "batchName",
                        header: "Batch",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "invoiceCount",
                        header: "Invoices",
                        render: (v) => String(v),
                      },
                      {
                        key: "totalAmount",
                        header: "Total",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v) => (
                          <span
                            className={`ui-badge ${v === "PROCESSED" ? "ui-badge-green" : v === "PROCESSING" ? "ui-badge-blue" : "ui-badge-yellow"}`}
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
                              onClick={() => handleProcessBatch(String(v))}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                            >
                              <Play size={12} className="mr-1" /> Process
                            </button>
                          ),
                      },
                    ] as ListColumn[]
                  }
                  data={batches as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No capture batches"
                  emptyDescription="Create a batch to start capturing invoices."
                />
              )}
            </Card>
            <Card className="ui-list-card">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Capture Results ({filteredResults.length})
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
                        key: "vendorName",
                        header: "Vendor",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "invoiceNumber",
                        header: "Invoice #",
                        render: (v) => String(v),
                      },
                      {
                        key: "amount",
                        header: "Amount",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "confidence",
                        header: "Confidence",
                        render: (v) => (
                          <span
                            className={`font-semibold ${Number(v) > 90 ? "text-green-600" : Number(v) > 70 ? "text-amber-600" : "text-red-600"}`}
                          >
                            {Number(v).toFixed(0)}%
                          </span>
                        ),
                      },
                      {
                        key: "validated",
                        header: "Validated",
                        render: (v) =>
                          v ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          ),
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v, row) =>
                          !row.validated && (
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  handleValidateResult(String(v), true)
                                }
                                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                              >
                                Validate
                              </button>
                              <button
                                onClick={() =>
                                  handleValidateResult(String(v), false)
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
                  data={filteredResults as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No capture results"
                  emptyDescription="Process a batch to see capture results."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "match" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowMatchRuleForm(!showMatchRuleForm)}>
                <Plus size={16} className="mr-1" /> Create Match Rule
              </Button>
            </div>
            {showMatchRuleForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Match Rule</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Rule Name</label>
                    <input
                      className="ui-input"
                      value={matchRuleForm.ruleName}
                      onChange={(e) =>
                        setMatchRuleForm({
                          ...matchRuleForm,
                          ruleName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Match Type</label>
                    <select
                      className="ui-input"
                      value={matchRuleForm.matchType}
                      onChange={(e) =>
                        setMatchRuleForm({
                          ...matchRuleForm,
                          matchType: e.target.value,
                        })
                      }
                    >
                      <option value="THREE_WAY">
                        3-Way (PO + Receipt + Invoice)
                      </option>
                      <option value="TWO_WAY">2-Way (PO + Invoice)</option>
                      <option value="AMOUNT">Amount Only</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Tolerance (%)</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={matchRuleForm.tolerance}
                      onChange={(e) =>
                        setMatchRuleForm({
                          ...matchRuleForm,
                          tolerance: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Priority</label>
                    <input
                      className="ui-input"
                      type="number"
                      min="1"
                      value={matchRuleForm.priority}
                      onChange={(e) =>
                        setMatchRuleForm({
                          ...matchRuleForm,
                          priority: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateMatchRule}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowMatchRuleForm(false)}
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
                        key: "matchType",
                        header: "Type",
                        render: (v) => String(v).replace(/_/g, " "),
                      },
                      {
                        key: "tolerance",
                        header: "Tolerance %",
                        render: (v) => `${Number(v)}%`,
                      },
                      {
                        key: "priority",
                        header: "Priority",
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
                  data={matchRules as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No match rules"
                  emptyDescription="Create match rules to automate invoice matching."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "approval" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={() => setShowApprovalRuleForm(!showApprovalRuleForm)}
              >
                <Plus size={16} className="mr-1" /> Create Approval Rule
              </Button>
            </div>
            {showApprovalRuleForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Approval Rule</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Rule Name</label>
                    <input
                      className="ui-input"
                      value={approvalRuleForm.ruleName}
                      onChange={(e) =>
                        setApprovalRuleForm({
                          ...approvalRuleForm,
                          ruleName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Condition</label>
                    <select
                      className="ui-input"
                      value={approvalRuleForm.condition}
                      onChange={(e) =>
                        setApprovalRuleForm({
                          ...approvalRuleForm,
                          condition: e.target.value,
                        })
                      }
                    >
                      <option value="AMOUNT_EXCEEDS">Amount Exceeds</option>
                      <option value="NEW_VENDOR">New Vendor</option>
                      <option value="CATEGORY">Category Match</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Approver</label>
                    <input
                      className="ui-input"
                      value={approvalRuleForm.approver}
                      onChange={(e) =>
                        setApprovalRuleForm({
                          ...approvalRuleForm,
                          approver: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Threshold ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={approvalRuleForm.threshold}
                      onChange={(e) =>
                        setApprovalRuleForm({
                          ...approvalRuleForm,
                          threshold: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateApprovalRule}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowApprovalRuleForm(false)}
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
                        key: "condition",
                        header: "Condition",
                        render: (v) => String(v).replace(/_/g, " "),
                      },
                      {
                        key: "approver",
                        header: "Approver",
                        render: (v) => String(v),
                      },
                      {
                        key: "threshold",
                        header: "Threshold",
                        render: (v) => fmt(Number(v)),
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
                  data={approvalRules as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No approval rules"
                  emptyDescription="Create approval routing rules for AP."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "payment" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={handleRecommendRail} disabled={actionLoading}>
                <Zap size={16} className="mr-1" /> Recommend Rail
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
                        key: "recommendation",
                        header: "Recommendation",
                        render: (v) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "currentCost",
                        header: "Current Cost",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "optimizedCost",
                        header: "Optimized Cost",
                        render: (v) => fmt(Number(v)),
                      },
                      {
                        key: "savings",
                        header: "Savings",
                        render: (v) => (
                          <span className="font-semibold text-green-600">
                            {fmt(Number(v))}
                          </span>
                        ),
                      },
                      {
                        key: "recommendedRail",
                        header: "Rail",
                        render: (v) => (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v) => (
                          <button
                            onClick={() => handleExecuteOptimization(String(v))}
                            className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                          >
                            Execute
                          </button>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={optimizations as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No payment optimizations"
                  emptyDescription="Click 'Recommend Rail' to generate optimization suggestions."
                />
              )}
            </Card>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
