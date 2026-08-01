"use client";

import styles from "./page.module.css";
import React, { useEffect, useState } from "react";
import { PageHeader, Card, KPICard, DashboardChart } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { DollarSign, TrendingUp, Landmark, Wallet } from "lucide-react";

interface CashAccount {
  name: string;
  bankName: string;
  balance: number;
  currency: string;
  type: string;
}

interface DailyFlow {
  date: string;
  inflows: number;
  outflows: number;
}

interface CashPosition {
  totalCash: number;
  operatingCash: number;
  reserves: number;
  netChangeToday: number;
  accounts: CashAccount[];
  dailyFlows: DailyFlow[];
}

const EMPTY: CashPosition = {
  totalCash: 0,
  operatingCash: 0,
  reserves: 0,
  netChangeToday: 0,
  accounts: [],
  dailyFlows: [],
};

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function CashPositionPage() {
  const client = useApiClient();
  const [data, setData] = useState<CashPosition>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get<{ success: boolean; data: CashPosition }>(
        "/finance/reports/cash-position",
      )
      .then((res) => setData(res?.data ?? EMPTY))
      .catch(() => setData(EMPTY))
      .finally(() => setLoading(false));
  }, [client]);

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Cash Position"
        description="Real-time view of cash across all bank accounts and payment processors"
        breadcrumbs={[
          { label: "Finance", href: "/finance" },
          { label: "Advanced", href: "/finance/advanced" },
          { label: "Cash Position" },
        ]}
      />

      <div className={styles.s1}>
        <KPICard
          title="Total Cash"
          value={loading ? "—" : fmtCurrency(data.totalCash)}
          icon={<DollarSign size={20} />}
          color="var(--color-primary)"
        />
        <KPICard
          title="Operating Cash"
          value={loading ? "—" : fmtCurrency(data.operatingCash)}
          icon={<Wallet size={20} />}
          color="var(--color-success)"
        />
        <KPICard
          title="Reserves"
          value={loading ? "—" : fmtCurrency(data.reserves)}
          icon={<Landmark size={20} />}
          color="var(--color-info)"
        />
        <KPICard
          title="Net Change (Today)"
          value={
            loading
              ? "—"
              : `${data.netChangeToday >= 0 ? "+" : ""}${fmtCurrency(data.netChangeToday)}`
          }
          icon={<TrendingUp size={20} />}
          color={
            data.netChangeToday >= 0
              ? "var(--color-success)"
              : "var(--color-danger)"
          }
        />
      </div>

      <div className="ui-grid-2">
        <DashboardChart
          title="Daily Cash Flow"
          subtitle="Inflows vs outflows, last 7 days"
          data={data.dailyFlows as unknown as Record<string, unknown>[]}
          config={{
            xAxisKey: "date",
            series: [
              {
                dataKey: "inflows",
                name: "Inflows",
                color: "var(--color-success)",
              },
              {
                dataKey: "outflows",
                name: "Outflows",
                color: "var(--color-danger)",
              },
            ],
          }}
          defaultChartType="bar"
          allowedChartTypes={["bar", "area", "line"]}
          height={280}
        />

        <Card>
          <div className="p-4 ui-stack-3">
            <h3 className={styles.s2}>Account Balances</h3>
            {data.accounts.length === 0 && !loading && (
              <p className="ui-text-xs-muted">No bank accounts on file yet.</p>
            )}
            {data.accounts.map((acc) => (
              <div key={acc.name} className={styles.s3}>
                <div>
                  <div className="ui-heading-sm">
                    {acc.bankName} — {acc.name}
                  </div>
                  <div className="ui-text-xs-tertiary">
                    {acc.type} · {acc.currency}
                  </div>
                </div>
                <span className="ui-heading-sm font-bold">
                  {fmtCurrency(acc.balance)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
