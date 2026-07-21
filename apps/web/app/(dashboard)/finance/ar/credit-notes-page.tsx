"use client";

import { Card, PageHeader } from "@unerp/ui";
import { FileText, DollarSign, CheckCircle, XCircle } from "lucide-react";

const CREDIT_NOTES = [
  {
    id: "CN-001",
    customer: "Acme Corp",
    issueDate: "2026-07-15",
    status: "Applied",
    amount: 2500.0,
  },
  {
    id: "CN-002",
    customer: "GlobalTech Inc",
    issueDate: "2026-07-14",
    status: "Void",
    amount: 1800.0,
  },
  {
    id: "CN-003",
    customer: "MegaCorp Ltd",
    issueDate: "2026-07-12",
    status: "Applied",
    amount: 4500.0,
  },
  {
    id: "CN-004",
    customer: "StartupXYZ",
    issueDate: "2026-07-10",
    status: "Draft",
    amount: 750.0,
  },
  {
    id: "CN-005",
    customer: "RetailPlus",
    issueDate: "2026-07-08",
    status: "Applied",
    amount: 3200.0,
  },
  {
    id: "CN-006",
    customer: "Acme Corp",
    issueDate: "2026-07-05",
    status: "Open",
    amount: 1100.0,
  },
];

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    Applied: "var(--color-success)",
    Void: "var(--color-danger)",
    Draft: "var(--color-text-muted)",
    Open: "var(--color-warning)",
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

export default function CreditNotesPage() {
  return (
    <div className="ui-stack-4 ui-animate-in">
      <PageHeader
        title="Credit Notes"
        description="Manage customer credit notes, refunds, and adjustments"
      />

      <div className="ui-grid-4">
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <FileText
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Total Credit Notes
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-primary)" }}
            >
              156
            </p>
            <p className="ui-text-xs-muted">All time</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <DollarSign
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Total Amount
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-primary)" }}
            >
              $342,800
            </p>
            <p className="ui-text-xs-muted">Face value of all notes</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <CheckCircle
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Applied
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-success)" }}
            >
              $285,400
            </p>
            <p className="ui-text-xs-muted">Applied to outstanding invoices</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <XCircle
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Void
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-danger)" }}
            >
              $18,200
            </p>
            <p className="ui-text-xs-muted">Voided or cancelled</p>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <h3
          className="ui-heading-sm"
          style={{ marginBottom: "var(--space-3)" }}
        >
          Credit Notes List
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
                  #
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Customer
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Issue Date
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
              </tr>
            </thead>
            <tbody>
              {CREDIT_NOTES.map((cn) => (
                <tr
                  key={cn.id}
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
                    }}
                  >
                    {cn.id}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {cn.customer}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {cn.issueDate}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {statusBadge(cn.status)}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    ${cn.amount.toLocaleString()}
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
