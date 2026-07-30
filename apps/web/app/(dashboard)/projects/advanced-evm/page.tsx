// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Target,
  FileText,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  StatCardRow,
  useToast,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  { id: "kpi", label: "KPI", href: "/projects/advanced-evm?tab=kpi" },
  {
    id: "forecast",
    label: "Forecast",
    href: "/projects/advanced-evm?tab=forecast",
  },
  { id: "tcpi", label: "TCPI", href: "/projects/advanced-evm?tab=tcpi" },
  {
    id: "reports",
    label: "Reports",
    href: "/projects/advanced-evm?tab=reports",
  },
];

interface EVMData {
  projectId: string;
  pv: number;
  ev: number;
  ac: number;
  sv: number;
  cv: number;
  cpi: number;
  spi: number;
  eac: number;
  etc: number;
  vac: number;
  tcpi: number;
  bac: number;
  percentComplete: number;
  forecasts?: any[];
  snapshots?: any[];
  targets?: any[];
}

export default function AdvancedEvmPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "kpi";
  const [evm, setEvm] = useState<EVMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [client]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const prjData = await client.get<
        { id: string }[] | { data?: { id: string }[] }
      >("/projects");
      const projects = Array.isArray(prjData) ? prjData : prjData.data || [];
      if (projects.length > 0 && projects[0]) {
        const data = await client.get<EVMData>(
          `/projects/${projects[0].id}/evm-dashboard`,
        );
        setEvm(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      notifyError("Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="ui-alert ui-alert-danger">{error}</div>;
  if (!evm)
    return (
      <p className="ui-text-muted">No project selected for EVM analysis.</p>
    );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Advanced EVM"
        description="Earned Value Management with EAC, TCPI, and forecasting"
      />
      <SubTabBar tabs={SUB_TABS} />
      {activeTab === "kpi" && (
        <>
          <StatCardRow
            stats={[
              {
                label: "CPI",
                value: evm.cpi.toFixed(2),
                icon: <TrendingUp size={16} />,
                color: evm.cpi >= 1 ? "var(--chart-2)" : "var(--chart-4)",
              },
              {
                label: "SPI",
                value: evm.spi.toFixed(2),
                icon: <Activity size={16} />,
                color: evm.spi >= 1 ? "var(--chart-2)" : "var(--chart-4)",
              },
              {
                label: "EAC",
                value: `$${Number(evm.eac).toLocaleString()}`,
                icon: <DollarSign size={16} />,
                color: "var(--chart-3)",
              },
              {
                label: "TCPI",
                value: evm.tcpi.toFixed(2),
                icon: <Target size={16} />,
                color: evm.tcpi <= 1.1 ? "var(--chart-2)" : "var(--chart-4)",
              },
            ]}
          />
          <div className="ui-grid-3">
            <Card>
              <p className="ui-text-micro">PV</p>
              <p className="ui-text-label">
                ${Number(evm.pv).toLocaleString()}
              </p>
            </Card>
            <Card>
              <p className="ui-text-micro">EV</p>
              <p className="ui-text-label">
                ${Number(evm.ev).toLocaleString()}
              </p>
            </Card>
            <Card>
              <p className="ui-text-micro">AC</p>
              <p className="ui-text-label">
                ${Number(evm.ac).toLocaleString()}
              </p>
            </Card>
            <Card>
              <p className="ui-text-micro">SV</p>
              <p
                className="ui-text-label"
                style={{
                  color:
                    evm.sv >= 0
                      ? "var(--color-success)"
                      : "var(--color-danger)",
                }}
              >
                ${Number(evm.sv).toLocaleString()}
              </p>
            </Card>
            <Card>
              <p className="ui-text-micro">CV</p>
              <p
                className="ui-text-label"
                style={{
                  color:
                    evm.cv >= 0
                      ? "var(--color-success)"
                      : "var(--color-danger)",
                }}
              >
                ${Number(evm.cv).toLocaleString()}
              </p>
            </Card>
            <Card>
              <p className="ui-text-micro">BAC</p>
              <p className="ui-text-label">
                ${Number(evm.bac).toLocaleString()}
              </p>
            </Card>
          </div>
        </>
      )}
      {activeTab === "forecast" && (
        <div className="ui-grid-3">
          <Card>
            <p className="ui-text-micro">EAC (Estimate at Completion)</p>
            <p className="ui-text-lg">${Number(evm.eac).toLocaleString()}</p>
          </Card>
          <Card>
            <p className="ui-text-micro">ETC (Estimate to Complete)</p>
            <p className="ui-text-lg">${Number(evm.etc).toLocaleString()}</p>
          </Card>
          <Card>
            <p className="ui-text-micro">VAC (Variance at Completion)</p>
            <p
              className="ui-text-lg"
              style={{
                color:
                  evm.vac >= 0 ? "var(--color-success)" : "var(--color-danger)",
              }}
            >
              ${Number(evm.vac).toLocaleString()}
            </p>
          </Card>
        </div>
      )}
      {activeTab === "tcpi" && (
        <div className="ui-stack-4">
          <Card className="ui-stack-3">
            <h3 className="ui-text-label">To-Complete Performance Index</h3>
            <div className="ui-hstack-3">
              <div>
                <p className="ui-text-micro">TCPI (BAC)</p>
                <p className="ui-text-label">{evm.tcpi.toFixed(2)}</p>
              </div>
              <div>
                <p className="ui-text-micro">% Complete</p>
                <p className="ui-text-label">
                  {evm.percentComplete.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
      {activeTab === "reports" && (
        <div className="ui-stack-4">
          <p className="ui-text-muted">
            EVM snapshot and trend data available via the API. Create snapshots
            to track EVM over time.
          </p>
          {evm.snapshots && evm.snapshots.length > 0 && (
            <div className="ui-stack-3">
              {evm.snapshots.map((s: any) => (
                <Card key={s.id} className="ui-flex-between">
                  <span>{new Date(s.snapshotDate).toLocaleDateString()}</span>
                  <div className="ui-hstack-3">
                    <span className="ui-text-micro">
                      CPI: {Number(s.cpi).toFixed(2)}
                    </span>
                    <span className="ui-text-micro">
                      SPI: {Number(s.spi).toFixed(2)}
                    </span>
                    <span className="ui-text-micro">
                      EAC: ${Number(s.eac).toLocaleString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
