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
  Percent,
  Tag,
  AlertCircle,
  Gift,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface Promotion {
  id: string;
  name: string;
  type: string;
  value: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usedCount: number;
}

interface Coupon {
  id: string;
  code: string;
  promotionId: string;
  promotionName?: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export default function PromotionsPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<"promotions" | "coupons">("promotions");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    type: "PERCENTAGE",
    value: 0,
    startDate: "",
    endDate: "",
    isActive: true,
  });
  const [couponForm, setCouponForm] = useState<any>({
    code: "",
    promotionId: "",
    usageLimit: 100,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const pr = await client.get<Promotion[] | { data?: Promotion[] }>(
        "/sales/promotions",
      );
      const cr = await client.get<Coupon[] | { data?: Coupon[] }>(
        "/sales/promotions/coupons",
      );
      setPromotions(Array.isArray(pr) ? pr : pr.data || []);
      setCoupons(Array.isArray(cr) ? cr : cr.data || []);
    } catch {
      setError("Could not load data.");
      setPromotions([]);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editPromo)
        await client.patch(`/sales/promotions/${editPromo.id}`, form);
      else
        await client.post("/sales/promotions", {
          ...form,
          startDate: form.startDate || new Date().toISOString().split("T")[0],
        });
      setSaveSuccess(true);
      setTimeout(() => {
        setShowCreate(false);
        setEditPromo(null);
        setSaveSuccess(false);
        fetchData();
      }, 1200);
    } catch {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post("/sales/promotions/coupons", couponForm);
      setSaveSuccess(true);
      setTimeout(() => {
        setShowCreateCoupon(false);
        setSaveSuccess(false);
        fetchData();
      }, 1200);
    } catch {
      alert("Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try {
      await client.delete(`/sales/promotions/${id}`);
      fetchData();
    } catch {
      alert("Failed.");
    }
  };

  const promoColumns: Column<Promotion>[] = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "type",
      header: "Type",
      render: (row) => <Badge variant="default">{row.type}</Badge>,
    },
    {
      key: "value",
      header: "Value",
      render: (row) =>
        row.type === "PERCENTAGE" ? `${row.value}%` : `$${row.value}`,
    },
    {
      key: "startDate",
      header: "Start",
      render: (row) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      key: "endDate",
      header: "End",
      render: (row) => new Date(row.endDate).toLocaleDateString(),
    },
    {
      key: "isActive",
      header: "Active",
      render: (row) =>
        row.isActive ? (
          <Badge variant="success">Yes</Badge>
        ) : (
          <Badge variant="danger">No</Badge>
        ),
    },
    { key: "usedCount", header: "Used" },
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
              setEditPromo(row);
              setForm(row);
              setShowCreate(true);
            }}
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const couponColumns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      render: (row) => <code className={styles.p3}>{row.code}</code>,
    },
    { key: "promotionName", header: "Promotion" },
    { key: "usageLimit", header: "Usage Limit" },
    { key: "usedCount", header: "Used" },
    {
      key: "isActive",
      header: "Active",
      render: (row) =>
        row.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="danger">Inactive</Badge>
        ),
    },
  ];

  return (
    <RouteGuard permission="sales.promotion.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Promotions & Coupons"
          description="Manage discount promotions and coupon codes."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Sales", href: "/sales" },
            { label: "Promotions" },
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
                  label: "Active Promotions",
                  value: promotions.filter((p) => p.isActive).length,
                  icon: React.createElement(Percent, { size: 16 }),
                  color: "green",
                },
                {
                  label: "Total Coupons",
                  value: coupons.length,
                  icon: React.createElement(Tag, { size: 16 }),
                  color: "blue",
                },
                {
                  label: "Total Used",
                  value: promotions.reduce((s, p) => s + p.usedCount, 0),
                  icon: React.createElement(Gift, { size: 16 }),
                  color: "purple",
                },
              ]}
            />
            <Card>
              <div className={styles.p2}>
                <div className={styles.p4}>
                  <button
                    onClick={() => setTab("promotions")}
                    className={tab === "promotions" ? styles.p5 : styles.p6}
                  >
                    Promotions
                  </button>
                  <button
                    onClick={() => setTab("coupons")}
                    className={tab === "coupons" ? styles.p5 : styles.p6}
                  >
                    Coupons
                  </button>
                </div>
                {tab === "promotions" && (
                  <>
                    <div className={styles.p7}>
                      <span className="ui-text-xs-muted">
                        {promotions.length} promotions
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setEditPromo(null);
                          setForm({
                            name: "",
                            type: "PERCENTAGE",
                            value: 0,
                            startDate: "",
                            endDate: "",
                            isActive: true,
                          });
                          setShowCreate(true);
                        }}
                      >
                        <Plus size={14} /> New Promotion
                      </Button>
                    </div>
                    <DataTable columns={promoColumns} data={promotions} />
                  </>
                )}
                {tab === "coupons" && (
                  <>
                    <div className={styles.p7}>
                      <span className="ui-text-xs-muted">
                        {coupons.length} coupons
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setCouponForm({
                            code: "",
                            promotionId: promotions[0]?.id || "",
                            usageLimit: 100,
                            isActive: true,
                          });
                          setShowCreateCoupon(true);
                        }}
                      >
                        <Plus size={14} /> New Coupon
                      </Button>
                    </div>
                    <DataTable columns={couponColumns} data={coupons} />
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
            setEditPromo(null);
          }}
          title={editPromo ? `Edit: ${editPromo.name}` : "Create Promotion"}
          size="md"
        >
          <form onSubmit={handleSave} className="ui-stack-4">
            {saveSuccess ? (
              <div className={styles.p8}>
                <CheckCircle size={40} className={styles.p9} />
                <p>Saved.</p>
              </div>
            ) : (
              <>
                <div className="ui-grid-2 ui-gap-3">
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Name</label>
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
                    <label className="ui-text-xs-label">Type</label>
                    <select
                      className="ui-input"
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                    >
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED_AMOUNT">Fixed Amount</option>
                      <option value="FREE_SHIPPING">Free Shipping</option>
                    </select>
                  </div>
                </div>
                <div className="ui-grid-2 ui-gap-3">
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Value</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={form.value}
                      onChange={(e) =>
                        setForm({ ...form, value: Number(e.target.value) })
                      }
                      required
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
                <div className="ui-grid-2 ui-gap-3">
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Start Date</label>
                    <input
                      className="ui-input"
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">End Date</label>
                    <input
                      className="ui-input"
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm({ ...form, endDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setEditPromo(null);
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
