// @ts-nocheck
"use client";
import React, { useState, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { TrendingUp, BarChart3, Users, Package, Clock } from "lucide-react";
import { apiGet } from "../../_components/api";

export default function SalesVelocityPage() {
  const [period, setPeriod] = useState("2026-07");
  const [metrics, setMetrics] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [byRep, setByRep] = useState<any[]>([]);
  const [byProduct, setByProduct] = useState<any[]>([]);
  const [cycleTime, setCycleTime] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("metrics");

  const load = useCallback(
    async (section: string) => {
      setLoading(true);
      setActiveSection(section);
      try {
        switch (section) {
          case "metrics":
            setMetrics(
              await apiGet(
                `/crm/ai-intelligence/sales-velocity?period=${period}`,
              ),
            );
            break;
          case "trend":
            const periods = [
              "2026-01",
              "2026-02",
              "2026-03",
              "2026-04",
              "2026-05",
              "2026-06",
            ].join(",");
            setTrend(
              await apiGet(
                `/crm/ai-intelligence/sales-velocity/trend?periods=${periods}`,
              ),
            );
            break;
          case "by-rep":
            setByRep(
              await apiGet(
                `/crm/ai-intelligence/sales-velocity/by-rep?period=${period}`,
              ),
            );
            break;
          case "by-product":
            setByProduct(
              await apiGet(
                `/crm/ai-intelligence/sales-velocity/by-product?period=${period}`,
              ),
            );
            break;
          case "cycle-time":
            setCycleTime(
              await apiGet(
                `/crm/ai-intelligence/sales-velocity/cycle-time?period=${period}`,
              ),
            );
            break;
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [period],
  );

  return (
    <div className="ui-page">
      <PageHeader
        title="Sales Velocity"
        description="Velocity KPIs, trends, and cycle time analysis"
      />
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          className="ui-input"
          style={{ width: 120 }}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="YYYY-MM"
        />
        <Button
          variant={activeSection === "metrics" ? "primary" : "secondary"}
          onClick={() => load("metrics")}
        >
          <TrendingUp size={16} /> Velocity
        </Button>
        <Button
          variant={activeSection === "trend" ? "primary" : "secondary"}
          onClick={() => load("trend")}
        >
          <BarChart3 size={16} /> Trend
        </Button>
        <Button
          variant={activeSection === "by-rep" ? "primary" : "secondary"}
          onClick={() => load("by-rep")}
        >
          <Users size={16} /> By Rep
        </Button>
        <Button
          variant={activeSection === "by-product" ? "primary" : "secondary"}
          onClick={() => load("by-product")}
        >
          <Package size={16} /> By Product
        </Button>
        <Button
          variant={activeSection === "cycle-time" ? "primary" : "secondary"}
          onClick={() => load("cycle-time")}
        >
          <Clock size={16} /> Cycle Time
        </Button>
      </div>

      {loading && <Spinner />}

      {metrics && activeSection === "metrics" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Sales Velocity — {period}</h3>
          </div>
          <div className="ui-card-body">
            <div className="ui-grid-3" style={{ gap: "1rem" }}>
              <div
                style={{
                  background: "#f0fdf4",
                  padding: "1rem",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  Sales Velocity
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#10b981",
                  }}
                >
                  ${metrics.metrics?.salesVelocity?.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  background: "#eff6ff",
                  padding: "1rem",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  Deals Closed
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#3b82f6",
                  }}
                >
                  {metrics.metrics?.dealCount}
                </div>
                <div style={{ fontSize: "0.85rem" }}>
                  {metrics.metrics?.dealsPerDay}/day
                </div>
              </div>
              <div
                style={{
                  background: "#fefce8",
                  padding: "1rem",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  Avg Deal Size
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#f59e0b",
                  }}
                >
                  ${metrics.metrics?.avgDealSize?.toLocaleString()}
                </div>
                <div style={{ fontSize: "0.85rem" }}>
                  Total: ${metrics.metrics?.totalRevenue?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {trend.length > 0 && activeSection === "trend" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Velocity Trend</h3>
          </div>
          <div className="ui-card-body">
            {trend.map((t: any, i: number) => (
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
                  Velocity: ${t.metrics?.salesVelocity?.toLocaleString()} |
                  Deals: {t.metrics?.dealCount} | Revenue: $
                  {t.metrics?.totalRevenue?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {byRep.length > 0 && activeSection === "by-rep" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Velocity by Rep — {period}</h3>
          </div>
          <div className="ui-card-body">
            {byRep.map((r: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span style={{ fontWeight: 600 }}>{r.repId}</span>
                <span>
                  ${r.velocity?.toLocaleString()}/day | {r.dealCount} deals |
                  Avg ${r.avgDealSize?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {byProduct.length > 0 && activeSection === "by-product" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Velocity by Product — {period}</h3>
          </div>
          <div className="ui-card-body">
            {byProduct.map((p: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span style={{ fontWeight: 600 }}>{p.product}</span>
                <span>
                  ${p.totalRevenue?.toLocaleString()} | {p.dealCount} deals |
                  Avg ${p.avgDealSize?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {cycleTime && activeSection === "cycle-time" && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-card-title">Cycle Time — {period}</h3>
          </div>
          <div className="ui-card-body">
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              Average total cycle: {cycleTime.avgTotalCycleDays} days (
              {cycleTime.totalDealsAnalyzed} deals)
            </p>
            {cycleTime.stageBreakdown?.map((s: any, i: number) => (
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
                  Avg: {s.avgDays}d | Min: {s.minDays}d | Max: {s.maxDays}d (
                  {s.dealCount} deals)
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
