"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, DataTable, Card } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import type { Column } from "@unerp/ui";

interface NetworkHealth {
  id: string;
  network: string;
  blockHeight: number;
  peers: number;
  syncStatus: string;
  lastCheckedAt: string;
}
interface NetworkStats {
  networks: NetworkHealth[];
  totalTransactions: number;
  totalContracts: number;
  totalAuditEntries: number;
}

export default function NetworkPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const [healthRes, statsRes] = await Promise.all([
      fetch("/api/v1/blockchain/network/health"),
      fetch("/api/v1/blockchain/network/stats"),
    ]);
    const health = healthRes.ok ? await healthRes.json() : [];
    const statsData = statsRes.ok ? await statsRes.json() : null;
    setStats(
      statsData ?? {
        networks: health,
        totalTransactions: 0,
        totalContracts: 0,
        totalAuditEntries: 0,
      },
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const columns: Column<NetworkHealth>[] = [
    {
      key: "network",
      header: "Network",
      render: (r) => <span className="ui-badge">{r.network}</span>,
    },
    {
      key: "blockHeight",
      header: "Block Height",
      render: (r) => r.blockHeight.toLocaleString(),
    },
    { key: "peers", header: "Peers", render: (r) => r.peers },
    {
      key: "syncStatus",
      header: "Sync Status",
      render: (r) => {
        const cls =
          r.syncStatus === "SYNCED"
            ? "ui-badge-success"
            : r.syncStatus === "ERROR"
              ? "ui-badge-danger"
              : "ui-badge-info";
        return <span className={`ui-badge ${cls}`}>{r.syncStatus}</span>;
      },
    },
    {
      key: "lastCheckedAt",
      header: "Last Checked",
      render: (r) => new Date(r.lastCheckedAt).toLocaleString(),
    },
  ];

  return (
    <RouteGuard permission="blockchain.network.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Network Health"
          description="Blockchain network status, block height, and sync status."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Blockchain", href: "/blockchain" },
            { label: "Network" },
          ]}
        />
        <div className="ui-grid-4">
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Transactions
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {stats?.totalTransactions ?? 0}
              </h3>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Smart Contracts
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {stats?.totalContracts ?? 0}
              </h3>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Audit Entries
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {stats?.totalAuditEntries ?? 0}
              </h3>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Networks
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {stats?.networks.length ?? 0}
              </h3>
            </div>
          </Card>
        </div>
        <DataTable
          columns={columns}
          data={stats?.networks ?? []}
          loading={loading}
        />
      </div>
    </RouteGuard>
  );
}
