// @ts-nocheck
"use client";
import React, { useState, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import {
  Layers,
  Target,
  Shield,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { apiGet } from "../../_components/api";

export default function CompetitorLandscapePage() {
  const [compId, setCompId] = useState("");
  const [landscape, setLandscape] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!compId) return;
    setLoading(true);
    try {
      setLandscape(
        await apiGet(`/crm/competitor-intelligence/landscape/${compId}`),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [compId]);

  return (
    <div className="ui-page">
      <PageHeader
        title="Competitor Landscape"
        description="Full competitive intelligence view — SWOT, reports, deal positioning"
      />

      <Card>
        <div className="ui-card-header">
          <h3 className="ui-card-title">View Competitor</h3>
        </div>
        <div className="ui-card-body">
          <div className="ui-form-group">
            <label className="ui-label">Competitor ID</label>
            <input
              className="ui-input"
              value={compId}
              onChange={(e) => setCompId(e.target.value)}
              placeholder="Enter competitor ID"
            />
          </div>
          <Button onClick={load} disabled={loading || !compId}>
            <Layers size={16} /> Load Landscape
          </Button>
        </div>
      </Card>

      {loading && <Spinner />}

      {landscape && (
        <>
          <Card>
            <div className="ui-card-header">
              <h3 className="ui-card-title">{landscape.competitor?.name}</h3>
            </div>
            <div className="ui-card-body">
              <p>{landscape.competitor?.description}</p>
              {landscape.competitor?.website && (
                <p style={{ fontSize: "0.85rem" }}>
                  Website: {landscape.competitor.website}
                </p>
              )}
              {landscape.competitor?.marketShare && (
                <p style={{ fontSize: "0.85rem" }}>
                  Market Share: {landscape.competitor.marketShare}%
                </p>
              )}

              <div style={{ marginTop: "1rem" }}>
                <h4>Strengths</h4>
                <ul>
                  {(Array.isArray(landscape.competitor?.strengths)
                    ? landscape.competitor.strengths
                    : []
                  ).map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Weaknesses</h4>
                <ul>
                  {(Array.isArray(landscape.competitor?.weaknesses)
                    ? landscape.competitor.weaknesses
                    : []
                  ).map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <div className="ui-grid-2" style={{ gap: "1rem" }}>
            <Card>
              <div className="ui-card-header">
                <h3 className="ui-card-title">Intelligence Reports</h3>
              </div>
              <div className="ui-card-body">
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                  {landscape.intelligence?.totalReports}
                </div>
                <p style={{ color: "#666" }}>
                  Total reports | {landscape.intelligence?.unreadReports} unread
                </p>
                {landscape.intelligence?.recentReports?.map(
                  (r: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        padding: "0.5rem 0",
                        borderBottom: "1px solid #eee",
                        fontSize: "0.85rem",
                      }}
                    >
                      <strong>{r.title}</strong>{" "}
                      <Badge variant="info">{r.reportType}</Badge>
                    </div>
                  ),
                )}
              </div>
            </Card>

            <Card>
              <div className="ui-card-header">
                <h3 className="ui-card-title">Competitive Positioning</h3>
              </div>
              <div className="ui-card-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      background: "#f0fdf4",
                      padding: "0.75rem",
                      borderRadius: 6,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>
                      Win Rate
                    </div>
                    <div
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#10b981",
                      }}
                    >
                      {landscape.competitivePositioning?.winRate}%
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#fef2f2",
                      padding: "0.75rem",
                      borderRadius: 6,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>
                      Deals Against
                    </div>
                    <div
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#ef4444",
                      }}
                    >
                      {landscape.competitivePositioning?.totalDealsAgainst}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#eff6ff",
                      padding: "0.75rem",
                      borderRadius: 6,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>
                      Wins
                    </div>
                    <div
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#3b82f6",
                      }}
                    >
                      {landscape.competitivePositioning?.wins}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#fefce8",
                      padding: "0.75rem",
                      borderRadius: 6,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>
                      Value at Risk
                    </div>
                    <div
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#f59e0b",
                      }}
                    >
                      $
                      {landscape.competitivePositioning?.totalValueAtRisk?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
