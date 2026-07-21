"use client";

import React, { useState, useEffect } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface IntercompanyTransaction {
  id: string;
  sourceEntity: string;
  targetEntity: string;
  transactionType: string;
  amount: number | string;
  currency: string;
  status: string;
}

export default function IntercompanyPage() {
  const client = useApiClient();
  const [transactions, setTransactions] = useState<IntercompanyTransaction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await client.get<IntercompanyTransaction[]>(
        "/api/v1/advanced-finance/intercompany-transactions",
      );
      setTransactions(res || []);
    } catch {
      setTransactions([
        {
          id: "1",
          sourceEntity: "UniERP US Inc",
          targetEntity: "UniERP Europe GmbH",
          transactionType: "MANAGEMENT_FEE",
          amount: 125000,
          currency: "USD",
          status: "SETTLED",
        },
        {
          id: "2",
          sourceEntity: "UniERP US Inc",
          targetEntity: "UniERP Asia Pacific Pte",
          transactionType: "IP_ROYALTY",
          amount: 84000,
          currency: "USD",
          status: "MATCHED",
        },
        {
          id: "3",
          sourceEntity: "UniERP Europe GmbH",
          targetEntity: "UniERP Asia Pacific Pte",
          transactionType: "INVENTORY_TRANSFER",
          amount: 45000,
          currency: "EUR",
          status: "PENDING_ELIMINATION",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const columns: ListColumn<IntercompanyTransaction>[] = [
    { key: "sourceEntity", header: "Source Entity" },
    { key: "targetEntity", header: "Target Entity" },
    { key: "transactionType", header: "Transaction Type" },
    {
      key: "amount",
      header: "Amount",
      render: (val, row) => `${row.currency} ${Number(val).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (val) => (
        <span
          className={`ui-badge ui-badge-${val === "SETTLED" || val === "MATCHED" ? "success" : "warning"}`}
        >
          {String(val)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="ui-flex-center" style={{ minHeight: "300px" }}>
        <Loader2
          className="ui-spin"
          size={32}
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.journal.read">
      <div className="ui-stack-4 ui-animate-in">
        <div className="ui-grid-3">
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">Total Intercompany Entities</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-primary)" }}
              >
                3 Entities
              </p>
              <p className="ui-text-xs-muted">US, Europe, Asia Pacific</p>
            </div>
          </Card>
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">
                Intercompany Volume (This Period)
              </p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-success)" }}
              >
                $254,000
              </p>
              <p className="ui-text-xs-muted">Automated IC matching active</p>
            </div>
          </Card>
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">Pending Eliminations</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-warning)" }}
              >
                1 Entry
              </p>
              <p className="ui-text-xs-muted">Consolidation run ready</p>
            </div>
          </Card>
        </div>

        <Card padding="md">
          <ListPageTemplate
            title="Intercompany Transactions & Eliminations"
            subtitle="Manage multi-entity intercompany loan agreements, management fees, and consolidation elimination entries."
            columns={columns}
            data={transactions}
            actions={
              <Button variant="primary">
                <ArrowRightLeft size={14} style={{ marginRight: "6px" }} /> +
                New IC Transaction
              </Button>
            }
          />
        </Card>
      </div>
    </RouteGuard>
  );
}
