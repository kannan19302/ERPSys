"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  DataTable,
  StatCardRow,
  type Column,
} from "@unerp/ui";
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface ForecastResult {
  period: string;
  forecastRevenue: number;
  forecastOrders: number;
  confidenceUpper: number;
  confidenceLower: number;
  growthRate: number;
  seasonalityFactor: number;
}

interface ForecastInput {
  productId: string;
  productName: string;
  currentStock: number;
  avgMonthlySales: number;
  forecastNextMonth: number;
  reorderPoint: number;
}

export default function SalesForecastingPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<"revenue" | "inventory">("revenue");
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [inventory, setInventory] = useState<ForecastInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(3);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "revenue") {
        const res = await client.get<ForecastResult>(
          `/sales/forecasting?months=${months}`,
        );
        setForecast(res);
      } else {
        const res = await client.get<
          ForecastInput[] | { data?: ForecastInput[] }
        >("/sales/forecasting/inventory");
        setInventory(Array.isArray(res) ? res : res.data || []);
      }
    } catch {
      setForecast(null);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client, tab, months]);

  const invColumns: Column<ForecastInput>[] = [
    { key: "productName", header: "Product", sortable: true },
    { key: "currentStock", header: "Current Stock", sortable: true },
    { key: "avgMonthlySales", header: "Avg Monthly Sales", sortable: true },
    {
      key: "forecastNextMonth",
      header: "Forecast (Next Month)",
      sortable: true,
      render: (row) => <strong>{row.forecastNextMonth}</strong>,
    },
    {
      key: "reorderPoint",
      header: "Reorder Point",
      render: (row) => (
        <Badge
          variant={row.currentStock <= row.reorderPoint ? "danger" : "default"}
        >
          {row.reorderPoint}
        </Badge>
      ),
    },
  ];

  const growthLabel = forecast
    ? forecast.growthRate > 0
      ? "+Growth"
      : forecast.growthRate < 0
        ? "-Decline"
        : "Stable"
    : "—";

  return (
    <RouteGuard permission="sales.forecast.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Sales Forecasting"
          description="Predictive analytics for revenue planning and inventory optimization."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Sales", href: "/sales" },
            { label: "Forecasting" },
          ]}
          actions={
            <div className="ui-hstack-2">
              {[1, 3, 6, 12].map((m) => (
                <Button
                  key={m}
                  variant={months === m ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setMonths(m)}
                >
                  {m} {m === 1 ? "Month" : "Months"}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={fetchData}>
                <RefreshCw size={14} />
              </Button>
            </div>
          }
        />
        <div className="ui-tabs ui-mb-4">
          <button
            onClick={() => setTab("revenue")}
            className={tab === "revenue" ? "ui-tab-active" : "ui-tab"}
          >
            Revenue Forecast
          </button>
          <button
            onClick={() => setTab("inventory")}
            className={tab === "inventory" ? "ui-tab-active" : "ui-tab"}
          >
            Inventory Demand
          </button>
        </div>
        {loading ? (
          <div className="ui-center-pad">
            <Spinner size="lg" />
          </div>
        ) : tab === "revenue" && forecast ? (
          <>
            <StatCardRow
              stats={[
                {
                  label: `Forecast Revenue (${months}m)`,
                  value: `$${forecast.forecastRevenue.toLocaleString()}`,
                  icon: React.createElement(DollarSign, { size: 16 }),
                  color: "green",
                },
                {
                  label: "Forecast Orders",
                  value: forecast.forecastOrders,
                  icon: React.createElement(Package, { size: 16 }),
                  color: "blue",
                },
                {
                  label: "Growth Rate",
                  value: `${(forecast.growthRate * 100).toFixed(1)}%`,
                  change: forecast.growthRate,
                  color: forecast.growthRate >= 0 ? "green" : "red",
                },
                {
                  label: "Growth Label",
                  value: growthLabel,
                  color: forecast.growthRate >= 0 ? "green" : "red",
                },
                {
                  label: "Seasonality",
                  value: `${(forecast.seasonalityFactor * 100).toFixed(0)}%`,
                  icon: React.createElement(Calendar, { size: 16 }),
                  color: "purple",
                },
              ]}
            />
            <div className="ui-grid-2 ui-gap-4">
              <Card padding="none">
                <div className="ui-card-header">
                  <span>Confidence Range</span>
                  <span className="ui-text-xs-muted">Upper / Lower bounds</span>
                </div>
                <div className="ui-p-4 ui-stack-2">
                  <div className="ui-flex-between">
                    <span className="ui-text-sm">Upper Bound</span>
                    <span className="ui-text-sm-semibold">
                      ${forecast.confidenceUpper.toLocaleString()}
                    </span>
                  </div>
                  <div className="ui-flex-between">
                    <span className="ui-text-sm">Lower Bound</span>
                    <span className="ui-text-sm-semibold">
                      ${forecast.confidenceLower.toLocaleString()}
                    </span>
                  </div>
                  <div className="ui-flex-between">
                    <span className="ui-text-sm">Mid Point</span>
                    <span className="ui-text-sm-semibold">
                      $
                      {(
                        (forecast.confidenceUpper + forecast.confidenceLower) /
                        2
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
              <Card padding="none">
                <div className="ui-card-header">
                  <span>Forecast Period</span>
                  <span className="ui-text-xs-muted">{forecast.period}</span>
                </div>
                <div className="ui-p-4 ui-stack-2">
                  <div className="ui-flex-between">
                    <span className="ui-text-sm">Period</span>
                    <span className="ui-text-sm">{forecast.period}</span>
                  </div>
                  <div className="ui-flex-between">
                    <span className="ui-text-sm">Model Confidence</span>
                    <Badge
                      variant={
                        forecast.confidenceUpper - forecast.confidenceLower <
                        forecast.forecastRevenue * 0.3
                          ? "success"
                          : "warning"
                      }
                    >
                      {(
                        1 -
                        ((forecast.confidenceUpper - forecast.confidenceLower) /
                          forecast.forecastRevenue) *
                          100
                      ).toFixed(0)}
                      %
                    </Badge>
                  </div>
                  <div className="ui-flex-between">
                    <span className="ui-text-sm">Expected Orders</span>
                    <span className="ui-text-sm-semibold">
                      {forecast.forecastOrders}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : tab === "inventory" ? (
          <Card>
            <div className="ui-p-4">
              <DataTable columns={invColumns} data={inventory} />
            </div>
          </Card>
        ) : (
          <Card>
            <div className="ui-center-pad ui-text-muted">
              No forecast data available.
            </div>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
