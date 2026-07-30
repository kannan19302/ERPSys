// @ts-nocheck
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet, apiDelete } from "@/lib/api";
import { GitBranch, Plus, Edit3, Trash2 } from "lucide-react";

export default function WorkflowConditionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet("/workflow/conditions?definitionId=all");
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "field", header: "Field" },
    { key: "operator", header: "Operator" },
    { key: "logicGroup", header: "Logic" },
    {
      key: "actions",
      header: "Actions",
      render: (_v: any, row: any) => (
        <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
          <button
            className="ui-btn-icon"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Edit3 size={16} />
          </button>
          <button
            className="ui-btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              apiDelete(`/workflow/conditions/${row.id}`).then(load);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Workflow Conditions"
        description="Conditional branching rules"
      />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <div
          className="ui-flex"
          style={{
            justifyContent: "space-between",
            marginBottom: "var(--space-4)",
          }}
        >
          <h3 className="ui-heading-sm">
            <GitBranch size={20} /> Conditions
          </h3>
          <Button leftIcon={<Plus size={16} />}>New Condition</Button>
        </div>
        <DataTable columns={columns} data={items} />
      </div>
    </div>
  );
}
