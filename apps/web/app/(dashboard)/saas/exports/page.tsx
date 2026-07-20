"use client";
import React, { useState, useEffect } from "react";
import { Card, PageHeader, DataTable } from "@unerp/ui";
import {
  Download,
  FileText,
  X,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface ExportJob {
  id: string;
  format: "CSV" | "JSON" | "XLSX";
  modules: string[];
  dateFrom: string;
  dateTo: string;
  status: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";
  fileUrl: string | null;
  fileSize: number | null;
  createdAt: string;
  completedAt: string | null;
}

const AVAILABLE_MODULES = [
  "finance", "hr", "crm", "inventory", "sales",
  "procurement", "projects", "manufacturing", "analytics",
];

export default function SaasExportsPage() {
  const client = useApiClient();
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState<"CSV" | "JSON" | "XLSX">("CSV");
  const [selectedModules, setSelectedModules] = useState<string[]>(["finance"]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await client.get<ExportJob[]>("/saas/exports").catch(() => []);
      setJobs(res || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post("/saas/exports", {
        format,
        modules: selectedModules,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      });
      setFormat("CSV");
      setSelectedModules(["finance"]);
      setDateFrom("");
      setDateTo("");
      loadData();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (jobId: string) => {
    try {
      const blob = await client.request(`/saas/exports/${jobId}/download`, {}, "blob");
      const url = URL.createObjectURL(blob as any);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${jobId}.${(jobs.find((j) => j.id === jobId)?.format || "csv").toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleCancel = async (jobId: string) => {
    try {
      await client.post(`/saas/exports/${jobId}/cancel`);
      loadData();
    } catch {}
  };

  const toggleModule = (mod: string) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    );
  };

  const statusBadge = (status: string) => {
    const cls = status === "COMPLETE" ? "ui-badge-success" :
      status === "PROCESSING" ? "ui-badge-info" :
      status === "PENDING" ? "ui-badge-warning" : "ui-badge-danger";
    const icon = status === "COMPLETE" ? <CheckCircle size={12} /> :
      status === "PROCESSING" ? <RefreshCw size={12} className="animate-spin" /> :
      status === "PENDING" ? <Clock size={12} /> : <AlertCircle size={12} />;
    return <span className={`ui-badge ${cls}`}>{icon} {status}</span>;
  };

  const activeJobs = jobs.filter((j) => j.status === "PENDING" || j.status === "PROCESSING");
  const completedJobs = jobs.filter((j) => j.status === "COMPLETE");

  return (
    <RouteGuard permission="saas.exports.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Data Export"
          description="Export your workspace data in CSV, JSON, or XLSX format."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Exports" },
          ]}
        />

        <div className="ui-grid-3">
          <Card padding="lg">
            <div className="ui-stat-value">{jobs.length}</div>
            <div className="ui-stat-label">Total Exports</div>
          </Card>
          <Card padding="lg">
            <div className="ui-stat-value">{activeJobs.length}</div>
            <div className="ui-stat-label">Active</div>
          </Card>
          <Card padding="lg">
            <div className="ui-stat-value">{completedJobs.length}</div>
            <div className="ui-stat-label">Completed</div>
          </Card>
        </div>

        <div className="ui-grid-3" style={{ alignItems: "start" }}>
          <Card padding="lg" style={{ gridColumn: "span 1" }}>
            <h3 className="ui-heading-base ui-mb-4">New Export Request</h3>
            <form onSubmit={handleCreateExport} className="ui-stack-4">
              <div className="ui-form-group">
                <label className="ui-label">Format</label>
                <select className="ui-select" value={format} onChange={(e) => setFormat(e.target.value as any)}>
                  <option value="CSV">CSV</option>
                  <option value="JSON">JSON</option>
                  <option value="XLSX">XLSX (Excel)</option>
                </select>
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Modules</label>
                <div className="ui-chip-group">
                  {AVAILABLE_MODULES.map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      className={`ui-chip ${selectedModules.includes(mod) ? "ui-chip-primary" : ""}`}
                      onClick={() => toggleModule(mod)}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ui-grid-2">
                <div className="ui-form-group">
                  <label className="ui-label">From</label>
                  <input className="ui-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">To</label>
                  <input className="ui-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="ui-btn ui-btn-primary" disabled={submitting || selectedModules.length === 0}>
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                {submitting ? "Requesting..." : "Request Export"}
              </button>
            </form>
          </Card>

          <Card padding="lg" style={{ gridColumn: "span 2" }}>
            <h3 className="ui-heading-base ui-mb-4">Export History</h3>
            <DataTable
              columns={[
                { key: "format", header: "Format" },
                { key: "modules", header: "Modules" },
                { key: "dateRange", header: "Date Range" },
                { key: "status", header: "Status" },
                { key: "created", header: "Created", sortable: true },
                { key: "size", header: "Size" },
                { key: "actions", header: "" },
              ]}
              data={jobs.map((j) => ({
                ...j,
                format: <span className="font-mono text-xs font-semibold">{j.format}</span>,
                modules: j.modules.slice(0, 3).join(", ") + (j.modules.length > 3 ? ` +${j.modules.length - 3}` : ""),
                dateRange: `${j.dateFrom ? new Date(j.dateFrom).toLocaleDateString() : "All"} - ${j.dateTo ? new Date(j.dateTo).toLocaleDateString() : "All"}`,
                status: statusBadge(j.status),
                created: new Date(j.createdAt).toLocaleDateString(),
                size: j.fileSize ? `${(j.fileSize / 1024 / 1024).toFixed(2)} MB` : "-",
                actions: (
                  <div className="ui-table-actions">
                    {j.status === "COMPLETE" && j.fileUrl && (
                      <button className="ui-table-action-btn" onClick={(e) => { e.stopPropagation(); handleDownload(j.id); }} title="Download">
                        <Download size={14} />
                      </button>
                    )}
                    {(j.status === "PENDING" || j.status === "PROCESSING") && (
                      <button className="ui-table-action-btn ui-table-action-btn-danger" onClick={(e) => { e.stopPropagation(); handleCancel(j.id); }} title="Cancel">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ),
              })) as unknown as Record<string, unknown>[]}
              emptyTitle="No export jobs"
              emptyMessage="Create an export request to begin."
            />
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}
