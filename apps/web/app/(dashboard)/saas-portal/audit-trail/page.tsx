"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge } from "@unerp/ui";
import { Shield, Clock, UserCheck, Activity } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function SaasPortalAuditTrailPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const toast = useToast();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/saas-portal/audit-trail-deep/logs",
      );
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Audit Trail logs",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
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
        title="Administrative Security & Audit Trail"
        description="Immutable administrative action logs, user privilege changes, and security compliance trail."
      />

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Audit Log Stream
        </h3>
        {logs.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No administrative audit events recorded.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Timestamp</th>
                <th style={{ padding: "12px" }}>Actor</th>
                <th style={{ padding: "12px" }}>Action</th>
                <th style={{ padding: "12px" }}>Resource</th>
                <th style={{ padding: "12px" }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {log.actor}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="info">{log.action}</Badge>
                  </td>
                  <td style={{ padding: "12px" }}>{log.resource}</td>
                  <td
                    style={{
                      padding: "12px",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {log.ipAddress}
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
