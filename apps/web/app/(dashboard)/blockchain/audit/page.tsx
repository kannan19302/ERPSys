// @ts-nocheck
"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, DataTable, Pagination } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import type { Column } from "@unerp/ui";

interface AuditEntry {
  id: string; entityType: string; entityId: string; action: string;
  transactionHash: string | null; performedBy: string; metadata: any; timestamp: string;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityType, setEntityType] = useState("");

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (entityType) params.set("entityType", entityType);
    const res = await fetch(`/api/v1/blockchain/audit?${params}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.items);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page, entityType]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const columns: Column<AuditEntry>[] = [
    { key: "entityType", header: "Entity Type", render: (r) => <span className="ui-badge">{r.entityType}</span> },
    { key: "entityId", header: "Entity ID", render: (r) => <code className="u-text-xs">{r.entityId.substring(0, 12)}...</code> },
    { key: "action", header: "Action", render: (r) => r.action },
    { key: "transactionHash", header: "Tx Hash", render: (r) => r.transactionHash ? <code className="u-text-xs">{r.transactionHash.substring(0, 16)}...</code> : "-" },
    { key: "performedBy", header: "Performed By", render: (r) => r.performedBy.substring(0, 8) },
    { key: "timestamp", header: "Timestamp", render: (r) => new Date(r.timestamp).toLocaleString() },
  ];

  return (
    <RouteGuard permission="blockchain.audit.read">
      <div className="ui-stack-6">
        <PageHeader title="Blockchain Audit Trail" description="Append-only log of critical entity changes with blockchain proof." breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: "Blockchain", href: "/blockchain" }, { label: "Audit" }]} />
        <div className="ui-form-group">
          <select className="ui-input u-w-48" value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}>
            <option value="">All Entity Types</option>
            <option value="DOCUMENT">Document</option>
            <option value="GL_JOURNAL">GL Journal</option>
            <option value="PRODUCT">Product</option>
            <option value="INVOICE">Invoice</option>
            <option value="CONTRACT">Contract</option>
          </select>
        </div>
        <DataTable columns={columns} data={entries} loading={loading} />
        {totalPages > 1 && <Pagination page={page} pageCount={totalPages} onChange={setPage} />}
      </div>
    </RouteGuard>
  );
}
