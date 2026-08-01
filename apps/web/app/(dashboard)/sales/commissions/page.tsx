"use client";

import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  DataTable,
  Modal,
  StatCardRow,
  type Column,
} from "@unerp/ui";
import {
  Plus,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Eye,
  AlertCircle,
  Award,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface CommissionPlan {
  id: string;
  name: string;
  targetType: string;
  rate: number;
  threshold: number;
  maxPayout: number | null;
  isActive: boolean;
}

interface CommissionPayout {
  id: string;
  planName: string;
  salesPersonName: string;
  amount: number;
  period: string;
  status: string;
  paidAt: string | null;
}

export default function CommissionsPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<"plans" | "payouts">("plans");
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editPlan, setEditPlan] = useState<CommissionPlan | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    targetType: "SALES_AMOUNT",
    rate: 5,
    threshold: 0,
    maxPayout: null,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const pl = await client.get<
        CommissionPlan[] | { data?: CommissionPlan[] }
      >("/sales/commissions/plans");
      const pa = await client.get<
        CommissionPayout[] | { data?: CommissionPayout[] }
      >("/sales/commissions/payouts");
      setPlans(Array.isArray(pl) ? pl : pl.data || []);
      setPayouts(Array.isArray(pa) ? pa : pa.data || []);
    } catch {
      setError("Could not load data.");
      setPlans([]);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        maxPayout: form.maxPayout ? Number(form.maxPayout) : null,
      };
      if (editPlan)
        await client.patch(`/sales/commissions/plans/${editPlan.id}`, payload);
      else await client.post("/sales/commissions/plans", payload);
      setSaveSuccess(true);
      setTimeout(() => {
        setShowCreate(false);
        setEditPlan(null);
        setSaveSuccess(false);
        fetchData();
      }, 1200);
    } catch {
      alert("Failed.");
    } finally {
      setSaving(false);
    }
  };

  const planColumns: Column<CommissionPlan>[] = [
    { key: "name", header: "Plan Name", sortable: true },
    {
      key: "targetType",
      header: "Target",
      render: (row) => (
        <Badge variant="default">{row.targetType.replace(/_/g, " ")}</Badge>
      ),
    },
    { key: "rate", header: "Rate", render: (row) => `${row.rate}%` },
    {
      key: "threshold",
      header: "Threshold",
      render: (row) => `$${row.threshold.toLocaleString()}`,
    },
    {
      key: "maxPayout",
      header: "Max Payout",
      render: (row) =>
        row.maxPayout ? `$${row.maxPayout.toLocaleString()}` : "—",
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (row) =>
        row.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="danger">Inactive</Badge>
        ),
    },
    {
      key: "id",
      header: "Actions",
      render: (row) => (
        <div className="ui-hstack-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditPlan(row);
              setForm(row);
              setShowCreate(true);
            }}
          >
            <Eye size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const payoutColumns: Column<CommissionPayout>[] = [
    { key: "planName", header: "Plan", sortable: true },
    { key: "salesPersonName", header: "Sales Person", sortable: true },
    {
      key: "amount",
      header: "Amount",
      render: (row) => <strong>${row.amount.toLocaleString()}</strong>,
    },
    { key: "period", header: "Period" },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.status === "PAID" ? (
          <Badge variant="success">Paid</Badge>
        ) : row.status === "PENDING" ? (
          <Badge variant="warning">Pending</Badge>
        ) : (
          <Badge variant="danger">{row.status}</Badge>
        ),
    },
    {
      key: "paidAt",
      header: "Paid Date",
      render: (row) =>
        row.paidAt ? new Date(row.paidAt).toLocaleDateString() : "—",
    },
  ];

  const totalPending = payouts
    .filter((p) => p.status === "PENDING")
    .reduce((s, p) => s + p.amount, 0);
  const totalPaid = payouts
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <RouteGuard permission="sales.commission.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Sales Commissions"
          description="Manage commission plans and track payouts."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Sales", href: "/sales" },
            { label: "Commissions" },
          ]}
        />
        {loading ? (
          <div className="ui-center-pad">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <StatCardRow
              stats={[
                {
                  label: "Active Plans",
                  value: plans.filter((p) => p.isActive).length,
                  icon: React.createElement(Award, { size: 16 }),
                  color: "green",
                },
                {
                  label: "Sales People",
                  value: payouts.reduce(
                    (s, p) => s.add(p.salesPersonName),
                    new Set(),
                  ).size,
                  icon: React.createElement(Users, { size: 16 }),
                  color: "blue",
                },
                {
                  label: "Pending",
                  value: `$${totalPending.toLocaleString()}`,
                  icon: React.createElement(Clock, { size: 16 }),
                  color: "amber",
                },
                {
                  label: "Paid Out",
                  value: `$${totalPaid.toLocaleString()}`,
                  icon: React.createElement(TrendingUp, { size: 16 }),
                  color: "purple",
                },
              ]}
            />
            <Card>
              <div className={styles.p1}>
                <div className={styles.p2}>
                  <button
                    onClick={() => setTab("plans")}
                    className={tab === "plans" ? styles.p3 : styles.p4}
                  >
                    Plans
                  </button>
                  <button
                    onClick={() => setTab("payouts")}
                    className={tab === "payouts" ? styles.p3 : styles.p4}
                  >
                    Payouts
                  </button>
                </div>
                {tab === "plans" && (
                  <>
                    <div className={styles.p5}>
                      <span className="ui-text-xs-muted">
                        {plans.length} plans
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setEditPlan(null);
                          setForm({
                            name: "",
                            targetType: "SALES_AMOUNT",
                            rate: 5,
                            threshold: 0,
                            maxPayout: null,
                            isActive: true,
                          });
                          setShowCreate(true);
                        }}
                      >
                        <Plus size={14} /> New Plan
                      </Button>
                    </div>
                    <DataTable columns={planColumns} data={plans} />
                  </>
                )}
                {tab === "payouts" && (
                  <>
                    <div className={styles.p5}>
                      <span className="ui-text-xs-muted">
                        {payouts.length} payouts
                      </span>
                    </div>
                    <DataTable columns={payoutColumns} data={payouts} />
                  </>
                )}
              </div>
            </Card>
          </>
        )}
        <Modal
          open={showCreate}
          onClose={() => {
            setShowCreate(false);
            setEditPlan(null);
          }}
          title={editPlan ? `Edit: ${editPlan.name}` : "Create Commission Plan"}
          size="md"
        >
          <form onSubmit={handleSavePlan} className="ui-stack-4">
            {saveSuccess ? (
              <div className={styles.p6}>
                <AlertCircle size={40} className={styles.p7} />
                <p>Saved.</p>
              </div>
            ) : (
              <>
                <div className="ui-grid-2 ui-gap-3">
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Plan Name</label>
                    <input
                      className="ui-input"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Target Type</label>
                    <select
                      className="ui-input"
                      value={form.targetType}
                      onChange={(e) =>
                        setForm({ ...form, targetType: e.target.value })
                      }
                    >
                      <option value="SALES_AMOUNT">Sales Amount</option>
                      <option value="PROFIT_MARGIN">Profit Margin</option>
                      <option value="UNIT_COUNT">Unit Count</option>
                      <option value="NEW_CUSTOMER">New Customer</option>
                    </select>
                  </div>
                </div>
                <div className="ui-grid-2 ui-gap-3">
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Rate (%)</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={form.rate}
                      onChange={(e) =>
                        setForm({ ...form, rate: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Threshold ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={form.threshold}
                      onChange={(e) =>
                        setForm({ ...form, threshold: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="ui-grid-2 ui-gap-3">
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">
                      Max Payout (optional)
                    </label>
                    <input
                      className="ui-input"
                      type="number"
                      value={form.maxPayout || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          maxPayout: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Active</label>
                    <select
                      className="ui-input"
                      value={form.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          isActive: e.target.value === "true",
                        })
                      }
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setEditPlan(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={saving}>
                    {saving ? <Spinner size="sm" /> : "Save"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
