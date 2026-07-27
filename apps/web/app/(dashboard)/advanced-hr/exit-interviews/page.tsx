"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { LogOut, Heart, ThumbsUp, BarChart3 } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AdvancedHrExitInterviewPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [iData, insData] = await Promise.all([
        client.get<any[]>("/advanced-hr/exit-interview-deep/interviews"),
        client.get<any>("/advanced-hr/exit-interview-deep/insights"),
      ]);
      setInterviews(Array.isArray(iData) ? iData : []);
      setInsights(insData);
    } catch (err) {
      toast.error(
        "Failed to load exit data",
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
        title="Exit Interview Intelligence & Attrition Root Cause Analyzer"
        description="Conduct structured exit interviews, track satisfaction scores, rehire eligibility, and surface attrition patterns."
      />

      {insights && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            margin: "24px 0",
          }}
        >
          {[
            {
              label: "Total Exits",
              value: insights.totalExits,
              icon: <LogOut size={18} />,
              color: "#ef4444",
            },
            {
              label: "Avg Satisfaction",
              value: `${insights.avgSatisfaction}/10`,
              icon: <Heart size={18} />,
              color: "#f59e0b",
            },
            {
              label: "Would Rehire",
              value: `${insights.rehireRate}%`,
              icon: <ThumbsUp size={18} />,
              color: "#10b981",
            },
          ].map((kpi, i) => (
            <Card
              key={i}
              style={{
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: `${kpi.color}18`,
                  borderRadius: "12px",
                  padding: "12px",
                  color: kpi.color,
                }}
              >
                {kpi.icon}
              </div>
              <div>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  {kpi.label}
                </p>
                <h3 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
                  {kpi.value}
                </h3>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Exit Interview Records
        </h3>
        {interviews.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No exit interviews recorded.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Employee</th>
                <th style={{ padding: "12px" }}>Exit Reason</th>
                <th style={{ padding: "12px" }}>Satisfaction</th>
                <th style={{ padding: "12px" }}>Would Rehire</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((e, i) => (
                <tr
                  key={e.id ?? i}
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {e.employeeId}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="warning">{e.exitReason}</Badge>
                  </td>
                  <td style={{ padding: "12px" }}>{e.satisfactionScore}/10</td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant={e.wouldRehire ? "success" : "danger"}>
                      {e.wouldRehire ? "Yes" : "No"}
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
