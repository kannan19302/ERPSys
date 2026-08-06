"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";

export default function SalesPlaybooksPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [activeStage, setActiveStage] = useState<string>("QUALIFICATION");
  const toast = useToast();

  const stages = [
    "PROSPECTING",
    "QUALIFICATION",
    "PROPOSAL",
    "NEGOTIATION",
    "CLOSING",
  ];

  const loadPlaybooks = async (stage: string) => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        `/sales/playbooks-deep?stage=${stage}`,
      );
      setPlaybooks(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Sales Playbooks",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaybooks(activeStage);
  }, [activeStage]);

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Guided Sales Playbooks"
        description="Standardized sales execution steps, battlecards, and objection handling per deal stage."
      />

      <div
        style={{
          display: "flex",
          gap: "8px",
          margin: "20px 0",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "8px",
        }}
      >
        {stages.map((stg) => (
          <button
            key={stg}
            onClick={() => setActiveStage(stg)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor:
                activeStage === stg
                  ? "var(--color-primary)"
                  : "var(--color-bg-hover)",
              color:
                activeStage === stg
                  ? "var(--color-text-inverse)"
                  : "var(--color-text-secondary)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {stg}
          </button>
        ))}
      </div>

      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "60px" }}
        >
          <Spinner size="lg" />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
          {playbooks.length === 0 ? (
            <Card
              style={{
                padding: "32px",
                textAlign: "center",
                gridColumn: "1 / -1",
                color: "var(--color-text-secondary)",
              }}
            >
              No playbooks configured for stage <strong>{activeStage}</strong>.
            </Card>
          ) : (
            playbooks.map((pb) => (
              <Card key={pb.id} style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                    {pb.title}
                  </h3>
                  <Badge variant="info">{pb.targetRole || "All Reps"}</Badge>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-text-secondary)",
                    marginBottom: "16px",
                  }}
                >
                  {pb.description || "Guided playbook"}
                </p>
                <div
                  style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}
                >
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-border-strong)",
                      marginBottom: "8px",
                    }}
                  >
                    Required Steps:
                  </h4>
                  <ul
                    style={{
                      paddingLeft: "20px",
                      margin: 0,
                      fontSize: "13px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {pb.steps?.map((step: any) => (
                      <li key={step.id} style={{ marginBottom: "6px" }}>
                        <strong>{step.title}</strong>: {step.instruction}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
