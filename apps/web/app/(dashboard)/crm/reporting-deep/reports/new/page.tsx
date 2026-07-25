"use client";
import React, { useState } from "react";
import { Card, PageHeader, Button, useToast } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { useRouter } from "next/navigation";

export default function NewReportPage() {
  const router = useRouter();
  const toast = useToast();
  const client = useApiClient();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    module: "crm",
    type: "TABLE",
    isShared: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await client.post<any>("/crm/reporting/reports", form);
      toast.success("Report created");
      router.push(
        `/crm/reporting-deep/reports/${result?.id || (result as any)?.data?.id}`,
      );
    } catch {
      toast.error("Failed to create report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="New Saved Report"
        breadcrumbs={[
          { label: "Reporting", href: "/crm/reporting-deep" },
          { label: "Reports", href: "/crm/reporting-deep/reports" },
          { label: "New" },
        ]}
      />
      <Card className="ui-card-md">
        <form onSubmit={handleSubmit} className="ui-form">
          <div className="ui-form-group">
            <label className="ui-label">Report Name</label>
            <input
              className="ui-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Monthly Pipeline Summary"
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
              rows={2}
            />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Module</label>
            <select
              className="ui-input"
              value={form.module}
              onChange={(e) => setForm({ ...form, module: e.target.value })}
            >
              <option value="crm">CRM</option>
              <option value="opportunities">Opportunities</option>
              <option value="leads">Leads</option>
              <option value="customers">Customers</option>
              <option value="activities">Activities</option>
            </select>
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Type</label>
            <select
              className="ui-input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="TABLE">Table</option>
              <option value="CHART">Chart</option>
              <option value="PIVOT">Pivot</option>
              <option value="SUMMARY">Summary</option>
            </select>
          </div>
          <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Report"}
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
