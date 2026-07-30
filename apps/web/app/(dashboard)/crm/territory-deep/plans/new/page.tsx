// @ts-nocheck
"use client";
import React, { useState } from "react";
import { Card, PageHeader, Button, useToast } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { useRouter } from "next/navigation";

export default function NewTerritoryPlanPage() {
  const router = useRouter();
  const toast = useToast();
  const client = useApiClient();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    fiscalYear: "FY2026",
    status: "DRAFT",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await client.post<any>("/crm/territory-deep/plans", form);
      toast.success("Territory plan created");
      router.push(
        `/crm/territory-deep/plans/${result?.id || (result as any)?.data?.id}`,
      );
    } catch {
      toast.error("Failed to create plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="New Territory Plan"
        breadcrumbs={[
          { label: "Territory Management", href: "/crm/territory-deep" },
          { label: "New Plan" },
        ]}
      />
      <Card className="ui-card-md">
        <form onSubmit={handleSubmit} className="ui-form">
          <div className="ui-form-group">
            <label className="ui-label">Plan Name</label>
            <input
              className="ui-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. FY2026 EMEA Plan"
            />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Description</label>
            <textarea
              className="ui-input"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Fiscal Year</label>
            <input
              className="ui-input"
              value={form.fiscalYear}
              onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })}
              required
              placeholder="e.g. FY2026"
            />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Status</label>
            <select
              className="ui-input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>
          <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Plan"}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
