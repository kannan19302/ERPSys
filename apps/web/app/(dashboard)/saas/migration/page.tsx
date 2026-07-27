"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { RefreshCw, Server, ArrowRight, Database } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function TenantMigrationPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const toast = useToast();

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>("/saas/tenant-migration-deep/jobs");
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Tenant Migration jobs",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleStartMigration = async () => {
    try {
      await client.post("/saas/tenant-migration-deep/start", {
        sourceCluster: "us-east-1-shared",
        targetCluster: "us-east-1-dedicated-02",
      });
      toast.success(
        "Migration Initiated",
        "Tenant database migration started in background",
      );
      loadJobs();
    } catch (err) {
      toast.error(
        "Failed to start migration",
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
        title="Tenant Cluster Migration Engine"
        description="Zero-downtime database cluster migrations, dedicated node promotion, and cross-region failover."
        actions={
          <Button onClick={handleStartMigration}>
            + Start Cluster Migration
          </Button>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          margin: "24px 0",
        }}
      >
        <Card style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Total Migration Jobs
          </span>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "4px" }}
          >
            {jobs.length}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Migration Engine Status
          </span>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#10b981",
              marginTop: "4px",
            }}
          >
            ONLINE
          </div>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Migration Executions
        </h3>
        {jobs.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No tenant migration jobs recorded.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px 16px" }}>Job ID</th>
                <th style={{ padding: "12px 16px" }}>Source Cluster</th>
                <th style={{ padding: "12px 16px" }}>Target Cluster</th>
                <th style={{ padding: "12px 16px" }}>Records</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                    {j.id}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>
                    {j.sourceCluster}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "#3b82f6",
                      fontWeight: 500,
                    }}
                  >
                    {j.targetCluster}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {(j.recordsMigrated || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      variant={j.status === "COMPLETED" ? "success" : "info"}
                    >
                      {j.status}
                    </Badge>
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
