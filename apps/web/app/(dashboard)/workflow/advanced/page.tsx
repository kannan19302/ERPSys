"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, StatCardRow } from "@unerp/ui";
import { apiGet } from "@/lib/api";
import {
  FileText,
  FolderOpen,
  GitBranch,
  AlertTriangle,
  Bell,
  Globe,
  Tag,
} from "lucide-react";

export default function WorkflowAdvancedPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/workflow/dashboard")
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Workflow Advanced"
        description="Conditions, loops, subprocesses, error handlers, notifications, webhooks"
      />
      {dashboard && (
        <StatCardRow
          stats={[
            { label: "Definitions", value: dashboard.totalDefinitions },
            { label: "Active", value: dashboard.activeDefinitions },
            { label: "Executions", value: dashboard.totalExecutions },
            { label: "Pending Tasks", value: dashboard.pendingTasks },
          ]}
        />
      )}
      <div className="ui-grid-4" style={{ marginTop: "var(--space-6)" }}>
        <a
          href="/workflow/templates"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <FileText size={24} /> <span>Templates</span>
        </a>
        <a
          href="/workflow/categories"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <FolderOpen size={24} /> <span>Categories</span>
        </a>
        <a
          href="/workflow/conditions"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <GitBranch size={24} /> <span>Conditions</span>
        </a>
        <a
          href="/workflow/versions"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <FileText size={24} /> <span>Versions</span>
        </a>
      </div>
    </div>
  );
}
