"use client";

import { Card, PageHeader } from "@unerp/ui";
import { Receipt, DollarSign, CheckCircle, XCircle } from "lucide-react";

const DEBIT_NOTES = [
  {
    id: "DN-001",
    vendor: "TechSupply Co",
    issueDate: "2026-07-18",
    status: "Open",
    amount: 1800.0,
  },
  {
    id: "DN-002",
    vendor: "OfficeMart Inc",
    issueDate: "2026-07-16",
    status: "Applied",
    amount: 950.0,
  },
  {
    id: "DN-003",
    vendor: "LogiTrans Ltd",
    issueDate: "2026-07-14",
    status: "Void",
    amount: 2750.0,
  },
  {
    id: "DN-004",
    vendor: "RawMaterials Plus",
    issueDate: "2026-07-11",
    status: "Applied",
    amount: 5200.0,
  },
  {
    id: "DN-005",
    vendor: "TechSupply Co",
    issueDate: "2026-07-09",
    status: "Open",
    amount: 3100.0,
  },
  {
    id: "DN-006",
    vendor: "OfficeMart Inc",
    issueDate: "2026-07-05",
    status: "Draft",
    amount: 640.0,
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

export default function DebitNotesPage() {
  return (
    <div className="ui-stack-4 ui-animate-in">
      <PageHeader
        title="Debit Notes"
        description="Manage vendor debit notes, adjustments, and deductions"
      />

      <div className="ui-grid-4">
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <Receipt
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Total Debit Notes
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-primary)" }}
            >
              89
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
              $142,500
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
              $98,300
            </p>
            <p className="ui-text-xs-muted">Applied to bills</p>
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
              $12,400
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
          Debit Notes List
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
                  Vendor
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
              {DEBIT_NOTES.map((dn) => (
                <tr
                  key={dn.id}
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
                    {dn.id}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {dn.vendor}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {dn.issueDate}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {statusBadge(dn.status)}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    ${dn.amount.toLocaleString()}
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
