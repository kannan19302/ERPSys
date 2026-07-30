// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  PageHeader,
  Spinner,
  useToast,
  DataTable,
  type Column,
} from "@unerp/ui";
import { TrendingUp } from "lucide-react";
import { apiGet, ApiRequestError } from "../../../../../src/lib/api";

interface LeaderboardRow {
  rank: number;
  userId: string;
  userName: string;
  dealsWon: number;
  revenue: number;
  score: number;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("ALL_TIME");
  const [metric, setMetric] = useState("points");
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<LeaderboardRow[]>(
        `/crm/gamification-deep/leaderboard?period=${encodeURIComponent(period)}&metric=${metric}`,
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Could not load leaderboard",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [period, metric, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<LeaderboardRow>[] = [
    { key: "rank", header: "Rank", sortable: true },
    { key: "userName", header: "User", sortable: true },
    { key: "dealsWon", header: "Deals Won", sortable: true },
    {
      key: "revenue",
      header: "Revenue",
      sortable: true,
      render: (r) => `$${Number(r.revenue).toLocaleString()}`,
    },
    {
      key: "score",
      header: "Score",
      sortable: true,
      render: (r) => Number(r.score).toLocaleString(),
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
        title="Leaderboard"
        description="Current standings across periods and metrics"
      />
      <div
        className="ui-flex-row"
        style={{ gap: "var(--space-2)", padding: "var(--space-4)" }}
      >
        <select
          className="ui-input"
          style={{ width: "auto" }}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="ALL_TIME">All Time</option>
          <option value="2026">2026</option>
          <option value="2026-Q1">Q1 2026</option>
          <option value="2026-Q2">Q2 2026</option>
          <option value="2026-07">July 2026</option>
        </select>
        <select
          className="ui-input"
          style={{ width: "auto" }}
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
        >
          <option value="points">Points</option>
          <option value="revenue">Revenue</option>
          <option value="deals">Deals Won</option>
        </select>
      </div>
      <DataTable columns={columns} data={rows} />
    </div>
  );
}
