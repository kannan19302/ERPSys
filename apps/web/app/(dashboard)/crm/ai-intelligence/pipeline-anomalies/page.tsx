"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { Activity, AlertTriangle, Clock, Mail } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

export default function PipelineAnomaliesPage() {
  const [anomalies, setAnomalies] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [predictors, setPredictors] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<
    "anomalies" | "recommendations" | "predictors"
  >("anomalies");

  const loadAnomalies = useCallback(async () => {
    setLoading(true);
    try {
      setMode("anomalies");
      setAnomalies(await apiGet("/crm/ai-intelligence/pipeline/anomalies"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      setMode("recommendations");
      setRecommendations(
        await apiGet("/crm/ai-intelligence/pipeline/activity-recommendations"),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPredictors = useCallback(async () => {
    setLoading(true);
    try {
      setMode("predictors");
      setPredictors(
        await apiGet("/crm/ai-intelligence/leads/conversion-predictors"),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnomalies();
  }, []);

  return (
    <div className="ui-page">
      <PageHeader
        title="Pipeline Intelligence"
        description="Anomaly detection, activity recommendations, and conversion predictors"
      />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <Button
          variant={mode === "anomalies" ? "primary" : "secondary"}
          onClick={loadAnomalies}
        >
          <AlertTriangle size={16} /> Anomalies
        </Button>
        <Button
          variant={mode === "recommendations" ? "primary" : "secondary"}
          onClick={loadRecommendations}
        >
          <Activity size={16} /> Recommendations
        </Button>
        <Button
          variant={mode === "predictors" ? "primary" : "secondary"}
          onClick={loadPredictors}
        >
          <Clock size={16} /> Predictors
        </Button>
      </div>

      {loading && <Spinner />}

      {anomalies && mode === "anomalies" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">
              Pipeline Anomalies ({anomalies.totalAnomalies})
            </h3>
            {anomalies.highSeverityCount > 0 && (
              <Badge variant="danger">
                {anomalies.highSeverityCount} high severity
              </Badge>
            )}
          </div>
          <div className="ui-card-body">
            {anomalies.anomalies?.length === 0 && (
              <p style={{ color: "#666" }}>
                No anomalies detected — pipeline is healthy.
              </p>
            )}
            {anomalies.anomalies?.map((a: any, i: number) => (
              <div
                key={i}
                style={{
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                  background: "#f9fafb",
                  borderRadius: 6,
                  borderLeft: `4px solid ${a.severity === "high" ? "#ef4444" : a.severity === "medium" ? "#f59e0b" : "#3b82f6"}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: "0.9rem" }}>
                    {a.type.replace(/_/g, " ")}
                  </strong>
                  <Badge
                    variant={
                      a.severity === "high"
                        ? "danger"
                        : a.severity === "medium"
                          ? "warning"
                          : "success"
                    }
                  >
                    {a.severity}
                  </Badge>
                </div>
                <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>
                  {a.opportunityName}: {a.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {recommendations && mode === "recommendations" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Activity Recommendations</h3>
          </div>
          <div className="ui-card-body">
            <p
              style={{
                fontSize: "0.85rem",
                color: "#666",
                marginBottom: "0.75rem",
              }}
            >
              Based on {recommendations.totalWonDealsAnalyzed} won deals
            </p>
            {recommendations.recommendations?.map((r: any, i: number) => (
              <div
                key={i}
                style={{
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{r.activityType}</strong>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#666",
                      margin: "0.15rem 0 0",
                    }}
                  >
                    {r.recommendation}
                  </p>
                </div>
                <Badge
                  variant={r.percentageOfWonDeals > 50 ? "success" : "info"}
                >
                  {r.percentageOfWonDeals}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {predictors && mode === "predictors" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Lead Conversion Predictors</h3>
          </div>
          <div className="ui-card-body">
            <p
              style={{
                fontSize: "0.85rem",
                color: "#666",
                marginBottom: "0.75rem",
              }}
            >
              Analyzed {predictors.totalConvertedAnalyzed} converted vs{" "}
              {predictors.totalNonConvertedAnalyzed} non-converted leads
            </p>
            <p style={{ fontWeight: 600, marginBottom: "0.75rem" }}>
              Top Predictor: {predictors.topPredictor}
            </p>
            {predictors.predictors?.map((p: any, i: number) => (
              <div
                key={i}
                style={{ padding: "0.75rem 0", borderBottom: "1px solid #eee" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>{p.field}</strong>
                  <Badge variant={p.impact === "high" ? "success" : "warning"}>
                    {p.impact}
                  </Badge>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    fontSize: "0.85rem",
                    color: "#666",
                    marginTop: "0.25rem",
                  }}
                >
                  <span>Converted: {p.conversionRate}%</span>
                  <span>Non-converted: {p.nonConversionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
