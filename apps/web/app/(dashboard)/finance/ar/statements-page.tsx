"use client";

import { Card, PageHeader } from "@unerp/ui";
import {
  FileSpreadsheet,
  Send,
  Clock,
  Download,
  Eye,
  Plus,
} from "lucide-react";

const RECENT_STATEMENTS = [
  {
    id: "STMT-0726-001",
    customer: "Acme Corp",
    period: "Jul 2026",
    generated: "2026-07-20",
    status: "Sent",
    amount: 42500,
  },
  {
    id: "STMT-0726-002",
    customer: "GlobalTech Inc",
    period: "Jul 2026",
    generated: "2026-07-20",
    status: "Sent",
    amount: 28300,
  },
  {
    id: "STMT-0726-003",
    customer: "MegaCorp Ltd",
    period: "Jul 2026",
    generated: "2026-07-19",
    status: "Pending",
    amount: 67200,
  },
  {
    id: "STMT-0726-004",
    customer: "StartupXYZ",
    period: "Jun 2026",
    generated: "2026-06-30",
    status: "Sent",
    amount: 15400,
  },
  {
    id: "STMT-0726-005",
    customer: "RetailPlus",
    period: "Jun 2026",
    generated: "2026-06-30",
    status: "Sent",
    amount: 38900,
  },
  {
    id: "STMT-0726-006",
    customer: "Acme Corp",
    period: "Jun 2026",
    generated: "2026-06-29",
    status: "Pending",
    amount: 22100,
  },
];

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    Sent: "var(--color-success)",
    Pending: "var(--color-warning)",
    Draft: "var(--color-text-muted)",
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

export default function StatementsPage() {
  return (
    <div className="ui-stack-4 ui-animate-in">
      <PageHeader
        title="Customer Statements"
        description="Generate, send, and manage customer account statements"
      />

      <div className="ui-grid-3">
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <FileSpreadsheet
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Generated Statements
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-primary)" }}
            >
              486
            </p>
            <p className="ui-text-xs-muted">This month</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <Send
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Sent
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-success)" }}
            >
              412
            </p>
            <p className="ui-text-xs-muted">84.8% delivery rate</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <Clock
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Pending
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-warning)" }}
            >
              74
            </p>
            <p className="ui-text-xs-muted">Awaiting generation or send</p>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-3)",
          }}
        >
          <h3 className="ui-heading-sm">Generate Statements</h3>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1)",
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--font-sm)",
              fontWeight: 600,
              color: "#fff",
              background: "var(--color-primary)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            Generate New
          </button>
        </div>
        <p
          className="ui-text-xs-muted"
          style={{ marginBottom: "var(--space-2)" }}
        >
          Select a date range and customer group to generate statements in bulk.
        </p>
        <div
          style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <label
              className="ui-text-xs-muted"
              style={{ display: "block", marginBottom: 4 }}
            >
              Period
            </label>
            <select className="ui-input" style={{ width: "100%" }}>
              <option>Current Month</option>
              <option>Last Month</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label
              className="ui-text-xs-muted"
              style={{ display: "block", marginBottom: 4 }}
            >
              Customer Group
            </label>
            <select className="ui-input" style={{ width: "100%" }}>
              <option>All Customers</option>
              <option>Active Accounts</option>
              <option>Overdue Accounts</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-1)",
                padding: "var(--space-1) var(--space-3)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-sm)",
                fontWeight: 600,
                color: "var(--color-primary)",
                background: "transparent",
                border: "1px solid var(--color-primary)",
                cursor: "pointer",
                height: 36,
              }}
            >
              Preview
            </button>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h3
          className="ui-heading-sm"
          style={{ marginBottom: "var(--space-3)" }}
        >
          Recent Statements
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
                  Statement
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
                  Period
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Generated
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
              {RECENT_STATEMENTS.map((stmt) => (
                <tr
                  key={stmt.id}
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
                    {stmt.id}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {stmt.customer}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {stmt.period}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {stmt.generated}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {statusBadge(stmt.status)}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    ${stmt.amount.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "var(--space-1)" }}>
                      <button
                        title="View"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        title="Download"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        title="Send"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        <Send size={14} />
                      </button>
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
