"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Spinner, useToast } from "@unerp/ui";
import { Flame, ArrowLeft } from "lucide-react";
import { apiGet, ApiRequestError } from "../../../../../../src/lib/api";
import { useParams, useRouter } from "next/navigation";

interface StreakData {
  userId: string;
  activity: { current: number; best: number };
  deals: { current: number; best: number };
}

export default function StreaksPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiGet<StreakData>(
        `/crm/gamification-deep/streaks/${userId}`,
      );
      setData(result);
    } catch (err) {
      toast.error(
        "Could not load streaks",
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
        <p>No streak data found.</p>
      </div>
    );

  return (
    <div className="ui-page">
      <PageHeader
        title="Streak Data"
        subtitle={
          <button
            className="ui-link"
            onClick={() => router.push("/crm/gamification-deep")}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        }
      />
      <div className="ui-grid-2">
        <Card className="ui-card">
          <div className="ui-card-body">
            <h3>
              <Flame size={20} /> Activity Streak
            </h3>
            <p style={{ fontSize: "2rem" }}>{data.activity.current} days</p>
            <p>Best: {data.activity.best} days</p>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <h3>
              <Flame size={20} /> Deals Won Streak
            </h3>
            <p style={{ fontSize: "2rem" }}>{data.deals.current} days</p>
            <p>Best: {data.deals.best} days</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
