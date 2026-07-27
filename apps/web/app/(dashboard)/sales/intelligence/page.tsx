"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";

export default function SalesIntelligencePage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const toast = useToast();

  const loadSignals = async () => {
    try {
      setLoading(true);
      const [sumData, sigData] = await Promise.all([
        client.get<any>("/sales/intelligence-signals/summary"),
        client.get<any[]>("/sales/intelligence-signals"),
      ]);
      setSummary(sumData);
      setSignals(Array.isArray(sigData) ? sigData : []);
    } catch (err) {
      toast.error(
        "Failed to load Sales Intelligence Signals",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignals();
  }, []);

  const handleMarkActioned = async (id: string) => {
    try {
      await client.put(`/sales/intelligence-signals/${id}/action`, {});
      toast.success("Actioned", "Signal marked as actioned");
      loadSignals();
    } catch (err) {
      toast.error(
        "Failed to update signal",
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
        title="Sales Intelligence & Risk Detection"
        description="Real-time buyer engagement signals, executive departure alerts, and account churn indicators."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          margin: "24px 0",
        }}
      >
        <Card style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Pending Signals
          </span>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "4px" }}
          >
            {summary?.totalPendingSignals ?? 0}
          </div>
        </Card>
        <Card style={{ padding: "20px", borderLeft: "4px solid #ef4444" }}>
          <span style={{ fontSize: "13px", color: "#ef4444", fontWeight: 600 }}>
            Critical Alerts
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#ef4444",
              marginTop: "4px",
            }}
          >
            {summary?.criticalCount ?? 0}
          </div>
        </Card>
        <Card style={{ padding: "20px", borderLeft: "4px solid #f59e0b" }}>
          <span style={{ fontSize: "13px", color: "#f59e0b", fontWeight: 600 }}>
            High Priority
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#f59e0b",
              marginTop: "4px",
            }}
          >
            {summary?.highCount ?? 0}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Medium / Low
          </span>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "4px" }}
          >
            {(summary?.mediumCount ?? 0) + (summary?.lowCount ?? 0)}
          </div>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Detected Buyer & Account Signals
        </h3>
        {signals.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No un-actioned intelligence signals detected.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {signals.map((sig) => (
              <div
                key={sig.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: sig.isActioned ? "#f8fafc" : "#fff",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <Badge
                      variant={
                        sig.severity === "CRITICAL" || sig.severity === "HIGH"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {sig.severity}
                    </Badge>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        textTransform: "uppercase",
                        fontWeight: 600,
                      }}
                    >
                      {sig.signalType}
                    </span>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      via {sig.source}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    {sig.headline}
                  </div>
                </div>
                {!sig.isActioned && (
                  <Button size="sm" onClick={() => handleMarkActioned(sig.id)}>
                    Mark Actioned
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
