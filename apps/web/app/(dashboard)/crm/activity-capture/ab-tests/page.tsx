// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Spinner,
  Badge,
  Button,
  DataTable,
  Modal,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { Plus, Play, CheckCircle } from "lucide-react";
import type { Column } from "@unerp/ui";

function ABTestsPage() {
  const client = useApiClient();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    sequenceId: "",
    name: "",
    variantA: "{}",
    variantB: "{}",
  });

  const load = async () => {
    try {
      const res = await client.get("/crm/activity-capture/ab-tests");
      setTests(Array.isArray(res) ? res : []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    await client.post("/crm/activity-capture/ab-tests", {
      sequenceId: form.sequenceId,
      name: form.name,
      variantA: JSON.parse(form.variantA || "{}"),
      variantB: JSON.parse(form.variantB || "{}"),
    });
    setShowCreate(false);
    setForm({ sequenceId: "", name: "", variantA: "{}", variantB: "{}" });
    load();
  };

  const handleComplete = async (id: string) => {
    await client.post(`/crm/activity-capture/ab-tests/${id}/complete`, {});
    load();
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => {
        const v = (row as any).status;
        return (
          <Badge variant={v === "RUNNING" ? "info" : "success"}>{v}</Badge>
        );
      },
    },
    {
      key: "winner",
      header: "Winner",
      render: (row) => (row as any).winner || "-",
    },
    {
      key: "openedRateA",
      header: "Open Rate A",
      render: (row) => {
        const v = (row as any).openedRateA;
        return v ? `${v}%` : "-";
      },
    },
    {
      key: "openedRateB",
      header: "Open Rate B",
      render: (row) => {
        const v = (row as any).openedRateB;
        return v ? `${v}%` : "-";
      },
    },
    { key: "sampleSize", header: "Sample", sortable: true },
    {
      key: "startedAt",
      header: "Started",
      render: (row) =>
        new Date((row as any).startedAt as string).toLocaleDateString(),
    },
    {
      key: "id",
      header: "Actions",
      render: (row) => {
        const r = row as any;
        return r.status === "RUNNING" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleComplete(r.id)}
          >
            <CheckCircle size={14} /> Complete
          </Button>
        ) : (
          <span className="ui-text-muted">Done</span>
        );
      },
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="A/B Tests"
        description="Run A/B tests on email sequences to optimize engagement"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Activity Capture", href: "/crm/activity-capture" },
          { label: "A/B Tests" },
        ]}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New A/B Test
          </Button>
        }
      />
      <Card>
        <DataTable columns={columns} data={tests} />
      </Card>

      {showCreate && (
        <Modal
          open={showCreate}
          title="Create A/B Test"
          onClose={() => setShowCreate(false)}
        >
          <div className="ui-stack-4">
            <div className="ui-form-group">
              <label className="ui-label">Sequence ID</label>
              <input
                className="ui-input"
                value={form.sequenceId}
                onChange={(e: any) =>
                  setForm({ ...form, sequenceId: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Test Name</label>
              <input
                className="ui-input"
                value={form.name}
                onChange={(e: any) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Variant A (JSON)</label>
              <textarea
                className="ui-input"
                rows={4}
                value={form.variantA}
                onChange={(e: any) =>
                  setForm({ ...form, variantA: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Variant B (JSON)</label>
              <textarea
                className="ui-input"
                rows={4}
                value={form.variantB}
                onChange={(e: any) =>
                  setForm({ ...form, variantB: e.target.value })
                }
              />
            </div>
            <Button onClick={handleCreate}>
              <Play size={14} /> Start Test
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RouteGuard permission="crm.activity-capture.ab-tests.read">
      <ABTestsPage />
    </RouteGuard>
  );
}
