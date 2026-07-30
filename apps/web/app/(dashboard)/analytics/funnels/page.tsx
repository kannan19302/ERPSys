// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { Filter, ArrowDown, TrendingDown } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AnalyticsFunnelsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [conversions, setConversions] = useState<any[]>([]);
  const toast = useToast();

  const loadConversions = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/analytics/funnel-conversion-deep/conversions",
      );
      setConversions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Conversion Funnels",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversions();
  }, []);

  const handleCompute = async () => {
    try {
      await client.post("/analytics/funnel-conversion-deep/compute", {
        funnelName: "Enterprise SaaS Signup Flow",
      });
      toast.success("Funnel Computed", "Funnel conversion dropoff calculated.");
      loadConversions();
    } catch (err) {
      toast.error(
        "Failed to compute funnel",
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
        title="Conversion Funnels & Dropoff Analytics"
        description="Track step-by-step user acquisition funnels, compute dropoff metrics, and optimize conversions."
      />

      <Card
        style={{
          padding: "20px",
          margin: "24px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
            Compute Live Funnel Conversions
          </h3>
          <p
            style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}
          >
            Analyze conversion steps across user onboarding journeys.
          </p>
        </div>
        <Button onClick={handleCompute}>Calculate Funnel Dropoff</Button>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Funnel Audits
        </h3>
        {conversions.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No conversion funnel calculations recorded.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Funnel Name</th>
                <th style={{ padding: "12px" }}>Period</th>
                <th style={{ padding: "12px" }}>Overall Dropoff</th>
                <th style={{ padding: "12px" }}>Calculated At</th>
              </tr>
            </thead>
            <tbody>
              {conversions.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {c.funnelName}
                  </td>
                  <td style={{ padding: "12px" }}>{c.period}</td>
                  <td
                    style={{
                      padding: "12px",
                      color: "#ef4444",
                      fontWeight: "bold",
                    }}
                  >
                    {Number(c.overallDropoff).toFixed(2)}%
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {new Date(c.calculatedAt).toLocaleString()}
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
