"use client";
import React, { useState, useEffect } from "react";
import { Card, PageHeader, DataTable } from "@unerp/ui";
import {
  Key,
  Plus,
  X,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  permissions: string[];
  usageCount: number;
}

export default function SaasApiKeysPage() {
  const client = useApiClient();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyPermissions, setKeyPermissions] = useState<string[]>(["read"]);
  const [keyExpiry, setKeyExpiry] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);

  const AVAILABLE_PERMISSIONS = [
    "read", "write", "admin", "billing", "team", "webhooks",
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await client.get<ApiKey[]>("/saas/api-keys").catch(() => []);
      setKeys(res || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.post<{ key: string; id: string }>("/saas/api-keys", {
        name: keyName,
        permissions: keyPermissions,
        expiresAt: keyExpiry || null,
      });
      setNewKeyValue(res.key);
      setKeyName("");
      setKeyPermissions(["read"]);
      setKeyExpiry("");
      loadData();
    } catch {}
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await client.post(`/saas/api-keys/${keyId}/revoke`);
      loadData();
    } catch {}
  };

  const handleRotate = async (keyId: string) => {
    try {
      const res = await client.post<{ key: string }>(`/saas/api-keys/${keyId}/rotate`);
      setNewKeyValue(res.key);
      loadData();
    } catch {}
  };

  const handleDelete = async (keyId: string) => {
    try {
      await client.delete(`/saas/api-keys/${keyId}`);
      loadData();
    } catch {}
  };

  const togglePermission = (perm: string) => {
    setKeyPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const statusBadge = (status: string) => {
    const cls = status === "ACTIVE" ? "ui-badge-success" :
      status === "EXPIRED" ? "ui-badge-neutral" : "ui-badge-danger";
    return <span className={`ui-badge ${cls}`}>{status}</span>;
  };

  const handleCopyKey = async () => {
    if (!newKeyValue) return;
    try {
      await navigator.clipboard.writeText(newKeyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const totalUsage = keys.reduce((s, k) => s + k.usageCount, 0);

  return (
    <RouteGuard permission="saas.api-keys.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="API Keys"
          description="Manage API keys for programmatic access to your workspace."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "API Keys" },
          ]}
        />

        <div className="ui-list-toolbar">
          <div className="ui-hstack-3">
            <span className="ui-heading-sm">{keys.length} Keys</span>
            <span className="ui-badge ui-badge-info">{totalUsage.toLocaleString()} Total Calls</span>
          </div>
          <button className="ui-btn ui-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create Key
          </button>
        </div>

        {newKeyValue && (
          <Card padding="lg" style={{ borderColor: "var(--color-warning)" }}>
            <div className="ui-hstack-3">
              <AlertTriangle size={16} className="ui-text-warning" />
              <div className="flex-1">
                <p className="font-semibold text-sm">New API Key Created</p>
                <p className="ui-text-xs-muted">Copy this key now. You won&apos;t be able to see it again.</p>
              </div>
            </div>
            <div className="ui-flex-between ui-mt-3" style={{ gap: "var(--space-2)" }}>
              <code className="flex-1 ui-field-box font-mono text-xs" style={{ wordBreak: "break-all" }}>
                {newKeyValue}
              </code>
              <button className="ui-btn ui-btn-primary" onClick={handleCopyKey}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button className="ui-btn ui-btn-secondary" onClick={() => setNewKeyValue(null)}>
                <X size={14} /> Dismiss
              </button>
            </div>
          </Card>
        )}

        <Card padding="lg">
          <DataTable
            columns={[
              { key: "name", header: "Name", sortable: true },
              { key: "prefix", header: "Key Prefix" },
              { key: "created", header: "Created", sortable: true },
              { key: "lastUsed", header: "Last Used" },
              { key: "usage", header: "Usage" },
              { key: "status", header: "Status" },
              { key: "actions", header: "" },
            ]}
            data={keys.map((k) => ({
              ...k,
              prefix: `${k.prefix}...`,
              created: new Date(k.createdAt).toLocaleDateString(),
              lastUsed: k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never",
              usage: k.usageCount.toLocaleString(),
              status: statusBadge(k.status),
              actions: (
                <div className="ui-table-actions">
                  <button
                    className="ui-table-action-btn"
                    onClick={(e) => { e.stopPropagation(); setRevealedKeyId(revealedKeyId === k.id ? null : k.id); }}
                    title="View details"
                  >
                    {revealedKeyId === k.id ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {k.status === "ACTIVE" && (
                    <button className="ui-table-action-btn" onClick={(e) => { e.stopPropagation(); handleRotate(k.id); }} title="Rotate">
                      <RefreshCw size={14} />
                    </button>
                  )}
                  {k.status === "ACTIVE" && (
                    <button className="ui-table-action-btn ui-table-action-btn-danger" onClick={(e) => { e.stopPropagation(); handleRevoke(k.id); }} title="Revoke">
                      <Trash2 size={14} />
                    </button>
                  )}
                  {k.status !== "ACTIVE" && (
                    <button className="ui-table-action-btn ui-table-action-btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(k.id); }} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ),
            })) as unknown as Record<string, unknown>[]}
            onRowClick={(row) => setRevealedKeyId(revealedKeyId === (row as any).id ? null : (row as any).id)}
            emptyTitle="No API keys"
            emptyMessage="Create your first API key to start integrating with external services."
          />
        </Card>

        {showCreate && (
          <div className="ui-modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ui-modal-header">
                <span>Create API Key</span>
                <button className="ui-btn-icon" onClick={() => setShowCreate(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="ui-modal-body ui-stack-4">
                  <div className="ui-form-group">
                    <label className="ui-label">Key Name</label>
                    <input className="ui-input" required placeholder="e.g. Production Integration" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Permissions</label>
                    <div className="ui-chip-group">
                      {AVAILABLE_PERMISSIONS.map((perm) => (
                        <button
                          key={perm}
                          type="button"
                          className={`ui-chip ${keyPermissions.includes(perm) ? "ui-chip-primary" : ""}`}
                          onClick={() => togglePermission(perm)}
                        >
                          {perm}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Expiry (optional)</label>
                    <input className="ui-input" type="date" value={keyExpiry} onChange={(e) => setKeyExpiry(e.target.value)} />
                  </div>
                </div>
                <div className="ui-modal-footer">
                  <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="ui-btn ui-btn-primary">Create Key</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
