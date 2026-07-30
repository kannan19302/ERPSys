// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { Database, Play, GitMerge, RefreshCw } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AnalyticsPipelinesPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [pipelineName, setPipelineName] = useState("");
  const toast = useToast();

  const loadPipelines = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/analytics/data-pipelines-deep/pipelines",
      );
      setPipelines(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load ETL Data Pipelines",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelines();
  }, []);

  const handleCreate = async () => {
    try {
      if (!pipelineName) {
        toast.error("Validation Error", "Pipeline name is required");
        return;
      }
      await client.post("/analytics/data-pipelines-deep/pipelines", {
        pipelineName,
        sourceDatasetId: "ds-pg-1",
        targetDatasetId: "ds-ch-1",
      });
      toast.success(
        "Pipeline Created",
        `ETL data pipeline "${pipelineName}" initialized.`,
      );
      setPipelineName("");
      loadPipelines();
    } catch (err) {
      toast.error(
        "Failed to create pipeline",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  const handleRun = async (id: string) => {
    try {
      await client.post(
        `/analytics/data-pipelines-deep/pipelines/${id}/run`,
        {},
      );
      toast.success(
        "Pipeline Triggered",
        "ETL sync process triggered in background.",
      );
      loadPipelines();
    } catch (err) {
      toast.error(
        "Failed to run pipeline",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Enterprise ETL Data Pipelines & Warehouse Ingestion"
        description="Schedule automated data extraction, SQL transformations, and analytical data warehouse sync."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Create New Data Pipeline
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Pipeline Name (e.g. Postgres to ClickHouse Sales ETL)..."
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleCreate}>Deploy Pipeline</Button>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Active ETL Pipelines
        </h3>
        {pipelines.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No active ETL data pipelines.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Pipeline Name</th>
                <th style={{ padding: "12px" }}>Status</th>
                <th style={{ padding: "12px" }}>Last Run</th>
                <th style={{ padding: "12px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pipelines.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {p.pipelineName}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="success">{p.status}</Badge>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {p.lastRunAt
                      ? new Date(p.lastRunAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRun(p.id)}
                    >
                      <Play size={12} style={{ marginRight: "6px" }} /> Run Sync
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
