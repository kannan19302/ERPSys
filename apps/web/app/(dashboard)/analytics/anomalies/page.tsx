"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge } from "@unerp/ui";
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AnalyticsAnomaliesPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const toast = useToast();

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/analytics/anomaly-detection-deep/anomalies",
      );
      setAnomalies(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Anomaly Detection entries",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
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
        title="AI Automated Metric Anomaly Detection"
        description="Continuous statistical anomaly detection, unexpected traffic spikes, and financial divergence alerts."
      />

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Detected Metric Anomalies
        </h3>
        {anomalies.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No active metric anomalies detected.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Metric</th>
                <th style={{ padding: "12px" }}>Severity</th>
                <th style={{ padding: "12px" }}>Deviation</th>
                <th style={{ padding: "12px" }}>Detected At</th>
                <th style={{ padding: "12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {a.metric}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge
                      variant={a.severity === "CRITICAL" ? "danger" : "warning"}
                    >
                      {a.severity}
                    </Badge>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--chart-4)",
                      fontWeight: "bold",
                    }}
                  >
                    {a.deviationPercent}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--color-text-secondary)",
                      fontSize: "13px",
                    }}
                  >
                    {new Date(a.detectedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="info">{a.status}</Badge>
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
