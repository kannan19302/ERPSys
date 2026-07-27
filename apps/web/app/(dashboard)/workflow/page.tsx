"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  DataTable,
  type ListColumn,
  StatusBadge,
  StatCardRow,
} from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Plus } from "lucide-react";

export default function WorkflowDefinitionsPage() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/workflow/definitions")
      .then((d) => setDefinitions(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: ListColumn[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "category", label: "Category" },
    { key: "trigger", label: "Trigger" },
    { key: "status", label: "Status" },
    { key: "version", label: "Version" },
    { key: "createdAt", label: "Created", sortable: true },
  ];

  return (
    <div>
      <PageHeader
        title="Workflow Definitions"
        subtitle={`${definitions.length} definitions`}
      />
      <StatCardRow
        cards={[{ label: "Total Definitions", value: definitions.length }]}
      />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button icon={Plus}>New Definition</Button>
        </div>
        <DataTable columns={columns} data={definitions} />
      </div>
    </div>
  );
}
