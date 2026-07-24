"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Plus,
  Copy,
  Lock,
  Unlock,
  FileEdit,
  Trash2,
  Loader2,
  Save,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  Card,
  Button,
  ListPageTemplate,
  type ListColumn,
  DataTable,
  type Column,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface BudgetScenario {
  id: string;
  name: string;
  description?: string;
  type: string;
  fiscalYear: number;
  isLocked: boolean;
  status: string;
  _count?: { lines: number };
}

interface BudgetScenarioLine {
  id?: string;
  accountId: string;
  month: number;
  amount: number;
  driverType?: string;
  driverValue?: number;
  driverRate?: number;
  notes?: string;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

const API = "/advanced-finance";

export default function BudgetScenariosPage() {
  const client = useApiClient();
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [selectedScenario, setSelectedScenario] =
    useState<BudgetScenario | null>(null);
  const [lines, setLines] = useState<BudgetScenarioLine[]>([]);

  const [loading, setLoading] = useState(true);
  const [linesLoading, setLinesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [showDriver, setShowDriver] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    type: "BASE",
    fiscalYear: 2026,
  });

  const [cloneForm, setCloneForm] = useState({
    name: "",
    type: "UPSIDE",
  });

  const [driverForm, setDriverForm] = useState({
    accountId: "",
    driverType: "HEADCOUNT" as "HEADCOUNT" | "UNITS" | "PERCENTAGE",
    driverValue: "10",
    driverRate: "5000",
  });

  // Track manual cell updates
  const [editedCells, setEditedCells] = useState<Record<string, string>>({}); // keyed by accountId-month

  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [scenRes, accRes] = await Promise.all([
        client.get<BudgetScenario[]>(`${API}/budget-scenarios`),
        client.get<GLAccount[]>(`${API}/accounts`),
      ]);
      setScenarios(scenRes);
      setAccounts(accRes);
    } catch {
      setError("Failed to fetch scenarios or chart of accounts");
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchScenarioLines = useCallback(
    async (scenarioId: string) => {
      setLinesLoading(true);
      setEditedCells({});
      try {
        const data = await client.get<{ lines: BudgetScenarioLine[] }>(
          `${API}/budget-scenarios/${scenarioId}`,
        );
        setLines(data.lines);
      } catch {
        setError("Failed to load budget scenario lines");
      } finally {
        setLinesLoading(false);
      }
    },
    [client],
  );

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  useEffect(() => {
    if (selectedScenario) {
      fetchScenarioLines(selectedScenario.id);
    }
  }, [selectedScenario, fetchScenarioLines]);

  const handleCreate = async () => {
    if (!createForm.name) return;
    setActionLoading(true);
    try {
      await client.post(`${API}/budget-scenarios`, createForm);
      {
        setSuccess("Budget scenario created successfully");
        setShowCreate(false);
        setCreateForm({
          name: "",
          description: "",
          type: "BASE",
          fiscalYear: 2026,
        });
        fetchScenarios();
      }
    } catch {
      setError("Failed to create scenario");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClone = async () => {
    if (!selectedScenario || !cloneForm.name) return;
    setActionLoading(true);
    try {
      await client.post(
        `${API}/budget-scenarios/${selectedScenario.id}/clone`,
        cloneForm,
      );
      {
        setSuccess("Scenario cloned successfully");
        setShowClone(false);
        fetchScenarios();
      }
    } catch {
      setError("Failed to clone scenario");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLockToggle = async () => {
    if (!selectedScenario) return;
    setActionLoading(true);
    const endpoint = selectedScenario.isLocked ? "unlock" : "lock";
    try {
      await client.post(
        `${API}/budget-scenarios/${selectedScenario.id}/${endpoint}`,
      );
      {
        setSuccess(
          selectedScenario.isLocked
            ? "Scenario unlocked"
            : "Scenario approved and locked",
        );
        // Refresh scenario
        setSelectedScenario(
          await client.get<BudgetScenario>(
            `${API}/budget-scenarios/${selectedScenario.id}`,
          ),
        );
        fetchScenarios();
      }
    } catch {
      setError("Failed to toggle lock status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm("Are you sure you want to delete/archive this budget scenario?")
    )
      return;
    try {
      await client.delete(`${API}/budget-scenarios/${id}`);
      {
        setSuccess("Scenario archived");
        if (selectedScenario?.id === id) setSelectedScenario(null);
        fetchScenarios();
      }
    } catch {
      setError("Failed to delete scenario");
    }
  };

  const handleDriverApply = async () => {
    if (!selectedScenario || !driverForm.accountId) return;
    setActionLoading(true);
    try {
      await client.post(
        `${API}/budget-scenarios/${selectedScenario.id}/driver`,
        {
          accountId: driverForm.accountId,
          driverType: driverForm.driverType,
          driverValue: parseFloat(driverForm.driverValue),
          driverRate: parseFloat(driverForm.driverRate),
        },
      );
      {
        setSuccess("Driver parameters computed and applied to Q1-Q4 months.");
        setShowDriver(false);
        fetchScenarioLines(selectedScenario.id);
      }
    } catch {
      setError("Failed to apply driver calculation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCellChange = (
    accountId: string,
    month: number,
    value: string,
  ) => {
    setEditedCells((prev) => ({
      ...prev,
      [`${accountId}-${month}`]: value,
    }));
  };

  const handleSaveCell = async (accountId: string, month: number) => {
    if (!selectedScenario) return;
    const key = `${accountId}-${month}`;
    const value = editedCells[key];
    if (value === undefined) return;

    try {
      await client.post(
        `${API}/budget-scenarios/${selectedScenario.id}/lines`,
        {
          accountId,
          month,
          amount: parseFloat(value) || 0,
        },
      );
      {
        // Clear edited indicator
        setEditedCells((prev) => {
          const c = { ...prev };
          delete c[key];
          return c;
        });
        fetchScenarioLines(selectedScenario.id);
      }
    } catch {
      setError("Failed to save budget cell change");
    }
  };

  // Organize scenario lines by accountId-month for rendering lookup
  const lineMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const line of lines) {
      map.set(`${line.accountId}-${line.month}`, Number(line.amount));
    }
    return map;
  }, [lines]);

  const monthColumns: Column<GLAccount>[] = Array.from(
    { length: 12 },
    (_, i) => {
      const month = i + 1;
      return {
        key: `month-${month}`,
        header: `Month ${month}`,
        align: "right" as const,
        render: (acc: GLAccount) => {
          const cellKey = `${acc.id}-${month}`;
          const val = lineMap.get(cellKey) || 0;
          const isEdited = editedCells[cellKey] !== undefined;
          const displayVal = isEdited ? editedCells[cellKey] : val.toString();
          return (
            <input
              type="number"
              className={`w-full text-right p-1 text-sm border rounded focus:ring-1 focus:outline-none ${
                selectedScenario?.isLocked
                  ? "bg-gray-50 border-transparent cursor-not-allowed"
                  : isEdited
                    ? "border-amber-400 bg-amber-50 focus:ring-amber-500"
                    : "border-gray-200 focus:ring-blue-500"
              }`}
              value={displayVal}
              onChange={(e) => handleCellChange(acc.id, month, e.target.value)}
              onBlur={() => handleSaveCell(acc.id, month)}
              disabled={selectedScenario?.isLocked}
            />
          );
        },
      };
    },
  );

  const monthlyGridColumns: Column<GLAccount>[] = [
    {
      key: "account",
      header: "GL Account",
      render: (acc) => (
        <div>
          <div className="text-xs text-gray-400">{acc.code}</div>
          <div className="truncate font-semibold text-gray-700">{acc.name}</div>
        </div>
      ),
    },
    ...monthColumns,
    {
      key: "rowTotal",
      header: "Row Total",
      align: "right" as const,
      render: (acc) => {
        let rowTotal = 0;
        for (let m = 1; m <= 12; m++) {
          rowTotal += lineMap.get(`${acc.id}-${m}`) || 0;
        }
        return (
          <span className="font-bold text-gray-800">
            $
            {rowTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        );
      },
    },
  ];

  return (
    <RouteGuard permission="finance.budget-scenarios.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <nav className="ui-breadcrumb">
              <span>Finance</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span>FP&A</span>
              <span className="ui-breadcrumb-sep">/</span>
              <span className="ui-breadcrumb-current">Budget Scenarios</span>
            </nav>
            <div className="ui-title-section">
              <Layers className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">Budget Scenarios & Drivers</h1>
            </div>
            <p className="ui-page-subtitle">
              Configure month-by-month budget planning, clone base scenarios,
              and calculate labor or unit driver projections.
            </p>
          </div>

          <div className="ui-page-actions">
            {selectedScenario ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedScenario(null)}
                >
                  Back to List
                </Button>
                <Button variant="secondary" onClick={() => setShowClone(true)}>
                  <Copy size={16} className="mr-1" /> Branch Scenario
                </Button>
                {!selectedScenario.isLocked && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowDriver(true)}
                  >
                    <Sparkles size={16} className="mr-1 text-purple-600" />{" "}
                    Apply Driver
                  </Button>
                )}
                <Button
                  variant={selectedScenario.isLocked ? "secondary" : "primary"}
                  onClick={handleLockToggle}
                  disabled={actionLoading}
                >
                  {selectedScenario.isLocked ? (
                    <>
                      <Unlock size={16} className="mr-1" /> Unlock Draft
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="mr-1" /> Approve & Lock
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-1" /> New Scenario
              </Button>
            )}
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

        {/* Main Scenarios List View */}
        {!selectedScenario ? (
          <Card className="ui-list-card">
            {loading ? (
              <div className="ui-loading">
                <Loader2 className="animate-spin mr-2" size={20} /> Loading
                budget scenarios...
              </div>
            ) : scenarios.length === 0 ? (
              <div className="ui-empty-state">
                <Layers size={40} className="ui-empty-icon" />
                <p>No budget scenarios found for this tenant.</p>
                <p className="text-xs text-gray-500 mt-1">
                  Create a "FY2026 Base" draft scenario to start driver
                  budgeting.
                </p>
              </div>
            ) : (
              <ListPageTemplate
                columns={
                  [
                    {
                      key: "name",
                      header: "Scenario Name",
                      render: (v, row) => (
                        <div
                          onClick={() => setSelectedScenario(row as any)}
                          className="cursor-pointer"
                        >
                          <div className="font-semibold text-blue-600 hover:underline">
                            {String(v)}
                          </div>
                          {Boolean(row.description) && (
                            <div className="text-xs text-gray-500">
                              {String(row.description)}
                            </div>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: "type",
                      header: "Type",
                      render: (v) => (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded">
                          {String(v)}
                        </span>
                      ),
                    },
                    { key: "fiscalYear", header: "Fiscal Year" },
                    {
                      key: "_count",
                      header: "Lines Entered",
                      render: (v) => (
                        <span className="font-medium text-gray-600">
                          {(v as any)?.lines || 0}
                        </span>
                      ),
                    },
                    {
                      key: "isLocked",
                      header: "Status",
                      render: (v) => (
                        <span
                          className={`ui-badge ${v ? "ui-badge-green" : "ui-badge-gray"}`}
                        >
                          {v ? "LOCKED / APPROVED" : "DRAFT"}
                        </span>
                      ),
                    },
                    {
                      key: "id",
                      header: "Actions",
                      render: (v) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(String(v));
                          }}
                          className="ui-action-btn ui-action-btn-danger"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      ),
                    },
                  ] as ListColumn[]
                }
                data={scenarios as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No budget scenarios found"
                emptyDescription="Create a scenario to start driver budgeting."
              />
            )}
          </Card>
        ) : (
          /* Scenario Details & Monthly Grid View */
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-blue-800">
                  Current View:
                </span>{" "}
                {selectedScenario.name} ({selectedScenario.type}) | Fiscal Year:{" "}
                {selectedScenario.fiscalYear}
              </div>
              {selectedScenario.isLocked && (
                <div className="flex items-center gap-1 text-green-700 font-semibold">
                  <Lock size={12} /> Approved / Read-Only
                </div>
              )}
            </div>

            <Card className="ui-list-card overflow-x-auto">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Monthly Budget Grid
              </h3>
              <DataTable
                columns={monthlyGridColumns}
                data={accounts}
                rowKey={(acc) => acc.id}
                loading={linesLoading}
                emptyTitle="No GL accounts found"
                emptyMessage="No accounts are available to budget for this scenario."
              />
            </Card>
          </div>
        )}

        {/* Create Dialog */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <Card className="ui-form-card max-w-md w-full p-6">
              <h3 className="ui-form-title">Create Budget Scenario</h3>
              <div className="flex flex-col gap-3 my-4">
                <div className="ui-form-group">
                  <label className="ui-label">Scenario Name</label>
                  <input
                    className="ui-input"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    placeholder="e.g. FY2026 Base Draft"
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Description</label>
                  <input
                    className="ui-input"
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Notes or scope guidelines..."
                  />
                </div>
                <div className="ui-grid-2">
                  <div className="ui-form-group">
                    <label className="ui-label">Type</label>
                    <select
                      className="ui-input"
                      value={createForm.type}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, type: e.target.value })
                      }
                    >
                      <option value="BASE">Base Case</option>
                      <option value="UPSIDE">Upside Case</option>
                      <option value="DOWNSIDE">Downside Case</option>
                      <option value="CUSTOM">Custom Scenario</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Fiscal Year</label>
                    <input
                      type="number"
                      className="ui-input"
                      value={createForm.fiscalYear}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          fiscalYear: parseInt(e.target.value, 10) || 2026,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="ui-form-actions mt-6">
                <Button onClick={handleCreate} disabled={actionLoading}>
                  Create
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Clone Dialog */}
        {showClone && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <Card className="ui-form-card max-w-md w-full p-6">
              <h3 className="ui-form-title">Branch Scenario</h3>
              <p className="text-xs text-gray-500 my-2">
                Clone scenario metadata and all budget lines to create a new
                branch.
              </p>
              <div className="flex flex-col gap-3 my-4">
                <div className="ui-form-group">
                  <label className="ui-label">New Scenario Name</label>
                  <input
                    className="ui-input"
                    value={cloneForm.name}
                    onChange={(e) =>
                      setCloneForm({ ...cloneForm, name: e.target.value })
                    }
                    placeholder="e.g. FY2026 High Inflation"
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Scenario Type</label>
                  <select
                    className="ui-input"
                    value={cloneForm.type}
                    onChange={(e) =>
                      setCloneForm({ ...cloneForm, type: e.target.value })
                    }
                  >
                    <option value="BASE">Base Case</option>
                    <option value="UPSIDE">Upside Case</option>
                    <option value="DOWNSIDE">Downside Case</option>
                    <option value="CUSTOM">Custom Scenario</option>
                  </select>
                </div>
              </div>
              <div className="ui-form-actions mt-6">
                <Button onClick={handleClone} disabled={actionLoading}>
                  Clone Scenario
                </Button>
                <Button variant="secondary" onClick={() => setShowClone(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Driver Dialog */}
        {showDriver && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <Card className="ui-form-card max-w-md w-full p-6">
              <h3 className="ui-form-title">Apply Driver Calculation</h3>
              <p className="text-xs text-gray-500 my-2">
                Generate monthly budget amounts using structural driver
                computations.
              </p>
              <div className="flex flex-col gap-3 my-4">
                <div className="ui-form-group">
                  <label className="ui-label">Target GL Account</label>
                  <select
                    className="ui-input"
                    value={driverForm.accountId}
                    onChange={(e) =>
                      setDriverForm({
                        ...driverForm,
                        accountId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Account...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Driver Type</label>
                  <select
                    className="ui-input"
                    value={driverForm.driverType}
                    onChange={(e) =>
                      setDriverForm({
                        ...driverForm,
                        driverType: e.target.value as any,
                      })
                    }
                  >
                    <option value="HEADCOUNT">
                      Headcount (FTEs × Monthly Rate)
                    </option>
                    <option value="UNITS">
                      Sales Units (Units Sold × Price Per Unit)
                    </option>
                    <option value="PERCENTAGE">Markup Percentage</option>
                  </select>
                </div>
                <div className="ui-grid-2">
                  <div className="ui-form-group">
                    <label className="ui-label">
                      {driverForm.driverType === "HEADCOUNT"
                        ? "FTE Count"
                        : driverForm.driverType === "UNITS"
                          ? "Unit Quantity"
                          : "Base Amount"}
                    </label>
                    <input
                      type="number"
                      className="ui-input"
                      value={driverForm.driverValue}
                      onChange={(e) =>
                        setDriverForm({
                          ...driverForm,
                          driverValue: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">
                      {driverForm.driverType === "HEADCOUNT"
                        ? "Salary Rate / Mo"
                        : driverForm.driverType === "UNITS"
                          ? "Rate per Unit"
                          : "Multiplier %"}
                    </label>
                    <input
                      type="number"
                      className="ui-input"
                      value={driverForm.driverRate}
                      onChange={(e) =>
                        setDriverForm({
                          ...driverForm,
                          driverRate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="ui-form-actions mt-6">
                <Button onClick={handleDriverApply} disabled={actionLoading}>
                  Compute & Populate
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDriver(false)}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
