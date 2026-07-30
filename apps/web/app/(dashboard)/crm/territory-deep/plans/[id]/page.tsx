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
import { ArrowLeft, RefreshCw, Eye, Activity } from "lucide-react";
import { useApiClient } from "@unerp/framework";
import { useParams, useRouter } from "next/navigation";

export default function TerritoryPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const toast = useToast();
  const client = useApiClient();

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const [planRes, histRes] = await Promise.all([
        client.get<any>(`/crm/territory-deep/plans/${id}`),
        client.get<any>(`/crm/territory-deep/plans/${id}/history`),
      ]);
      setPlan(planRes);
      setHistory(histRes);
    } catch {
      toast.error("Could not load territory plan");
    } finally {
      setLoading(false);
    }
  }, [id, client]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleRebalance = async () => {
    try {
      const result = await client.post(
        `/crm/territory-deep/plans/${id}/rebalance`,
      );
      toast.success("Territory rebalanced", `Assignments redistributed`);
      loadPlan();
    } catch {
      toast.error("Rebalance failed");
    }
  };

  const handlePreviewRebalance = async () => {
    try {
      const result = await client.post(
        `/crm/territory-deep/plans/${id}/preview-rebalance`,
      );
      toast.info("Preview ready", `Proposed changes calculated`);
    } catch {
      toast.error("Preview failed");
    }
  };

  if (loading) return <Spinner />;
  if (!plan) return <div className="ui-empty">Plan not found</div>;

  const assignmentCols: Column<any>[] = [
    { key: "userId", header: "User" },
    { key: "territoryId", header: "Territory" },
    {
      key: "allocation",
      header: "Allocation %",
      render: (v: number) => `${v}%`,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: "endDate",
      header: "End Date",
      render: (v: string | null) =>
        v ? new Date(v).toLocaleDateString() : "—",
    },
  ];

  return (
    <div className="ui-page">
      <PageHeader
        title={plan.name}
        description={`Fiscal Year: ${plan.fiscalYear}`}
        breadcrumbs={[
          { label: "Territory Management", href: "/crm/territory-deep" },
          { label: plan.name },
        ]}
        actions={
          <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
            <Button variant="outline" onClick={handlePreviewRebalance}>
              <Eye size={16} /> Preview Rebalance
            </Button>
            <Button variant="outline" onClick={handleRebalance}>
              <RefreshCw size={16} /> Rebalance
            </Button>
          </div>
        }
      />
      <div className="ui-grid-3" style={{ marginBottom: "var(--space-4)" }}>
        <Card title="Status">
          <Badge variant={plan.status === "ACTIVE" ? "success" : "default"}>
            {plan.status}
          </Badge>
        </Card>
        <Card title="Assignments">
          <div className="ui-stat-value">{plan.assignments?.length ?? 0}</div>
        </Card>
        <Card title="Fiscal Year">
          <div className="ui-stat-value">{plan.fiscalYear}</div>
        </Card>
      </div>
      <Card title="Assignments" className="ui-card-full">
        <DataTable columns={assignmentCols} data={plan.assignments || []} />
      </Card>
      {history && (
        <Card
          title="Assignment History"
          className="ui-card-full"
          style={{ marginTop: "var(--space-4)" }}
        >
          {Array.isArray(history.logs) && history.logs.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: "createdAt",
                  header: "Date",
                  render: (v: string) => new Date(v).toLocaleString(),
                },
                { key: "strategy", header: "Strategy" },
                { key: "summary", header: "Summary" },
              ]}
              data={history.logs}
            />
          ) : (
            <div className="ui-empty">No rebalance history yet</div>
          )}
        </Card>
      )}
    </div>
  );
}
