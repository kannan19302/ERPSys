"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Play,
  Calendar,
  CheckCircle,
  RefreshCw,
  Trash2,
  FileText,
  ChevronRight,
  AlertCircle,
  Info,
  Settings,
} from "lucide-react";
import {
  Card,
  Button,
  Badge,
  ListPageTemplate,
  type ListColumn,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface CostCenter {
  id: string;
  code: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface AllocationTarget {
  accountId: string;
  costCenterId?: string;
  departmentId?: string;
  percentage?: number;
  ratioWeight?: number;
}

interface AllocationRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  allocationType: "STATIC_PCT" | "DYNAMIC_STAT";
  basisType: "HEADCOUNT" | "SQUARE_FOOTAGE" | "REVENUE" | null;
  sourceAccountId: string;
  sourceAccount: Account;
  targetAllocations: AllocationTarget[];
}

interface AllocationRun {
  id: string;
  rule: AllocationRule;
  runDate: string;
  periodStart: string;
  periodEnd: string;
  allocatedAmount: number;
  journalId: string | null;
  status: "DRAFT" | "POSTED";
}

export default function AllocationsPage() {
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [runs, setRuns] = useState<AllocationRun[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "rules") as
    | "rules"
    | "runs";
  const setActiveTab = useCallback(
    (tab: "rules" | "runs") => {
      router.push(`/finance/advanced/allocations?subtab=${tab}`);
    },
    [router],
  );
  const [showCreate, setShowCreate] = useState(false);
  const [showRun, setShowRun] = useState<AllocationRule | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states for Create Rule
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allocationType, setAllocationType] = useState<
    "STATIC_PCT" | "DYNAMIC_STAT"
  >("STATIC_PCT");
  const [basisType, setBasisType] = useState<
    "HEADCOUNT" | "SQUARE_FOOTAGE" | "REVENUE"
  >("HEADCOUNT");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [targets, setTargets] = useState<AllocationTarget[]>([
    { accountId: "" },
  ]);

  // Form states for Run Rule
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, runsRes, accountsRes, ccRes, deptRes] =
        await Promise.all([
          apiGet<AllocationRule[]>("/advanced-finance/allocations/rules"),
          apiGet<AllocationRun[]>("/advanced-finance/allocations/runs"),
          apiGet<Account[]>("/advanced-finance/accounts"),
          apiGet<CostCenter[]>("/advanced-finance/cost-centers").catch(
            () => [],
          ),
          apiGet<{ data: Department[] }>("/hr/departments").catch(() => ({
            data: [],
          })),
        ]);
      setRules(rulesRes || []);
      setRuns(runsRes || []);
      setAccounts(accountsRes || []);
      setCostCenters(ccRes || []);
      setDepartments(deptRes.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load allocations dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTarget = () => {
    setTargets([...targets, { accountId: "" }]);
  };

  const handleRemoveTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const handleTargetChange = (
    index: number,
    key: keyof AllocationTarget,
    value: any,
  ) => {
    const updated = [...targets];
    updated[index] = { ...updated[index], [key]: value } as any;
    setTargets(updated);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        name,
        description: description || undefined,
        allocationType,
        basisType: allocationType === "DYNAMIC_STAT" ? basisType : undefined,
        sourceAccountId,
        targetAllocations: targets.map((t) => ({
          accountId: t.accountId,
          costCenterId: t.costCenterId || undefined,
          departmentId: t.departmentId || undefined,
          percentage:
            allocationType === "STATIC_PCT" ? Number(t.percentage) : undefined,
        })),
      };

      await apiPost("/advanced-finance/allocations/rules", payload);
      setShowCreate(false);
      // Reset form
      setName("");
      setDescription("");
      setSourceAccountId("");
      setTargets([{ accountId: "" }]);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to create allocation rule.");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this allocation rule?"))
      return;
    try {
      await apiDelete(`/advanced-finance/allocations/rules/${id}`);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete rule.");
    }
  };

  const handleToggleActive = async (rule: AllocationRule) => {
    try {
      await apiPatch(`/advanced-finance/allocations/rules/${rule.id}`, {
        isActive: !rule.isActive,
      });
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to toggle status.");
    }
  };

  const handleExecuteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRun) return;
    setError(null);
    try {
      await apiPost(`/advanced-finance/allocations/rules/${showRun.id}/run`, {
        periodStart,
        periodEnd,
      });
      setShowRun(null);
      setPeriodStart("");
      setPeriodEnd("");
      setActiveTab("runs");
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to execute allocation run.");
    }
  };

  const handlePostRun = async (id: string) => {
    try {
      await apiPost(`/advanced-finance/allocations/runs/${id}/post`);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to post allocation run.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold ui-text-primary">
            Dynamic Allocations
          </h1>
          <p className="text-sm ui-text-muted mt-1">
            Automate expense and revenue distributions using static percentages
            or dynamic drivers
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} /> New Rule
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <SubTabBar
        tabs={
          [
            {
              id: "rules",
              label: `Allocation Rules (${rules.length})`,
              href: "/finance/advanced/allocations?subtab=rules",
              icon: Settings,
            },
            {
              id: "runs",
              label: `Run Logs & Execution (${runs.length})`,
              href: "/finance/advanced/allocations?subtab=runs",
              icon: Calendar,
            },
          ] as SubTab[]
        }
      />

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw size={24} className="animate-spin text-indigo-600" />
        </div>
      ) : activeTab === "rules" ? (
        rules.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <Info className="mx-auto text-gray-400" size={32} />
            <p className="font-medium text-gray-700">
              No allocation rules found
            </p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Create a rule to define how to distribute pool balances from one
              account to target accounts and cost centers.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreate(true)}
            >
              Create First Rule
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <Card
                key={rule.id}
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{rule.name}</h3>
                      <p className="text-xs text-gray-500">
                        {rule.description || "No description provided"}
                      </p>
                    </div>
                    <Badge variant={rule.isActive ? "success" : "default"}>
                      {rule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-gray-500 block">
                        Source Account
                      </span>
                      <span className="font-medium text-gray-800">
                        {rule.sourceAccount.code} - {rule.sourceAccount.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Type</span>
                      <span className="font-medium text-gray-800">
                        {rule.allocationType === "STATIC_PCT"
                          ? "Static Percentages"
                          : `Dynamic: ${rule.basisType}`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs text-gray-500 block mb-1">
                      Targets Allocation
                    </span>
                    <div className="max-h-24 overflow-y-auto space-y-1 bg-gray-50 p-2 rounded">
                      {rule.targetAllocations.map((t, idx) => {
                        const acc = accounts.find((a) => a.id === t.accountId);
                        const cc = costCenters.find(
                          (c) => c.id === t.costCenterId,
                        );
                        const dept = departments.find(
                          (d) => d.id === t.departmentId,
                        );
                        return (
                          <div
                            key={idx}
                            className="text-xs flex justify-between text-gray-700"
                          >
                            <span>
                              {acc ? `${acc.code} ${acc.name}` : t.accountId}
                              {cc && ` (CC: ${cc.name})`}
                              {dept && ` (Dept: ${dept.name})`}
                            </span>
                            <span className="font-semibold">
                              {rule.allocationType === "STATIC_PCT"
                                ? `${t.percentage}%`
                                : "Dynamic Ratio"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleActive(rule)}
                    >
                      {rule.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 size={12} className="mr-1 inline" /> Delete
                    </Button>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setShowRun(rule)}
                  >
                    <Play size={10} /> Run Allocation
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : runs.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <Calendar className="mx-auto text-gray-400" size={32} />
          <p className="font-medium text-gray-700">No allocation runs logged</p>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Execute a rule run to calculate and post the distributions for a
            specific accounting period.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <ListPageTemplate
            columns={
              [
                {
                  key: "runDate",
                  header: "Run Date",
                  render: (v) => new Date(String(v)).toLocaleDateString(),
                },
                {
                  key: "rule",
                  header: "Rule",
                  render: (v) => (
                    <span className="font-medium text-gray-800">
                      {(v as any)?.name || "Deleted Rule"}
                    </span>
                  ),
                },
                {
                  key: "periodStart",
                  header: "Allocation Period",
                  render: (v, row) =>
                    `${new Date(String(v)).toLocaleDateString()} - ${new Date(String(row.periodEnd)).toLocaleDateString()}`,
                },
                {
                  key: "allocatedAmount",
                  header: "Allocated Amount",
                  render: (v) => (
                    <span className="font-semibold">
                      $
                      {Number(v).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (v) => (
                    <Badge variant={v === "POSTED" ? "success" : "warning"}>
                      {String(v)}
                    </Badge>
                  ),
                },
                {
                  key: "id",
                  header: "Actions",
                  render: (v, row) => (
                    <div className="text-right">
                      {row.status === "DRAFT" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePostRun(String(v))}
                        >
                          Approve &amp; Post
                        </Button>
                      )}
                      {Boolean(row.journalId) && (
                        <span className="text-xs text-gray-500 ml-2">
                          Journal Created
                        </span>
                      )}
                    </div>
                  ),
                },
              ] as ListColumn[]
            }
            data={runs as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No allocation runs"
            emptyDescription="Execute a rule run to calculate and post distributions."
          />
        </Card>
      )}

      {/* Modal - Create Allocation Rule */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Create Allocation Rule
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-xl"
                onClick={() => setShowCreate(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Rule Name *
                  </label>
                  <input
                    className="ui-input w-full"
                    placeholder="e.g. Overhead IT Allocations"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Source Pool Account *
                  </label>
                  <select
                    className="ui-input w-full"
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    required
                  >
                    <option value="">Select Pool Account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">
                  Description
                </label>
                <textarea
                  className="ui-input w-full h-16 resize-none"
                  placeholder="Purpose of this allocation rule..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Allocation Type *
                  </label>
                  <select
                    className="ui-input w-full"
                    value={allocationType}
                    onChange={(e) => setAllocationType(e.target.value as any)}
                    required
                  >
                    <option value="STATIC_PCT">Static Percentage</option>
                    <option value="DYNAMIC_STAT">
                      Dynamic Stat (Headcount/Revenue)
                    </option>
                  </select>
                </div>
                {allocationType === "DYNAMIC_STAT" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">
                      Dynamic Basis *
                    </label>
                    <select
                      className="ui-input w-full"
                      value={basisType}
                      onChange={(e) => setBasisType(e.target.value as any)}
                      required
                    >
                      <option value="HEADCOUNT">
                        Active Headcount (by Department)
                      </option>
                      <option value="REVENUE">
                        Revenue Ratios (by Account)
                      </option>
                      <option value="SQUARE_FOOTAGE">
                        Square Footage (Equal Split fallback)
                      </option>
                    </select>
                  </div>
                )}
              </div>

              {/* Targets Section */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">
                    Target Distributions
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddTarget}
                  >
                    Add Target
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {targets.map((t, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        className="ui-input text-xs flex-1"
                        value={t.accountId}
                        onChange={(e) =>
                          handleTargetChange(idx, "accountId", e.target.value)
                        }
                        required
                      >
                        <option value="">Select Target Account</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>

                      {allocationType === "DYNAMIC_STAT" &&
                      basisType === "HEADCOUNT" ? (
                        <select
                          className="ui-input text-xs w-36"
                          value={t.departmentId || ""}
                          onChange={(e) =>
                            handleTargetChange(
                              idx,
                              "departmentId",
                              e.target.value,
                            )
                          }
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          className="ui-input text-xs w-36"
                          value={t.costCenterId || ""}
                          onChange={(e) =>
                            handleTargetChange(
                              idx,
                              "costCenterId",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Cost Center (Opt)</option>
                          {costCenters.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {allocationType === "STATIC_PCT" && (
                        <input
                          type="number"
                          placeholder="%"
                          className="ui-input text-xs w-16 text-center"
                          value={t.percentage || ""}
                          onChange={(e) =>
                            handleTargetChange(
                              idx,
                              "percentage",
                              e.target.value,
                            )
                          }
                          required
                        />
                      )}

                      {targets.length > 1 && (
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 text-sm"
                          onClick={() => handleRemoveTarget(idx)}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Allocation Rule
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal - Execute Run */}
      {showRun && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Execute Allocation Run
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-xl"
                onClick={() => setShowRun(null)}
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded text-xs text-gray-700 space-y-1">
              <p>
                <strong>Rule:</strong> {showRun.name}
              </p>
              <p>
                <strong>Source:</strong> {showRun.sourceAccount?.code} -{" "}
                {showRun.sourceAccount?.name}
              </p>
              <p>
                <strong>Method:</strong>{" "}
                {showRun.allocationType === "STATIC_PCT"
                  ? "Static Percentage"
                  : `Dynamic: ${showRun.basisType}`}
              </p>
            </div>

            <form onSubmit={handleExecuteRun} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Period Start Date *
                  </label>
                  <input
                    type="date"
                    className="ui-input w-full"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Period End Date *
                  </label>
                  <input
                    type="date"
                    className="ui-input w-full"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRun(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Play size={12} /> Execute Distribution
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
