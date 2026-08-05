"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { ShieldCheck, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function CustomerSuccessPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    customerId: "",
    name: "",
    arr: 0,
    nrrTarget: 100,
    churnRiskLevel: "LOW",
  });
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, metricsData] = await Promise.all([
        client.get<any[]>("/sales/customer-success"),
        client.get<any>("/sales/customer-success/metrics"),
      ]);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setMetrics(metricsData);
    } catch (err) {
      toast.error(
        "Failed to load Customer Success dashboard",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePlan = async () => {
    try {
      if (!newPlan.name || !newPlan.customerId) {
        toast.error(
          "Validation Error",
          "Customer ID and Plan Name are required",
        );
        return;
      }
      await client.post("/sales/customer-success", newPlan);
      toast.success("Success", "Customer Success plan created");
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(
        "Failed to create plan",
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

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Customer Success & Retention Hub"
        description="Monitor account health, retention goals, NRR metrics, and risk alerts."
        actions={
          <Button onClick={() => setShowModal(true)}>+ New CS Plan</Button>
        }
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
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              Total Active Plans
            </span>
            <Users size={20} color="var(--color-primary)" />
          </div>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "8px" }}
          >
            {metrics?.activePlans ?? 0}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              At-Risk Accounts
            </span>
            <AlertTriangle size={20} color="var(--chart-4)" />
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "var(--chart-4)",
              marginTop: "8px",
            }}
          >
            {metrics?.atRiskPlans ?? 0}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              Avg Health Score
            </span>
            <ShieldCheck size={20} color="var(--chart-9)" />
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "var(--chart-9)",
              marginTop: "8px",
            }}
          >
            {metrics?.avgHealthScore ?? 100}%
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              Total Portfolio ARR
            </span>
            <TrendingUp size={20} color="var(--chart-5)" />
          </div>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "8px" }}
          >
            ${(metrics?.totalArr ?? 0).toLocaleString()}
          </div>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Customer Success Plans
        </h3>
        {plans.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No active customer success plans. Click "+ New CS Plan" to create
            one.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px 16px" }}>Plan Name</th>
                <th style={{ padding: "12px 16px" }}>Customer ID</th>
                <th style={{ padding: "12px 16px" }}>Health Score</th>
                <th style={{ padding: "12px 16px" }}>Risk Level</th>
                <th style={{ padding: "12px 16px" }}>ARR</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                    {p.name}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {p.customerId}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      variant={
                        p.healthScore >= 80
                          ? "success"
                          : p.healthScore >= 50
                            ? "warning"
                            : "danger"
                      }
                    >
                      {p.healthScore}/100
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      variant={
                        p.churnRiskLevel === "LOW"
                          ? "success"
                          : p.churnRiskLevel === "MEDIUM"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {p.churnRiskLevel}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    ${Number(p.arr || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-text-inverse)",
              borderRadius: "8px",
              padding: "24px",
              width: "480px",
              maxWidth: "90vw",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0" }}>
              Create Customer Success Plan
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Customer ID *
                </label>
                <input
                  type="text"
                  placeholder="cust-101"
                  value={newPlan.customerId}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, customerId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    marginTop: "4px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Plan Name *
                </label>
                <input
                  type="text"
                  placeholder="Enterprise Growth & Adoption"
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    marginTop: "4px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  ARR ($)
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  value={newPlan.arr}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, arr: Number(e.target.value) })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    marginTop: "4px",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "20px",
              }}
            >
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlan}>Create Plan</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
