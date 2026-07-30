// @ts-nocheck
"use client";
import React, { useState, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { Heart, Activity, TrendingUp } from "lucide-react";
import { apiGet } from "../../_components/api";

export default function DealHealthPage() {
  const [oppId, setOppId] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [factors, setFactors] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!oppId) return;
    setLoading(true);
    try {
      const [s, f] = await Promise.all([
        apiGet<{ score: number }>(`/crm/ai-intelligence/deal-health/${oppId}`),
        apiGet(`/crm/ai-intelligence/deal-health/${oppId}/factors`),
      ]);
      setScore((s as any).score ?? s);
      setFactors(f);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [oppId]);

  const getColor = (s: number) =>
    s >= 70 ? "#10b981" : s >= 40 ? "#f59e0b" : "#ef4444";
  const getLabel = (s: number) =>
    s >= 70 ? "Healthy" : s >= 40 ? "Needs Attention" : "At Risk";

  return (
    <div className="ui-page">
      <PageHeader
        title="Deal Health"
        description="Health scores and factor analysis for every deal"
      />
      <Card>
        <div className="ui-card-header">
          <h3 className="ui-card-title">Check Deal Health</h3>
        </div>
        <div className="ui-card-body">
          <div className="ui-form-group">
            <label className="ui-label">Opportunity ID</label>
            <input
              className="ui-input"
              value={oppId}
              onChange={(e) => setOppId(e.target.value)}
              placeholder="Enter opportunity ID"
            />
          </div>
          <Button onClick={load} disabled={loading || !oppId}>
            <Heart size={16} /> Check Health
          </Button>
        </div>
      </Card>

      {loading && <Spinner />}

      {score !== null && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Health Score</h3>
          </div>
          <div className="ui-card-body" style={{ textAlign: "center" }}>
            <div
              style={{
                position: "relative",
                width: 120,
                height: 120,
                margin: "0 auto",
              }}
            >
              <svg viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#eee"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke={getColor(score)}
                  strokeWidth="10"
                  strokeDasharray={`${(score / 100) * 339.292} 339.292`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color: getColor(score),
                  }}
                >
                  {score}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#666" }}>
                  out of 100
                </div>
              </div>
            </div>
            <Badge
              variant={
                score >= 70 ? "success" : score >= 40 ? "warning" : "danger"
              }
            >
              {getLabel(score)}
            </Badge>
          </div>
        </Card>
      )}

      {factors && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Health Factors</h3>
          </div>
          <div className="ui-card-body">
            {factors.factors?.map((f: any, i: number) => (
              <div
                key={i}
                style={{
                  padding: "0.75rem 0",
                  borderBottom:
                    i < factors.factors.length - 1 ? "1px solid #eee" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>{f.name}</strong>
                  <Badge
                    variant={
                      f.status === "positive"
                        ? "success"
                        : f.status === "negative"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {f.status}
                  </Badge>
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#666",
                    margin: "0.25rem 0 0",
                  }}
                >
                  {f.detail}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
