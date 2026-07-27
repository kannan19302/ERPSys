"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { CheckCircle2, Circle, Rocket, ShieldCheck } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function OnboardingPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<any>(null);
  const toast = useToast();

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const data = await client.get<any>(
        "/saas/onboarding-flow-deep/checklist",
      );
      setChecklist(data);
    } catch (err) {
      toast.error(
        "Failed to load Tenant Onboarding checklist",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecklist();
  }, []);

  const handleCompleteStep = async (stepId: string) => {
    try {
      await client.post(
        `/saas/onboarding-flow-deep/checklist/${stepId}/complete`,
        {},
      );
      toast.success("Step Completed", "Onboarding step marked as completed");
      loadChecklist();
    } catch (err) {
      toast.error(
        "Failed to update step",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

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

  const steps = checklist?.steps || [];

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Tenant Onboarding & Launch Checklist"
        description="Guided setup wizard for new enterprise tenants, domain setup, RBAC configuration, and data import."
      />

      <Card
        style={{
          padding: "24px",
          margin: "24px 0",
          borderLeft: "4px solid #10b981",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
              Overall Onboarding Readiness
            </h3>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Complete all required tasks to finalize production deployment.
            </p>
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "bold", color: "#10b981" }}
          >
            {checklist?.overallProgressPct || 0}%
          </div>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Onboarding Milestones
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {steps.map((step: any) => (
            <div
              key={step.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: step.isCompleted ? "#f0fdf4" : "#fff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {step.isCompleted ? (
                  <CheckCircle2 size={22} color="#10b981" />
                ) : (
                  <Circle size={22} color="#94a3b8" />
                )}
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    {step.title}
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Category: {step.category}
                  </span>
                </div>
              </div>
              {!step.isCompleted && (
                <Button size="sm" onClick={() => handleCompleteStep(step.id)}>
                  Mark Complete
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
