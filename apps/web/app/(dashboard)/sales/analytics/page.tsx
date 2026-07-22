"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  DataTable,
  StatCardRow,
  type Column,
} from "@unerp/ui";
import {
  BarChart4,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  RefreshCw,
  Download,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface SalesAnalytics {
  periodRevenue: number;
  periodOrders: number;
  avgOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  conversionRate: number;
  newCustomers: number;
  repeatRate: number;
}

export default function SalesAnalyticsPage() {
  const client = useApiClient();
  const [data, setData] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await client.get<SalesAnalytics>(
        `/sales/analytics?period=${period}`,
      );
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client, period]);

  const productColumns: Column<{
    name: string;
    quantity: number;
    revenue: number;
  }>[] = [
    { key: "name", header: "Product" },
    { key: "quantity", header: "Qty Sold", sortable: true },
    {
      key: "revenue",
      header: "Revenue",
      sortable: true,
      render: (row) => `$${row.revenue.toLocaleString()}`,
    },
  ];

  return (
    <RouteGuard permission="sales.analytics.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Sales Analytics"
          description="Performance dashboards, trends, and revenue breakdown."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Sales", href: "/sales" },
            { label: "Analytics" },
          ]}
          actions={
            <div className="ui-hstack-2">
              {["7d", "30d", "90d", "1y"].map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                >
                  {p === "7d"
                    ? "7 Days"
                    : p === "30d"
                      ? "30 Days"
                      : p === "90d"
                        ? "90 Days"
                        : "1 Year"}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={fetchData}>
                <RefreshCw size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => alert("Export analytics")}
              >
                <Download size={14} />
              </Button>
            </div>
          }
        />
        {loading ? (
          <div className="ui-center-pad">
            <Spinner size="lg" />
          </div>
        ) : !data ? (
          <Card>
            <div className="ui-center-pad ui-text-muted">
              No analytics data available for this period.
            </div>
          </Card>
        ) : (
          <>
            <StatCardRow
              stats={[
                {
                  label: "Revenue",
                  value: `$${data.periodRevenue.toLocaleString()}`,
                  icon: React.createElement(DollarSign, { size: 16 }),
                  color: "green",
                },
                {
                  label: "Orders",
                  value: data.periodOrders,
                  icon: React.createElement(ShoppingCart, { size: 16 }),
                  color: "blue",
                },
                {
                  label: "Avg Order Value",
                  value: `$${data.avgOrderValue.toFixed(2)}`,
                  icon: React.createElement(TrendingUp, { size: 16 }),
                  color: "purple",
                },
                {
                  label: "Conversion",
                  value: `${(data.conversionRate * 100).toFixed(1)}%`,
                  icon: React.createElement(BarChart4, { size: 16 }),
                  color: "amber",
                },
                {
                  label: "New Customers",
                  value: data.newCustomers,
                  icon: React.createElement(Users, { size: 16 }),
                  color: "cyan",
                },
                {
                  label: "Repeat Rate",
                  value: `${(data.repeatRate * 100).toFixed(1)}%`,
                  icon: React.createElement(Package, { size: 16 }),
                  color: "pink",
                },
              ]}
            />
            <div className="ui-grid-2 ui-gap-4">
              <Card padding="none">
                <div className="ui-card-header">
                  <span>Revenue Trend</span>
                  <span className="ui-text-xs-muted">Last {period}</span>
                </div>
                <div className="ui-p-4">
                  {data.revenueByDay.length > 0 ? (
                    <div className="ui-stack-2">
                      {data.revenueByDay.slice(-14).map((d) => (
                        <div key={d.date} className="ui-flex-between">
                          <span className="ui-text-xs">
                            {new Date(d.date).toLocaleDateString()}
                          </span>
                          <div className="ui-flex-center ui-gap-3">
                            <div
                              className="ui-h-2 ui-rounded-sm"
                              style={{
                                width: `${Math.max(4, (d.revenue / Math.max(...data.revenueByDay.map((x) => x.revenue))) * 100)}px`,
                                background: "var(--color-primary)",
                              }}
                            />
                            <span className="ui-text-xs-muted">
                              ${d.revenue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ui-text-muted">No trend data.</p>
                  )}
                </div>
              </Card>
              <Card padding="none">
                <div className="ui-card-header">
                  <span>Top Products</span>
                  <span className="ui-text-xs-muted">By revenue</span>
                </div>
                <div className="ui-p-4">
                  {data.topProducts.length > 0 ? (
                    <DataTable
                      columns={productColumns}
                      data={data.topProducts}
                    />
                  ) : (
                    <p className="ui-text-muted">No product data.</p>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
