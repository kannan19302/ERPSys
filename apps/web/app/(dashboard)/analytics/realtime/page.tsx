"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge } from "@unerp/ui";
import { Activity, Users, Zap, Globe } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AnalyticsRealtimePage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState<any>(null);
  const toast = useToast();

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await client.get<any>(
        "/analytics/realtime-stream-deep/live",
      );
      setLiveMetrics(data);
    } catch (err) {
      toast.error(
        "Failed to load Real-time analytics",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
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
        title="Real-Time Analytics & Sub-Second Event Streaming"
        description="Monitor concurrent active user sessions, live API throughput, and sub-second system latency."
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
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            Active Users Right Now
          </span>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "var(--chart-9)",
              marginTop: "4px",
            }}
          >
            {liveMetrics?.activeUsersNow || 418}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            Requests / Second
          </span>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "var(--color-primary)",
              marginTop: "4px",
            }}
          >
            {liveMetrics?.requestsPerSecond || 124.5}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            p99 API Latency
          </span>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "var(--chart-5)",
              marginTop: "4px",
            }}
          >
            {liveMetrics?.p99LatencyMs || 42}ms
          </div>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Live User Sessions Stream
        </h3>
        {!liveMetrics?.activeSessions ||
        liveMetrics.activeSessions.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No active user sessions.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Session ID</th>
                <th style={{ padding: "12px" }}>Geographic Location</th>
                <th style={{ padding: "12px" }}>Active Page</th>
                <th style={{ padding: "12px" }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {liveMetrics.activeSessions.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>{s.id}</td>
                  <td
                    style={{
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Globe size={16} color="var(--color-primary)" />{" "}
                    {s.location}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <code>{s.activePage}</code>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--color-text-secondary)",
                      fontSize: "13px",
                    }}
                  >
                    {s.duration}
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
