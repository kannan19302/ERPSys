// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, Badge, useToast, Button } from "@unerp/ui";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  Users,
  Clock,
} from "lucide-react";
import { apiGet } from "../_components/api";

export default function ForecastGovernancePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any>(null);
  const [accuracy, setAccuracy] = useState<any[]>([]);
  const toast = useToast();

  const loadData = async () => {
    try {
      const [cat, tr, cov, acc] = await Promise.all([
        apiGet<any>("/crm/forecast-governance/categories"),
        apiGet<any[]>("/crm/forecast-governance/trend"),
        apiGet<any>("/crm/forecast-governance/pipeline-coverage/current"),
        apiGet<any[]>("/crm/forecast-governance/accuracy"),
      ]);
      setCategories(cat);
      setTrend(Array.isArray(tr) ? tr : []);
      setCoverage(cov);
      setAccuracy(Array.isArray(acc) ? acc : []);
    } catch (err) {
      toast.error(
        "Could not load forecast governance data",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading)
    return (
      <div className="ui-page-loading">
        <Spinner />
      </div>
    );

  const summary = categories?.summary || {
    totalPipeline: 0,
    totalWeighted: 0,
    totalCommit: 0,
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Forecast Governance"
        description="Manage team forecasts, rollups, and accuracy analytics"
      />
      <div className="ui-card-grid ui-grid-4">
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="ui-stat-value">
            ${(summary.totalCommit || 0).toLocaleString()}
          </div>
          <div className="ui-stat-label">Commit Amount</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="ui-stat-value">
            ${(summary.totalWeighted || 0).toLocaleString()}
          </div>
          <div className="ui-stat-label">Weighted Pipeline</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <Target size={24} />
          </div>
          <div className="ui-stat-value">
            ${(summary.totalPipeline || 0).toLocaleString()}
          </div>
          <div className="ui-stat-label">Total Pipeline</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="ui-stat-value">
            {coverage?.overallCoverage
              ? `${(coverage.overallCoverage * 100).toFixed(0)}%`
              : "N/A"}
          </div>
          <div className="ui-stat-label">Pipeline Coverage</div>
        </Card>
      </div>

      <div className="ui-grid-2">
        <Card title="Forecast Categories">
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Deals</th>
                  <th>Amount</th>
                  <th>Weighted</th>
                </tr>
              </thead>
              <tbody>
                {categories?.categories?.map((c: any) => (
                  <tr key={c.category}>
                    <td>
                      <Badge
                        variant={
                          c.category === "Commit"
                            ? "success"
                            : c.category === "Best Case"
                              ? "warning"
                              : "default"
                        }
                      >
                        {c.category}
                      </Badge>
                    </td>
                    <td>{c.dealCount}</td>
                    <td>${c.totalAmount.toLocaleString()}</td>
                    <td>${c.weightedAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Forecast Trend">
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Commit</th>
                  <th>Best Case</th>
                  <th>Pipeline</th>
                  <th>Closed</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((t: any) => (
                  <tr key={t.period}>
                    <td>{t.period}</td>
                    <td>${(t.commit || 0).toLocaleString()}</td>
                    <td>${(t.bestCase || 0).toLocaleString()}</td>
                    <td>${(t.pipeline || 0).toLocaleString()}</td>
                    <td>
                      <Badge variant="success">
                        ${(t.closedWon || 0).toLocaleString()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="ui-grid-2">
        <Card title="Forecast Accuracy">
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Forecasted</th>
                  <th>Actual</th>
                  <th>Accuracy</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {accuracy.map((a: any) => (
                  <tr key={a.period}>
                    <td>{a.period}</td>
                    <td>${(a.forecastedAmount || 0).toLocaleString()}</td>
                    <td>${(a.actualAmount || 0).toLocaleString()}</td>
                    <td>
                      <Badge
                        variant={
                          a.accuracyPct >= 80
                            ? "success"
                            : a.accuracyPct >= 50
                              ? "warning"
                              : "danger"
                        }
                      >
                        {a.accuracyPct}%
                      </Badge>
                    </td>
                    <td
                      className={
                        a.variance >= 0 ? "ui-text-success" : "ui-text-error"
                      }
                    >
                      ${(a.variance || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="ui-card-actions">
            <Button
              variant="primary"
              onClick={() =>
                (window.location.href = "/crm/forecast-governance/team-rollup")
              }
            >
              <Users size={16} /> View Team Rollups
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                (window.location.href = "/crm/forecast-governance/accuracy")
              }
            >
              <BarChart3 size={16} /> Accuracy Analytics
            </Button>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = "/crm/deal-desk")}
            >
              <Target size={16} /> Deal Desk
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
