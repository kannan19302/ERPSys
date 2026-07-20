"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, PageHeader, DataTable } from "@unerp/ui";
import {
  Search,
  Download,
  X,
  Filter,
  Clock,
  Shield,
  UserCheck,
  Settings,
  Key,
  FileText,
  CreditCard,
  Users,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface AuditEntry {
  id: string;
  actionType: string;
  actor: string;
  actorEmail: string;
  resourceType: string;
  resourceId: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  metadata: Record<string, string>;
}

export default function SaasAuditLogPage() {
  const client = useApiClient();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await client.get<AuditEntry[]>("/saas/audit-logs").catch(() => []);
      setEntries(res || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const actionTypes = useMemo(() => {
    const types = new Set(entries.map((e) => e.actionType));
    return ["ALL", ...Array.from(types)];
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.actorEmail.toLowerCase().includes(search.toLowerCase())) return false;
      if (actionTypeFilter !== "ALL" && e.actionType !== actionTypeFilter) return false;
      if (dateFrom && new Date(e.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.createdAt) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [entries, search, actionTypeFilter, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total: entries.length,
    logins: entries.filter((e) => e.actionType === "LOGIN").length,
    changes: entries.filter((e) => e.actionType === "UPDATE" || e.actionType === "CREATE" || e.actionType === "DELETE").length,
    security: entries.filter((e) => e.actionType === "SECURITY" || e.actionType === "PERMISSION_CHANGE").length,
    today: entries.filter((e) => new Date(e.createdAt).toDateString() === new Date().toDateString()).length,
  }), [entries]);

  const handleExport = async () => {
    try {
      const blob = await client.request("/saas/audit-logs/export/csv", {}, "blob");
      const url = URL.createObjectURL(blob as any);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit-log.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const actionIcon = (type: string) => {
    if (type === "LOGIN" || type === "LOGOUT") return <UserCheck size={14} />;
    if (type === "SECURITY" || type === "PERMISSION_CHANGE") return <Shield size={14} />;
    if (type === "CREATE" || type === "UPDATE" || type === "DELETE") return <Settings size={14} />;
    if (type === "API_KEY") return <Key size={14} />;
    if (type === "BILLING") return <CreditCard size={14} />;
    if (type === "TEAM") return <Users size={14} />;
    return <FileText size={14} />;
  };

  return (
    <RouteGuard permission="saas.audit-log.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Audit Log"
          description="Track all security-relevant events and changes in your workspace."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Audit Log" },
          ]}
        />

        <div className="ui-stats-row">
          <Card padding="lg">
            <div className="ui-stat-value">{stats.total}</div>
            <div className="ui-stat-label">Total Events</div>
          </Card>
          <Card padding="lg">
            <div className="ui-stat-value">{stats.today}</div>
            <div className="ui-stat-label">Today</div>
          </Card>
          <Card padding="lg">
            <div className="ui-stat-value">{stats.logins}</div>
            <div className="ui-stat-label">Logins</div>
          </Card>
          <Card padding="lg">
            <div className="ui-stat-value">{stats.security}</div>
            <div className="ui-stat-label">Security Events</div>
          </Card>
        </div>

        <div className="ui-filter-bar">
          <div className="ui-search-wrapper">
            <Search size={14} className="ui-search-icon" />
            <input
              className="ui-search-input"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="ui-select" style={{ width: "160px" }} value={actionTypeFilter} onChange={(e) => setActionTypeFilter(e.target.value)}>
            {actionTypes.map((t) => (
              <option key={t} value={t}>{t === "ALL" ? "All Types" : t}</option>
            ))}
          </select>
          <input className="ui-input" type="date" style={{ width: "auto" }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
          <input className="ui-input" type="date" style={{ width: "auto" }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
          <button className="ui-btn ui-btn-secondary" onClick={handleExport}>
            <Download size={14} /> Export
          </button>
        </div>

        <Card padding="lg">
          <DataTable
            columns={[
              { key: "type", header: "Type" },
              { key: "description", header: "Event", sortable: true },
              { key: "actor", header: "Actor" },
              { key: "resource", header: "Resource" },
              { key: "ip", header: "IP Address" },
              { key: "createdAt", header: "Date", sortable: true },
            ]}
            data={filtered.map((e) => ({
              ...e,
              type: (
                <span className="ui-hstack-2">
                  {actionIcon(e.actionType)}
                  <span className="text-xs font-medium">{e.actionType}</span>
                </span>
              ),
              actor: (
                <span className="text-sm">
                  {e.actor} <span className="ui-text-xs-muted">({e.actorEmail})</span>
                </span>
              ),
              resource: (
                <span className="text-xs">
                  {e.resourceType} #{e.resourceId.slice(0, 8)}
                </span>
              ),
              createdAt: new Date(e.createdAt).toLocaleString(),
            })) as unknown as Record<string, unknown>[]}
            onRowClick={(row) => setSelectedEntry(entries.find((e) => e.id === (row as any).id) || null)}
            emptyTitle="No audit events"
            emptyMessage="Adjust your filters or wait for activity to appear."
          />
        </Card>

        {selectedEntry && (
          <div className="ui-modal-overlay" onClick={() => setSelectedEntry(null)}>
            <div className="ui-modal ui-modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="ui-modal-header">
                <div className="ui-hstack-3">
                  {actionIcon(selectedEntry.actionType)}
                  <span>{selectedEntry.actionType} — {selectedEntry.id.slice(0, 8)}</span>
                </div>
                <button className="ui-btn-icon" onClick={() => setSelectedEntry(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="ui-modal-body">
                <div className="ui-grid-2">
                  <div className="ui-kv-pair">
                    <span className="ui-kv-label">Action Type</span>
                    <span className="ui-kv-value">{selectedEntry.actionType}</span>
                  </div>
                  <div className="ui-kv-pair">
                    <span className="ui-kv-label">Date</span>
                    <span className="ui-kv-value">{new Date(selectedEntry.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="ui-kv-pair">
                    <span className="ui-kv-label">Actor</span>
                    <span className="ui-kv-value">{selectedEntry.actor} ({selectedEntry.actorEmail})</span>
                  </div>
                  <div className="ui-kv-pair">
                    <span className="ui-kv-label">Resource</span>
                    <span className="ui-kv-value">{selectedEntry.resourceType} / {selectedEntry.resourceId}</span>
                  </div>
                  <div className="ui-kv-pair" style={{ gridColumn: "span 2" }}>
                    <span className="ui-kv-label">Description</span>
                    <span className="ui-kv-value">{selectedEntry.description}</span>
                  </div>
                  <div className="ui-kv-pair">
                    <span className="ui-kv-label">IP Address</span>
                    <span className="ui-kv-value font-mono">{selectedEntry.ipAddress}</span>
                  </div>
                  <div className="ui-kv-pair">
                    <span className="ui-kv-label">User Agent</span>
                    <span className="ui-kv-value" style={{ fontSize: "11px", wordBreak: "break-word" }}>
                      {selectedEntry.userAgent}
                    </span>
                  </div>
                </div>
                {Object.keys(selectedEntry.metadata).length > 0 && (
                  <>
                    <hr className="ui-divider" />
                    <h4 className="ui-heading-sm ui-mb-3">Metadata</h4>
                    <div className="ui-grid-2">
                      {Object.entries(selectedEntry.metadata).map(([k, v]) => (
                        <div key={k} className="ui-kv-pair">
                          <span className="ui-kv-label">{k}</span>
                          <span className="ui-kv-value">{v}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="ui-modal-footer">
                <button className="ui-btn ui-btn-secondary" onClick={() => setSelectedEntry(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
