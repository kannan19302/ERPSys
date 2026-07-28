"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, DataTable, type Column, Button, Spinner, useToast } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  children: Category[];
}

export default function CategoriesPage() {
  const client = useApiClient();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<Category[]>("/documents/categories")
      .then((res) => setCategories(res as any || []))
      .catch((e) => toast({ title: "Failed to load categories", description: e.message, variant: "error" }))
      .finally(() => setLoading(false));
  }, [client, toast]);

  const flattenTree = (items: Category[], depth = 0): (Category & { depth: number })[] => {
    const result: (Category & { depth: number })[] = [];
    for (const item of items) {
      result.push({ ...item, depth });
      if (item.children) result.push(...flattenTree(item.children, depth + 1));
    }
    return result;
  };

  const columns: Column<Category & { depth: number }>[] = [
    { key: "name", header: "Name", render: (r) => <span style={{ paddingLeft: `${r.depth * 20}px` }}>{r.depth > 0 ? "└ " : ""}{r.name}</span> },
    { key: "sortOrder", header: "Sort Order", render: (r) => r.sortOrder },
  ];

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="Document Categories" description="Organize documents into hierarchical categories" />
      <Card>
        <div className="ui-flex-end p-4">
          <Button leftIcon={<Plus size={16} />}>New Category</Button>
        </div>
        <DataTable columns={columns} data={flattenTree(categories)} />
      </Card>
    </>
  );
}
