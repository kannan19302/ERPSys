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
  ProtectedComponent,
  type Column,
} from "@unerp/ui";
import { Trophy, Target, Award, Flame, TrendingUp, Users } from "lucide-react";
import { apiGet, ApiRequestError } from "../../../../src/lib/api";
import styles from "../gamification/page.module.css";
import Link from "next/link";

interface DashboardKPIs {
  activeGoals: number;
  activeContests: number;
  totalContestEntries: number;
  topStreaks: Array<{
    userId: string;
    streakType: string;
    currentStreak: number;
    bestStreak: number;
  }>;
  totalBadges: number;
  awardedBadges: number;
  topLeaderboardUsers: Array<{ userId: string; rank: number; points: number }>;
}

export default function GamificationDeepPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<DashboardKPIs>(
        "/crm/gamification-deep/dashboard",
      );
      setKpis(data);
    } catch (err) {
      toast.error(
        "Could not load gamification dashboard",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <div className="ui-page">
        <Spinner />
      </div>
    );

  return (
    <div className="ui-page">
      <PageHeader
        title="Gamification Deepening"
        description="Team goals, contests, achievements & streaks"
      />
      <div className="ui-grid-3">
        <Card className="ui-card">
          <div className="ui-card-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
              }}
            >
              <Target size={28} />
              <div>
                <strong>Active Goals</strong>
                <br />
                <span style={{ fontSize: "1.5rem" }}>
                  {kpis?.activeGoals ?? 0}
                </span>
              </div>
            </div>
            <Link href="/crm/gamification-deep/goals" className="ui-link">
              View Goals →
            </Link>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
              }}
            >
              <Trophy size={28} />
              <div>
                <strong>Active Contests</strong>
                <br />
                <span style={{ fontSize: "1.5rem" }}>
                  {kpis?.activeContests ?? 0}
                </span>
              </div>
            </div>
            <Link href="/crm/gamification-deep/contests" className="ui-link">
              View Contests →
            </Link>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
              }}
            >
              <Users size={28} />
              <div>
                <strong>Contest Entries</strong>
                <br />
                <span style={{ fontSize: "1.5rem" }}>
                  {kpis?.totalContestEntries ?? 0}
                </span>
              </div>
            </div>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
              }}
            >
              <Award size={28} />
              <div>
                <strong>Badges</strong>
                <br />
                <span style={{ fontSize: "1.5rem" }}>
                  {kpis?.totalBadges ?? 0} active / {kpis?.awardedBadges ?? 0}{" "}
                  awarded
                </span>
              </div>
            </div>
            <Link
              href="/crm/gamification-deep/achievements"
              className="ui-link"
            >
              View Achievements →
            </Link>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
              }}
            >
              <Flame size={28} />
              <div>
                <strong>Top Streaks</strong>
                <br />
                <span style={{ fontSize: "1.5rem" }}>
                  {kpis?.topStreaks.length ?? 0} active
                </span>
              </div>
            </div>
            <Link href="/crm/gamification-deep/streaks" className="ui-link">
              View Streaks →
            </Link>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
              }}
            >
              <TrendingUp size={28} />
              <div>
                <strong>Leaderboard</strong>
                <br />
                <span style={{ fontSize: "1.5rem" }}>
                  Top {kpis?.topLeaderboardUsers.length ?? 0} reps
                </span>
              </div>
            </div>
            <Link href="/crm/gamification-deep/leaderboard" className="ui-link">
              View Leaderboard →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
