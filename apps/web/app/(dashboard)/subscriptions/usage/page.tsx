"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Button, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Eye } from "lucide-react";

export default function SubscriptionUsagePage() {
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/subscriptions/usage")
      .then((d) => setUsage(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "subscription.name", header: "Subscription" },
    { key: "metricName", header: "Metric" },
    { key: "quantity", header: "Quantity" },
    { key: "unitAmount", header: "Unit Amount" },
    { key: "totalAmount", header: "Total" },
    { key: "usageDate", header: "Date" },
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
        title="Usage Records"
        description={`${usage.length} records`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={usage} />
      </div>
    </div>
  );
}
