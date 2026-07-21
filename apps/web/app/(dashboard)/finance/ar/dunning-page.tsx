"use client";

import { Card, PageHeader } from "@unerp/ui";
import {
  Bell,
  Layers,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Clock,
} from "lucide-react";

const DUNNING_LEVELS = [
  {
    level: "Level 1",
    daysOverdue: "1–15",
    template: "Friendly Reminder",
    action: "Email",
  },
  {
    level: "Level 2",
    daysOverdue: "16–30",
    template: "Formal Notice",
    action: "Email + Letter",
  },
  {
    level: "Level 3",
    daysOverdue: "31–60",
    template: "Strong Demand",
    action: "Letter + Phone",
  },
  {
    level: "Level 4",
    daysOverdue: "61–90",
    template: "Final Notice",
    action: "Registered Mail",
  },
  {
    level: "Collections",
    daysOverdue: "90+",
    template: "Collections Referral",
    action: "Third Party",
  },
];

const RECENT_RUNS = [
  {
    id: "DR-2407-01",
    date: "2026-07-20",
    level: "Level 1",
    sent: 24,
    opened: 18,
    amount: 12800,
  },
  {
    id: "DR-2407-02",
    date: "2026-07-18",
    level: "Level 2",
    sent: 15,
    opened: 10,
    amount: 34200,
  },
  {
    id: "DR-2407-03",
    date: "2026-07-15",
    level: "Level 3",
    sent: 8,
    opened: 5,
    amount: 45600,
  },
  {
    id: "DR-2407-04",
    date: "2026-07-12",
    level: "Level 4",
    sent: 4,
    opened: 2,
    amount: 38500,
  },
  {
    id: "DR-2407-05",
    date: "2026-07-10",
    level: "Collections",
    sent: 3,
    opened: 1,
    amount: 67200,
  },
];

export default function DunningPage() {
  return (
    <div className="ui-stack-4 ui-animate-in">
      <PageHeader
        title="Dunning & Payment Reminders"
        description="Manage automated payment reminders and dunning letter campaigns"
      />

      <div className="ui-grid-4">
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <Layers
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Active Dunning Levels
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-primary)" }}
            >
              5
            </p>
            <p className="ui-text-xs-muted">Levels configured</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <Bell
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Total Runs
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-primary)" }}
            >
              342
            </p>
            <p className="ui-text-xs-muted">This month</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <AlertTriangle
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Overdue Invoices
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-danger)" }}
            >
              54
            </p>
            <p className="ui-text-xs-muted">Past due date</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="ui-stack-2">
            <p className="ui-text-xs-muted">
              <DollarSign
                size={14}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Total Overdue Amount
            </p>
            <p
              className="ui-heading-sm"
              style={{ color: "var(--color-danger)" }}
            >
              $198,300
            </p>
            <p className="ui-text-xs-muted">Across all overdue invoices</p>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <h3
          className="ui-heading-sm"
          style={{ marginBottom: "var(--space-3)" }}
        >
          Dunning Levels
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
                  Level
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Days Overdue
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Template
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {DUNNING_LEVELS.map((dl) => (
                <tr
                  key={dl.level}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                      fontWeight: 600,
                    }}
                  >
                    {dl.level}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {dl.daysOverdue}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {dl.template}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {dl.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="lg">
        <h3
          className="ui-heading-sm"
          style={{ marginBottom: "var(--space-3)" }}
        >
          <Clock
            size={16}
            style={{ marginRight: 6, verticalAlign: "middle" }}
          />
          Recent Dunning Runs
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
                  Run ID
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
                  Level
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Sent
                </th>
                <th
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontWeight: 600,
                    fontSize: "var(--font-sm)",
                  }}
                >
                  Opened
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
              {RECENT_RUNS.map((run) => (
                <tr
                  key={run.id}
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
                    {run.id}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {run.date}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {run.level}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {run.sent}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {run.opened}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--font-sm)",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    ${run.amount.toLocaleString()}
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
