// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Spinner, Badge, useToast } from "@unerp/ui";
import { Award, Flame, Trophy, ArrowLeft } from "lucide-react";
import { apiGet, ApiRequestError } from "../../../../../../src/lib/api";
import { useParams, useRouter } from "next/navigation";

interface AchievementData {
  badges: Array<{
    id: string;
    badge: { name: string; icon: string; description: string | null };
    awardedAt: string;
  }>;
  streaks: Array<{
    streakType: string;
    currentStreak: number;
    bestStreak: number;
  }>;
  leaderboardHistory: Array<{ period: string; rank: number; points: number }>;
}

export default function AchievementsPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [data, setData] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiGet<AchievementData>(
        `/crm/gamification-deep/achievements/${userId}`,
      );
      setData(result);
    } catch (err) {
      toast.error(
        "Could not load achievements",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <div className="ui-page">
        <Spinner />
      </div>
    );
  if (!data)
    return (
      <div className="ui-page">
        <p>No achievement data found.</p>
      </div>
    );

  return (
    <div className="ui-page">
      <PageHeader
        title="User Achievements"
        description="View and manage user badges, streaks, and leaderboard history"
        actions={
          <button
            className="ui-link"
            onClick={() => router.push("/crm/gamification-deep")}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        }
      />
      <div className="ui-grid-3">
        <Card className="ui-card">
          <div className="ui-card-body">
            <h3>
              <Award size={20} /> Badges ({data.badges.length})
            </h3>
            {data.badges.length === 0 ? (
              <p>No badges earned yet.</p>
            ) : (
              data.badges.map((b) => (
                <div
                  key={b.id}
                  className="ui-flex-row"
                  style={{
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: "var(--space-2) 0",
                  }}
                >
                  <span>{b.badge.name}</span>
                  <Badge variant="success">
                    {new Date(b.awardedAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <h3>
              <Flame size={20} /> Streaks
            </h3>
            {data.streaks.length === 0 ? (
              <p>No streaks yet.</p>
            ) : (
              data.streaks.map((s) => (
                <div
                  key={s.streakType}
                  className="ui-flex-row"
                  style={{
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                  }}
                >
                  <span>{s.streakType}</span>
                  <span>
                    Current: {s.currentStreak} | Best: {s.bestStreak}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <h3>
              <Trophy size={20} /> Leaderboard History
            </h3>
            {data.leaderboardHistory.length === 0 ? (
              <p>No leaderboard history.</p>
            ) : (
              data.leaderboardHistory.map((h) => (
                <div
                  key={h.period}
                  className="ui-flex-row"
                  style={{
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                  }}
                >
                  <span>{h.period}</span>
                  <span>
                    Rank #{h.rank} ({h.points} pts)
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
