"use client";

import { Card, PageHeader, DataTable, type Column } from "@unerp/ui";
import {
  Bell,
  Layers,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Clock,
} from "lucide-react";

interface DunningLevel {
  level: string;
  daysOverdue: string;
  template: string;
  action: string;
}

interface DunningRun {
  id: string;
  date: string;
  level: string;
  sent: number;
  opened: number;
  amount: number;
}

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

const LEVEL_COLUMNS: Column<DunningLevel>[] = [
  { key: "level", header: "Level", render: (row) => row.level },
  {
    key: "daysOverdue",
    header: "Days Overdue",
    render: (row) => row.daysOverdue,
  },
  { key: "template", header: "Template", render: (row) => row.template },
  { key: "action", header: "Action", render: (row) => row.action },
];

const RUN_COLUMNS: Column<DunningRun>[] = [
  { key: "id", header: "Run ID", render: (row) => row.id },
  { key: "date", header: "Date", render: (row) => row.date },
  { key: "level", header: "Level", render: (row) => row.level },
  { key: "sent", header: "Sent", render: (row) => row.sent },
  { key: "opened", header: "Opened", render: (row) => row.opened },
  {
    key: "amount",
    header: "Amount",
    align: "right" as const,
    render: (row) => `$${row.amount.toLocaleString()}`,
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

      <Card padding="none">
        <h3
          className="ui-heading-sm"
          style={{ padding: "var(--space-4) var(--space-4) 0" }}
        >
          Dunning Levels
        </h3>
        <DataTable
          columns={LEVEL_COLUMNS}
          data={DUNNING_LEVELS}
          rowKey={(row) => row.level}
          emptyTitle="No dunning levels configured"
          emptyMessage="Set up escalation levels to begin automated collections."
        />
      </Card>

      <Card padding="none">
        <h3
          className="ui-heading-sm"
          style={{ padding: "var(--space-4) var(--space-4) 0" }}
        >
          <Clock
            size={16}
            style={{ marginRight: 6, verticalAlign: "middle" }}
          />
          Recent Dunning Runs
        </h3>
        <DataTable
          columns={RUN_COLUMNS}
          data={RECENT_RUNS}
          rowKey={(row) => row.id}
          emptyTitle="No dunning runs yet"
          emptyMessage="Runs will appear here once a dunning campaign executes."
        />
      </Card>
    </div>
  );
}
