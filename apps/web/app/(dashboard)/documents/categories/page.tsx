"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, DataTable, type Column, Button, Spinner, useToast } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { FolderTree, Plus, Edit2, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  children: Category[];
}

export default function CategoriesPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<Category[]>("/documents/categories")
      .then((res) => setCategories(res as any || []))
      .catch((e) => notifyError("Failed to load categories", e.message))
      .finally(() => setLoading(false));
  }, [client, notifyError]);

  const flattenTree = (items: Category[], depth = 0): (Category & { depth: number })[] => {
    const result: (Category & { depth: number })[] = [];
    for (const item of items) {
      result.push({ ...item, depth });
      if (item.children) result.push(...flattenTree(item.children, depth + 1));
    }
    return result;
  };

  const columns: Column<Category & { depth: number }>[] = [
    { id: "name", header: "Name", render: (r) => <span style={{ paddingLeft: `${r.depth * 20}px` }}>{r.depth > 0 ? "└ " : ""}{r.name}</span> },
    { id: "sortOrder", header: "Sort Order", render: (r) => r.sortOrder },
  ];

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="Document Categories" description="Organize documents into hierarchical categories" />
      <Card>
        <div className="ui-flex-end">
          <Button leftIcon={Plus}>New Category</Button>
        </div>
        <DataTable columns={columns} data={flattenTree(categories)} />
      </Card>
    </>
  );
}
