"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  type Column,
  Modal,
  TextField,
  FormField,
  Select,
  KPICard,
} from "@unerp/ui";
import {
  Receipt,
  Plus,
  DollarSign,
  Clock,
  Scan,
  ShieldAlert,
  Trash2,
  ListFilter,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  merchant?: string | null;
  amount: string | number;
  taxAmount: string | number;
  receiptUrl?: string | null;
  expenseDate: string;
  policyViolation: boolean;
  policyViolationReason?: string | null;
}

interface ExpenseReport {
  id: string;
  title: string;
  description?: string | null;
  totalAmount: string | number;
  status: string;
  hasPolicyViolation: boolean;
  requiresSecondApproval: boolean;
  employeeId: string;
  employee?: { firstName: string; lastName: string } | null;
  items: ExpenseItem[];
  createdAt: string;
}

const fmt = (n: number | string) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const statusVariant = (
  status: string,
): "success" | "danger" | "warning" | "info" | "default" => {
  if (status === "APPROVED" || status === "PAID") return "success";
  if (status === "REJECTED") return "danger";
  if (status === "SUBMITTED" || status === "PENDING_SECOND_APPROVAL")
    return "warning";
  return "default";
};

export default function ExpenseManagementPage() {
  const client = useApiClient();
  const [reports, setReports] = useState<ExpenseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailReport, setDetailReport] = useState<ExpenseReport | null>(null);
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("subtab") || "all";

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Add-item form state
  const [itemCategory, setItemCategory] = useState("TRAVEL");
  const [itemDescription, setItemDescription] = useState("");
  const [itemMerchant, setItemMerchant] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [itemDate, setItemDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [itemReceipt, setItemReceipt] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrScanning, setOcrScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.get<
        ExpenseReport[] | { data?: ExpenseReport[] }
      >("/advanced-finance/expense-reports");
      setReports(Array.isArray(data) ? data : data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshDetail = useCallback(
    async (id: string) => {
      setDetailReport(
        await client.get<ExpenseReport>(
          `/advanced-finance/expense-reports/${id}`,
        ),
      );
    },
    [client],
  );

  const pending = reports.filter(
    (r) => r.status === "SUBMITTED" || r.status === "PENDING_SECOND_APPROVAL",
  ).length;
  const totalPending = reports
    .filter(
      (r) => r.status === "SUBMITTED" || r.status === "PENDING_SECOND_APPROVAL",
    )
    .reduce((a, r) => a + Number(r.totalAmount), 0);
  const violations = reports.filter((r) => r.hasPolicyViolation).length;

  const filtered =
    activeTab === "all"
      ? reports
      : reports.filter((r) => r.status === activeTab);

  const createReport = async () => {
    setSubmitting(true);
    try {
      await client.post("/advanced-finance/expense-reports", {
        employeeId: newEmployeeId,
        reportNumber: `EXP-${Date.now()}`,
        title: newTitle,
        description: newDescription || undefined,
      });
      setCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewEmployeeId("");
      await load();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const runOcrScan = async () => {
    setOcrScanning(true);
    try {
      const data = await client.post<{
        extracted?: {
          merchant?: string;
          amount?: number;
          date?: string;
          suggestedCategory?: string;
        };
      }>("/advanced-finance/expenses/ocr-scan", {
        fileName: "receipt.jpg",
        rawText: ocrText,
      });
      if (data.extracted) {
        if (data.extracted.merchant) setItemMerchant(data.extracted.merchant);
        if (data.extracted.amount) setItemAmount(String(data.extracted.amount));
        if (data.extracted.date) setItemDate(data.extracted.date);
        if (data.extracted.suggestedCategory)
          setItemCategory(data.extracted.suggestedCategory);
      }
    } catch {
    } finally {
      setOcrScanning(false);
    }
  };

  const addItem = async () => {
    if (!detailReport) return;
    try {
      await client.post(
        `/advanced-finance/expense-reports/${detailReport.id}/items`,
        {
          category: itemCategory,
          description: itemDescription,
          merchant: itemMerchant || undefined,
          amount: Number(itemAmount),
          expenseDate: itemDate,
          receiptUrl: itemReceipt || undefined,
        },
      );
      setItemDescription("");
      setItemMerchant("");
      setItemAmount("");
      setItemReceipt("");
      setOcrText("");
      await refreshDetail(detailReport.id);
      await load();
    } catch {}
  };

  const deleteItem = async (itemId: string) => {
    if (!detailReport) return;
    try {
      await client.delete(`/advanced-finance/expense-items/${itemId}`);
      await refreshDetail(detailReport.id);
      await load();
    } catch {}
  };

  const doAction = async (
    id: string,
    action: "submit" | "approve" | "second-approve" | "pay",
  ) => {
    try {
      await client.post(`/advanced-finance/expense-reports/${id}/${action}`);
      await load();
      if (detailReport?.id === id) await refreshDetail(id);
    } catch {}
  };

  const columns: Column<ExpenseReport>[] = [
    {
      key: "report",
      header: "Expense Report",
      render: (row) => (
        <div className={styles.s1} onClick={() => refreshDetail(row.id)}>
          <div className="ui-heading-sm">
            {row.title}{" "}
            {row.hasPolicyViolation && (
              <ShieldAlert size={13} className={styles.s2} />
            )}
          </div>
          <div className="ui-text-xs-tertiary">
            {row.employee
              ? `${row.employee.firstName} ${row.employee.lastName}`
              : row.employeeId}{" "}
            · {row.items?.length || 0} items
          </div>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      align: "right" as const,
      render: (row) => (
        <span className="font-semibold">{fmt(row.totalAmount)}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => (
        <span className="ui-text-xs-muted">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={statusVariant(row.status)}>
          {row.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right" as const,
      width: "220px",
      render: (row) => (
        <div className={styles.s3}>
          {row.status === "DRAFT" && (
            <Button
              variant="secondary"
              onClick={() => doAction(row.id, "submit")}
            >
              Submit
            </Button>
          )}
          {row.status === "SUBMITTED" && (
            <Button
              variant="primary"
              onClick={() => doAction(row.id, "approve")}
            >
              Approve
            </Button>
          )}
          {row.status === "PENDING_SECOND_APPROVAL" && (
            <Button
              variant="primary"
              onClick={() => doAction(row.id, "second-approve")}
            >
              2nd Approve
            </Button>
          )}
          {row.status === "APPROVED" && (
            <Button variant="primary" onClick={() => doAction(row.id, "pay")}>
              Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <RouteGuard permission="finance.expense.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Expense Management"
          description="Employee expense reports, OCR receipt capture, policy enforcement, and reimbursement"
          breadcrumbs={[
            { label: "Finance", href: "/finance" },
            { label: "Advanced", href: "/finance/advanced" },
            { label: "Expense Management" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-2" /> New Report
            </Button>
          }
        />

        <div className="ui-grid-auto">
          <KPICard
            title="Pending Approval"
            value={pending}
            icon={<Clock size={18} />}
            color="var(--color-warning)"
          />
          <KPICard
            title="Pending Amount"
            value={fmt(totalPending)}
            icon={<DollarSign size={18} />}
            color="var(--color-warning)"
          />
          <KPICard
            title="Policy Violations"
            value={violations}
            icon={<ShieldAlert size={18} />}
            color="var(--color-danger)"
          />
          <KPICard
            title="Total Reports"
            value={reports.length}
            icon={<Receipt size={18} />}
            color="var(--color-primary)"
          />
        </div>

        <SubTabBar
          tabs={
            [
              {
                id: "all",
                label: "All",
                href: "/finance/advanced/expense-reports?subtab=all",
                icon: ListFilter,
              },
              {
                id: "SUBMITTED",
                label: "Pending",
                href: "/finance/advanced/expense-reports?subtab=SUBMITTED",
                icon: Clock,
              },
              {
                id: "PENDING_SECOND_APPROVAL",
                label: "2nd Approval",
                href: "/finance/advanced/expense-reports?subtab=PENDING_SECOND_APPROVAL",
                icon: ShieldAlert,
              },
              {
                id: "APPROVED",
                label: "Approved",
                href: "/finance/advanced/expense-reports?subtab=APPROVED",
                icon: Receipt,
              },
              {
                id: "PAID",
                label: "Paid",
                href: "/finance/advanced/expense-reports?subtab=PAID",
                icon: DollarSign,
              },
            ] as SubTab[]
          }
        />

        <Card padding="none">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(r) => r.id}
            loading={loading}
            emptyTitle="No expense reports"
            emptyMessage="Submit your first expense report."
            emptyIcon={<Receipt size={48} />}
          />
        </Card>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Create Expense Report"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={createReport}
                disabled={submitting || !newTitle || !newEmployeeId}
              >
                Create
              </Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField
              label="Report Title"
              placeholder="Client Visit - Chicago"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <TextField
              label="Employee ID"
              required
              value={newEmployeeId}
              onChange={(e) => setNewEmployeeId(e.target.value)}
            />
            <TextField
              label="Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
        </Modal>

        <Modal
          open={!!detailReport}
          onClose={() => setDetailReport(null)}
          title={detailReport?.title || "Expense Report"}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setDetailReport(null)}>
              Close
            </Button>
          }
        >
          {detailReport && (
            <div className="ui-stack-4">
              <div className="ui-flex-between">
                <Badge variant={statusVariant(detailReport.status)}>
                  {detailReport.status.replace(/_/g, " ")}
                </Badge>
                <span className={styles.s4}>
                  {fmt(detailReport.totalAmount)}
                </span>
              </div>

              <Card padding="sm">
                <div className={styles.s5}>Line Items</div>
                {(detailReport.items || []).map((item) => (
                  <div key={item.id} className={styles.s6}>
                    <div>
                      <div className="text-sm">
                        {item.description}{" "}
                        {item.policyViolation && (
                          <span title={item.policyViolationReason || ""}>
                            <ShieldAlert size={12} className={styles.s2} />
                          </span>
                        )}
                      </div>
                      <div className="ui-text-xs-tertiary">
                        {item.category} · {item.merchant || "N/A"} ·{" "}
                        {new Date(item.expenseDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ui-hstack-2">
                      <span className="font-semibold">{fmt(item.amount)}</span>
                      {detailReport.status === "DRAFT" && (
                        <Button
                          variant="danger"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {(!detailReport.items || detailReport.items.length === 0) && (
                  <div className={styles.s7}>No items yet.</div>
                )}
              </Card>

              {detailReport.status === "DRAFT" && (
                <Card padding="sm">
                  <div className={styles.s5}>Add Item</div>
                  <div className="ui-stack-2">
                    <FormField label="Scan receipt text (simulated OCR)">
                      <div className="ui-flex ui-gap-2">
                        <TextField
                          placeholder="Paste receipt text here..."
                          value={ocrText}
                          onChange={(e) => setOcrText(e.target.value)}
                        />
                        <Button
                          variant="secondary"
                          onClick={runOcrScan}
                          disabled={ocrScanning || !ocrText}
                        >
                          <Scan size={14} className="mr-1" /> Scan
                        </Button>
                      </div>
                    </FormField>
                    <div className={styles.s8}>
                      <FormField label="Category">
                        <Select
                          value={itemCategory}
                          onChange={(e) => setItemCategory(e.target.value)}
                        >
                          <option value="TRAVEL">Travel</option>
                          <option value="MEALS">Meals</option>
                          <option value="OFFICE">Office</option>
                          <option value="UTILITIES">Utilities</option>
                          <option value="OTHER">Other</option>
                        </Select>
                      </FormField>
                      <TextField
                        label="Merchant"
                        value={itemMerchant}
                        onChange={(e) => setItemMerchant(e.target.value)}
                      />
                    </div>
                    <TextField
                      label="Description"
                      required
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                    />
                    <div className={styles.s8}>
                      <TextField
                        label="Amount"
                        type="number"
                        required
                        value={itemAmount}
                        onChange={(e) => setItemAmount(e.target.value)}
                      />
                      <TextField
                        label="Date"
                        type="date"
                        required
                        value={itemDate}
                        onChange={(e) => setItemDate(e.target.value)}
                      />
                    </div>
                    <TextField
                      label="Receipt URL (optional)"
                      value={itemReceipt}
                      onChange={(e) => setItemReceipt(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      onClick={addItem}
                      disabled={!itemDescription || !itemAmount}
                    >
                      Add Item
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </Modal>
      </div>
    </RouteGuard>
  );
}
