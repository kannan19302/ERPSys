"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Button, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Plus, Eye } from "lucide-react";

export default function SubscriptionCreditNotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/subscriptions/credit-notes")
      .then((d) => setNotes(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "subscription.name", header: "Subscription" },
    { key: "amount", header: "Amount" },
    { key: "reason", header: "Reason" },
    { key: "createdAt", header: "Created" },
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Credit Notes"
        description={`${notes.length} credit notes`}
      />
      <div className="ui-card">
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>Issue Credit Note</Button>
        </div>
        <DataTable columns={columns} data={notes} />
      </div>
    </div>
  );
}
