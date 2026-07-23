"use client";
import styles from "./page.module.css";
import React, { useEffect, useState } from "react";
import { PageHeader, Card, KPICard, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { TrendingUp, DollarSign, Percent, Scale } from "lucide-react";

interface RatiosData {
  assetToLiabilityRatio: number;
  debtToEquity: number;
  returnOnEquity: number;
  returnOnAssets: number;
  netMargin: number;
  daysSalesOutstanding: number;
}

const EMPTY_RATIOS: RatiosData = {
  assetToLiabilityRatio: 0,
  debtToEquity: 0,
  returnOnEquity: 0,
  returnOnAssets: 0,
  netMargin: 0,
  daysSalesOutstanding: 0,
};

interface Ratio {
  name: string;
  value: number;
  unit: string;
  benchmark: number;
  description: string;
}

function statusFor(
  value: number,
  benchmark: number,
  higherIsBetter: boolean,
): "good" | "warning" | "poor" {
  const ratio = benchmark === 0 ? 1 : value / benchmark;
  if (higherIsBetter) {
    if (ratio >= 1) return "good";
    if (ratio >= 0.7) return "warning";
    return "poor";
  }
  if (ratio <= 1) return "good";
  if (ratio <= 1.3) return "warning";
  return "poor";
}

const statusColor = {
  good: "var(--color-success)",
  warning: "var(--color-warning)",
  poor: "var(--color-danger)",
};

export default function FinancialRatiosPage() {
  const client = useApiClient();
  const [data, setData] = useState<RatiosData>(EMPTY_RATIOS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get<{ success: boolean; data: RatiosData }>(
        `/finance/reports/financial-ratios?asOfDate=${new Date().toISOString()}`,
      )
      .then((res) => setData(res?.data ?? EMPTY_RATIOS))
      .catch(() => setData(EMPTY_RATIOS))
      .finally(() => setLoading(false));
  }, [client]);

  const ratios: Ratio[] = [
    {
      name: "Asset-to-Liability Ratio",
      value: data.assetToLiabilityRatio,
      unit: "x",
      benchmark: 2.0,
      description: "Total assets / total liabilities",
    },
    {
      name: "Debt-to-Equity",
      value: data.debtToEquity,
      unit: "x",
      benchmark: 1.0,
      description: "Total liabilities / total equity",
    },
    {
      name: "Net Margin",
      value: data.netMargin,
      unit: "%",
      benchmark: 10,
      description: "Net income / revenue (YTD)",
    },
    {
      name: "Return on Equity",
      value: data.returnOnEquity,
      unit: "%",
      benchmark: 15,
      description: "Net income / shareholder equity (YTD)",
    },
    {
      name: "Return on Assets",
      value: data.returnOnAssets,
      unit: "%",
      benchmark: 5,
      description: "Net income / total assets (YTD)",
    },
    {
      name: "Days Sales Outstanding",
      value: data.daysSalesOutstanding,
      unit: "days",
      benchmark: 30,
      description: "Average collection period",
    },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Financial Ratios"
        description="Key financial health indicators, computed from live ledger and AR data"
        breadcrumbs={[
          { label: "Finance", href: "/finance" },
          { label: "Advanced", href: "/finance/advanced" },
          { label: "Financial Ratios" },
        ]}
      />

      <div className={styles.s1}>
        <KPICard
          title="Asset/Liability Ratio"
          value={loading ? "—" : `${data.assetToLiabilityRatio}x`}
          icon={<Scale size={18} />}
          color="var(--color-success)"
        />
        <KPICard
          title="Net Margin"
          value={loading ? "—" : `${data.netMargin}%`}
          icon={<Percent size={18} />}
          color="var(--color-success)"
        />
        <KPICard
          title="Return on Equity"
          value={loading ? "—" : `${data.returnOnEquity}%`}
          icon={<TrendingUp size={18} />}
          color="var(--color-primary)"
        />
        <KPICard
          title="DSO"
          value={loading ? "—" : `${data.daysSalesOutstanding} days`}
          icon={<DollarSign size={18} />}
          color="var(--color-warning)"
        />
      </div>

      <div className={styles.s2}>
        {ratios.map((r) => {
          const status = statusFor(
            r.value,
            r.benchmark,
            r.name !== "Debt-to-Equity" && r.name !== "Days Sales Outstanding",
          );
          return (
            <Card key={r.name}>
              <div className={styles.s3}>
                <div>
                  <div className="ui-heading-sm">{r.name}</div>
                  <div className={styles.s4}>{r.description}</div>
                  <div className={styles.s4}>
                    Benchmark: {r.benchmark}
                    {r.unit}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    style={{ color: statusColor[status] }}
                    className={styles.s5}
                  >
                    {loading ? "—" : `${r.value}${r.unit}`}
                  </div>
                  <Badge
                    variant={
                      status === "good"
                        ? "success"
                        : status === "warning"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
