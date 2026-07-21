"use client";

import { Card, PageHeader } from "@unerp/ui";
import {
  FileSpreadsheet,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  Ban,
} from "lucide-react";

const VENDOR_BILLS = [
  {
    id: "BILL-0042",
    vendor: "TechSupply Co",
    date: "2026-07-20",
    dueDate: "2026-08-19",
    status: "Pending Approval",
    amount: 12500.0,
  },
  {
    id: "BILL-0041",
    vendor: "OfficeMart Inc",
    date: "2026-07-18",
    dueDate: "2026-08-17",
    status: "Approved",
    amount: 3400.0,
  },
  {
    id: "BILL-0040",
    vendor: "LogiTrans Ltd",
    date: "2026-07-15",
    dueDate: "2026-08-14",
    status: "Paid",
    amount: 8200.0,
  },
  {
    id: "BILL-0039",
    vendor: "RawMaterials Plus",
    date: "2026-07-14",
    dueDate: "2026-08-13",
    status: "Approved",
    amount: 22100.0,
  },
  {
    id: "BILL-0038",
    vendor: "TechSupply Co",
    date: "2026-07-12",
    dueDate: "2026-08-11",
    status: "Pending Approval",
    amount: 5600.0,
  },
  {
    id: "BILL-0037",
    vendor: "OfficeMart Inc",
    date: "2026-07-10",
    dueDate: "2026-08-09",
    status: "Void",
    amount: 1800.0,
  },
  {
    id: "BILL-0036",
    vendor: "MegaCorp Services",
    date: "2026-07-08",
    dueDate: "2026-08-07",
    status: "Paid",
    amount: 15400.0,
  },
  {
    id: "BILL-0035",
    vendor: "LogiTrans Ltd",
    date: "2026-07-05",
    dueDate: "2026-08-04",
    status: "Pending Approval",
    amount: 9800.0,
  },
];

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    "Pending Approval": "var(--color-warning)",
    Approved: "var(--color-primary)",
    Paid: "var(--color-success)",
    Void: "var(--color-danger)",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        fontSize: "var(--font-xs)",
        fontWeight: 600,
        background: `${colors[status] || "var(--color-surface-2)"}20`,
        color: colors[status] || "var(--color-text-secondary)",
      }}
    >
      {status}
    </span>
  );
};

const actionButton = (label: string, icon: React.ReactNode, color: string) => (
  <button
    title={label}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--color-border)",
      background: "transparent",
      cursor: "pointer",
      color,
    }}
  >
    {icon}
  </button>
);

export default function VendorBillsPage() {
  return (
    <div className="ui-stack-4 ui-animate-in">
      <PageHeader
        title="Vendor Bills"
        description="Track and manage vendor bills, approvals, and payment processing"
      />

      <div className="ui-grid-4">
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <FileSpreadsheet
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Total Bills
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-primary)" }}
            >
              89
            </p>
            <p className="ui-text-xs-muted">This month</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <Clock
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Pending Approval
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-warning)" }}
            >
              23
            </p>
            <p className="ui-text-xs-muted">Awaiting review</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <CheckCircle
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Approved
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-primary)" }}
            >
              41
            </p>
            <p className="ui-text-xs-muted">Ready for payment</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <DollarSign
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Paid
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-success)" }}
            >
              25
            </p>
            <p className="ui-text-xs-muted">Paid this month</p>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <h3
          className="ui-heading-sm"
          style={{ marginBottom: "var(--space-3)" }}
        >
          All Vendor Bills
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table
            className="ui-table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  textAlign: "left",
                }}
              >
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Bill#
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Vendor
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Due Date
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                    textAlign: "right",
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {VENDOR_BILLS.map((bill) => (
                <tr
                  key={bill.id}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--color-surface-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                      fontWeight: 600,
                    }}
                  >
                    {bill.id}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {bill.vendor}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {bill.date}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {bill.dueDate}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {statusBadge(bill.status)}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    ${bill.amount.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "var(--space-1)" }}>
                      {actionButton(
                        "Approve",
                        <Check size={12} />,
                        "var(--color-success)",
                      )}
                      {actionButton(
                        "Pay",
                        <DollarSign size={12} />,
                        "var(--color-primary)",
                      )}
                      {actionButton(
                        "Void",
                        <Ban size={12} />,
                        "var(--color-danger)",
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
