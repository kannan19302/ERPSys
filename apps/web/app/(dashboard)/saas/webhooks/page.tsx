"use client";
import React, { useState, useEffect } from "react";
import { Card, PageHeader, DataTable } from "@unerp/ui";
import {
  Webhook,
  Plus,
  X,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Play,
  Eye,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  status: "ACTIVE" | "DISABLED" | "FAILING";
  lastDeliveryAt: string | null;
  lastDeliveryStatus: "SUCCESS" | "FAILED" | null;
  createdAt: string;
}

interface DeliveryLog {
  id: string;
  endpointId: string;
  event: string;
  status: string;
  statusCode: number;
  requestBody: string;
  responseBody: string;
  durationMs: number;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  "subscription.created", "subscription.updated", "subscription.cancelled",
  "invoice.paid", "invoice.overdue",
  "user.invited", "user.removed",
  "usage.threshold_exceeded",
  "domain.verified", "domain.failed",
];

export default function SaasWebhooksPage() {
  const client = useApiClient();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["subscription.created"]);
  const [testing, setTesting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eRes, lRes] = await Promise.all([
        client.get<WebhookEndpoint[]>("/saas/webhooks").catch(() => []),
        client.get<DeliveryLog[]>("/saas/webhooks/logs").catch(() => []),
      ]);
      setEndpoints(eRes || []);
      setDeliveryLogs(lRes || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.post<WebhookEndpoint>("/saas/webhooks", {
        name, url, events,
      });
      setShowCreate(false);
      setShowSecret(res.secret);
      setName("");
      setUrl("");
      setEvents(["subscription.created"]);
      loadData();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/saas/webhooks/${id}`);
      loadData();
    } catch {}
  };

  const handleToggle = async (endpoint: WebhookEndpoint) => {
    const newStatus = endpoint.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await client.patch(`/saas/webhooks/${endpoint.id}`, { status: newStatus });
      loadData();
    } catch {}
  };

  const handleRotateSecret = async (id: string) => {
    try {
      const res = await client.post<{ secret: string }>(`/saas/webhooks/${id}/rotate-secret`);
      setShowSecret(res.secret);
      loadData();
    } catch {}
  };

  const handleTest = async (id: string) => {
    setTesting(true);
    try {
      const res = await client.post<DeliveryLog>(`/saas/webhooks/${id}/test`);
      setDeliveryLogs((prev) => [res, ...prev]);
      loadData();
    } catch {
    } finally {
      setTesting(false);
    }
  };

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const statusBadge = (status: string) => {
    const cls = status === "ACTIVE" ? "ui-badge-success" :
      status === "DISABLED" ? "ui-badge-neutral" : "ui-badge-danger";
    return <span className={`ui-badge ${cls}`}>{status}</span>;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <RouteGuard permission="saas.webhooks.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Webhooks"
          description="Configure webhook endpoints to receive real-time events from your workspace."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Webhooks" },
          ]}
        />

        <div className="ui-list-toolbar">
          <div className="ui-hstack-3">
            <span className="ui-heading-sm">{endpoints.length} Endpoints</span>
            <span className="ui-badge ui-badge-info">{deliveryLogs.length} Recent Deliveries</span>
          </div>
          <div className="ui-hstack-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => setShowLogs(!showLogs)}>
              <Eye size={14} /> Delivery Logs
            </button>
            <button className="ui-btn ui-btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Add Endpoint
            </button>
          </div>
        </div>

        {showSecret && (
          <Card padding="lg" style={{ borderColor: "var(--color-warning)" }}>
            <div className="ui-flex-between">
              <div>
                <p className="font-semibold text-sm">New Webhook Secret</p>
                <p className="ui-text-xs-muted">Copy this secret now. You won&apos;t be able to see it again.</p>
              </div>
              <button className="ui-btn-icon" onClick={() => setShowSecret(null)}><X size={16} /></button>
            </div>
            <div className="ui-hstack-2 ui-mt-3">
              <code className="flex-1 ui-field-box font-mono text-xs">{showSecret}</code>
              <button className="ui-btn ui-btn-primary" onClick={() => handleCopy(showSecret)}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </Card>
        )}

        <Card padding="lg">
          <DataTable
            columns={[
              { key: "name", header: "Name", sortable: true },
              { key: "url", header: "URL" },
              { key: "events", header: "Events" },
              { key: "status", header: "Status" },
              { key: "lastDelivery", header: "Last Delivery" },
              { key: "actions", header: "" },
            ]}
            data={endpoints.map((ep) => ({
              ...ep,
              url: <span className="font-mono text-xs">{ep.url}</span>,
              events: <span className="text-xs">{ep.events.slice(0, 2).join(", ")}{ep.events.length > 2 ? ` +${ep.events.length - 2}` : ""}</span>,
              status: statusBadge(ep.status),
              lastDelivery: ep.lastDeliveryAt ? (
                <div className="ui-hstack-2">
                  <span className="text-xs">{new Date(ep.lastDeliveryAt).toLocaleDateString()}</span>
                  {ep.lastDeliveryStatus === "SUCCESS" ? (
                    <span className="ui-badge ui-badge-success">OK</span>
                  ) : ep.lastDeliveryStatus === "FAILED" ? (
                    <span className="ui-badge ui-badge-danger">FAILED</span>
                  ) : null}
                </div>
              ) : <span className="ui-text-xs-muted">Never</span>,
              actions: (
                <div className="ui-table-actions">
                  <button className="ui-table-action-btn" onClick={(e) => { e.stopPropagation(); handleTest(ep.id); }} disabled={testing} title="Test">
                    <Play size={14} />
                  </button>
                  <button className="ui-table-action-btn" onClick={(e) => { e.stopPropagation(); handleRotateSecret(ep.id); }} title="Rotate Secret">
                    <RefreshCw size={14} />
                  </button>
                  <button className="ui-table-action-btn" onClick={(e) => { e.stopPropagation(); handleToggle(ep); }} title="Toggle">
                    {ep.status === "ACTIVE" ? <X size={14} /> : <RefreshCw size={14} />}
                  </button>
                  <button className="ui-table-action-btn ui-table-action-btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(ep.id); }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              ),
            })) as unknown as Record<string, unknown>[]}
            emptyTitle="No webhook endpoints"
            emptyMessage="Create your first endpoint to start receiving events."
          />
        </Card>

        {showLogs && (
          <Card padding="lg">
            <div className="ui-flex-between ui-mb-4">
              <h3 className="ui-heading-base">Delivery Logs</h3>
              <button className="ui-btn-icon" onClick={() => setShowLogs(false)}><X size={16} /></button>
            </div>
            <DataTable
              columns={[
                { key: "event", header: "Event" },
                { key: "status", header: "Status" },
                { key: "code", header: "Status Code" },
                { key: "duration", header: "Duration" },
                { key: "date", header: "Date" },
              ]}
              data={deliveryLogs.slice(0, 50).map((log) => ({
                ...log,
                status: log.status === "SUCCESS" ? <span className="ui-badge ui-badge-success">Success</span> : <span className="ui-badge ui-badge-danger">Failed</span>,
                code: log.statusCode,
                duration: `${log.durationMs}ms`,
                date: new Date(log.createdAt).toLocaleString(),
              })) as unknown as Record<string, unknown>[]}
              emptyTitle="No delivery logs"
              emptyMessage="Webhook deliveries will appear here."
            />
          </Card>
        )}

        {showCreate && (
          <div className="ui-modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="ui-modal ui-modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="ui-modal-header">
                <span>Create Webhook Endpoint</span>
                <button className="ui-btn-icon" onClick={() => setShowCreate(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="ui-modal-body ui-stack-4">
                  <div className="ui-form-group">
                    <label className="ui-label">Endpoint Name</label>
                    <input className="ui-input" required placeholder="e.g. Production Slack Notifier" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Payload URL</label>
                    <input className="ui-input" required type="url" placeholder="https://hooks.example.com/webhook" value={url} onChange={(e) => setUrl(e.target.value)} />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Subscribe to Events</label>
                    <div className="ui-chip-group">
                      {AVAILABLE_EVENTS.map((event) => (
                        <button
                          key={event}
                          type="button"
                          className={`ui-chip ${events.includes(event) ? "ui-chip-primary" : ""}`}
                          onClick={() => toggleEvent(event)}
                        >
                          {event}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="ui-modal-footer">
                  <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="ui-btn ui-btn-primary">Create Endpoint</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
