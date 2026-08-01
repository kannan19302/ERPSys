"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  useToast,
  DataTable,
  type Column,
} from "@unerp/ui";
import { Plus, Trash2 } from "lucide-react";
import { useApiClient } from "@unerp/framework";
import Link from "next/link";

export default function NamedAccountsPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    name: "",
    tier: "STANDARD",
    targetRevenue: 0,
  });
  const toast = useToast();
  const client = useApiClient();

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<any>("/crm/territory-deep/named-accounts");
      setAccounts(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast.error("Could not load named accounts");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/crm/territory-deep/named-accounts", form);
      toast.success("Named account created");
      setShowCreate(false);
      setForm({ customerId: "", name: "", tier: "STANDARD", targetRevenue: 0 });
      loadAccounts();
    } catch {
      toast.error("Failed to create named account");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/crm/territory-deep/named-accounts/${id}`);
      toast.success("Named account removed");
      loadAccounts();
    } catch {
      toast.error("Failed to remove named account");
    }
  };

  const columns: Column<any>[] = [
    { key: "name", header: "Account Name" },
    {
      key: "tier",
      header: "Tier",
      render: (v: string) => (
        <Badge variant={v === "STRATEGIC" ? "success" : "default"}>{v}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (v: string) => (
        <Badge variant={v === "ACTIVE" ? "success" : "warning"}>{v}</Badge>
      ),
    },
    {
      key: "targetRevenue",
      header: "Target Revenue",
      render: (v: number) => (v ? `$${v.toLocaleString()}` : "—"),
    },
    {
      key: "id",
      header: "",
      render: (_: string, row: any) => (
        <button
          className="ui-btn ui-btn-sm ui-btn-ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row.id);
          }}
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <PageHeader
        title="Named Accounts"
        description="Strategic, key, and target accounts"
        breadcrumbs={[
          { label: "Territory Management", href: "/crm/territory-deep" },
          { label: "Named Accounts" },
        ]}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Named Account
          </Button>
        }
      />
      {showCreate && (
        <Card title="New Named Account" className="ui-card-sm">
          <form onSubmit={handleCreate} className="ui-form">
            <div className="ui-form-group">
              <label className="ui-label">Customer ID</label>
              <input
                className="ui-input"
                value={form.customerId}
                onChange={(e) =>
                  setForm({ ...form, customerId: e.target.value })
                }
                required
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Account Name</label>
              <input
                className="ui-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Tier</label>
              <select
                className="ui-input"
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
              >
                <option value="STANDARD">Standard</option>
                <option value="KEY">Key</option>
                <option value="STRATEGIC">Strategic</option>
                <option value="PROSPECT">Prospect</option>
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Target Revenue</label>
              <input
                className="ui-input"
                type="number"
                value={form.targetRevenue}
                onChange={(e) =>
                  setForm({ ...form, targetRevenue: Number(e.target.value) })
                }
              />
            </div>
            <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
              <Button type="submit">Create</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      <Card className="ui-card-full">
        <DataTable columns={columns} data={accounts} />
      </Card>
    </div>
  );
}
