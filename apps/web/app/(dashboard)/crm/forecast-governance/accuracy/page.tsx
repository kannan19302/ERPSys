"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, Badge, useToast } from "@unerp/ui";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { apiGet } from "../../_components/api";

export default function ForecastAccuracyPage() {
  const [loading, setLoading] = useState(true);
  const [accuracy, setAccuracy] = useState<any[]>([]);
  const [vsActual, setVsActual] = useState<any>(null);
  const toast = useToast();

  const loadData = async () => {
    try {
      const [acc, vs] = await Promise.all([
        apiGet<any[]>("/crm/forecast-governance/accuracy"),
        apiGet<any>(
          "/crm/forecast-governance/vs-actual/" +
            new Date().toISOString().slice(0, 7),
        ),
      ]);
      setAccuracy(Array.isArray(acc) ? acc : []);
      setVsActual(vs);
    } catch (err) {
      toast.error(
        "Could not load accuracy data",
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

  const avgAccuracy =
    accuracy.length > 0
      ? Math.round(
          accuracy.reduce((s, a) => s + a.accuracyPct, 0) / accuracy.length,
        )
      : 0;

  return (
    <div className="ui-page">
      <PageHeader
        title="Forecast Accuracy"
        description="Compare forecasted vs actual revenue across periods"
        breadcrumb={[
          { label: "Forecast Governance", href: "/crm/forecast-governance" },
          { label: "Accuracy" },
        ]}
      />

      <div className="ui-card-grid ui-grid-3">
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="ui-stat-value">{avgAccuracy}%</div>
          <div className="ui-stat-label">Avg Forecast Accuracy</div>
        </Card>
        {vsActual && (
          <>
            <Card className="ui-stat-card">
              <div className="ui-stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="ui-stat-value">
                ${(vsActual.forecastedAmount || 0).toLocaleString()}
              </div>
              <div className="ui-stat-label">
                Forecasted ({vsActual.period})
              </div>
            </Card>
            <Card className="ui-stat-card">
              <div className="ui-stat-icon">
                <TrendingDown size={24} />
              </div>
              <div className="ui-stat-value">
                ${(vsActual.actualAmount || 0).toLocaleString()}
              </div>
              <div className="ui-stat-label">Actual ({vsActual.period})</div>
            </Card>
          </>
        )}
      </div>

      {vsActual && (
        <Card title={`Forecast vs Actual — ${vsActual.period}`}>
          <div className="ui-grid-3">
            <div className="ui-stat-detail">
              <span className="ui-stat-detail-label">Forecasted</span>
              <span className="ui-stat-detail-value">
                ${(vsActual.forecastedAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="ui-stat-detail">
              <span className="ui-stat-detail-label">Actual</span>
              <span className="ui-stat-detail-value">
                ${(vsActual.actualAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="ui-stat-detail">
              <span className="ui-stat-detail-label">Variance</span>
              <span
                className={`ui-stat-detail-value ${(vsActual.variance || 0) >= 0 ? "ui-text-success" : "ui-text-error"}`}
              >
                {(vsActual.variance || 0) >= 0 ? "+" : ""}$
                {(vsActual.variance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      )}

      <Card title="Period-over-Period Accuracy">
        <div className="ui-table-wrapper">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Forecasted</th>
                <th>Actual</th>
                <th>Accuracy</th>
                <th>Variance</th>
                <th>Trend</th>
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
                            : "error"
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
                  <td>
                    {a.accuracyPct >= 80 ? (
                      <TrendingUp size={16} className="ui-text-success" />
                    ) : a.accuracyPct >= 50 ? (
                      <Minus size={16} className="ui-text-warning" />
                    ) : (
                      <TrendingDown size={16} className="ui-text-error" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
