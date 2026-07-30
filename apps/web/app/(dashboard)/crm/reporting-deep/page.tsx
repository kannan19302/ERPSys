// @ts-nocheck
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
import { Plus, FileText, Clock, Star, Layout, FolderOpen } from "lucide-react";
import { useApiClient } from "@unerp/framework";
import Link from "next/link";

export default function ReportingDeepDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const toast = useToast();
  const client = useApiClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, catRes] = await Promise.all([
        client.get<any>("/crm/reporting/dashboard"),
        client.get<any>("/crm/reporting/categories"),
      ]);
      setDashboard(dashRes);
      setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
    } catch {
      toast.error("Could not load reporting dashboard");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <Spinner />;

  return (
    <div className="ui-page">
      <PageHeader
        title="Advanced Reporting & Dashboards"
        description="Saved reports, scheduled exports, templates, and analytics"
        actions={
          <Link
            href="/crm/reporting-deep/reports/new"
            className="ui-btn ui-btn-primary"
          >
            <Plus size={16} /> New Report
          </Link>
        }
      />
      <div className="ui-grid-4" style={{ marginBottom: "var(--space-6)" }}>
        <Card title="Saved Reports">
          <div className="ui-stat-value">{dashboard?.totalReports ?? 0}</div>
          <div className="ui-stat-label">Custom reports</div>
        </Card>
        <Card title="System Reports">
          <div className="ui-stat-value">{dashboard?.systemReports ?? 0}</div>
          <div className="ui-stat-label">Pre-built templates</div>
        </Card>
        <Card title="Favorites">
          <div className="ui-stat-value">{dashboard?.favoriteReports ?? 0}</div>
          <div className="ui-stat-label">Starred reports</div>
        </Card>
        <Card title="Active Schedules">
          <div className="ui-stat-value">{dashboard?.totalSchedules ?? 0}</div>
          <div className="ui-stat-label">Automated exports</div>
        </Card>
      </div>
      <div className="ui-grid-2">
        <Card title="Report Categories" className="ui-card-full">
          <div className="ui-flex-col" style={{ gap: "var(--space-2)" }}>
            {categories.map((cat: any) => (
              <div
                key={cat.id}
                className="ui-flex"
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  <FolderOpen size={14} /> {cat.name}
                </span>
                <Badge>{cat._count?.reports ?? 0}</Badge>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="ui-text-muted">No categories defined</div>
            )}
          </div>
        </Card>
        <Card title="Quick Actions" className="ui-card-full">
          <div className="ui-flex-col" style={{ gap: "var(--space-3)" }}>
            <Link
              href="/crm/reporting-deep/reports"
              className="ui-btn ui-btn-outline ui-btn-block"
            >
              View All Reports
            </Link>
            <Link
              href="/crm/reporting-deep/reports"
              className="ui-btn ui-btn-outline ui-btn-block"
            >
              Browse System Reports
            </Link>
            <Link
              href="/crm/reporting-deep/dashboards/templates"
              className="ui-btn ui-btn-outline ui-btn-block"
            >
              Dashboard Templates
            </Link>
          </div>
        </Card>
      </div>
      {dashboard?.recentReports && dashboard.recentReports.length > 0 && (
        <Card
          title="Recently Used Reports"
          className="ui-card-full"
          style={{ marginTop: "var(--space-4)" }}
        >
          <DataTable<any>
            columns={[
              { key: "name", header: "Report Name" },
              { key: "type", header: "Type" },
              { key: "usageCount", header: "Times Used" },
              {
                key: "lastUsedAt",
                header: "Last Used",
                render: (v: string | null) =>
                  v ? new Date(v).toLocaleDateString() : "Never",
              },
              {
                key: "id",
                header: "",
                render: (_val: any, row: any) => (
                  <Link
                    href={`/crm/reporting-deep/reports/${row.id}`}
                    className="ui-btn ui-btn-sm ui-btn-ghost"
                  >
                    Open
                  </Link>
                ),
              },
            ]}
            data={dashboard.recentReports}
          />
        </Card>
      )}
    </div>
  );
}
