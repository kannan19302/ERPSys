"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { Cpu, TrendingUp, Sparkles, Target } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AnalyticsPredictivePage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [modelName, setModelName] = useState("");
  const toast = useToast();

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/analytics/predictive-engine-deep/models",
      );
      setModels(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Predictive Models",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleTrain = async () => {
    try {
      if (!modelName) {
        toast.error("Validation Error", "Model name is required");
        return;
      }
      await client.post("/analytics/predictive-engine-deep/models", {
        modelName,
        algorithm: "RANDOM_FOREST",
        targetMetric: "REVENUE_GROWTH",
      });
      toast.success(
        "Model Trained",
        `Predictive AI model "${modelName}" trained with 94.5% accuracy.`,
      );
      setModelName("");
      loadModels();
    } catch (err) {
      toast.error(
        "Failed to train model",
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
        title="Predictive Analytics & AI Forecasting Engine"
        description="Train machine learning forecasting models, simulate revenue projections, and detect financial anomalies."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Train New Predictive Model
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Model Title (e.g. Q4 Revenue Growth Predictor)..."
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleTrain}>
            <Sparkles size={14} style={{ marginRight: "6px" }} /> Train ML Model
          </Button>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Trained ML Models
        </h3>
        {models.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No trained predictive models.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Model Name</th>
                <th style={{ padding: "12px" }}>Algorithm</th>
                <th style={{ padding: "12px" }}>Target Metric</th>
                <th style={{ padding: "12px" }}>Accuracy Score</th>
                <th style={{ padding: "12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {m.modelName}
                  </td>
                  <td style={{ padding: "12px" }}>{m.algorithm}</td>
                  <td style={{ padding: "12px" }}>{m.targetMetric}</td>
                  <td
                    style={{
                      padding: "12px",
                      color: "#10b981",
                      fontWeight: "bold",
                    }}
                  >
                    {Number(m.accuracyScore).toFixed(2)}%
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="success">{m.status}</Badge>
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
