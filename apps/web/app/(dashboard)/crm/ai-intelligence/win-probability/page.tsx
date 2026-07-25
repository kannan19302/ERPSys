"use client";
import React, { useState, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { Crosshair, TrendingUp, Target } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

export default function WinProbabilityPage() {
  const [oppId, setOppId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [rationale, setRationale] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [batchIds, setBatchIds] = useState("");

  const calculate = useCallback(async () => {
    if (!oppId) return;
    setLoading(true);
    try {
      const [prob, rat] = await Promise.all([
        apiGet(`/crm/ai-intelligence/win-probability/${oppId}`),
        apiGet(`/crm/ai-intelligence/win-probability/${oppId}/rationale`),
      ]);
      setResult(prob);
      setRationale(rat);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [oppId]);

  const runBatch = useCallback(async () => {
    const ids = batchIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return;
    setLoading(true);
    try {
      const data = await apiSend(
        "POST",
        "/crm/ai-intelligence/win-probability/batch",
        { opportunityIds: ids },
      );
      setResult({ batch: true, results: data });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [batchIds]);

  return (
    <div className="ui-page">
      <PageHeader
        title="Win Probability"
        description="AI-powered win probability scoring with factor breakdown"
      />
      <Card>
        <div className="ui-card-header">
          <h3 className="ui-card-title">Calculate Win Probability</h3>
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
          <Button onClick={calculate} disabled={loading || !oppId}>
            <Crosshair size={16} /> Calculate
          </Button>
        </div>
      </Card>

      {loading && <Spinner />}

      {result && !result.batch && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Probability Score</h3>
          </div>
          <div className="ui-card-body">
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                color:
                  result.probability >= 70
                    ? "#10b981"
                    : result.probability >= 40
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            >
              {result.probability}%
            </div>
            <p style={{ color: "#666", marginTop: 4 }}>
              Deal: {result.opportunityName} | Stage: {result.stage}
            </p>
            <div
              style={{
                marginTop: "1rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              {Object.entries(result.factors || {}).map(([k, v]: any) => (
                <div
                  key={k}
                  style={{
                    background: "#f9fafb",
                    padding: "0.5rem",
                    borderRadius: 6,
                  }}
                >
                  <strong
                    style={{ fontSize: "0.8rem", textTransform: "capitalize" }}
                  >
                    {k.replace(/([A-Z])/g, " $1")}
                  </strong>
                  <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {rationale && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Rationale Breakdown</h3>
          </div>
          <div className="ui-card-body">
            {rationale.factors?.map((f: any, i: number) => (
              <div
                key={i}
                style={{
                  padding: "0.75rem 0",
                  borderBottom:
                    i < rationale.factors.length - 1
                      ? "1px solid #eee"
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>{f.factor}</strong>
                  <Badge
                    variant={
                      f.impact === "positive"
                        ? "success"
                        : f.impact === "negative"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {typeof f.impact === "number"
                      ? `${f.impact}/100`
                      : f.impact}
                  </Badge>
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#666",
                    margin: "0.25rem 0 0",
                  }}
                >
                  {f.explanation}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="ui-card-header">
          <h3 className="ui-card-title">Batch Calculation</h3>
        </div>
        <div className="ui-card-body">
          <div className="ui-form-group">
            <label className="ui-label">
              Opportunity IDs (comma separated)
            </label>
            <input
              className="ui-input"
              value={batchIds}
              onChange={(e) => setBatchIds(e.target.value)}
              placeholder="opp-1, opp-2, opp-3"
            />
          </div>
          <Button onClick={runBatch} disabled={loading || !batchIds}>
            <Target size={16} /> Run Batch
          </Button>
        </div>
      </Card>

      {result?.batch && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Batch Results</h3>
          </div>
          <div className="ui-card-body">
            {result.results?.map((r: any, i: number) => (
              <div
                key={i}
                style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}
              >
                {r.error ? (
                  <span style={{ color: "#ef4444" }}>
                    {r.opportunityId}: {r.error}
                  </span>
                ) : (
                  <span>
                    {r.opportunityName}: <strong>{r.probability}%</strong>{" "}
                    (stage: {r.stage})
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
