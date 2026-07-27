"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, Button, Badge, KPICard, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  Activity,
  ClipboardCheck,
  BarChart3,
  Target,
  ShieldCheck,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "pillars",
    label: "TPM Pillars",
    href: "/manufacturing/tpm?tab=pillars",
  },
  { id: "audits", label: "5S Audits", href: "/manufacturing/tpm?tab=audits" },
];

interface Dashboard {
  pillarCount: number;
  averagePillarScore: number;
  totalAudits: number;
  passedAudits: number;
  pillars: Array<{
    id: string;
    name: string;
    code: string;
    pillarType: string;
    score: number;
    targetScore: number;
    status: string;
  }>;
  recentAudits: Array<{
    id: string;
    workstationId: string;
    totalScore: number;
    maxScore: number;
    status: string;
    auditedAt: string;
  }>;
  recentKpis: Array<{
    id: string;
    kpiType: string;
    value: number;
    period: string;
  }>;
}

export default function TpmPage() {
  const client = useApiClient();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "pillars";

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(await client.get<Dashboard>("/manufacturing/tpm/dashboard"));
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
    <RouteGuard permission="manufacturing.tpm.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Total Productive Maintenance"
          description="TPM pillars, autonomous maintenance, 5S audits, OEE deep dive"
          breadcrumbs={[
            { label: "Manufacturing", href: "/manufacturing" },
            { label: "TPM" },
          ]}
        />

        {dashboard && (
          <div className="ui-grid-auto">
            <KPICard
              title="TPM Pillars"
              value={dashboard.pillarCount}
              icon={<Activity size={20} />}
              color="var(--color-primary)"
            />
            <KPICard
              title="Avg Score"
              value={`${dashboard.averagePillarScore}%`}
              icon={<Target size={20} />}
              color="var(--color-success)"
            />
            <KPICard
              title="Total Audits"
              value={dashboard.totalAudits}
              icon={<ClipboardCheck size={20} />}
              color="var(--color-warning)"
            />
            <KPICard
              title="Passed"
              value={dashboard.passedAudits}
              icon={<ShieldCheck size={20} />}
              color="var(--color-info)"
            />
          </div>
        )}

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "pillars" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Track TPM pillars: Autonomous, Planned, Focused, Quality,
              Training, Safety.
            </p>
            <div className="ui-stack-2 ui-mt-4">
              {dashboard?.pillars.map((p) => (
                <div key={p.id} className="ui-flex-between py-1 border-b">
                  <span className="ui-text-sm font-semibold">{p.name}</span>
                  <Badge
                    variant={p.score >= p.targetScore ? "success" : "warning"}
                  >
                    {p.score}% / {p.targetScore}%
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "audits" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              5S Workplace Audits — Sort, Set in Order, Shine, Standardize,
              Sustain.
            </p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
