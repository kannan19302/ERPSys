"use client";

import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  Badge,
  Modal,
  TextField,
  FormField,
  Select,
  KPICard,
  DataTable,
  type Column,
} from "@unerp/ui";
import {
  Target,
  TrendingUp,
  Plus,
  PieChart,
  Layers,
  RefreshCw,
  Edit2,
  Trash2,
  BarChart2,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X,
  Shield,
  ArrowRight,
  Check,
  Ban,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

const BUDGETING_TABS: SubTab[] = [
  {
    id: "budgets",
    label: "Allocated Budgets",
    href: "/finance/advanced/budgeting?subtab=budgets",
    icon: Target,
  },
  {
    id: "reallocations",
    label: "Budget Reallocations",
    href: "/finance/advanced/budgeting?subtab=reallocations",
    icon: RefreshCw,
  },
  {
    id: "config",
    label: "Active Control Config",
    href: "/finance/advanced/budgeting?subtab=config",
    icon: Shield,
  },
];

interface GLAccount {
  id: string;
  code: string;
  name: string;
}

interface BudgetScenario {
  id: string;
  name: string;
  status: string;
  description?: string;
}

interface BudgetAllocation {
  id: string;
  accountId: string;
  startDate: string;
  endDate: string;
  amount: number;
  costCenterId?: string | null;
  projectId?: string | null;
  account?: {
    code: string;
    name: string;
  };
  costCenter?: {
    name: string;
  };
  project?: {
    name: string;
  };
}

interface BudgetVsActualData {
  fiscalYear: string;
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  items: Array<{
    accountId: string;
    accountName: string;
    accountCode: string;
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePercent: number;
  }>;
}

interface BudgetControlConfig {
  enforcementAction: "ALLOW" | "WARN" | "BLOCK";
  checkInvoices: boolean;
  checkJournals: boolean;
  checkExpenses: boolean;
  tolerancePercentage: number;
}

interface ReallocationLine {
  id: string;
  budgetId: string;
  type: "SOURCE" | "DESTINATION";
  amount: number;
  budget?: BudgetAllocation;
}

interface BudgetReallocation {
  id: string;
  number: string;
  description?: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  requestedBy: string;
  approvedBy?: string;
  createdAt: string;
  lines: ReallocationLine[];
}

function fmtBalance(b: string | number) {
  const val = typeof b === "string" ? parseFloat(b) : b;
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BudgetingPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "budgets") as
    | "budgets"
    | "reallocations"
    | "config";
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [reallocations, setReallocations] = useState<BudgetReallocation[]>([]);
  const [config, setConfig] = useState<BudgetControlConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Budget Create/Edit State
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetAllocation | null>(
    null,
  );
  const [budgetData, setBudgetData] = useState({
    accountId: "",
    amount: "",
    startDate: "",
    endDate: "",
    costCenterId: "",
    projectId: "",
    spreadMethod: "EVEN",
  });
  const [savingBudget, setSavingBudget] = useState(false);

  // Reallocation Create State
  const [showReallocForm, setShowReallocForm] = useState(false);
  const [reallocData, setReallocData] = useState({
    sourceBudgetId: "",
    destBudgetId: "",
    amount: "",
    description: "",
  });
  const [savingRealloc, setSavingRealloc] = useState(false);

  // Scenario Create State
  const [showScenarioForm, setShowScenarioForm] = useState(false);
  const [scenarioData, setScenarioData] = useState({
    name: "",
    description: "",
    status: "DRAFT",
  });
  const [savingScenario, setSavingScenario] = useState(false);

  // Budget Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<BudgetAllocation | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // Vs Actuals Modal State
  const [vsActualOpen, setVsActualOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetAllocation | null>(
    null,
  );
  const [vsActualData, setVsActualData] = useState<BudgetVsActualData | null>(
    null,
  );
  const [vsActualLoading, setVsActualLoading] = useState(false);

  // Config Update Saving state
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budRes, scnRes, accRes, configRes, reallocRes] = await Promise.all(
        [
          client.get<BudgetAllocation[]>("/advanced-finance/budgets"),
          client.get<BudgetScenario[]>("/advanced-finance/forecast-scenarios"),
          client.get<GLAccount[]>("/advanced-finance/accounts"),
          client.get<BudgetControlConfig>(
            "/advanced-finance/budget-control/config",
          ),
          client.get<BudgetReallocation[]>(
            "/advanced-finance/budget-reallocations",
          ),
        ],
      );
      setBudgets(budRes);
      setScenarios(scnRes);
      setAccounts(accRes);
      setConfig(configRes);
      setReallocations(reallocRes);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setBudgetData({
      accountId: "",
      amount: "",
      startDate: "",
      endDate: "",
      costCenterId: "",
      projectId: "",
      spreadMethod: "EVEN",
    });
    setShowBudgetForm(true);
  };

  const handleOpenEdit = (budget: BudgetAllocation) => {
    setEditingBudget(budget);
    setBudgetData({
      accountId: budget.accountId,
      amount: String(budget.amount),
      startDate: new Date(budget.startDate).toISOString().split("T")[0] || "",
      endDate: new Date(budget.endDate).toISOString().split("T")[0] || "",
      costCenterId: budget.costCenterId || "",
      projectId: budget.projectId || "",
      spreadMethod: "EVEN", // default to even on edit
    });
    setShowBudgetForm(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    try {
      const url = editingBudget
        ? `/advanced-finance/budgets/${editingBudget.id}`
        : "/advanced-finance/budgets";
      const method = editingBudget ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        accountId: budgetData.accountId,
        amount: parseFloat(budgetData.amount) || 0,
        startDate: budgetData.startDate,
        endDate: budgetData.endDate,
        costCenterId: budgetData.costCenterId || null,
        projectId: budgetData.projectId || null,
        spreadMethod: budgetData.spreadMethod,
      };

      await client.request(url, {
        method,
        body: JSON.stringify(body),
      });
      setShowBudgetForm(false);
      setEditingBudget(null);
      fetchData();
    } catch {
      alert("Network error");
    } finally {
      setSavingBudget(false);
    }
  };

  const confirmDelete = (budget: BudgetAllocation) => {
    setDeletingBudget(budget);
    setDeleteOpen(true);
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;
    setDeleting(true);
    try {
      await client.delete(`/advanced-finance/budgets/${deletingBudget.id}`);
      setDeleteOpen(false);
      setDeletingBudget(null);
      fetchData();
    } catch {
      alert("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const loadVsActuals = async (budget: BudgetAllocation) => {
    setSelectedBudget(budget);
    setVsActualLoading(true);
    setVsActualOpen(true);
    try {
      setVsActualData(
        await client.get<BudgetVsActualData>(
          `/advanced-finance/budgets/${budget.id}/vs-actuals`,
        ),
      );
    } catch {
      /* handled */
    } finally {
      setVsActualLoading(false);
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingScenario(true);
    try {
      await client.post("/advanced-finance/forecast-scenarios", scenarioData);
      setShowScenarioForm(false);
      setScenarioData({ name: "", description: "", status: "DRAFT" });
      fetchData();
    } catch {
      alert("Network error");
    } finally {
      setSavingScenario(false);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSavingConfig(true);
    try {
      await client.request("/advanced-finance/budget-control/config", {
        method: "PATCH",
        body: JSON.stringify({
          enforcementAction: config.enforcementAction,
          checkInvoices: config.checkInvoices,
          checkJournals: config.checkJournals,
          checkExpenses: config.checkExpenses,
          tolerancePercentage: Number(config.tolerancePercentage),
        }),
      });
      alert("Budget control configurations updated successfully!");
      fetchData();
    } catch {
      alert("Network error");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveRealloc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reallocData.sourceBudgetId === reallocData.destBudgetId) {
      alert("Source and destination budgets must be different.");
      return;
    }
    setSavingRealloc(true);
    try {
      await client.post("/advanced-finance/budget-reallocations", {
        description: reallocData.description,
        lines: [
          {
            budgetId: reallocData.sourceBudgetId,
            type: "SOURCE",
            amount: parseFloat(reallocData.amount) || 0,
          },
          {
            budgetId: reallocData.destBudgetId,
            type: "DESTINATION",
            amount: parseFloat(reallocData.amount) || 0,
          },
        ],
      });
      setShowReallocForm(false);
      setReallocData({
        sourceBudgetId: "",
        destBudgetId: "",
        amount: "",
        description: "",
      });
      fetchData();
    } catch {
      alert("Network error");
    } finally {
      setSavingRealloc(false);
    }
  };

  const executeReallocAction = async (
    id: string,
    action: "submit" | "approve" | "reject",
  ) => {
    try {
      let body: string | undefined;
      if (action === "reject") {
        const notes = prompt("Please enter rejection notes:");
        if (notes === null) return;
        body = JSON.stringify({ notes });
      }

      await client.request(
        `/advanced-finance/budget-reallocations/${id}/${action}`,
        {
          method: "POST",
          body,
        },
      );
      fetchData();
    } catch {
      alert("Network error");
    }
  };

  if (loading) {
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  }

  const budgetColumns: Column<BudgetAllocation>[] = [
    {
      key: "account",
      header: "Account",
      render: (b) =>
        b.account ? `${b.account.code} - ${b.account.name}` : b.accountId,
    },
    {
      key: "dimension",
      header: "Dimension",
      render: (b) =>
        b.costCenter ? (
          <span className="ui-hstack-2">
            <Layers size={12} /> {b.costCenter.name}
          </span>
        ) : b.project ? (
          <span className="ui-hstack-2">
            <PieChart size={12} /> {b.project.name}
          </span>
        ) : (
          "Company-wide"
        ),
    },
    {
      key: "period",
      header: "Period",
      render: (b) =>
        `${new Date(b.startDate).toLocaleDateString()} - ${new Date(
          b.endDate,
        ).toLocaleDateString()}`,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (b) => fmtBalance(b.amount),
    },
    {
      key: "actions",
      header: "",
      align: "right" as const,
      render: (b) => (
        <div className="ui-hstack-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadVsActuals(b)}
            title="View Budget vs Actuals"
          >
            <BarChart2 size={12} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenEdit(b)}
            title="Edit Budget"
          >
            <Edit2 size={12} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => confirmDelete(b)}
            title="Delete Budget"
            className="ui-text-danger"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      ),
    },
  ];

  const reallocationColumns: Column<BudgetReallocation>[] = [
    { key: "number", header: "Req Number", render: (r) => r.number },
    {
      key: "description",
      header: "Description",
      render: (r) => r.description || "N/A",
    },
    {
      key: "transfer",
      header: "Transfer Detail",
      render: (r) => {
        const sourceLine = r.lines.find((l) => l.type === "SOURCE");
        const destLine = r.lines.find((l) => l.type === "DESTINATION");
        if (!sourceLine || !destLine) return "Invalid Lines";
        return (
          <span className="ui-hstack-2">
            <span>{sourceLine.budget?.account?.name || "Source"}</span>
            <ArrowRight size={14} />
            <span>{destLine.budget?.account?.name || "Destination"}</span>
            <span>({fmtBalance(sourceLine.amount)})</span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge
          variant={
            r.status === "APPROVED"
              ? "success"
              : r.status === "REJECTED"
                ? "danger"
                : r.status === "SUBMITTED"
                  ? "info"
                  : "warning"
          }
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: "requestedBy",
      header: "Requested By",
      render: (r) => r.requestedBy,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="ui-hstack-2">
          {r.status === "DRAFT" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeReallocAction(r.id, "submit")}
            >
              Submit
            </Button>
          )}
          {r.status === "SUBMITTED" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="ui-text-success"
                onClick={() => executeReallocAction(r.id, "approve")}
              >
                <Check size={14} className="mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="ui-text-danger"
                onClick={() => executeReallocAction(r.id, "reject")}
              >
                <Ban size={14} className="mr-1" /> Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const vsActualColumns: Column<BudgetVsActualData["items"][number]>[] = [
    {
      key: "account",
      header: "Account Code / Name",
      render: (item) => `${item.accountCode} - ${item.accountName}`,
    },
    {
      key: "budgetAmount",
      header: "Budget Amount",
      align: "right" as const,
      render: (item) => fmtBalance(item.budgetAmount),
    },
    {
      key: "actualAmount",
      header: "Actual Amount",
      align: "right" as const,
      render: (item) => fmtBalance(item.actualAmount),
    },
    {
      key: "variance",
      header: "Variance",
      align: "right" as const,
      render: (item) => (
        <span
          className={item.variance >= 0 ? "ui-text-success" : "ui-text-danger"}
        >
          {fmtBalance(item.variance)}
        </span>
      ),
    },
    {
      key: "variancePercent",
      header: "% Diff",
      align: "right" as const,
      render: (item) => (
        <span
          className={item.variance >= 0 ? "ui-text-success" : "ui-text-danger"}
        >
          {item.variancePercent.toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <RouteGuard permission="finance.budget-scenarios.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Budgeting & Planning"
          description="Allocate general ledger budgets, configure rolling forecasts, and track performance vs actuals"
          breadcrumbs={[
            { label: "Finance", href: "/finance" },
            { label: "Budgeting & Planning" },
          ]}
          actions={
            <div className="ui-flex ui-gap-2">
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw size={14} className="mr-2" /> Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowScenarioForm(true)}
              >
                <Plus size={14} className="mr-2" /> New Scenario
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReallocForm(true)}
              >
                <Plus size={14} className="mr-2" /> Reallocate Budget
              </Button>
              <Button variant="primary" onClick={handleOpenCreate}>
                <Plus size={14} className="mr-2" /> Allocate Budget
              </Button>
            </div>
          }
        />

        <SubTabBar tabs={BUDGETING_TABS} />

        {showBudgetForm && (
          <Card>
            <div className="ui-flex-between mb-4">
              <h3 className={styles.s2}>
                {editingBudget
                  ? "Edit Budget Allocation"
                  : "Allocate New Budget"}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBudgetForm(false)}
              >
                <X size={16} />
              </Button>
            </div>
            <form onSubmit={handleSaveBudget} className="ui-stack-4">
              <div className={styles.s3}>
                <FormField label="GL Account" required>
                  <Select
                    value={budgetData.accountId}
                    onChange={(e) =>
                      setBudgetData({
                        ...budgetData,
                        accountId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <TextField
                  label="Budget Amount ($)"
                  type="number"
                  required
                  placeholder="50000"
                  value={budgetData.amount}
                  onChange={(e) =>
                    setBudgetData({ ...budgetData, amount: e.target.value })
                  }
                />
              </div>

              <div className={styles.s4}>
                <TextField
                  label="Start Date"
                  type="date"
                  required
                  value={budgetData.startDate}
                  onChange={(e) =>
                    setBudgetData({ ...budgetData, startDate: e.target.value })
                  }
                />
                <TextField
                  label="End Date"
                  type="date"
                  required
                  value={budgetData.endDate}
                  onChange={(e) =>
                    setBudgetData({ ...budgetData, endDate: e.target.value })
                  }
                />
                <FormField label="Spread Method" required>
                  <Select
                    value={budgetData.spreadMethod}
                    onChange={(e) =>
                      setBudgetData({
                        ...budgetData,
                        spreadMethod: e.target.value,
                      })
                    }
                  >
                    <option value="EVEN">EVEN Spread</option>
                    <option value="HISTORICAL_PROPORTIONAL">
                      HISTORICAL PROPORTIONAL
                    </option>
                  </Select>
                </FormField>
              </div>

              <div className={styles.s5}>
                <FormField label="Cost Center (Optional)">
                  <Select
                    value={budgetData.costCenterId}
                    onChange={(e) =>
                      setBudgetData({
                        ...budgetData,
                        costCenterId: e.target.value,
                      })
                    }
                  >
                    <option value="">Company-wide</option>
                  </Select>
                </FormField>
                <FormField label="Project (Optional)">
                  <Select
                    value={budgetData.projectId}
                    onChange={(e) =>
                      setBudgetData({
                        ...budgetData,
                        projectId: e.target.value,
                      })
                    }
                  >
                    <option value="">None</option>
                  </Select>
                </FormField>
              </div>

              <div className={styles.s6}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowBudgetForm(false)}
                  disabled={savingBudget}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={savingBudget}>
                  {savingBudget ? <Spinner size="sm" /> : "Save Budget"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {showScenarioForm && (
          <Card>
            <div className="ui-flex-between mb-4">
              <h3 className={styles.s7}>Create Forecast Scenario</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScenarioForm(false)}
              >
                <X size={16} />
              </Button>
            </div>
            <form onSubmit={handleCreateScenario} className="ui-stack-4">
              <div className={styles.s8}>
                <TextField
                  label="Scenario Name"
                  required
                  placeholder="FY2027 Optimistic Case"
                  value={scenarioData.name}
                  onChange={(e) =>
                    setScenarioData({ ...scenarioData, name: e.target.value })
                  }
                />
                <FormField label="Status" required>
                  <Select
                    value={scenarioData.status}
                    onChange={(e) =>
                      setScenarioData({
                        ...scenarioData,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                  </Select>
                </FormField>
              </div>
              <TextField
                label="Description"
                placeholder="Reflects 15% revenue growth projection"
                value={scenarioData.description}
                onChange={(e) =>
                  setScenarioData({
                    ...scenarioData,
                    description: e.target.value,
                  })
                }
              />
              <div className={styles.s9}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowScenarioForm(false)}
                  disabled={savingScenario}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={savingScenario}
                >
                  {savingScenario ? <Spinner size="sm" /> : "Create Scenario"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {showReallocForm && (
          <Card>
            <div className="ui-flex-between mb-4">
              <h3 className={styles.s10}>Create Budget Reallocation</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReallocForm(false)}
              >
                <X size={16} />
              </Button>
            </div>
            <form onSubmit={handleSaveRealloc} className="ui-stack-4">
              <div className={styles.s11}>
                <FormField label="Source Budget (Transfer FROM)" required>
                  <Select
                    value={reallocData.sourceBudgetId}
                    onChange={(e) =>
                      setReallocData({
                        ...reallocData,
                        sourceBudgetId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Source Budget</option>
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.account
                          ? `${b.account.code} - ${b.account.name}`
                          : b.accountId}{" "}
                        (Balance: {fmtBalance(b.amount)})
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Destination Budget (Transfer TO)" required>
                  <Select
                    value={reallocData.destBudgetId}
                    onChange={(e) =>
                      setReallocData({
                        ...reallocData,
                        destBudgetId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Destination Budget</option>
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.account
                          ? `${b.account.code} - ${b.account.name}`
                          : b.accountId}{" "}
                        (Balance: {fmtBalance(b.amount)})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className={styles.s12}>
                <TextField
                  label="Reallocation Amount ($)"
                  type="number"
                  required
                  placeholder="5000"
                  value={reallocData.amount}
                  onChange={(e) =>
                    setReallocData({ ...reallocData, amount: e.target.value })
                  }
                />
                <TextField
                  label="Description"
                  placeholder="Reallocate surplus department funds"
                  value={reallocData.description}
                  onChange={(e) =>
                    setReallocData({
                      ...reallocData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.s13}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowReallocForm(false)}
                  disabled={savingRealloc}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={savingRealloc}
                >
                  {savingRealloc ? (
                    <Spinner size="sm" />
                  ) : (
                    "Request Reallocation"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === "budgets" && (
          <div className={styles.s14}>
            {/* Scenarios Sidebar */}
            <Card padding="none">
              <div className={styles.s15}>
                <TrendingUp size={20} />
                <h3 className={styles.s16}>Forecast Scenarios</h3>
              </div>
              <div className={styles.s17}>
                {scenarios.length === 0 ? (
                  <div className={styles.s18}>No scenarios defined</div>
                ) : (
                  scenarios.map((scn) => (
                    <div key={scn.id} className={styles.s19}>
                      <div className={styles.s20}>
                        <span className={styles.s21}>{scn.name}</span>
                        <Badge
                          variant={scn.status === "ACTIVE" ? "success" : "info"}
                        >
                          {scn.status}
                        </Badge>
                      </div>
                      {scn.description && (
                        <div className={styles.s22}>{scn.description}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Budgets Main Table */}
            <Card padding="none">
              <div className={styles.s23}>
                <Target size={20} />
                <h3 className={styles.s24}>Allocated Budgets</h3>
              </div>
              <DataTable
                columns={budgetColumns}
                data={budgets}
                rowKey={(b) => b.id}
                emptyTitle="No budget allocations found"
                emptyMessage="Create a budget allocation to start tracking spend against it."
              />
            </Card>
          </div>
        )}

        {activeTab === "reallocations" && (
          <Card padding="none">
            <div className={styles.s41}>
              <RefreshCw size={20} />
              <h3 className={styles.s42}>Budget Reallocations</h3>
            </div>
            <DataTable
              columns={reallocationColumns}
              data={reallocations}
              rowKey={(r) => r.id}
              emptyTitle="No budget reallocations found"
              emptyMessage="Submit a reallocation request to transfer budget between accounts."
            />
          </Card>
        )}

        {activeTab === "config" && config && (
          <Card>
            <div className={styles.s62}>
              <Shield size={22} className="ui-text-primary" />
              <h3 className={styles.s63}>Active Budget Enforcement Control</h3>
            </div>

            <form onSubmit={handleUpdateConfig} className="ui-stack-6">
              <div className={styles.s64}>
                <FormField label="Enforcement Action Policy" required>
                  <div className={styles.s65}>
                    Define what happens when a transaction exceeds the remaining
                    budget balance.
                  </div>
                  <Select
                    value={config.enforcementAction}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        enforcementAction: e.target
                          .value as BudgetControlConfig["enforcementAction"],
                      })
                    }
                  >
                    <option value="ALLOW">
                      ALLOW (Disabled - No checks/warnings)
                    </option>
                    <option value="WARN">
                      WARN (Log warning, but allow post)
                    </option>
                    <option value="BLOCK">
                      BLOCK (Strict validation - Prevent execution)
                    </option>
                  </Select>
                </FormField>

                <TextField
                  label="Tolerance Buffer (%)"
                  type="number"
                  required
                  hint="Allowed percentage override buffer above the strict budget limit."
                  value={config.tolerancePercentage}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      tolerancePercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="ui-stack-3">
                <label className={styles.s66}>Enforcement Channels</label>

                <div className="ui-stack-2">
                  <label className={styles.s67}>
                    <input
                      type="checkbox"
                      checked={config.checkJournals}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          checkJournals: e.target.checked,
                        })
                      }
                    />
                    Verify General Ledger Journal Entries
                  </label>

                  <label className={styles.s68}>
                    <input
                      type="checkbox"
                      checked={config.checkExpenses}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          checkExpenses: e.target.checked,
                        })
                      }
                    />
                    Verify Employee Expense Reports
                  </label>

                  <label className={styles.s69}>
                    <input
                      type="checkbox"
                      checked={config.checkInvoices}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          checkInvoices: e.target.checked,
                        })
                      }
                    />
                    Verify Accounts Payable & Vendor Invoices
                  </label>
                </div>
              </div>

              <div className={styles.s70}>
                <Button type="submit" variant="primary" disabled={savingConfig}>
                  {savingConfig ? (
                    <Spinner size="sm" />
                  ) : (
                    "Save Enforcement Configuration"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Delete Budget Confirmation Modal */}
        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete Budget Allocation"
          description="Are you sure you want to delete this allocation case?"
          size="sm"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteBudget}
                disabled={deleting}
                className={styles.s71}
              >
                {deleting ? <Spinner size="sm" /> : "Confirm Delete"}
              </Button>
            </>
          }
        >
          <p className={styles.s72}>
            Deletes the selected budget allocation. This action is permanent.
          </p>
        </Modal>

        {/* Budget vs Actuals Analysis Modal */}
        <Modal
          open={vsActualOpen}
          onClose={() => setVsActualOpen(false)}
          title="Budget vs Actuals Analysis"
          description={`Account performance tracking for budget period`}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setVsActualOpen(false)}>
              Close Analysis
            </Button>
          }
        >
          {vsActualLoading ? (
            <div className={styles.s73}>
              <Spinner size="lg" />
            </div>
          ) : vsActualData ? (
            <div className={styles.s74}>
              {/* Summary Cards */}
              <div className={styles.s75}>
                <KPICard
                  title="Budget Allocation"
                  value={fmtBalance(vsActualData.totalBudget)}
                  color="var(--color-text)"
                />
                <KPICard
                  title="Actual Posting"
                  value={fmtBalance(vsActualData.totalActual)}
                  color="var(--color-text)"
                />
                <KPICard
                  title="Variance"
                  value={fmtBalance(vsActualData.totalVariance)}
                  color={
                    vsActualData.totalVariance >= 0
                      ? "var(--color-success)"
                      : "var(--color-danger)"
                  }
                />
              </div>

              {/* Status Alert Indicator */}
              {vsActualData.totalVariance < 0 ? (
                <div className={styles.s76}>
                  <AlertTriangle size={16} />
                  <span>
                    Budget Exceeded! Actual expenditures are over-budget by{" "}
                    {fmtBalance(Math.abs(vsActualData.totalVariance))}.
                  </span>
                </div>
              ) : (
                <div className={styles.s77}>
                  <CheckCircle size={16} />
                  <span>
                    On Target. Expenditures remain within the allocated budget
                    threshold.
                  </span>
                </div>
              )}

              {/* Variance Table */}
              <DataTable
                columns={vsActualColumns}
                data={vsActualData.items}
                rowKey={(item, idx) => `${item.accountId}-${idx}`}
                emptyTitle="No variance data"
                emptyMessage="No account activity for this budget period."
              />
            </div>
          ) : (
            <div className={styles.s89}>No budget analysis loaded.</div>
          )}
        </Modal>
      </div>
    </RouteGuard>
  );
}
