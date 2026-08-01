"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { Zap, Lightbulb, TrendingUp } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

export default function NextBestActionPage() {
  const [oppId, setOppId] = useState("");
  const [action, setAction] = useState<any>(null);
  const [pipelineActions, setPipelineActions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"single" | "pipeline" | "analytics">(
    "single",
  );

  const getSingle = useCallback(async () => {
    if (!oppId) return;
    setLoading(true);
    try {
      setAction(await apiGet(`/crm/ai-intelligence/next-best-action/${oppId}`));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [oppId]);

  const getPipeline = useCallback(async () => {
    setLoading(true);
    try {
      setMode("pipeline");
      setPipelineActions(
        await apiGet("/crm/ai-intelligence/next-best-action/pipeline"),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      setMode("analytics");
      setAnalytics(
        await apiGet("/crm/ai-intelligence/next-best-action/analytics"),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="ui-page">
      <PageHeader
        title="Next Best Action"
        description="AI-recommended next actions for every deal"
      />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <Button
          variant={mode === "single" ? "primary" : "secondary"}
          onClick={() => setMode("single")}
        >
          <Zap size={16} /> Single Deal
        </Button>
        <Button
          variant={mode === "pipeline" ? "primary" : "secondary"}
          onClick={getPipeline}
        >
          <Lightbulb size={16} /> Pipeline Actions
        </Button>
        <Button
          variant={mode === "analytics" ? "primary" : "secondary"}
          onClick={getAnalytics}
        >
          <TrendingUp size={16} /> Analytics
        </Button>
      </div>

      {mode === "single" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Get Next Best Action</h3>
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
            <Button onClick={getSingle} disabled={loading || !oppId}>
              <Zap size={16} /> Get Recommendation
            </Button>
          </div>
        </Card>
      )}

      {loading && <Spinner />}

      {action && mode === "single" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">{action.opportunityName}</h3>
          </div>
          <div className="ui-card-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <Badge
                variant={
                  action.priority === "high"
                    ? "danger"
                    : action.priority === "medium"
                      ? "warning"
                      : "success"
                }
              >
                {action.priority.toUpperCase()} PRIORITY
              </Badge>
              <span style={{ fontSize: "0.85rem", color: "#666" }}>
                Stage: {action.currentStage}
              </span>
            </div>
            <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              {action.recommendedAction}
            </p>
            <p style={{ color: "#666" }}>{action.reasoning}</p>
            <div style={{ marginTop: "0.75rem" }}>
              <h4 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                Stage-Specific Actions:
              </h4>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {action.stageSpecificActions?.map((a: string, i: number) => (
                  <li
                    key={i}
                    style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {pipelineActions.length > 0 && mode === "pipeline" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">
              Pipeline Actions ({pipelineActions.length})
            </h3>
          </div>
          <div className="ui-card-body">
            {pipelineActions.map((a: any, i: number) => (
              <div
                key={i}
                style={{
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                  background: "#f9fafb",
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>{a.opportunityName}</strong>
                  <Badge
                    variant={
                      a.priority === "high"
                        ? "danger"
                        : a.priority === "medium"
                          ? "warning"
                          : "success"
                    }
                  >
                    {a.priority}
                  </Badge>
                </div>
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  {a.recommendedAction}
                </p>
                <p style={{ fontSize: "0.8rem", color: "#666", margin: 0 }}>
                  {a.reasoning}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {analytics && mode === "analytics" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Action Analytics</h3>
          </div>
          <div className="ui-card-body">
            <p>Based on {analytics.totalWonDealsAnalyzed} won deals</p>
            <div style={{ marginTop: "0.75rem" }}>
              {analytics.actionEffectiveness?.map((a: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.4rem 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <span>{a.action}</span>
                  <span style={{ fontWeight: 600 }}>
                    {a.count} ({a.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
