// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge } from "@unerp/ui";
import { Trophy, Award, Flame, Target } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function SalesGamificationPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const toast = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const data = await client.get<any>("/sales/gamification/leaderboard");
        setLeaderboardData(data);
      } catch (err) {
        toast.error(
          "Failed to load Sales Gamification leaderboard",
          err instanceof Error ? err.message : "Error",
        );
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  const leaderboards = leaderboardData?.leaderboards || [];

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Sales Gamification & Leaderboards"
        description="Real-time sales competitions, quota attainment, achievement badges, and deal streak tracking."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          margin: "24px 0",
        }}
      >
        <Card style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "14px", color: "#64748b" }}>
              Current Leader
            </span>
            <Trophy size={20} color="#f59e0b" />
          </div>
          <div
            style={{ fontSize: "24px", fontWeight: "bold", marginTop: "8px" }}
          >
            {leaderboards[0]?.name || "N/A"}
          </div>
          <span style={{ fontSize: "13px", color: "#10b981" }}>
            ${(leaderboards[0]?.score || 0).toLocaleString()} booked
          </span>
        </Card>
        <Card style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "14px", color: "#64748b" }}>
              Top Deal Streak
            </span>
            <Flame size={20} color="#ef4444" />
          </div>
          <div
            style={{ fontSize: "24px", fontWeight: "bold", marginTop: "8px" }}
          >
            {leaderboardData?.streakData?.streakCount || 0} Deals
          </div>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Rep: {leaderboardData?.streakData?.currentTopStreakRep}
          </span>
        </Card>
        <Card style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "14px", color: "#64748b" }}>
              Active Period
            </span>
            <Target size={20} color="#3b82f6" />
          </div>
          <div
            style={{ fontSize: "20px", fontWeight: "bold", marginTop: "8px" }}
          >
            {leaderboardData?.period || "Q3-2026"}
          </div>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Rep Rankings & Leaderboard
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
            >
              <th style={{ padding: "12px 16px" }}>Rank</th>
              <th style={{ padding: "12px 16px" }}>Sales Rep</th>
              <th style={{ padding: "12px 16px" }}>Total Score / Value</th>
              <th style={{ padding: "12px 16px" }}>Deals Closed</th>
              <th style={{ padding: "12px 16px" }}>Streak</th>
            </tr>
          </thead>
          <tbody>
            {leaderboards.map((rep: any) => (
              <tr
                key={rep.salesRepId}
                style={{ borderBottom: "1px solid #f1f5f9" }}
              >
                <td style={{ padding: "12px 16px", fontWeight: "bold" }}>
                  {rep.rank === 1
                    ? "🥇 #1"
                    : rep.rank === 2
                      ? "🥈 #2"
                      : rep.rank === 3
                        ? "🥉 #3"
                        : `#${rep.rank}`}
                </td>
                <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                  {rep.name}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    color: "#10b981",
                    fontWeight: 600,
                  }}
                >
                  ${(rep.score || 0).toLocaleString()}
                </td>
                <td style={{ padding: "12px 16px" }}>{rep.deals} deals</td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge variant="warning">🔥 {rep.streak} streak</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
