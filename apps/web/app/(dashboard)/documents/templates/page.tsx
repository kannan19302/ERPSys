"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, DataTable, type Column, Button, Spinner, useToast } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { FileText, Plus, Edit2, Trash2, Eye } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string | null;
  content: string;
  variables: { key: string; label: string; type: string }[];
  createdAt: string;
}

export default function TemplatesPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<Template[]>("/documents/templates")
      .then((res) => setTemplates(res as any || []))
      .catch((e) => notifyError("Failed to load templates", e.message))
      .finally(() => setLoading(false));
  }, [client, notifyError]);

  const columns: Column<Template>[] = [
    { id: "name", header: "Name", sortable: true, render: (r) => <span className="ui-text-medium">{r.name}</span> },
    { id: "category", header: "Category", render: (r) => r.category || <span className="ui-text-muted">—</span> },
    { id: "variables", header: "Variables", render: (r) => <span>{r.variables?.length || 0} vars</span> },
    { id: "createdAt", header: "Created", sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="Document Templates" description="Manage reusable document templates with variable substitution" />
      <Card>
        <div className="ui-flex-end">
          <Button leftIcon={Plus}>New Template</Button>
        </div>
        <DataTable columns={columns} data={templates} />
      </Card>
    </>
  );
}
