"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  DataTable,
  type Column,
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

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name" },
    { key: "category", header: "Category" },
    { key: "trigger", header: "Trigger" },
    { key: "status", header: "Status" },
    { key: "version", header: "Version" },
    { key: "createdAt", header: "Created" },
  ];

  return (
    <div>
      <PageHeader
        title="Workflow Definitions"
        description={`${definitions.length} definitions`}
      />
      <StatCardRow
        stats={[{ label: "Total Definitions", value: definitions.length }]}
      />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>New Definition</Button>
        </div>
        <DataTable columns={columns} data={definitions} />
      </div>
    </div>
  );
}
