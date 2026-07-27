"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, DataTable, Pagination, Card } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { Search, ExternalLink } from "lucide-react";
import type { Column } from "@unerp/ui";

interface TxRecord {
  id: string; transactionHash: string; blockNumber: number | null;
  fromAddress: string | null; toAddress: string | null; value: string | null;
  status: string; timestamp: string;
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchTxs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/v1/blockchain/transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTxs(data.items);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchTxs(); }, [fetchTxs]);

  const columns: Column<TxRecord>[] = [
    { id: "transactionHash", header: "Tx Hash", render: (r) => <code className="u-text-xs">{r.transactionHash.substring(0, 16)}...</code> },
    { id: "blockNumber", header: "Block", render: (r) => r.blockNumber ?? "-" },
    { id: "fromAddress", header: "From", render: (r) => r.fromAddress ? <code className="u-text-xs">{r.fromAddress.substring(0, 10)}...</code> : "-" },
    { id: "toAddress", header: "To", render: (r) => r.toAddress ? <code className="u-text-xs">{r.toAddress.substring(0, 10)}...</code> : "-" },
    { id: "value", header: "Value", render: (r) => r.value ?? "0" },
    { id: "status", header: "Status", render: (r) => <span className={`ui-badge ${r.status === "CONFIRMED" ? "ui-badge-success" : r.status === "FAILED" ? "ui-badge-danger" : "ui-badge-info"}`}>{r.status}</span> },
    { id: "timestamp", header: "Time", render: (r) => new Date(r.timestamp).toLocaleString() },
  ];

  return (
    <RouteGuard permission="blockchain.transaction.read">
      <div className="ui-stack-6">
        <PageHeader title="Transaction Explorer" description="Search and browse blockchain transactions." icon={Search} breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: "Blockchain", href: "/blockchain" }, { label: "Transactions" }]} />
        <div className="ui-flex-row ui-gap-4">
          <input className="ui-input u-w-96" placeholder="Search by tx hash, from, or to address..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <DataTable columns={columns} data={txs} loading={loading} sortable />
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </RouteGuard>
  );
}
