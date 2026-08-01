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
import { Plus, Eye } from "lucide-react";

export default function SubscriptionMigrationsPage() {
  const [migrations, setMigrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/subscriptions/migrations")
      .then((d) => setMigrations(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "subscription.name", header: "Subscription" },
    { key: "fromPlan", header: "From Plan" },
    { key: "toPlan", header: "To Plan" },
    { key: "migrationDate", header: "Date" },
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Plan Migrations"
        description={`${migrations.length} migrations`}
      />
      <div className="ui-card">
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>New Migration</Button>
        </div>
        <DataTable columns={columns} data={migrations} />
      </div>
    </div>
  );
}
