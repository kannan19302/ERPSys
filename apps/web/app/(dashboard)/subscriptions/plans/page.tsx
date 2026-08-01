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

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/subscriptions/plans")
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Plan Name" },
    { key: "billingPeriod", header: "Billing Period" },
    { key: "unitAmount", header: "Amount" },
    { key: "currency", header: "Currency" },
    { key: "status", header: "Status" },
    { key: "trialDays", header: "Trial Days" },
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
      <PageHeader
        title="Subscription Plans"
        description={`${plans.length} plans`}
      />
      <div className="ui-card">
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>Create Plan</Button>
        </div>
        <DataTable columns={columns} data={plans} />
      </div>
    </div>
  );
}
