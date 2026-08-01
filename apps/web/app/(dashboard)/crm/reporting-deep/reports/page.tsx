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
import { Plus, Star, Trash2, Copy, Play, Download } from "lucide-react";
import { useApiClient } from "@unerp/framework";
import Link from "next/link";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [systemReports, setSystemReports] = useState<any[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const toast = useToast();
  const client = useApiClient();

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [repRes, sysRes] = await Promise.all([
        client.get<any>("/crm/reporting/reports"),
        client.get<any>("/crm/reporting/system"),
      ]);
      setReports(Array.isArray(repRes) ? repRes : []);
      setSystemReports(Array.isArray(sysRes?.data) ? sysRes.data : []);
    } catch {
      toast.error("Could not load reports");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/crm/reporting/reports/${id}`);
      toast.success("Report deleted");
      loadReports();
    } catch {
      toast.error("Failed to delete report");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await client.post(`/crm/reporting/reports/${id}/duplicate`);
      toast.success("Report duplicated");
      loadReports();
    } catch {
      toast.error("Failed to duplicate report");
    }
  };

  const handleFavorite = async (id: string, isFav: boolean) => {
    try {
      if (isFav) {
        await client.post(`/crm/reporting/reports/${id}/unfavorite`);
      } else {
        await client.post(`/crm/reporting/reports/${id}/favorite`);
      }
      loadReports();
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  const filtered = showFavorites
    ? reports.filter((r) => r.isFavorite)
    : reports;

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Report Name",
      render: (v: string, row: any) => (
        <Link
          href={`/crm/reporting-deep/reports/${row.id}`}
          className="ui-link"
        >
          {v}
        </Link>
      ),
    },
    { key: "type", header: "Type", render: (v: string) => <Badge>{v}</Badge> },
    { key: "module", header: "Module" },
    { key: "usageCount", header: "Usage" },
    {
      key: "updatedAt",
      header: "Updated",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: "id",
      header: "",
      render: (_: string, row: any) => (
        <div className="ui-flex" style={{ gap: "var(--space-1)" }}>
          <button
            className="ui-btn ui-btn-sm ui-btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleFavorite(row.id, row.isFavorite);
            }}
          >
            <Star size={14} fill={row.isFavorite ? "currentColor" : "none"} />
          </button>
          <button
            className="ui-btn ui-btn-sm ui-btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate(row.id);
            }}
          >
            <Copy size={14} />
          </button>
          <button
            className="ui-btn ui-btn-sm ui-btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <PageHeader
        title="Saved Reports"
        description={`${reports.length} reports · ${systemReports.length} system templates`}
        breadcrumbs={[
          { label: "Reporting", href: "/crm/reporting-deep" },
          { label: "Reports" },
        ]}
        actions={
          <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
            <Button
              variant={showFavorites ? "primary" : "outline"}
              onClick={() => setShowFavorites(!showFavorites)}
            >
              <Star size={16} /> {showFavorites ? "All Reports" : "Favorites"}
            </Button>
            <Link
              href="/crm/reporting-deep/reports/new"
              className="ui-btn ui-btn-primary"
            >
              <Plus size={16} /> New Report
            </Link>
          </div>
        }
      />
      <Card title="Custom Reports" className="ui-card-full">
        <DataTable columns={columns} data={filtered} />
      </Card>
      <Card
        title="System Reports"
        className="ui-card-full"
        style={{ marginTop: "var(--space-4)" }}
      >
        <DataTable
          columns={[
            { key: "name", header: "Report Name" },
            { key: "category", header: "Category" },
            { key: "type", header: "Type" },
          ]}
          data={systemReports}
        />
      </Card>
    </div>
  );
}
