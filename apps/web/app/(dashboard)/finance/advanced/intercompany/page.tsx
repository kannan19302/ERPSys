"use client";

import React, { useState, useEffect } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface IntercompanyTransaction {
  id: string;
  sourceEntity: string;
  targetEntity: string;
  description: string;
  amount: number | string;
  currency: string;
  status: string;
}

interface IntercompanyStats {
  totalTransactionsCount: number;
  eliminatedCount: number;
  matchedCount: number;
  pendingCount: number;
  totalNettedVolume: number;
  pendingNettingVolume: number;
  pendingMatchVolume: number;
}

const EMPTY_STATS: IntercompanyStats = {
  totalTransactionsCount: 0,
  eliminatedCount: 0,
  matchedCount: 0,
  pendingCount: 0,
  totalNettedVolume: 0,
  pendingNettingVolume: 0,
  pendingMatchVolume: 0,
};

export default function IntercompanyPage() {
  const client = useApiClient();
  const [transactions, setTransactions] = useState<IntercompanyTransaction[]>(
    [],
  );
  const [stats, setStats] = useState<IntercompanyStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txRes, statsRes] = await Promise.all([
        client.get<{ items: IntercompanyTransaction[]; total: number }>(
          "/advanced-finance/intercompany/transactions",
        ),
        client.get<IntercompanyStats>("/advanced-finance/intercompany/stats"),
      ]);
      setTransactions(txRes?.items || []);
      setStats(statsRes || EMPTY_STATS);
    } catch {
      setTransactions([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  };

  const columns: ListColumn<IntercompanyTransaction>[] = [
    { key: "sourceEntity", header: "Source Entity" },
    { key: "targetEntity", header: "Target Entity" },
    { key: "description", header: "Description" },
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
          className={`ui-badge ui-badge-${val === "ELIMINATED" || val === "MATCHED" ? "success" : "warning"}`}
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
              <p className="ui-text-xs-muted">Total IC Transactions</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-primary)" }}
              >
                {stats.totalTransactionsCount}
              </p>
              <p className="ui-text-xs-muted">
                {stats.eliminatedCount} eliminated, {stats.matchedCount} matched
              </p>
            </div>
          </Card>
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">Netted Volume (Eliminated)</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-success)" }}
              >
                ${stats.totalNettedVolume.toLocaleString()}
              </p>
              <p className="ui-text-xs-muted">
                ${stats.pendingNettingVolume.toLocaleString()} pending netting
              </p>
            </div>
          </Card>
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">Pending Match</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-warning)" }}
              >
                {stats.pendingCount}{" "}
                {stats.pendingCount === 1 ? "Entry" : "Entries"}
              </p>
              <p className="ui-text-xs-muted">
                ${stats.pendingMatchVolume.toLocaleString()} unmatched
              </p>
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
              <Button
                variant="primary"
                onClick={() =>
                  client
                    .post("/advanced-finance/intercompany/auto-match", {})
                    .then(fetchData)
                }
              >
                <ArrowRightLeft size={14} style={{ marginRight: "6px" }} /> Run
                Auto-Match
              </Button>
            }
          />
        </Card>
      </div>
    </RouteGuard>
  );
}
