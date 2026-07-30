// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import styles from "../page.module.css";

interface DealVelocity {
  averageSalesCycleDays: number;
  totalDeals: number;
  closedDeals: number;
}
interface WinRate {
  winRate: number;
  won: number;
  lost: number;
  totalClosed: number;
}
interface PipelineHealth {
  pipelineHealthScore: number;
  activeDealCount: number;
  totalPipelineValue: number;
  averageDealAgeDays: number;
}

export default function DealAnalyticsPage() {
  const [velocity, setVelocity] = useState<DealVelocity | null>(null);
  const [winRate, setWinRate] = useState<WinRate | null>(null);
  const [health, setHealth] = useState<PipelineHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, wRes, hRes] = await Promise.all([
          fetch("/api/crm/deal-analytics-deep/velocity"),
          fetch("/api/crm/deal-analytics-deep/win-rate"),
          fetch("/api/crm/deal-analytics-deep/pipeline-health"),
        ]);
        if (vRes.ok) {
          const d = await vRes.json();
          setVelocity(d.data);
        }
        if (wRes.ok) {
          const d = await wRes.json();
          setWinRate(d.data);
        }
        if (hRes.ok) {
          const d = await hRes.json();
          setHealth(d.data);
        }
      } catch (e) {
        console.error("Failed to load deal analytics:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Deal Analytics</h1>
          <p className={styles.pageSubtitle}>
            Deep deal intelligence — velocity, win rates, forecasting accuracy,
            and pipeline health
          </p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading deal analytics…</div>
      ) : (
        <div className={styles.contentArea}>
          {/* KPI Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Avg. Sales Cycle</div>
              <div className={styles.statValue}>
                {velocity?.averageSalesCycleDays ?? "--"} days
              </div>
              <div className={styles.statChange + " " + styles.positive}>
                From {velocity?.closedDeals ?? 0} closed deals
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Win Rate</div>
              <div className={styles.statValue}>
                {winRate?.winRate ?? "--"}%
              </div>
              <div className={styles.statChange}>
                {winRate?.won ?? 0} won / {winRate?.lost ?? 0} lost
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pipeline Health</div>
              <div className={styles.statValue}>
                {health?.pipelineHealthScore ?? "--"}/100
              </div>
              <div className={styles.statChange}>
                {health?.activeDealCount ?? 0} active deals
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pipeline Value</div>
              <div className={styles.statValue}>
                ${health ? (health.totalPipelineValue / 1000).toFixed(0) : "--"}
                K
              </div>
              <div className={styles.statChange}>
                Avg. age: {health?.averageDealAgeDays ?? "--"} days
              </div>
            </div>
          </div>

          {/* Analytics Panels */}
          <div className={styles.twoColumnGrid}>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Deal Velocity Analysis</h3>
              <div className={styles.analyticsLinks}>
                {[
                  "velocity",
                  "stage-duration",
                  "funnel",
                  "close-rate-trend",
                  "deal-age",
                ].map((metric) => (
                  <a
                    key={metric}
                    href={`#${metric}`}
                    className={styles.metricLink}
                  >
                    <span className={styles.metricDot} />
                    {metric
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </a>
                ))}
              </div>
            </div>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Win/Loss Analytics</h3>
              <div className={styles.analyticsLinks}>
                {[
                  "win-rate",
                  "loss-reasons",
                  "competitor-win-loss",
                  "deals-by-source",
                  "revenue-leakage",
                ].map((metric) => (
                  <a
                    key={metric}
                    href={`#${metric}`}
                    className={styles.metricLink}
                  >
                    <span className={styles.metricDot} />
                    {metric
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.twoColumnGrid}>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Forecasting Intelligence</h3>
              <div className={styles.analyticsLinks}>
                {[
                  "forecast-accuracy",
                  "weighted-forecast",
                  "pipeline-coverage",
                  "historical-forecast-accuracy",
                  "probability-scoring",
                ].map((metric) => (
                  <a
                    key={metric}
                    href={`#${metric}`}
                    className={styles.metricLink}
                  >
                    <span className={styles.metricDot} />
                    {metric
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </a>
                ))}
              </div>
            </div>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Rep Performance</h3>
              <div className={styles.analyticsLinks}>
                {[
                  "top-reps",
                  "quota-attainment",
                  "team-quota-rollup",
                  "velocity-by-channel",
                  "pipeline-by-assignee",
                ].map((metric) => (
                  <a
                    key={metric}
                    href={`#${metric}`}
                    className={styles.metricLink}
                  >
                    <span className={styles.metricDot} />
                    {metric
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Risk & Intelligence</h3>
            <div className={styles.featureGrid}>
              {[
                "at-risk",
                "risk-heatmap",
                "engagement-distribution",
                "revenue-trend",
                "cross-sell-upsell",
                "by-industry",
                "negotiation-success",
                "scorecard",
              ].map((feat) => (
                <div key={feat} className={styles.featureCard}>
                  <div className={styles.featureTitle}>
                    {feat
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                  <div className={styles.featureBadge}>Available</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
