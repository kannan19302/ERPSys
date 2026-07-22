"use client";
import styles from "./page.module.css";
import React, { useEffect, useState } from "react";
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
import { GitCompare, Link2, Unlink, FileText } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  currentBalance: number;
}

interface BankTransaction {
  id: string;
  bankAccountId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  description: string;
  date: string;
  reconciled: boolean;
}

interface Reconciliation {
  id: string;
  bankName: string;
  statementDate: string;
  status: string;
  matchedCount: number;
  unmatchedCount: number;
  totalTransactions: number;
}

const fmtCurrency = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function BankReconciliationPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("subtab") || "reconciliations";
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [statements, setStatements] = useState<BankTransaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const accts = await client.get<BankAccount[]>("/finance/bank-accounts");
      setAccounts(accts || []);

      const perAccount = await Promise.all(
        (accts || []).map(async (a) => {
          const txns = await client
            .get<
              BankTransaction[]
            >(`/finance/bank-accounts/${a.id}/transactions`)
            .catch(() => [] as BankTransaction[]);
          return { account: a, txns };
        }),
      );

      const recons: Reconciliation[] = perAccount.map(({ account, txns }) => {
        const matchedCount = txns.filter((t) => t.reconciled).length;
        return {
          id: account.id,
          bankName: `${account.bankName} — ${account.accountName}`,
          statementDate: txns[0]?.date?.slice(0, 10) || "—",
          status:
            matchedCount === txns.length && txns.length > 0
              ? "COMPLETED"
              : "IN_PROGRESS",
          matchedCount,
          unmatchedCount: txns.length - matchedCount,
          totalTransactions: txns.length,
        };
      });
      setReconciliations(recons);
      setStatements(perAccount.flatMap((p) => p.txns));
    } catch {
      setReconciliations([]);
      setStatements([]);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMatch = async (t: BankTransaction) => {
    await client.post(`/finance/bank-accounts/${t.bankAccountId}/reconcile`, {
      transactionId: t.id,
    });
    fetchData();
  };

  const matchedTotal = statements
    .filter((s) => s.reconciled)
    .reduce((a, s) => a + Math.abs(s.amount), 0);
  const unmatchedTotal = statements
    .filter((s) => !s.reconciled)
    .reduce((a, s) => a + Math.abs(s.amount), 0);

  const reconColumns: Column<Reconciliation>[] = [
    {
      key: "bank",
      header: "Bank Account",
      render: (row) => (
        <div>
          <div className="ui-heading-sm">{row.bankName}</div>
          <div className="ui-text-xs-tertiary">
            Latest transaction: {row.statementDate}
          </div>
        </div>
      ),
    },
    {
      key: "progress",
      header: "Match Progress",
      render: (row) => {
        const pct = row.totalTransactions
          ? Math.round((row.matchedCount / row.totalTransactions) * 100)
          : 0;
        return (
          <div className="ui-hstack-2">
            <div className={styles.s1}>
              <div
                style={{
                  width: `${pct}%`,
                  background:
                    pct === 100
                      ? "var(--color-success)"
                      : "var(--color-primary)",
                }}
                className={styles.s2}
              />
            </div>
            <span className="ui-text-xs-muted">
              {row.matchedCount}/{row.totalTransactions}
            </span>
          </div>
        );
      },
    },
    {
      key: "unmatched",
      header: "Unmatched",
      render: (row) =>
        row.unmatchedCount > 0 ? (
          <Badge variant="warning">{row.unmatchedCount}</Badge>
        ) : (
          <Badge variant="success">0</Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "COMPLETED" ? "success" : "warning"}>
          {row.status.replace("_", " ")}
        </Badge>
      ),
    },
  ];

  const stmtColumns: Column<BankTransaction>[] = [
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span className="text-xs">{row.date?.slice(0, 10)}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => <span className="text-sm">{row.description}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (row) => (
        <span
          style={{
            color:
              row.type === "CREDIT"
                ? "var(--color-success)"
                : "var(--color-danger)",
          }}
          className={styles.s3}
        >
          {row.type === "DEBIT" ? "-" : "+"}
          {fmtCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "matched",
      header: "Match Status",
      render: (row) =>
        row.reconciled ? (
          <div className="ui-flex ui-items-center ui-gap-1">
            <Link2 size={12} className="ui-text-success" />
            <span className={styles.s4}>Matched</span>
          </div>
        ) : (
          <Badge variant="warning">Unmatched</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right" as const,
      width: "100px",
      render: (row) =>
        !row.reconciled ? (
          <Button variant="outline" onClick={() => handleMatch(row)}>
            Match
          </Button>
        ) : null,
    },
  ];

  return (
    <RouteGuard permission="finance.reconciliation.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Bank Reconciliation"
          description="Import statements, auto-match transactions, and reconcile accounts"
          breadcrumbs={[
            { label: "Finance", href: "/finance" },
            { label: "Advanced", href: "/finance/advanced" },
            { label: "Bank Reconciliation" },
          ]}
          actions={
            <div className="ui-flex ui-gap-2">
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                disabled={accounts.length === 0}
              >
                Add Transaction
              </Button>
            </div>
          }
        />

        <div className="ui-grid-auto">
          <KPICard
            title="Matched"
            value={fmtCurrency(matchedTotal)}
            icon={<Link2 size={18} />}
            color="var(--color-success)"
          />
          <KPICard
            title="Unmatched"
            value={fmtCurrency(unmatchedTotal)}
            icon={<Unlink size={18} />}
            color="var(--color-warning)"
          />
          <KPICard
            title="Transactions"
            value={statements.length}
            icon={<FileText size={18} />}
            color="var(--color-primary)"
          />
        </div>

        <SubTabBar
          tabs={
            [
              {
                id: "reconciliations",
                label: "Reconciliations",
                href: "/finance/advanced/reconciliations?subtab=reconciliations",
                icon: GitCompare,
              },
              {
                id: "statements",
                label: "Statement Lines",
                href: "/finance/advanced/reconciliations?subtab=statements",
                icon: FileText,
              },
            ] as SubTab[]
          }
        />

        <Card padding="none">
          {activeTab === "reconciliations" ? (
            <DataTable
              columns={reconColumns}
              data={reconciliations}
              loading={loading}
              rowKey={(r) => r.id}
              emptyTitle="No bank accounts"
              emptyMessage="Add a bank account to start reconciling."
              emptyIcon={<GitCompare size={48} />}
            />
          ) : (
            <DataTable
              columns={stmtColumns}
              data={statements}
              loading={loading}
              rowKey={(r) => r.id}
              emptyTitle="No transactions"
              emptyMessage="Add a bank transaction to reconcile."
              emptyIcon={<FileText size={48} />}
            />
          )}
        </Card>

        <BankTransactionModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          accounts={accounts}
          onSubmit={async (accountId, data) => {
            await client.post(
              `/finance/bank-accounts/${accountId}/transactions`,
              data,
            );
            setImportOpen(false);
            fetchData();
          }}
        />
      </div>
    </RouteGuard>
  );
}

function BankTransactionModal({
  open,
  onClose,
  accounts,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  onSubmit: (
    accountId: string,
    data: {
      amount: number;
      type: "CREDIT" | "DEBIT";
      description: string;
      date: string;
    },
  ) => Promise<void>;
}) {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && accounts.length > 0 && !accountId && accounts[0])
      setAccountId(accounts[0].id);
  }, [open, accounts, accountId]);

  const canSubmit = accountId && amount && description && date && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(accountId, {
        amount: Number(amount),
        type,
        description,
        date,
      });
      setAmount("");
      setDescription("");
      setDate("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Bank Transaction"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Add
          </Button>
        </>
      }
    >
      <div className="ui-stack-4">
        <FormField label="Bank Account" required>
          <Select
            value={accountId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setAccountId(e.target.value)
            }
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.bankName} — {a.accountName}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Type" required>
          <Select
            value={type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setType(e.target.value as "CREDIT" | "DEBIT")
            }
          >
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </Select>
        </FormField>
        <TextField
          label="Amount"
          type="number"
          required
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAmount(e.target.value)
          }
        />
        <TextField
          label="Description"
          required
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDescription(e.target.value)
          }
        />
        <TextField
          label="Date"
          type="date"
          required
          value={date}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDate(e.target.value)
          }
        />
      </div>
    </Modal>
  );
}
