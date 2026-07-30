// @ts-nocheck
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
import { Eye, Play } from "lucide-react";

export default function SubscriptionDunningPage() {
  const [dunning, setDunning] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/subscriptions/dunning")
      .then((d) => setDunning(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "subscription.name", header: "Subscription" },
    { key: "customer", header: "Customer" },
    { key: "amountDue", header: "Amount Due" },
    { key: "dueDate", header: "Due Date" },
    { key: "dunningLevel", header: "Level" },
    { key: "status", header: "Status" },
    {
      key: "actions",
      header: "Actions",
      render: (_val: unknown, row: Record<string, unknown>) => (
        <div
          className="ui-flex"
          style={{ gap: "var(--space-2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="ghost">
            <Eye size={14} />
          </Button>
          <Button size="sm" variant="ghost">
            <Play size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dunning"
        description={`${dunning.length} dunning processes`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={dunning} />
      </div>
    </div>
  );
}
