"use client";

import { useState } from "react";
import { Landmark, Building2, CreditCard, RefreshCw } from "lucide-react";
import { Card, PageHeader, Button, Badge, Spinner } from "@unerp/ui";

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  type: "Checking" | "Savings" | "Credit Card" | "Money Market";
  currency: string;
  balance: number;
  status: "active" | "inactive" | "closed";
}

const SAMPLE_ACCOUNTS: BankAccount[] = [
  {
    id: "BA01",
    accountName: "Main Operating Account",
    bankName: "Chase Bank",
    accountNumber: "****4521",
    type: "Checking",
    currency: "USD",
    balance: 284750.0,
    status: "active",
  },
  {
    id: "BA02",
    accountName: "Payroll Account",
    bankName: "Bank of America",
    accountNumber: "****7893",
    type: "Checking",
    currency: "USD",
    balance: 125000.0,
    status: "active",
  },
  {
    id: "BA03",
    accountName: "Business Savings",
    bankName: "Wells Fargo",
    accountNumber: "****3367",
    type: "Savings",
    currency: "USD",
    balance: 500000.0,
    status: "active",
  },
  {
    id: "BA04",
    accountName: "Euro Operations",
    bankName: "Deutsche Bank",
    accountNumber: "****2291",
    type: "Checking",
    currency: "EUR",
    balance: 185000.0,
    status: "active",
  },
  {
    id: "BA05",
    accountName: "Corporate Credit Card",
    bankName: "American Express",
    accountNumber: "****5504",
    type: "Credit Card",
    currency: "USD",
    balance: -12450.0,
    status: "active",
  },
  {
    id: "BA06",
    accountName: "Money Market Fund",
    bankName: "Fidelity",
    accountNumber: "****1188",
    type: "Money Market",
    currency: "USD",
    balance: 750000.0,
    status: "active",
  },
  {
    id: "BA07",
    accountName: "Old Operating Account",
    bankName: "Citibank",
    accountNumber: "****9902",
    type: "Checking",
    currency: "USD",
    balance: 0.0,
    status: "closed",
  },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Checking: <Landmark size={20} />,
  Savings: <Building2 size={20} />,
  "Credit Card": <CreditCard size={20} />,
  "Money Market": <Building2 size={20} />,
};

export default function BankAccountsPage() {
  const [accounts] = useState<BankAccount[]>(SAMPLE_ACCOUNTS);
  const [loading] = useState(false);

  if (loading) return <Spinner />;

  const totalBalance = accounts
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="ui-stack-6">
      <div
        className="ui-hstack-4"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <PageHeader
          title="Bank Accounts"
          description="Manage bank accounts, balances, and account details"
        />
        <Button variant="primary">Add Account</Button>
      </div>
      <div className="ui-grid-3">
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Active Accounts</p>
          <p className="ui-heading-sm">
            {accounts.filter((a) => a.status === "active").length}
          </p>
        </Card>
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Total Balance</p>
          <p className="ui-heading-sm">
            $
            {totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Currencies</p>
          <p className="ui-heading-sm">
            {new Set(accounts.map((a) => a.currency)).size}
          </p>
        </Card>
      </div>
      <div className="ui-grid-2">
        {accounts.map((account) => (
          <Card key={account.id} padding="lg" className="ui-stack-3">
            <div className="ui-hstack-3" style={{ alignItems: "flex-start" }}>
              <div className="ui-text-primary">{TYPE_ICONS[account.type]}</div>
              <div style={{ flex: 1 }}>
                <div
                  className="ui-hstack-3"
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 className="ui-heading-sm">{account.accountName}</h3>
                  <Badge
                    variant={
                      account.status === "active"
                        ? "success"
                        : account.status === "closed"
                          ? "default"
                          : "warning"
                    }
                  >
                    {account.status}
                  </Badge>
                </div>
                <p
                  className="ui-text-xs-muted"
                  style={{ marginTop: "var(--space-1)" }}
                >
                  {account.bankName} · {account.accountNumber}
                </p>
                <div
                  className="ui-hstack-3"
                  style={{
                    marginTop: "var(--space-2)",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}
                >
                  <div>
                    <p className="ui-text-xs-muted">
                      {account.type} · {account.currency}
                    </p>
                    <p
                      className="ui-heading-sm"
                      style={{
                        color:
                          account.balance < 0
                            ? "var(--color-danger)"
                            : "inherit",
                      }}
                    >
                      {account.currency === "EUR" ? "€" : "$"}
                      {Math.abs(account.balance).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                      {account.balance < 0 && (
                        <span className="ui-text-xs-muted"> (negative)</span>
                      )}
                    </p>
                  </div>
                  <div className="ui-hstack-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
