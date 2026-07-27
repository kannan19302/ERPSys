"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { ZoomIn, BarChart2, TrendingUp, Globe } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function ReportingDrilldownPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState<any[]>([]);
  const [drillResults, setDrillResults] = useState<any>(null);
  const [dimension, setDimension] = useState("REGION");
  const toast = useToast();

  const loadPaths = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/reporting/data-drilldown-deep/paths",
      );
      setPaths(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load drilldown paths",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaths();
  }, []);

  const handleDrilldown = async () => {
    try {
      const res = await client.post<any>(
        "/reporting/data-drilldown-deep/execute",
        {
          dimension,
          filterValue: "ALL",
          metricKey: "REVENUE",
        },
      );
      setDrillResults(res);
      toast.success(
        "Drilldown Complete",
        `${res.results.length} segments returned.`,
      );
    } catch (err) {
      toast.error(
        "Failed to execute drilldown",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading)
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

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Multi-Dimensional Data Drilldown & Pivot Explorer"
        description="Navigate hierarchical business dimensions, pivot revenue metrics, and drill into regional/product segmentation."
      />

      <Card
        style={{
          padding: "20px",
          margin: "24px 0",
          display: "flex",
          gap: "16px",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            style={{
              fontSize: "13px",
              color: "#64748b",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Dimension Axis
          </label>
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          >
            <option value="REGION">Geographic Region</option>
            <option value="PRODUCT_CATEGORY">Product Category</option>
            <option value="CUSTOMER_SEGMENT">Customer Segment</option>
            <option value="DEPARTMENT">Department</option>
          </select>
        </div>
        <Button onClick={handleDrilldown}>
          <ZoomIn size={14} style={{ marginRight: "6px" }} /> Execute Drilldown
        </Button>
      </Card>

      {drillResults && (
        <Card style={{ padding: "24px" }}>
          <h3
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
          >
            Drilldown Results — {drillResults.dimension} /{" "}
            {drillResults.metricKey}
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Segment</th>
                <th style={{ padding: "12px" }}>Value</th>
                <th style={{ padding: "12px" }}>Growth</th>
              </tr>
            </thead>
            <tbody>
              {drillResults.results.map((r: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {r.label}
                  </td>
                  <td style={{ padding: "12px" }}>
                    ${r.value.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "#10b981",
                      fontWeight: "bold",
                    }}
                  >
                    {r.growth}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card style={{ padding: "24px", marginTop: "20px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Available Drilldown Dimension Paths
        </h3>
        {paths.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <Globe size={16} color="#3b82f6" />
            <span style={{ fontWeight: 600 }}>{p.sourceDimension}</span>
            <span style={{ color: "#64748b" }}>→</span>
            <span>{p.targetDimension}</span>
            <Badge variant="info">Level {p.drilldownLevel}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
