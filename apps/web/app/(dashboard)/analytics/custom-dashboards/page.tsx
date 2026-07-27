"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import {
  LayoutDashboard,
  Plus,
  BarChart2,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AnalyticsCustomDashboardsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [name, setName] = useState("");
  const toast = useToast();

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/analytics/custom-dashboards-deep/dashboards",
      );
      setDashboards(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Custom Dashboards",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboards();
  }, []);

  const handleCreate = async () => {
    try {
      if (!name) {
        toast.error("Validation Error", "Dashboard name is required");
        return;
      }
      await client.post("/analytics/custom-dashboards-deep/dashboards", {
        name,
      });
      toast.success(
        "Dashboard Created",
        `Custom BI dashboard "${name}" created successfully.`,
      );
      setName("");
      loadDashboards();
    } catch (err) {
      toast.error(
        "Failed to create dashboard",
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
        title="Custom Analytics Dashboards & Widget Builder"
        description="Design drag-and-drop executive BI dashboards, configure live SQL queries, and pin cross-module KPIs."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Create New Custom Dashboard
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Dashboard Title (e.g. Executive Quarterly KPI)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleCreate}>Build Dashboard</Button>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {dashboards.length === 0 ? (
          <Card
            style={{
              padding: "32px",
              gridColumn: "1 / -1",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#64748b" }}>
              No custom dashboards created yet.
            </p>
          </Card>
        ) : (
          dashboards.map((dash) => (
            <Card key={dash.id} style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <LayoutDashboard size={20} color="#3b82f6" />
                <h4 style={{ fontSize: "16px", fontWeight: 600 }}>
                  {dash.name}
                </h4>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  margin: "0 0 16px 0",
                }}
              >
                Created on {new Date(dash.createdAt).toLocaleDateString()}
              </p>
              <Button size="sm" variant="outline" style={{ width: "100%" }}>
                View & Edit Widgets
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
