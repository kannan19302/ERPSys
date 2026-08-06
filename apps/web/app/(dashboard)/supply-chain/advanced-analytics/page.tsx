"use client";

import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Modal,
  FormField,
  Select,
  Spinner,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui/layout";
import { Brain, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/supply-chain/advanced-analytics?tab=dashboard",
  },
  {
    id: "forecast",
    label: "AI Forecast",
    href: "/supply-chain/advanced-analytics?tab=forecast",
  },
  {
    id: "anomalies",
    label: "Anomaly Detection",
    href: "/supply-chain/advanced-analytics?tab=anomalies",
  },
];

export default function AdvancedAnalyticsPage() {
  const client = useApiClient();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forecastOpen, setForecastOpen] = useState(false);
  const [anomalyOpen, setAnomalyOpen] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [horizon, setHorizon] = useState(6);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .get("/supply-chain/advanced-analytics/dashboard")
      .then((res: any) => setDashboard(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const runForecast = async () => {
    setSaving(true);
    try {
      const res: any = await client.post(
        "/supply-chain/advanced-analytics/forecast",
        { horizonMonths: horizon },
      );
      setForecast(res);
      setForecastOpen(true);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  const runAnomalyDetection = async () => {
    setSaving(true);
    try {
      const res: any = await client.post(
        "/supply-chain/advanced-analytics/anomalies/detect",
        { limit: 10 },
      );
      setAnomalies(res);
      setAnomalyOpen(true);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="supply-chain.analytics.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Advanced Analytics & AI"
          description="ML-based demand sensing, anomaly detection, predictive lead times"
          breadcrumbs={[
            { label: "Supply Chain", href: "/supply-chain" },
            { label: "Advanced Analytics" },
          ]}
        />

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "dashboard" && dashboard && (
          <>
            <div className="ui-grid-5 ui-gap-4">
              <Card>
                <div className="ui-stat">
                  <span className="ui-stat-label">Forecast Accuracy</span>
                  <span className="ui-stat-value">
                    {dashboard.demandForecastAccuracy}%
                  </span>
                </div>
              </Card>
              <Card>
                <div className="ui-stat">
                  <span className="ui-stat-label">Predicted Lead Time</span>
                  <span className="ui-stat-value">
                    {dashboard.predictedLeadTime} days
                  </span>
                </div>
              </Card>
              <Card>
                <div className="ui-stat">
                  <span className="ui-stat-label">Anomalies</span>
                  <span className="ui-stat-value">
                    {dashboard.anomalyCount}
                  </span>
                </div>
              </Card>
            </div>
            <Card title="Model Performance">
              <div className="ui-stack-2">
                {(dashboard.modelPerformance ?? []).map((m: any, i: number) => (
                  <div
                    key={i}
                    className="ui-flex ui-justify-between ui-items-center"
                  >
                    <span>{m.model}</span>
                    <span>
                      <Badge
                        variant={
                          m.accuracy > 90
                            ? "success"
                            : m.accuracy > 80
                              ? "warning"
                              : "danger"
                        }
                      >
                        {m.accuracy}%
                      </Badge>
                      <span
                        className="ui-text-xs-muted"
                        style={{ marginLeft: 8 }}
                      >
                        Trained: {m.lastTrained}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <div className="ui-flex ui-gap-3">
              <Button variant="primary" onClick={runForecast} disabled={saving}>
                <Brain size={14} /> Generate AI Forecast
              </Button>
              <Button
                variant="secondary"
                onClick={runAnomalyDetection}
                disabled={saving}
              >
                <AlertTriangle size={14} /> Detect Anomalies
              </Button>
            </div>
          </>
        )}

        {activeTab === "forecast" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              AI Demand Forecasting engine using ensemble machine learning
              models.
            </p>
            <div className="ui-mt-4">
              <Button variant="primary" onClick={runForecast} disabled={saving}>
                Run Forecast Engine
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "anomalies" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Automated supply chain anomaly detection for lead times, prices,
              and stockouts.
            </p>
            <div className="ui-mt-4">
              <Button
                variant="primary"
                onClick={runAnomalyDetection}
                disabled={saving}
              >
                Run Anomaly Scan
              </Button>
            </div>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
