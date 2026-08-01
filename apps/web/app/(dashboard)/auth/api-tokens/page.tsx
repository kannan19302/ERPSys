"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, DataTable, Modal, useToast } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { Plus, Trash2 } from "lucide-react";
import type { Column } from "@unerp/ui";

interface ApiToken {
  id: string;
  name: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiTokensPage() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTokenResult, setNewTokenResult] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", expiresAt: "" });

  const fetchTokens = useCallback(async () => {
    const res = await fetch("/api/v1/auth/api-tokens");
    if (res.ok) setTokens(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreate = async () => {
    const res = await fetch("/api/v1/auth/api-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        expiresAt: form.expiresAt || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewTokenResult(data.token);
      setForm({ name: "", expiresAt: "" });
      await fetchTokens();
    } else toast({ title: "Failed to create token", variant: "error" });
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/v1/auth/api-tokens/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast({ title: "Token revoked", variant: "success" });
      await fetchTokens();
    } else toast({ title: "Failed to revoke token", variant: "error" });
  };

  const columns: Column<ApiToken>[] = [
    { key: "name", header: "Name", render: (r) => r.name },
    { key: "scopes", header: "Scopes", render: (r) => r.scopes.join(", ") },
    {
      key: "expiresAt",
      header: "Expires",
      render: (r) =>
        r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "Never",
    },
    {
      key: "lastUsedAt",
      header: "Last Used",
      render: (r) =>
        r.lastUsedAt ? new Date(r.lastUsedAt).toLocaleDateString() : "Never",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<Trash2 size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(r.id);
          }}
        >
          Revoke
        </Button>
      ),
    },
  ];

  return (
    <RouteGuard permission="auth.api-token.read">
      <div className="ui-stack-6">
        <PageHeader
          title="API Tokens"
          description="Manage personal access tokens for API authentication."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Auth", href: "/auth" },
            { label: "API Tokens" },
          ]}
        />
        <div className="ui-flex-row ui-gap-4">
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => setShowCreate(true)}
          >
            Create Token
          </Button>
        </div>
        <DataTable columns={columns} data={tokens} loading={loading} />
        <Modal
          open={showCreate}
          onClose={() => {
            setShowCreate(false);
            setNewTokenResult(null);
          }}
          title="Create API Token"
        >
          {newTokenResult ? (
            <div className="ui-stack-4">
              <p className="ui-text-warning">
                Copy this token now — you won&apos;t be able to see it again.
              </p>
              <code className="ui-input u-block u-p-2">{newTokenResult}</code>
              <Button
                onClick={() => {
                  setShowCreate(false);
                  setNewTokenResult(null);
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="ui-form-group">
              <label className="ui-label">Token Name</label>
              <input
                className="ui-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My Token"
              />
              <label className="ui-label">Expires At (optional)</label>
              <input
                className="ui-input"
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
              />
              <div className="ui-flex-row ui-gap-4 u-mt-4">
                <Button onClick={handleCreate} disabled={!form.name}>
                  Generate Token
                </Button>
                <Button variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </RouteGuard>
  );
}
