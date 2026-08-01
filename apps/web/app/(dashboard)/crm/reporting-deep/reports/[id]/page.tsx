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
import { Play, Download, Copy, Star, Clock, ArrowLeft } from "lucide-react";
import { useApiClient } from "@unerp/framework";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const toast = useToast();
  const client = useApiClient();

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<any>(`/crm/reporting/reports/${id}`);
      setReport(res);
    } catch {
      toast.error("Could not load report");
    } finally {
      setLoading(false);
    }
  }, [id, client]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const res = await client.post<any>(
        `/crm/reporting/reports/${id}/execute`,
      );
      setResult(res);
      toast.success("Report executed");
    } catch {
      toast.error("Could not execute report");
    } finally {
      setExecuting(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const res = await client.post<any>(
        `/crm/reporting/reports/${id}/export?format=${format}`,
      );
      toast.success(`Report exported as ${format}`);
    } catch {
      toast.error("Export failed");
    }
  };

  if (loading) return <Spinner />;
  if (!report) return <div className="ui-empty">Report not found</div>;

  const resultCols: Column<any>[] =
    result?.data && result.data.length > 0
      ? Object.keys(result.data[0]).map((k) => ({ key: k, header: k }))
      : [];

  return (
    <div className="ui-page">
      <PageHeader
        title={report.name}
        description={
          report.description ||
          `${report.type} report · ${report.module} module`
        }
        breadcrumbs={[
          { label: "Reporting", href: "/crm/reporting-deep" },
          { label: "Reports", href: "/crm/reporting-deep/reports" },
          { label: report.name },
        ]}
        actions={
          <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download size={16} /> CSV
            </Button>
            <Link
              href={`/crm/reporting-deep/reports/${id}/schedules`}
              className="ui-btn ui-btn-outline"
            >
              <Clock size={16} /> Schedules
            </Link>
            <Button onClick={handleExecute} disabled={executing}>
              <Play size={16} /> {executing ? "Running..." : "Run Report"}
            </Button>
          </div>
        }
      />
      <div className="ui-grid-3" style={{ marginBottom: "var(--space-4)" }}>
        <Card title="Type">
          <Badge>{report.type}</Badge>
        </Card>
        <Card title="Module">
          <Badge>{report.module}</Badge>
        </Card>
        <Card title="Usage">
          <span className="ui-stat-value-sm">{report.usageCount ?? 0}</span>{" "}
          times
        </Card>
      </div>
      {report.category && (
        <Card
          title="Category"
          className="ui-card-sm"
          style={{ marginBottom: "var(--space-3)" }}
        >
          {report.category.name}
        </Card>
      )}
      <Card
        title="Report Configuration"
        className="ui-card-full"
        style={{ marginBottom: "var(--space-3)" }}
      >
        <pre className="ui-code-block">
          {JSON.stringify(report.config, null, 2)}
        </pre>
      </Card>
      {result && (
        <Card
          title={`Results (${result.data?.length ?? 0} rows)`}
          className="ui-card-full"
        >
          {result.data && result.data.length > 0 ? (
            <DataTable columns={resultCols} data={result.data} />
          ) : (
            <div className="ui-empty">No data returned</div>
          )}
        </Card>
      )}
    </div>
  );
}
