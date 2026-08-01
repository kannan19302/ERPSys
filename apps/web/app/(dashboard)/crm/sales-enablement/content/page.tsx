"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  PageHeader,
  Spinner,
  Button,
  Badge,
  Input,
  ProtectedComponent,
} from "@unerp/ui";
import { Plus, Search, Eye, Download, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { apiGet, apiSend } from "../../_components/api";

interface ContentItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  tags?: string[];
  category?: { id: string; name: string } | null;
  createdAt: string;
}

const inputStyle =
  "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function ContentLibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ data: ContentItem[] }>(
        `/crm/content/items?limit=50${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      );
      setItems(Array.isArray(data) ? data : ((data as any)?.data ?? []));
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteItem = async (id: string) => {
    if (confirm("Delete this content item?")) {
      await apiSend(`/crm/content/items/${id}`, "DELETE");
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Content Library"
        description="Manage sales enablement content — documents, presentations, videos, and templates"
        actions={
          <Link href="/crm/sales-enablement/content/new">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Content
            </Button>
          </Link>
        }
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Sales Enablement", href: "/crm/sales-enablement" },
          { label: "Content Library" },
        ]}
      />

      <div className="flex gap-2">
        <Input
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="secondary" size="sm" onClick={load}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">No content items yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="pb-2">Title</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">
                    <Link
                      href={`/crm/sales-enablement/content/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Badge variant="default">{item.type}</Badge>
                  </td>
                  <td className="py-2 text-gray-500">
                    {item.category?.name ?? "—"}
                  </td>
                  <td className="py-2">
                    <Badge
                      variant={
                        item.status === "PUBLISHED" ? "success" : "warning"
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <Link href={`/crm/sales-enablement/content/${item.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <ProtectedComponent permission="crm.sales-enablement.content.delete">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </ProtectedComponent>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
