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
import { Trophy, UserPlus, ArrowLeft } from "lucide-react";
import {
  apiGet,
  apiPost,
  ApiRequestError,
} from "../../../../../../src/lib/api";
import { useParams, useRouter } from "next/navigation";

interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  rank: number;
}

export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinUserId, setJoinUserId] = useState("");
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<LeaderboardEntry[]>(
        `/crm/gamification-deep/contests/${id}/leaderboard`,
      );
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Could not load leaderboard",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const joinContest = async () => {
    try {
      await apiPost(`/crm/gamification-deep/contests/${id}/join`, {
        userId: joinUserId,
      });
      toast.success("User enrolled");
      setJoinUserId("");
      await load();
    } catch (err) {
      toast.error(
        "Failed to join",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  const columns: Column<LeaderboardEntry>[] = [
    { key: "rank", header: "Rank", sortable: true },
    { key: "userName", header: "User", sortable: true },
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
        title="Contest Leaderboard"
        subtitle={
          <button
            className="ui-link"
            onClick={() => router.push("/crm/gamification-deep/contests")}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <ArrowLeft size={16} /> Back to Contests
          </button>
        }
      />
      <ProtectedComponent permission="crm.gamification-deep.contests.update">
        <div
          className="ui-flex-row"
          style={{ gap: "var(--space-2)", padding: "var(--space-4)" }}
        >
          <input
            className="ui-input"
            placeholder="User ID"
            value={joinUserId}
            onChange={(e) => setJoinUserId(e.target.value)}
          />
          <Button onClick={joinContest}>
            <UserPlus size={16} /> Enroll
          </Button>
        </div>
      </ProtectedComponent>
      <DataTable columns={columns} data={entries} />
    </div>
  );
}
