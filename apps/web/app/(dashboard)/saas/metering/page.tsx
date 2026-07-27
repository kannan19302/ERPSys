"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { Cpu, Zap, DollarSign, Layers } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function MeteringEnginePage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, batchesData] = await Promise.all([
        client.get<any[]>("/saas/metering-engine-deep/rules"),
        client.get<any[]>("/saas/metering-engine-deep/batches"),
      ]);
      setRules(Array.isArray(rulesData) ? rulesData : []);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
    } catch (err) {
      toast.error(
        "Failed to load Metering Engine data",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        title="SaaS Metering Engine & Usage Rating"
        description="Configure usage-based billing metrics, event ingest batches, and free tier allowances."
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
            Active Metering Rules
          </span>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "4px" }}
          >
            {rules.length}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Batches Processed
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#10b981",
              marginTop: "4px",
            }}
          >
            {batches.length}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Rating Currency
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#3b82f6",
              marginTop: "4px",
            }}
          >
            USD ($)
          </div>
        </Card>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
      >
        <Card style={{ padding: "20px" }}>
          <h3
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}
          >
            Configured Metering Rules
          </h3>
          {rules.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#64748b" }}>
              No custom metering rules configured.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "10px" }}>Metric</th>
                  <th style={{ padding: "10px" }}>Unit Price</th>
                  <th style={{ padding: "10px" }}>Aggregation</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px", fontWeight: 600 }}>
                      {r.metricCode}
                    </td>
                    <td style={{ padding: "10px" }}>
                      ${Number(r.unitPrice).toFixed(4)}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <Badge variant="info">{r.aggregationType}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card style={{ padding: "20px" }}>
          <h3
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}
          >
            Recent Event Ingest Batches
          </h3>
          {batches.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#64748b" }}>
              No usage batches processed yet.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {batches.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>
                      {b.batchRef}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {b.eventCount} events ingest
                    </div>
                  </div>
                  <Badge
                    variant={b.status === "COMPLETED" ? "success" : "warning"}
                  >
                    {b.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
