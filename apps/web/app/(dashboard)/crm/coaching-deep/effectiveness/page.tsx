"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  PageHeader,
  Spinner,
  Badge,
  useToast,
  DataTable,
  type Column,
} from "@unerp/ui";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { apiGet, ApiRequestError } from "../../../../../src/lib/api";
import { useRouter } from "next/navigation";

interface RepEffectiveness {
  repId: string;
  scorecardsReviewed: number;
  averageFirstScorePct: number;
  averageLastScorePct: number;
  improvement: number;
}

interface EffectivenessData {
  reps: RepEffectiveness[];
  overallImprovement: number;
  totalRepsAnalyzed: number;
}

export default function EffectivenessPage() {
  const router = useRouter();
  const [data, setData] = useState<EffectivenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiGet<EffectivenessData>(
        "/crm/coaching-deep/effectiveness",
      );
      setData(result);
    } catch (err) {
      toast.error(
        "Could not load effectiveness data",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<RepEffectiveness>[] = [
    { key: "repId", header: "Rep", sortable: true },
    { key: "scorecardsReviewed", header: "Scorecards", sortable: true },
    { key: "averageFirstScorePct", header: "First Avg %", sortable: true },
    { key: "averageLastScorePct", header: "Last Avg %", sortable: true },
    {
      key: "improvement",
      header: "Improvement",
      sortable: true,
      render: (r) => (
        <Badge variant={r.improvement >= 0 ? "success" : "danger"}>
          {r.improvement > 0 ? "+" : ""}
          {r.improvement}%
        </Badge>
      ),
    },
  ];

  if (loading)
    return (
      <div className="ui-page">
        <Spinner />
      </div>
    );

  return (
    <div className="ui-page">
      <PageHeader
        title="Coaching Effectiveness"
        subtitle={
          <button
            className="ui-link"
            onClick={() => router.push("/crm/coaching-deep")}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        }
      />
      <div className="ui-grid-3">
        <Card className="ui-card">
          <div className="ui-card-body">
            <strong>Overall Improvement</strong>
            <p
              style={{
                fontSize: "2rem",
                color:
                  (data?.overallImprovement ?? 0) >= 0
                    ? "var(--color-success)"
                    : "var(--color-danger)",
              }}
            >
              {(data?.overallImprovement ?? 0) >= 0 ? "+" : ""}
              {data?.overallImprovement ?? 0}%
            </p>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <strong>Reps Analyzed</strong>
            <p style={{ fontSize: "2rem" }}>{data?.totalRepsAnalyzed ?? 0}</p>
          </div>
        </Card>
      </div>
      <DataTable columns={columns} data={data?.reps ?? []} />
    </div>
  );
}
