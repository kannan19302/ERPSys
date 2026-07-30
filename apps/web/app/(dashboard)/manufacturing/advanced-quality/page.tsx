// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  type Column,
  KPICard,
  Spinner,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  ShieldCheck,
  AlertTriangle,
  LineChart,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "spc",
    label: "SPC Charts",
    href: "/manufacturing/advanced-quality?tab=spc",
  },
  {
    id: "fmea",
    label: "FMEA",
    href: "/manufacturing/advanced-quality?tab=fmea",
  },
  {
    id: "apqp",
    label: "APQP",
    href: "/manufacturing/advanced-quality?tab=apqp",
  },
  {
    id: "ppap",
    label: "PPAP",
    href: "/manufacturing/advanced-quality?tab=ppap",
  },
];

interface Dashboard {
  spcCharts: number;
  fmeaWorksheets: number;
  apqpProjects: number;
  ppapSubmissions: number;
  averageRpn: number;
  highRiskItems: number;
}

export default function AdvancedQualityPage() {
  const client = useApiClient();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "spc";

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(
        await client.get<Dashboard>(
          "/manufacturing/advanced-quality/dashboard",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="manufacturing.advanced-quality.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Advanced Quality"
          description="SPC, FMEA, APQP, PPAP — comprehensive quality management"
          breadcrumbs={[
            { label: "Manufacturing", href: "/manufacturing" },
            { label: "Advanced Quality" },
          ]}
        />

        {dashboard && (
          <div className="ui-grid-auto">
            <KPICard
              title="SPC Charts"
              value={dashboard.spcCharts}
              icon={<LineChart size={20} />}
              color="var(--color-primary)"
            />
            <KPICard
              title="FMEA Worksheets"
              value={dashboard.fmeaWorksheets}
              icon={<AlertTriangle size={20} />}
              color="var(--color-warning)"
            />
            <KPICard
              title="APQP Projects"
              value={dashboard.apqpProjects}
              icon={<FileText size={20} />}
              color="var(--color-info)"
            />
            <KPICard
              title="PPAP Submissions"
              value={dashboard.ppapSubmissions}
              icon={<ShieldCheck size={20} />}
              color="var(--color-success)"
            />
            <KPICard
              title="High Risk Items"
              value={dashboard.highRiskItems}
              icon={<AlertTriangle size={20} />}
              color="var(--color-danger)"
            />
          </div>
        )}

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "spc" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Statistical Process Control — monitor process stability and
              capability indices (Cp, Cpk).
            </p>
            <div className="ui-mt-4">
              <Button variant="primary" disabled>
                View SPC Charts
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "fmea" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Failure Mode Effects Analysis — identify and prioritize process
              risks by RPN.
            </p>
            <div className="ui-mt-4">
              <Button variant="primary" disabled>
                Create FMEA
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "apqp" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Advanced Product Quality Planning — manage the 5-phase APQP
              lifecycle.
            </p>
            <div className="ui-mt-4">
              <Button variant="primary" disabled>
                New APQP Project
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "ppap" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Production Part Approval Process — manage PPAP submissions (Level
              1-5).
            </p>
            <div className="ui-mt-4">
              <Button variant="primary" disabled>
                Create Submission
              </Button>
            </div>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
