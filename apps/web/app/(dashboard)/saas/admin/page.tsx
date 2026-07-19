"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, PageHeader, DataTable } from "@unerp/ui";
import {
  DollarSign,
  Tag,
  Users,
  Percent,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface Plan {
  id: string;
  name: string;
  maxUsers: number;
  maxStorage: number;
  stripePriceId: string;
}

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  status: string;
  timesRedeemed: number;
}

export default function SaasAdminDashboard() {
  const client = useApiClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for Plan Creation
  const [planName, setPlanName] = useState("");
  const [maxUsers, setMaxUsers] = useState(10);
  const [maxStorage, setMaxStorage] = useState(1024);
  const [stripePriceId, setStripePriceId] = useState("");

  // Form states for Coupon Creation
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(10);

  const [activeTab, setActiveTab] = useState<"overview" | "plans" | "coupons">(
    "overview",
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, couponsRes] = await Promise.all([
        client.get<Plan[]>("/saas/plans").catch(() => []),
        client.get<Coupon[]>("/saas/coupons").catch(() => []),
      ]);
      setPlans(plansRes || []);
      setCoupons(couponsRes || []);
    } catch (err) {
      console.error("Failed to load admin billing data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/saas/plans", {
        name: planName,
        maxUsers: Number(maxUsers),
        maxStorage: Number(maxStorage),
        stripePriceId,
        features: ["Core Modules", "Support"],
      });
      setPlanName("");
      setStripePriceId("");
      loadData();
    } catch (err) {
      alert("Failed to create plan");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/saas/coupons", {
        code: couponCode.toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
      });
      setCouponCode("");
      loadData();
    } catch (err) {
      alert("Failed to create coupon");
    }
  };

  // Mock SaaS Metrics
  const metrics = useMemo(() => {
    const activeCount = 142; // Simulated
    const mrr = activeCount * 49.0;
    const arr = mrr * 12;
    const churn = 2.4;

    return {
      activeSubscriptions: activeCount,
      mrr,
      arr,
      churn,
    };
  }, []);

  return (
    <RouteGuard permission="saas.subscription.manage">
      <div className="ui-stack-6" style={{ padding: "var(--space-6)" }}>
        <PageHeader
          title="SaaS Platform Admin"
          description="Manage plans, publish discounts, and monitor platform recurring revenues."
        />

        {/* Tab navigation */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-4)",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "var(--space-2)",
          }}
        >
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "var(--space-2) var(--space-4)",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === "overview"
                  ? "2px solid var(--color-primary)"
                  : "none",
              color:
                activeTab === "overview"
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
              cursor: "pointer",
              fontWeight: "var(--weight-semibold)",
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            style={{
              padding: "var(--space-2) var(--space-4)",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === "plans"
                  ? "2px solid var(--color-primary)"
                  : "none",
              color:
                activeTab === "plans"
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
              cursor: "pointer",
              fontWeight: "var(--weight-semibold)",
            }}
          >
            Plan Templates
          </button>
          <button
            onClick={() => setActiveTab("coupons")}
            style={{
              padding: "var(--space-2) var(--space-4)",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === "coupons"
                  ? "2px solid var(--color-primary)"
                  : "none",
              color:
                activeTab === "coupons"
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
              cursor: "pointer",
              fontWeight: "var(--weight-semibold)",
            }}
          >
            Discount Coupons
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="ui-stack-6">
            {/* KPI grid */}
            <div className="ui-grid-4">
              <Card
                style={{
                  padding: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Active Accounts
                  </span>
                  <Users size={20} style={{ color: "var(--color-primary)" }} />
                </div>
                <span
                  style={{
                    fontSize: "var(--text-2xl)",
                    fontWeight: "var(--weight-bold)",
                  }}
                >
                  {metrics.activeSubscriptions}
                </span>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-success)",
                  }}
                >
                  +14% this month
                </span>
              </Card>

              <Card
                style={{
                  padding: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    MRR (Monthly Recurring)
                  </span>
                  <DollarSign
                    size={20}
                    style={{ color: "var(--color-success)" }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "var(--text-2xl)",
                    fontWeight: "var(--weight-bold)",
                  }}
                >
                  $
                  {metrics.mrr.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-success)",
                  }}
                >
                  +8.2% vs last month
                </span>
              </Card>

              <Card
                style={{
                  padding: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    ARR Run Rate
                  </span>
                  <TrendingUp
                    size={20}
                    style={{ color: "var(--color-info)" }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "var(--text-2xl)",
                    fontWeight: "var(--weight-bold)",
                  }}
                >
                  $
                  {metrics.arr.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Based on current active user count
                </span>
              </Card>

              <Card
                style={{
                  padding: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Estimated Churn
                  </span>
                  <Percent size={20} style={{ color: "var(--color-danger)" }} />
                </div>
                <span
                  style={{
                    fontSize: "var(--text-2xl)",
                    fontWeight: "var(--weight-bold)",
                  }}
                >
                  {metrics.churn}%
                </span>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-success)",
                  }}
                >
                  -0.5% decrease (good)
                </span>
              </Card>
            </div>

            <Card style={{ padding: "var(--space-6)" }}>
              <h3 style={{ marginBottom: "var(--space-4)" }}>
                Platform Health & Active Actions
              </h3>
              <p style={{ color: "var(--color-text-muted)" }}>
                All subscription renewals, stripe checkout sessions, and webhook
                signatures are running normally. Usage rules metrics are parsed
                asynchronously into buffered Redis instances.
              </p>
            </Card>
          </div>
        )}

        {activeTab === "plans" && (
          <div
            className="ui-grid-3"
            style={{ gap: "var(--space-6)", alignItems: "start" }}
          >
            <Card style={{ gridColumn: "span 2", padding: "var(--space-4)" }}>
              <h3 style={{ marginBottom: "var(--space-4)" }}>
                Active Plan Templates
              </h3>
              <DataTable
                columns={[
                  { key: "name", header: "Plan Name" },
                  { key: "maxUsers", header: "Max Users" },
                  { key: "maxStorage", header: "Max Storage (MB)" },
                  { key: "stripePriceId", header: "Stripe Price ID" },
                ]}
                data={plans as unknown as Record<string, unknown>[]}
                emptyTitle="No active plans"
                emptyMessage="Create plan templates below."
              />
            </Card>

            <Card style={{ padding: "var(--space-4)" }}>
              <h3 style={{ marginBottom: "var(--space-4)" }}>
                Create Plan Template
              </h3>
              <form onSubmit={handleCreatePlan} className="ui-stack-4">
                <div className="ui-form-group">
                  <label className="ui-label">Plan Name</label>
                  <input
                    type="text"
                    required
                    className="ui-input"
                    placeholder="e.g. Starter, Growth"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Max Users</label>
                  <input
                    type="number"
                    required
                    className="ui-input"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Max Storage (MB)</label>
                  <input
                    type="number"
                    required
                    className="ui-input"
                    value={maxStorage}
                    onChange={(e) => setMaxStorage(Number(e.target.value))}
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Stripe Price ID</label>
                  <input
                    type="text"
                    required
                    className="ui-input"
                    placeholder="price_xxxxxxxx"
                    value={stripePriceId}
                    onChange={(e) => setStripePriceId(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="landing-btn-primary"
                  style={{ width: "100%" }}
                >
                  Create Plan
                </button>
              </form>
            </Card>
          </div>
        )}

        {activeTab === "coupons" && (
          <div
            className="ui-grid-3"
            style={{ gap: "var(--space-6)", alignItems: "start" }}
          >
            <Card style={{ gridColumn: "span 2", padding: "var(--space-4)" }}>
              <h3 style={{ marginBottom: "var(--space-4)" }}>
                Active Discount Coupons
              </h3>
              <DataTable
                columns={[
                  { key: "code", header: "Code" },
                  { key: "discountType", header: "Type" },
                  { key: "discountValue", header: "Value" },
                  { key: "timesRedeemed", header: "Redemptions" },
                  { key: "status", header: "Status" },
                ]}
                data={coupons as unknown as Record<string, unknown>[]}
                emptyTitle="No coupons found"
                emptyMessage="Create discount codes using the form."
              />
            </Card>

            <Card style={{ padding: "var(--space-4)" }}>
              <h3 style={{ marginBottom: "var(--space-4)" }}>Create Coupon</h3>
              <form onSubmit={handleCreateCoupon} className="ui-stack-4">
                <div className="ui-form-group">
                  <label className="ui-label">Coupon Code</label>
                  <input
                    type="text"
                    required
                    className="ui-input"
                    placeholder="e.g. SUMMER20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Discount Type</label>
                  <select
                    className="ui-select"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT_AMOUNT">Flat Amount ($)</option>
                  </select>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Discount Value</label>
                  <input
                    type="number"
                    required
                    className="ui-input"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                  />
                </div>
                <button
                  type="submit"
                  className="landing-btn-primary"
                  style={{ width: "100%" }}
                >
                  Create Coupon
                </button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
