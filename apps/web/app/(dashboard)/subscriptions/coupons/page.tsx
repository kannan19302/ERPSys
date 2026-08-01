"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  DataTable,
  type Column,
  StatusBadge,
} from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";

export default function SubscriptionCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/subscriptions/coupons")
      .then((d) => setCoupons(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "code", header: "Code" },
    { key: "discountType", header: "Discount Type" },
    { key: "discountValue", header: "Value" },
    { key: "maxRedemptions", header: "Max Uses" },
    { key: "redemptionCount", header: "Used" },
    { key: "status", header: "Status" },
    {
      key: "actions",
      header: "Actions",
      render: (row: Record<string, unknown>) => (
        <div
          className="ui-flex"
          style={{ gap: "var(--space-2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="ghost">
            <Eye size={14} />
          </Button>
          <Button size="sm" variant="ghost">
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Coupons" description={`${coupons.length} coupons`} />
      <div className="ui-card">
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>Create Coupon</Button>
        </div>
        <DataTable columns={columns} data={coupons} />
      </div>
    </div>
  );
}
