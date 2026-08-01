"use client";

import styles from "./page.module.css";
import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  type Column,
  KPICard,
} from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { GitCompare, CheckCircle, AlertTriangle, FileText } from "lucide-react";

interface ReconciliationItem {
  id: string;
  accountCode: string;
  accountName: string;
  glBalance: number;
  subLedgerBalance: number;
  difference: number;
  status: "MATCHED" | "VARIANCE";
}

const fmtCurrency = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function AccountReconciliationPage() {
  const client = useApiClient();
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReconciliation = () => {
    setLoading(true);
    client
      .get<{ items: ReconciliationItem[] }>(
        `/finance/reports/account-reconciliation?asOfDate=${new Date().toISOString()}`,
      )
      .then((res) => setItems(res?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchReconciliation, [client]);

  const matched = items.filter((i) => i.status === "MATCHED").length;
  const variances = items.filter((i) => i.status === "VARIANCE").length;

  const columns: Column<ReconciliationItem>[] = [
    {
      key: "account",
      header: "Account",
      render: (row) => (
        <div>
          <span className="ui-heading-sm">{row.accountCode}</span>
          <span className={styles.s1}>{row.accountName}</span>
        </div>
      ),
    },
    {
      key: "glBalance",
      header: "GL Balance",
      align: "right" as const,
      render: (row) => (
        <span className="text-sm">{fmtCurrency(row.glBalance)}</span>
      ),
    },
    {
      key: "subLedgerBalance",
      header: "Sub-Ledger",
      align: "right" as const,
      render: (row) => (
        <span className="text-sm">{fmtCurrency(row.subLedgerBalance)}</span>
      ),
    },
    {
      key: "difference",
      header: "Difference",
      align: "right" as const,
      render: (row) => (
        <span
          className={`${styles.difference} ${row.difference === 0 ? styles.differenceBalanced : styles.differenceUnbalanced}`}
        >
          {row.difference === 0 ? "$0.00" : fmtCurrency(row.difference)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "MATCHED" ? "success" : "danger"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Account Reconciliation"
        description="Match sub-ledger balances to the general ledger and identify variances"
        breadcrumbs={[
          { label: "Finance", href: "/finance" },
          { label: "Advanced", href: "/finance/advanced" },
          { label: "Account Reconciliation" },
        ]}
        actions={
          <Button variant="primary" onClick={fetchReconciliation}>
            Run Reconciliation
          </Button>
        }
      />

      <div className="ui-grid-auto">
        <KPICard
          title="Accounts Matched"
          value={matched}
          icon={<CheckCircle size={18} />}
          color="var(--color-success)"
        />
        <KPICard
          title="Variances Found"
          value={variances}
          icon={<AlertTriangle size={18} />}
          color="var(--color-danger)"
        />
        <KPICard
          title="Total Accounts"
          value={items.length}
          icon={<FileText size={18} />}
          color="var(--color-primary)"
        />
      </div>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          rowKey={(r) => r.id}
          emptyTitle="No reconciliation data"
          emptyMessage="Only accounts with an independent sub-ledger (Receivable/Payable) are reconciled here."
          emptyIcon={<GitCompare size={48} />}
        />
      </Card>
    </div>
  );
}
