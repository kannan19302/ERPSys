// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Spinner, Badge, useToast } from "@unerp/ui";
import { Lightbulb, ArrowLeft } from "lucide-react";
import { apiGet, ApiRequestError } from "../../../../../../src/lib/api";
import { useParams, useRouter } from "next/navigation";

interface Recommendation {
  repId: string;
  weakAreas: string[];
  recommendations: Array<{ id: string; name: string; programType: string }>;
  scorecardsReviewed: number;
}

interface Action {
  priority: string;
  action: string;
  reason: string;
}

export default function RecommendationsPage() {
  const { repId } = useParams<{ repId: string }>();
  const router = useRouter();
  const [recs, setRecs] = useState<Recommendation | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([
        apiGet<Recommendation>(`/crm/coaching-deep/recommendations/${repId}`),
        apiGet<Action[]>(`/crm/coaching-deep/recommended-actions/${repId}`),
      ]);
      setRecs(r);
      setActions(Array.isArray(a) ? a : []);
    } catch (err) {
      toast.error(
        "Could not load recommendations",
        err instanceof ApiRequestError ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [repId, toast]);

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
      <div style={{ marginBottom: "var(--space-2)" }}>
        <button
          className="ui-link"
          onClick={() => router.push("/crm/coaching-deep")}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>
      <PageHeader
        title={`Coaching for ${repId}`}
        description="Personalized coaching recommendations and actions"
      />
      <div className="ui-grid-2">
        <Card className="ui-card">
          <div className="ui-card-body">
            <h3>
              <Lightbulb size={20} /> Recommendations
            </h3>
            {recs && (
              <>
                <p>Scorecards Reviewed: {recs.scorecardsReviewed}</p>
                {recs.weakAreas.length > 0 && (
                  <div style={{ margin: "var(--space-3) 0" }}>
                    <strong>Weak Areas:</strong>
                    {recs.weakAreas.map((w) => (
                      <div key={w}>
                        <Badge variant="warning">{w}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                {recs.recommendations.map((p) => (
                  <div
                    key={p.id}
                    className="ui-flex-row"
                    style={{
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                    }}
                  >
                    <span>{p.name}</span>
                    <Badge variant="info">{p.programType}</Badge>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-card-body">
            <h3>
              <Lightbulb size={20} /> Recommended Actions
            </h3>
            {actions.map((a, idx) => (
              <div
                key={idx}
                className="ui-card"
                style={{
                  margin: "var(--space-2) 0",
                  padding: "var(--space-2)",
                }}
              >
                <div
                  className="ui-flex-row"
                  style={{ justifyContent: "space-between" }}
                >
                  <Badge
                    variant={
                      a.priority === "HIGH"
                        ? "danger"
                        : a.priority === "MEDIUM"
                          ? "warning"
                          : "info"
                    }
                  >
                    {a.priority}
                  </Badge>
                  <strong>{a.action.replace(/_/g, " ")}</strong>
                </div>
                <p style={{ fontSize: "0.85rem", marginTop: "var(--space-1)" }}>
                  {a.reason}
                </p>
              </div>
            ))}
            {actions.length === 0 && <p>No actions recommended.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
