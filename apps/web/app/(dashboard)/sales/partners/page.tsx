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
  Star,
  Globe,
  Edit,
  Trash2,
  CheckCircle,
  UserPlus,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface SalesPartner {
  id: string;
  name: string;
  email: string;
  tier: string;
  commissionRate: number;
  totalSales: number;
  status: string;
  referralCode: string;
  createdAt: string;
}

export default function PartnersPage() {
  const client = useApiClient();
  const [partners, setPartners] = useState<SalesPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<SalesPartner | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    email: "",
    tier: "REGULAR",
    commissionRate: 5,
    referralCode: "",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.get<SalesPartner[] | { data?: SalesPartner[] }>(
        "/sales/partners",
      );
      setPartners(Array.isArray(res) ? res : res.data || []);
    } catch {
      setError("Could not load partner data.");
      setPartners([]);
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
      if (editItem) await client.patch(`/sales/partners/${editItem.id}`, form);
      else await client.post("/sales/partners", form);
      setSaveSuccess(true);
      setTimeout(() => {
        setShowCreate(false);
        setEditItem(null);
        setSaveSuccess(false);
        fetchData();
      }, 1200);
    } catch {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this partner?")) return;
    try {
      await client.delete(`/sales/partners/${id}`);
      fetchData();
    } catch {
      alert("Failed.");
    }
  };

  const activeCount = partners.filter((p) => p.status === "ACTIVE").length;
  const totalCommission = partners.reduce(
    (s, p) => s + (p.totalSales * p.commissionRate) / 100,
    0,
  );

  const columns: Column<SalesPartner>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email" },
    {
      key: "tier",
      header: "Tier",
      sortable: true,
      render: (row) =>
        row.tier === "GOLD" ? (
          <Badge variant="warning">Gold</Badge>
        ) : row.tier === "SILVER" ? (
          <Badge variant="default">Silver</Badge>
        ) : row.tier === "PLATINUM" ? (
          <Badge variant="primary">Platinum</Badge>
        ) : (
          <Badge variant="default">Regular</Badge>
        ),
    },
    {
      key: "commissionRate",
      header: "Rate",
      render: (row) => `${row.commissionRate}%`,
    },
    {
      key: "totalSales",
      header: "Total Sales",
      render: (row) => `$${row.totalSales.toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.status === "ACTIVE" ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="danger">Inactive</Badge>
        ),
    },
    {
      key: "referralCode",
      header: "Referral Code",
      render: (row) => <span className={styles.p1}>{row.referralCode}</span>,
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
              setEditItem(row);
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

  return (
    <RouteGuard permission="sales.partner.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Sales Partners & Resellers"
          description="Manage partner relationships and referral programs."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Sales", href: "/sales" },
            { label: "Partners" },
          ]}
          actions={
            <Button
              variant="primary"
              onClick={() => {
                setEditItem(null);
                setForm({
                  name: "",
                  email: "",
                  tier: "REGULAR",
                  commissionRate: 5,
                  referralCode: "",
                  status: "ACTIVE",
                });
                setShowCreate(true);
              }}
            >
              <Plus size={16} /> New Partner
            </Button>
          }
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
                  label: "Active Partners",
                  value: activeCount,
                  icon: React.createElement(UserPlus, { size: 16 }),
                  color: "green",
                },
                {
                  label: "Avg Rate",
                  value: `${(partners.reduce((s, p) => s + p.commissionRate, 0) / Math.max(partners.length, 1)).toFixed(1)}%`,
                  icon: React.createElement(DollarSign, { size: 16 }),
                  color: "blue",
                },
                {
                  label: "Est. Commission",
                  value: `$${totalCommission.toLocaleString()}`,
                  icon: React.createElement(Star, { size: 16 }),
                  color: "purple",
                },
                {
                  label: "Referral Codes",
                  value: partners.filter((p) => p.referralCode).length,
                  icon: React.createElement(Globe, { size: 16 }),
                  color: "amber",
                },
              ]}
            />
            <Card>
              <DataTable columns={columns} data={partners} />
            </Card>
          </>
        )}
        <Modal
          open={showCreate}
          onClose={() => {
            setShowCreate(false);
            setEditItem(null);
          }}
          title={editItem ? `Edit: ${editItem.name}` : "Create Partner"}
          size="md"
        >
          <form onSubmit={handleSave} className="ui-stack-4">
            {saveSuccess ? (
              <div className={styles.p2}>
                <CheckCircle size={40} className={styles.p3} />
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
                    <label className="ui-text-xs-label">Email</label>
                    <input
                      className="ui-input"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="ui-grid-2 ui-gap-3">
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Tier</label>
                    <select
                      className="ui-input"
                      value={form.tier}
                      onChange={(e) =>
                        setForm({ ...form, tier: e.target.value })
                      }
                    >
                      <option value="REGULAR">Regular</option>
                      <option value="SILVER">Silver</option>
                      <option value="GOLD">Gold</option>
                      <option value="PLATINUM">Platinum</option>
                    </select>
                  </div>
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">
                      Commission Rate (%)
                    </label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={form.commissionRate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          commissionRate: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="ui-grid-2 ui-gap-3">
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Referral Code</label>
                    <input
                      className="ui-input"
                      value={form.referralCode}
                      onChange={(e) =>
                        setForm({ ...form, referralCode: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Status</label>
                    <select
                      className="ui-input"
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setEditItem(null);
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
