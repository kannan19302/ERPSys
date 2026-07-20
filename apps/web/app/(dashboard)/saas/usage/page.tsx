"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, PageHeader, DashboardKPICard, DashboardChart, DataTable } from "@unerp/ui";
import {
  Users,
  HardDrive,
  Zap,
  Bell,
  Plus,
  Download,
  X,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface UsageMetrics {
  usersCurrent: number;
  usersLimit: number;
  storageCurrentMb: number;
  storageLimitMb: number;
  apiCallsCurrent: number;
  apiCallsLimit: number;
}

interface UsageHistoryPoint {
  date: string;
  users: number;
  storageMb: number;
  apiCalls: number;
}

interface AppStorage {
  appSlug: string;
  estimatedMb: number;
  rowCount: number;
}

interface AlertRule {
  id: string;
  metric: string;
  threshold: number;
  enabled: boolean;
}

interface AlertHistoryItem {
  id: string;
  ruleId: string;
  metric: string;
  triggeredValue: number;
  threshold: number;
  triggeredAt: string;
  acknowledged: boolean;
}

export default function SaasUsagePage() {
  const client = useApiClient();
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [history, setHistory] = useState<UsageHistoryPoint[]>([]);
  const [appStorage, setAppStorage] = useState<AppStorage[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newMetric, setNewMetric] = useState("USERS_COUNT");
  const [newThreshold, setNewThreshold] = useState(80);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [dateRange, setDateRange] = useState("30");

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, hRes, sRes, rRes, aRes] = await Promise.all([
        client.get<any>("/saas/usage/current").catch(() => null),
        client.get<any>("/saas/usage/history").catch(() => []),
        client.get<any>("/saas/storage-usage").catch(() => []),
        client.get<any>("/saas/alerts/rules").catch(() => []),
        client.get<any>("/saas/alerts/history").catch(() => []),
      ]);
      if (mRes) {
        setMetrics({
          usersCurrent: mRes.users?.current ?? 0,
          usersLimit: mRes.users?.limit ?? 1,
          storageCurrentMb: mRes.storage?.current ?? 0,
          storageLimitMb: mRes.storage?.limit ?? 1,
          apiCallsCurrent: mRes.apiCalls?.current ?? 0,
          apiCallsLimit: mRes.apiCalls?.limit ?? 1,
        });
      }
      setHistory(Array.isArray(hRes) ? hRes : []);
      setAppStorage(Array.isArray(sRes) ? sRes : []);
      setAlertRules(Array.isArray(rRes) ? rRes : []);
      setAlertHistory(Array.isArray(aRes) ? aRes : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const chartData = useMemo(() => {
    return history.map((h) => ({
      date: new Date(h.date).toLocaleDateString(),
      Users: h.users,
      Storage: Number((h.storageMb / 1024).toFixed(2)),
      "API Calls": h.apiCalls,
    }));
  }, [history]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/saas/alerts/rules", {
        name: `${newMetric} threshold alert`,
        metric: newMetric,
        condition: "gte",
        threshold: Number(newThreshold),
        enabled: true,
        channel: "email",
      });
      setShowCreateRule(false);
      setNewMetric("USERS_COUNT");
      setNewThreshold(80);
      loadData();
    } catch {}
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    try {
      await client.patch(`/saas/alerts/rules/${editingRule.id}`, {
        name: `${editingRule.metric} threshold alert`,
        metric: editingRule.metric,
        condition: "gte",
        threshold: Number(editingRule.threshold),
      });
      setEditingRule(null);
      loadData();
    } catch {}
  };

  const handleToggleRule = async (rule: AlertRule) => {
    try {
      await client.patch(`/saas/alerts/rules/${rule.id}`, {
        name: `${rule.metric} threshold alert`,
        metric: rule.metric,
        enabled: !rule.enabled,
      });
      loadData();
    } catch {}
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await client.delete(`/saas/alerts/rules/${id}`);
      loadData();
    } catch {}
  };

  const handleExport = async () => {
    try {
      const blob = await client.request("/saas/usage/export", {}, "blob");
      const url = URL.createObjectURL(blob as any);
      const a = document.createElement("a");
      a.href = url;
      a.download = "usage-report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const formatStorage = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;

  const pct = (current: number, limit: number) => limit > 0 ? Math.round((current / limit) * 100) : 0;
  const barColor = (v: number) => v > 90 ? "ui-progress-bar-danger" : v > 75 ? "ui-progress-bar-warning" : "ui-progress-bar-success";

  const metricLabel: Record<string, string> = {
    USERS_COUNT: "Active Users",
    STORAGE_MB: "Storage Used",
    API_CALLS_COUNT: "API Calls",
  };

  return (
    <RouteGuard permission="saas.usage.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Usage Analytics"
          description="Monitor resource consumption, set usage alerts, and export usage data."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Usage" },
          ]}
        />

        <div className="ui-flex-between">
          <div className="ui-hstack-3">
            <button
              className={`ui-pill ${dateRange === "7" ? "ui-pill-active" : ""}`}
              onClick={() => setDateRange("7")}
            >
              7 Days
            </button>
            <button
              className={`ui-pill ${dateRange === "30" ? "ui-pill-active" : ""}`}
              onClick={() => setDateRange("30")}
            >
              30 Days
            </button>
            <button
              className={`ui-pill ${dateRange === "90" ? "ui-pill-active" : ""}`}
              onClick={() => setDateRange("90")}
            >
              90 Days
            </button>
          </div>
          <button className="ui-btn ui-btn-secondary" onClick={handleExport}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="ui-grid-3">
          <Card padding="lg">
            <div className="ui-hstack-3 ui-mb-2">
              <Users size={18} style={{ color: "var(--color-primary)" }} />
              <span className="ui-heading-sm">Active Users</span>
            </div>
            <div className="text-2xl font-bold">{metrics?.usersCurrent.toLocaleString() || 0}</div>
            <div className="ui-text-xs-muted">of {metrics?.usersLimit.toLocaleString() || 0} limit</div>
            <div className="ui-progress ui-mt-3">
              <div className={`ui-progress-bar ${barColor(pct(metrics?.usersCurrent || 0, metrics?.usersLimit || 1))}`} style={{ width: `${pct(metrics?.usersCurrent || 0, metrics?.usersLimit || 1)}%` }} />
            </div>
          </Card>
          <Card padding="lg">
            <div className="ui-hstack-3 ui-mb-2">
              <HardDrive size={18} style={{ color: "var(--color-warning)" }} />
              <span className="ui-heading-sm">Storage</span>
            </div>
            <div className="text-2xl font-bold">{formatStorage(metrics?.storageCurrentMb || 0)}</div>
            <div className="ui-text-xs-muted">of {formatStorage(metrics?.storageLimitMb || 0)} limit</div>
            <div className="ui-progress ui-mt-3">
              <div className={`ui-progress-bar ${barColor(pct(metrics?.storageCurrentMb || 0, metrics?.storageLimitMb || 1))}`} style={{ width: `${pct(metrics?.storageCurrentMb || 0, metrics?.storageLimitMb || 1)}%` }} />
            </div>
          </Card>
          <Card padding="lg">
            <div className="ui-hstack-3 ui-mb-2">
              <Zap size={18} style={{ color: "var(--color-success)" }} />
              <span className="ui-heading-sm">API Calls</span>
            </div>
            <div className="text-2xl font-bold">{(metrics?.apiCallsCurrent || 0).toLocaleString()}</div>
            <div className="ui-text-xs-muted">of {(metrics?.apiCallsLimit || 0).toLocaleString()} limit</div>
            <div className="ui-progress ui-mt-3">
              <div className={`ui-progress-bar ${barColor(pct(metrics?.apiCallsCurrent || 0, metrics?.apiCallsLimit || 1))}`} style={{ width: `${pct(metrics?.apiCallsCurrent || 0, metrics?.apiCallsLimit || 1)}%` }} />
            </div>
          </Card>
        </div>

        <DashboardChart
          title="Usage Trend (Last 30 Days)"
          subtitle="Daily resource consumption over time"
          data={chartData}
          config={{
            xAxisKey: "date",
            series: [
              { dataKey: "Users", name: "Users", color: "var(--color-primary)" },
              { dataKey: "Storage", name: "Storage (GB)", color: "var(--color-warning)" },
              { dataKey: "API Calls", name: "API Calls", color: "var(--color-success)" },
            ],
          }}
          defaultChartType="line"
          allowedChartTypes={["line", "bar"]}
          height={300}
        />

        <div className="ui-grid-2">
          <Card padding="lg">
            <h3 className="ui-heading-base ui-mb-4">Storage by App</h3>
            {appStorage.length === 0 && !loading && (
              <p className="ui-text-xs-muted">No app storage data available.</p>
            )}
            <div className="ui-stack-2">
              {appStorage.map((a) => (
                <div key={a.appSlug} className="ui-flex-between ui-py-2 ui-border-b ui-border-border/30">
                  <div className="ui-hstack-2">
                    <HardDrive size={14} className="ui-text-muted" />
                    <span className="capitalize font-medium">{a.appSlug}</span>
                  </div>
                  <div className="ui-hstack-3">
                    <span className="text-xs ui-text-muted">{a.rowCount.toLocaleString()} rows</span>
                    <span className="font-mono text-sm font-semibold">{formatStorage(a.estimatedMb)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <div className="ui-flex-between ui-mb-4">
              <h3 className="ui-heading-base">Usage Alert Rules</h3>
              <button className="ui-btn ui-btn-primary" onClick={() => setShowCreateRule(true)}>
                <Plus size={14} /> Add Rule
              </button>
            </div>
            {alertRules.length === 0 && !loading && (
              <p className="ui-text-xs-muted">No alert rules configured.</p>
            )}
            <div className="ui-stack-2">
              {alertRules.map((rule) => (
                <div key={rule.id} className="ui-flex-between ui-py-2 ui-border-b ui-border-border/30">
                  <div>
                    <div className="font-medium text-sm">{metricLabel[rule.metric] || rule.metric}</div>
                    <div className="ui-text-xs-muted">Threshold: {rule.threshold}%</div>
                  </div>
                  <div className="ui-hstack-2">
                    <button
                      className={`ui-pill ${rule.enabled ? "ui-pill-active" : ""}`}
                      onClick={() => handleToggleRule(rule)}
                    >
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </button>
                    <button className="ui-btn-icon" onClick={() => setEditingRule(rule)} title="Edit">
                      <Bell size={14} />
                    </button>
                    <button className="ui-btn-icon ui-table-action-btn-danger" onClick={() => handleDeleteRule(rule.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <hr className="ui-divider" />
            <h4 className="ui-heading-sm ui-mb-3">Alert History</h4>
            {alertHistory.length === 0 && !loading && (
              <p className="ui-text-xs-muted">No alerts triggered yet.</p>
            )}
            <div className="ui-stack-2">
              {alertHistory.slice(0, 10).map((item) => (
                <div key={item.id} className="ui-flex-between ui-py-2 ui-border-b ui-border-border/30">
                  <div className="ui-hstack-3">
                    <AlertTriangle size={14} className="ui-text-warning" />
                    <div>
                      <span className="text-sm font-medium">{metricLabel[item.metric] || item.metric}</span>
                      <span className="ui-text-xs-muted ui-ml-2">
                        {item.triggeredValue} exceeded {item.threshold} threshold
                      </span>
                    </div>
                  </div>
                  <div className="ui-text-xs-muted">
                    {new Date(item.triggeredAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {showCreateRule && (
          <div className="ui-modal-overlay" onClick={() => setShowCreateRule(false)}>
            <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ui-modal-header">
                <span>Create Alert Rule</span>
                <button className="ui-btn-icon" onClick={() => setShowCreateRule(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateRule}>
                <div className="ui-modal-body ui-stack-4">
                  <div className="ui-form-group">
                    <label className="ui-label">Metric</label>
                    <select className="ui-select" value={newMetric} onChange={(e) => setNewMetric(e.target.value)}>
                      <option value="USERS_COUNT">Active Users</option>
                      <option value="STORAGE_MB">Storage Used</option>
                      <option value="API_CALLS_COUNT">API Calls</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Threshold (%)</label>
                    <input className="ui-input" type="number" min={1} max={100} value={newThreshold} onChange={(e) => setNewThreshold(Number(e.target.value))} />
                  </div>
                </div>
                <div className="ui-modal-footer">
                  <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setShowCreateRule(false)}>Cancel</button>
                  <button type="submit" className="ui-btn ui-btn-primary">Create Rule</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingRule && (
          <div className="ui-modal-overlay" onClick={() => setEditingRule(null)}>
            <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ui-modal-header">
                <span>Edit Alert Rule</span>
                <button className="ui-btn-icon" onClick={() => setEditingRule(null)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleUpdateRule}>
                <div className="ui-modal-body ui-stack-4">
                  <div className="ui-form-group">
                    <label className="ui-label">Metric</label>
                    <select className="ui-select" value={editingRule.metric} onChange={(e) => setEditingRule({ ...editingRule, metric: e.target.value })}>
                      <option value="USERS_COUNT">Active Users</option>
                      <option value="STORAGE_MB">Storage Used</option>
                      <option value="API_CALLS_COUNT">API Calls</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Threshold (%)</label>
                    <input className="ui-input" type="number" min={1} max={100} value={editingRule.threshold} onChange={(e) => setEditingRule({ ...editingRule, threshold: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="ui-modal-footer">
                  <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setEditingRule(null)}>Cancel</button>
                  <button type="submit" className="ui-btn ui-btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
