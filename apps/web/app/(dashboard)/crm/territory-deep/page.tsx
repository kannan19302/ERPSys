"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  useToast,
  DataTable,
  type Column,
} from "@unerp/ui";
import {
  Plus,
  MapPin,
  Users,
  TrendingUp,
  BarChart3,
  Target,
  ChevronRight,
} from "lucide-react";
import { useApiClient } from "@unerp/framework";
import Link from "next/link";

export default function TerritoryDeepDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const toast = useToast();
  const client = useApiClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, planRes] = await Promise.all([
        client.get<any>("/crm/territory-deep/dashboard"),
        client.get<any>("/crm/territory-deep/plans"),
      ]);
      setDashboard(dashRes);
      setPlans(Array.isArray(planRes) ? planRes : []);
    } catch {
      toast.error("Could not load territory data");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <Spinner />;

  const planColumns: Column<any>[] = [
    { key: "name", header: "Plan Name" },
    { key: "fiscalYear", header: "Fiscal Year" },
    {
      key: "status",
      header: "Status",
      render: (v: string) => (
        <Badge
          variant={
            v === "ACTIVE" ? "success" : v === "DRAFT" ? "warning" : "default"
          }
        >
          {v}
        </Badge>
      ),
    },
    {
      key: "id",
      header: "",
      render: (_: string, row: any) => (
        <Link
          href={`/crm/territory-deep/plans/${row.id}`}
          className="ui-btn ui-btn-sm ui-btn-ghost"
        >
          <ChevronRight size={16} />
        </Link>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <PageHeader
        title="Territory & Account Management"
        description="Territory plans, account teams, scoring, and named accounts"
        actions={
          <Link
            href="/crm/territory-deep/plans/new"
            className="ui-btn ui-btn-primary"
          >
            <Plus size={16} /> New Plan
          </Link>
        }
      />
      <div className="ui-grid-4" style={{ marginBottom: "var(--space-6)" }}>
        <Card title="Territories">
          <div className="ui-stat-value">
            {dashboard?.totalTerritories ?? 0}
          </div>
          <div className="ui-stat-label">Active territories</div>
        </Card>
        <Card title="Team Members">
          <div className="ui-stat-value">
            {dashboard?.totalTeamMembers ?? 0}
          </div>
          <div className="ui-stat-label">Across all territories</div>
        </Card>
        <Card title="Active Plans">
          <div className="ui-stat-value">{dashboard?.activePlans ?? 0}</div>
          <div className="ui-stat-label">Territory plans in progress</div>
        </Card>
        <Card title="Named Accounts">
          <div className="ui-stat-value">{dashboard?.namedAccounts ?? 0}</div>
          <div className="ui-stat-label">Strategic accounts</div>
        </Card>
      </div>
      <div className="ui-grid-2">
        <Card title="Territory Plans" className="ui-card-full">
          <DataTable columns={planColumns} data={plans} />
          <div className="ui-card-actions">
            <Link
              href="/crm/territory-deep/plans/new"
              className="ui-btn ui-btn-primary ui-btn-sm"
            >
              <Plus size={14} /> Create Plan
            </Link>
          </div>
        </Card>
        <Card title="Quick Actions" className="ui-card-full">
          <div className="ui-flex-col" style={{ gap: "var(--space-3)" }}>
            <Link
              href="/crm/territory-deep/named-accounts"
              className="ui-btn ui-btn-outline ui-btn-block"
            >
              Manage Named Accounts
            </Link>
            <Link
              href="/crm/territory-deep/account-teams"
              className="ui-btn ui-btn-outline ui-btn-block"
            >
              Account Teams
            </Link>
            <Link
              href="/crm/analytics/territory-performance"
              className="ui-btn ui-btn-outline ui-btn-block"
            >
              View Performance Analytics
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
