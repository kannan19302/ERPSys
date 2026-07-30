// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  Badge,
  DataTable,
  type Column,
  Modal,
  TextField,
  useToast,
} from "@unerp/ui";
import { ClipboardCheck, Plus, AlertTriangle } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
interface Checklist {
  id: string;
  name: string;
  items: string[];
  type?: string;
}

export default function ChecklistsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", itemsRaw: "" });

  useEffect(() => {
    (async () => {
      try {
        const d = await client.get<Checklist[] | { data?: Checklist[] }>(
          "/ext/field-service/checklists",
        );
        setChecklists(Array.isArray(d) ? d : d.data || []);
        setLoadError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load checklists";
        setLoadError(message);
        notifyError("Failed to load checklists", message);
      } finally {
        setLoading(false);
      }
    })();
  }, [client, notifyError]);
  const handleCreate = async () => {
    if (!form.name) return;
    setCreating(true);
    const items = form.itemsRaw.split("\n").filter(Boolean);
    try {
      await client.post("/ext/field-service/checklists", {
        name: form.name,
        items,
      });
      setCreateOpen(false);
      const d = await client.get<Checklist[] | { data?: Checklist[] }>(
        "/ext/field-service/checklists",
      );
      setChecklists(Array.isArray(d) ? d : d.data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create checklist";
      notifyError("Failed to create checklist", message);
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<Checklist>[] = [
    {
      key: "name",
      header: "Template Name",
      render: (row) => <span className="ui-heading-sm">{row.name}</span>,
    },
    {
      key: "items",
      header: "Checklist Items",
      render: (row) => (
        <span className="text-sm">{(row.items || []).join(", ")}</span>
      ),
    },
  ];
  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="field-service.checklist.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Service Checklists"
          description="Standardized technician checklists and template management"
          breadcrumbs={[
            { label: "Field Service", href: "/field-service" },
            { label: "Checklists" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-2" /> Create Template
            </Button>
          }
        />
        {loadError && (
          <div className="ui-alert ui-alert-danger">
            <AlertTriangle size={16} /> Failed to load checklists — list below
            may be stale. {loadError}
          </div>
        )}
        <Card padding="none">
          <DataTable
            columns={columns}
            data={checklists}
            rowKey={(r) => r.id}
            emptyTitle="No checklists"
            emptyMessage="Create checklist templates for field jobs."
            emptyIcon={<ClipboardCheck size={48} />}
          />
        </Card>
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Checklist"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Saving..." : "Create"}
              </Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField
              label="Checklist Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Checklist Items (one per line)"
              required
              value={form.itemsRaw}
              onChange={(e) => setForm({ ...form, itemsRaw: e.target.value })}
              placeholder="Check power connection&#10;Verify pressure readings&#10;Clean filter intake"
            />
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
