"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { GitBranch, Users, Building2, Plus } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AdvancedHrOrgChartPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<any[]>([]);
  const [deptCounts, setDeptCounts] = useState<any[]>([]);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [nodesData, countsData] = await Promise.all([
        client.get<any[]>("/advanced-hr/org-chart-deep/nodes"),
        client.get<any[]>("/advanced-hr/org-chart-deep/department-headcounts"),
      ]);
      setNodes(Array.isArray(nodesData) ? nodesData : []);
      setDeptCounts(Array.isArray(countsData) ? countsData : []);
    } catch (err) {
      toast.error(
        "Failed to load org chart",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        title="Live Organizational Chart & Reporting Hierarchy Visualizer"
        description="Browse the real-time org chart tree, view span-of-control, and audit headcount by department."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
          marginTop: "24px",
        }}
      >
        <Card style={{ padding: "24px" }}>
          <h3
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
          >
            Org Chart Nodes
          </h3>
          {nodes.length === 0 ? (
            <p
              style={{
                color: "#64748b",
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              No org chart nodes defined.
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
                  <th style={{ padding: "12px" }}>Job Title</th>
                  <th style={{ padding: "12px" }}>Department</th>
                  <th style={{ padding: "12px" }}>Level</th>
                  <th style={{ padding: "12px" }}>Headcount</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((n, i) => (
                  <tr
                    key={n.id ?? i}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      paddingLeft: `${n.reportingLevel * 16}px`,
                    }}
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: 600,
                        paddingLeft: `${(n.reportingLevel - 1) * 24 + 12}px`,
                      }}
                    >
                      {n.reportingLevel > 1 ? "└ " : ""}
                      {n.jobTitle}
                    </td>
                    <td style={{ padding: "12px" }}>{n.department}</td>
                    <td style={{ padding: "12px" }}>
                      <Badge variant="info">L{n.reportingLevel}</Badge>
                    </td>
                    <td style={{ padding: "12px" }}>{n.headcount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card style={{ padding: "24px" }}>
          <h3
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
          >
            Headcount by Department
          </h3>
          {deptCounts.length === 0 ? (
            <p
              style={{
                color: "#64748b",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              No data.
            </p>
          ) : (
            deptCounts.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Building2 size={14} color="#8b5cf6" />
                  <span style={{ fontWeight: 600 }}>{d.department}</span>
                </div>
                <span style={{ fontWeight: 700, color: "#3b82f6" }}>
                  {d.totalHeadcount}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
