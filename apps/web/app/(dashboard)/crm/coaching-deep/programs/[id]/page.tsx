"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Button, Spinner, Badge, useToast } from "@unerp/ui";
import { GraduationCap, UserPlus, ArrowLeft, CheckCircle } from "lucide-react";
import {
  apiGet,
  apiPost,
  ApiRequestError,
} from "../../../../../../src/lib/api";
import { useParams, useRouter } from "next/navigation";

interface ProgramAnalytics {
  programId: string;
  name: string;
  totalEnrolled: number;
  totalModules: number;
  modules: Array<{ name: string }>;
  status: string;
  programType: string;
}

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<ProgramAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollUserId, setEnrollUserId] = useState("");
  const [progressUserId, setProgressUserId] = useState("");
  const [progressData, setProgressData] = useState<any>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<ProgramAnalytics>(
        `/crm/coaching-deep/programs/${id}/analytics`,
      );
      setAnalytics(data);
    } catch (err) {
      toast.error(
        "Could not load program",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const enrollUser = async () => {
    try {
      await apiPost(`/crm/coaching-deep/programs/${id}/enroll`, {
        userId: enrollUserId,
      });
      toast.success("User enrolled");
      setEnrollUserId("");
      await load();
    } catch (err) {
      toast.error(
        "Failed to enroll",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  const checkProgress = async () => {
    try {
      const data = await apiGet(
        `/crm/coaching-deep/programs/${id}/progress/${progressUserId}`,
      );
      setProgressData(data);
    } catch (err) {
      toast.error(
        "Could not load progress",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  const completeModule = async (moduleName: string) => {
    try {
      await apiPost(`/crm/coaching-deep/programs/${id}/complete-module`, {
        userId: progressUserId,
        moduleName,
      });
      toast.success("Module completed");
      if (progressUserId) checkProgress();
    } catch (err) {
      toast.error(
        "Failed to complete module",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    }
  };

  if (loading)
    return (
      <div className="ui-page">
        <Spinner />
      </div>
    );
  if (!analytics)
    return (
      <div className="ui-page">
        <p>Program not found.</p>
      </div>
    );

  return (
    <div className="ui-page">
      <div style={{ marginBottom: "var(--space-2)" }}>
        <button
          className="ui-link"
          onClick={() => router.push("/crm/coaching-deep/programs")}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={16} /> Back to Programs
        </button>
      </div>
      <PageHeader
        title={analytics.name}
        description="Program detail and analytics"
      />
      <div className="ui-grid-3">
        <Card className="ui-card">
          <div className="ui-card-body">
            <strong>Type</strong>
            <br />
            <Badge variant="info">{analytics.programType}</Badge>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <strong>Status</strong>
            <br />
            <Badge
              variant={analytics.status === "ACTIVE" ? "success" : "warning"}
            >
              {analytics.status}
            </Badge>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <strong>Enrolled</strong>
            <br />
            <span style={{ fontSize: "1.5rem" }}>
              {analytics.totalEnrolled}
            </span>
          </div>
        </Card>
      </div>

      <Card className="ui-card" style={{ marginTop: "var(--space-4)" }}>
        <div className="ui-card-body">
          <h3>
            <UserPlus size={16} /> Enroll User
          </h3>
          <div className="ui-flex-row" style={{ gap: "var(--space-2)" }}>
            <input
              className="ui-input"
              placeholder="User ID"
              value={enrollUserId}
              onChange={(e) => setEnrollUserId(e.target.value)}
            />
            <Button onClick={enrollUser}>Enroll</Button>
          </div>
        </div>
      </Card>

      <Card className="ui-card" style={{ marginTop: "var(--space-4)" }}>
        <div className="ui-card-body">
          <h3>
            <GraduationCap size={16} /> Progress
          </h3>
          <div
            className="ui-flex-row"
            style={{ gap: "var(--space-2)", marginBottom: "var(--space-3)" }}
          >
            <input
              className="ui-input"
              placeholder="User ID"
              value={progressUserId}
              onChange={(e) => setProgressUserId(e.target.value)}
            />
            <Button onClick={checkProgress}>Check</Button>
          </div>
          {progressData && (
            <div>
              <p>Enrolled: {progressData.enrolled ? "Yes" : "No"}</p>
              <p>
                Progress: {progressData.progressPct}% (
                {progressData.completedCount}/{progressData.totalCount})
              </p>
              {progressData.modules?.map((m: any) => (
                <div
                  key={m.name}
                  className="ui-flex-row"
                  style={{
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: "var(--space-1) 0",
                  }}
                >
                  <span>{m.name}</span>
                  {m.completed ? (
                    <Badge variant="success">Completed</Badge>
                  ) : (
                    <Button size="sm" onClick={() => completeModule(m.name)}>
                      <CheckCircle size={14} /> Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
