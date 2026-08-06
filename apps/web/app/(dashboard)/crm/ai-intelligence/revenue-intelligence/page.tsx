"use client";
import React, { useState, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Crosshair,
} from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

export default function RevenueIntelligencePage() {
  const [digest, setDigest] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [byStage, setByStage] = useState<any[]>([]);
  const [bySource, setBySource] = useState<any[]>([]);
  const [byTerritory, setByTerritory] = useState<any[]>([]);
  const [forecastAccuracy, setForecastAccuracy] = useState<any>(null);
  const [bookingVsForecast, setBookingVsForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("digest");

  const sections = [
    { id: "digest", label: "Revenue Digest", icon: DollarSign },
    { id: "trends", label: "Trends", icon: TrendingUp },
    { id: "stage", label: "By Stage", icon: BarChart3 },
    { id: "source", label: "By Source", icon: PieChart },
    { id: "territory", label: "By Territory", icon: Target },
    { id: "forecast", label: "Forecast Accuracy", icon: Crosshair },
    { id: "booking", label: "Booking vs Forecast", icon: TrendingUp },
  ];

  const load = useCallback(async (section: string) => {
    setLoading(true);
    setActiveSection(section);
    try {
      switch (section) {
        case "digest":
          setDigest(
            await apiSend("/crm/ai-intelligence/revenue-digest", "POST", {}),
          );
          break;
        case "trends":
          setTrends(
            await apiGet(
              "/crm/ai-intelligence/revenue-trends?periods=2026-01,2026-02,2026-03,2026-04,2026-05,2026-06",
            ),
          );
          break;
        case "stage":
          setByStage(await apiGet("/crm/ai-intelligence/revenue-by-stage"));
          break;
        case "source":
          setBySource(await apiGet("/crm/ai-intelligence/revenue-by-source"));
          break;
        case "territory":
          setByTerritory(
            await apiGet("/crm/ai-intelligence/revenue-by-territory"),
          );
          break;
        case "forecast":
          setForecastAccuracy(
            await apiGet("/crm/ai-intelligence/forecast-accuracy"),
          );
          break;
        case "booking":
          setBookingVsForecast(
            await apiGet("/crm/ai-intelligence/booking-vs-forecast"),
          );
          break;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="ui-page">
      <PageHeader
        title="Revenue Intelligence"
        description="Revenue analytics, digests, and forecasting insights"
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        {sections.map((s) => (
          <Button
            key={s.id}
            variant={activeSection === s.id ? "primary" : "secondary"}
            onClick={() => load(s.id)}
          >
            <s.icon size={16} /> {s.label}
          </Button>
        ))}
      </div>

      {loading && <Spinner />}

      {digest && activeSection === "digest" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Revenue Digest</h3>
          </div>
          <div className="ui-card-body">
            <div className="ui-grid-3" style={{ gap: "1rem" }}>
              <div
                style={{
                  background: "var(--color-success-light)",
                  padding: "1rem",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Won Deals
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--chart-9)",
                  }}
                >
                  {digest.summary?.totalWon}
                </div>
                <div style={{ fontSize: "0.85rem" }}>
                  ${digest.summary?.wonValue?.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  background: "var(--color-danger-light)",
                  padding: "1rem",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Lost Deals
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--chart-4)",
                  }}
                >
                  {digest.summary?.totalLost}
                </div>
                <div style={{ fontSize: "0.85rem" }}>
                  ${digest.summary?.lostValue?.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  background: "var(--color-info-light)",
                  padding: "1rem",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Win Rate
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                  }}
                >
                  {digest.summary?.winRate}%
                </div>
                <div style={{ fontSize: "0.85rem" }}>
                  Pipeline: ${digest.summary?.pipelineValue?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {trends.length > 0 && activeSection === "trends" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Revenue Trends</h3>
          </div>
          <div className="ui-card-body">
            {trends.map((t: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span style={{ fontWeight: 600 }}>{t.period}</span>
                <span>
                  ${t.revenue?.toLocaleString()} ({t.dealCount} deals)
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {byStage.length > 0 && activeSection === "stage" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Revenue by Stage</h3>
          </div>
          <div className="ui-card-body">
            {byStage.map((s: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span style={{ fontWeight: 600 }}>{s.stage}</span>
                <span>
                  ${s.totalValue?.toLocaleString()} ({s.dealCount} deals, avg $
                  {s.averageValue?.toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {bySource.length > 0 && activeSection === "source" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Revenue by Source</h3>
          </div>
          <div className="ui-card-body">
            {bySource.map((s: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span style={{ fontWeight: 600 }}>{s.source}</span>
                <span>
                  ${s.totalValue?.toLocaleString()} | Win: {s.winRate}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {byTerritory.length > 0 && activeSection === "territory" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Revenue by Territory</h3>
          </div>
          <div className="ui-card-body">
            {byTerritory.map((t: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span style={{ fontWeight: 600 }}>{t.territory}</span>
                <span>
                  ${t.totalValue?.toLocaleString()} ({t.dealCount} deals)
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {forecastAccuracy && activeSection === "forecast" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Forecast Accuracy</h3>
          </div>
          <div className="ui-card-body">
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color:
                  forecastAccuracy.accuracyRate >= 80
                    ? "var(--chart-9)"
                    : "var(--chart-3)",
              }}
            >
              {forecastAccuracy.accuracyRate}%
            </div>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Accuracy rate across {forecastAccuracy.totalForecasts} forecasts
            </p>
            {forecastAccuracy.forecasts?.map((f: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid #eee",
                  fontSize: "0.85rem",
                }}
              >
                <span>{f.name}</span>
                <span>
                  Forecast: ${f.forecast?.toLocaleString()} | Actual: $
                  {f.actual?.toLocaleString()} | {f.variance > 0 ? "+" : ""}
                  {f.variance}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {bookingVsForecast.length > 0 && activeSection === "booking" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Booking vs Forecast</h3>
          </div>
          <div className="ui-card-body">
            {bookingVsForecast.map((b: any, i: number) => (
              <div
                key={i}
                style={{ padding: "0.75rem 0", borderBottom: "1px solid #eee" }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <strong>{b.name}</strong>
                  <Badge
                    variant={
                      b.gapPercentage > 20
                        ? "danger"
                        : b.gapPercentage > 10
                          ? "warning"
                          : "success"
                    }
                  >
                    {b.gapPercentage}% gap
                  </Badge>
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-text-secondary)",
                    marginTop: "0.25rem",
                  }}
                >
                  Forecast: ${b.forecast?.toLocaleString()} | Actual: $
                  {b.actual?.toLocaleString()} | Gap: ${b.gap?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
