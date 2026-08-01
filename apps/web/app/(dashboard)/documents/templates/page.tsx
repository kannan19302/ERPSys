"use client";
import { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  DataTable,
  type Column,
  Button,
  Spinner,
  useToast,
} from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { Plus } from "lucide-react";

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
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get<Template[]>("/documents/templates")
      .then((res) => setTemplates((res as any) || []))
      .catch((e) =>
        toast({
          title: "Failed to load templates",
          description: e.message,
          variant: "error",
        }),
      )
      .finally(() => setLoading(false));
  }, [client, toast]);

  const columns: Column<Template>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r) => <span className="ui-text-medium">{r.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      render: (r) => r.category || <span className="ui-text-muted">—</span>,
    },
    {
      key: "variables",
      header: "Variables",
      render: (r) => <span>{r.variables?.length || 0} vars</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Document Templates"
        description="Manage reusable document templates with variable substitution"
      />
      <Card>
        <div className="ui-flex-end p-4">
          <Button leftIcon={<Plus size={16} />}>New Template</Button>
        </div>
        <DataTable columns={columns} data={templates} />
      </Card>
    </>
  );
}
