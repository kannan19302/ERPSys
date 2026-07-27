"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, DataTable, Pagination } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { History } from "lucide-react";
import type { Column } from "@unerp/ui";

interface LoginRecord {
  id: string; status: string; ipAddress: string | null; device: string | null;
  browser: string | null; location: string | null; failureReason: string | null; createdAt: string;
}

export default function LoginHistoryPage() {
  const [records, setRecords] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/v1/auth/login-history?${params}`);
    if (res.ok) {
      const data = await res.json();
      setRecords(data.items);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const columns: Column<LoginRecord>[] = [
    { id: "status", header: "Status", render: (r) => <span className={r.status === "SUCCESS" ? "ui-badge ui-badge-success" : "ui-badge ui-badge-danger"}>{r.status}</span> },
    { id: "ipAddress", header: "IP Address", render: (r) => r.ipAddress ?? "-" },
    { id: "location", header: "Location", render: (r) => r.location ?? "-" },
    { id: "browser", header: "Browser", render: (r) => r.browser ?? "-" },
    { id: "device", header: "Device", render: (r) => r.device ?? "-" },
    { id: "failureReason", header: "Reason", render: (r) => r.failureReason ?? "-" },
    { id: "createdAt", header: "Date", render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <RouteGuard permission="auth.login-history.read">
      <div className="ui-stack-6">
        <PageHeader title="Login History" description="Review all sign-in attempts to your account." icon={History} breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: "Auth", href: "/auth" }, { label: "Login History" }]} />
        <div className="ui-flex-row ui-gap-4">
          <select className="ui-input u-w-48" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <DataTable columns={columns} data={records} loading={loading} sortable />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </RouteGuard>
  );
}
