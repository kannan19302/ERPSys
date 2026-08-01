"use client";
import { useState, useEffect } from "react";
import { PageHeader, Spinner, Card } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { ShoppingCart, BarChart3 } from "lucide-react";

export default function ProcurementAnalyticsPage() {
  const client = useApiClient();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/procurement/intelligence/analytics/dashboard")
      .then((res: any) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <RouteGuard permission="procurement.purchase-order.read">
      <PageHeader
        title="Procurement Analytics"
        description="Spend analysis, budget tracking, and vendor performance metrics."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Procurement", href: "/procurement" },
          { label: "Analytics" },
        ]}
      />

      {loading ? (
        <Spinner />
      ) : data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="ui-grid-5">
            <Card>
              <div className="ui-card">
                <h3>Budgeted</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>
                  ${(data.budgetOverview?.totalBudgeted || 0).toLocaleString()}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card">
                <h3>Spent</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>
                  ${(data.budgetOverview?.totalSpent || 0).toLocaleString()}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card">
                <h3>Utilization</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>
                  {data.budgetOverview?.utilizationRate || 0}%
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card">
                <h3>Vendors</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>
                  {data.scorecardStats?.vendorsScored || 0}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card">
                <h3>Avg Score</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>
                  {data.scorecardStats?.avgOverall
                    ? `${data.scorecardStats.avgOverall}/100`
                    : "—"}
                </p>
              </div>
            </Card>
          </div>

          <Card>
            <h3>Top Vendors by Spend</h3>
            <table className="ui-table" style={{ marginTop: 8, width: "100%" }}>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Total Spend</th>
                  <th>Orders</th>
                  <th>Overall Score</th>
                </tr>
              </thead>
              <tbody>
                {(data.vendorPerformance || []).slice(0, 10).map((v: any) => (
                  <tr key={v.vendorId}>
                    <td>{v.vendorName}</td>
                    <td>${v.totalSpend.toLocaleString()}</td>
                    <td>{v.orderCount}</td>
                    <td>{v.overallScore ? `${v.overallScore}/100` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="ui-grid-2">
            <Card>
              <h3>Spend by Status</h3>
              <table
                className="ui-table"
                style={{ marginTop: 8, width: "100%" }}
              >
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.spendByStatus || {}).map(
                    ([status, s]: any) => (
                      <tr key={status}>
                        <td>{status}</td>
                        <td>${s.total.toLocaleString()}</td>
                        <td>{s.count}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </Card>

            <Card>
              <h3>Monthly Spend Trend</h3>
              <table
                className="ui-table"
                style={{ marginTop: 8, width: "100%" }}
              >
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.monthlyTrend || []).slice(-6).map((m: any) => (
                    <tr key={m.month}>
                      <td>{m.month}</td>
                      <td>${m.total.toLocaleString()}</td>
                      <td>{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      ) : (
        <p>No data available</p>
      )}
    </RouteGuard>
  );
}
