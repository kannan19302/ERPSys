// @ts-nocheck
"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  PageHeader,
  Spinner,
  Button,
  ProtectedComponent,
} from "@unerp/ui";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

interface ContentCategory {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  _count?: { items: number };
}

export default function ContentCategoriesPage() {
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [catName, setCatName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<ContentCategory[]>("/crm/content/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createCategory = async () => {
    if (!catName.trim()) return;
    await apiSend("/crm/content/categories", "POST", { name: catName });
    setCatName("");
    setShowNew(false);
    load();
  };

  const deleteCategory = async (id: string) => {
    if (confirm("Delete this category?")) {
      await apiSend(`/crm/content/categories/${id}`, "DELETE");
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Content Categories"
        description="Organize sales content into categories for easy discovery"
        actions={
          <ProtectedComponent permission="crm.sales-enablement.categories.create">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNew(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Category
            </Button>
          </ProtectedComponent>
        }
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Sales Enablement", href: "/crm/sales-enablement" },
          { label: "Categories" },
        ]}
      />

      {showNew && (
        <Card className="p-4">
          <div className="ui-form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Sales Decks, Case Studies"
            />
            <div className="flex gap-2 mt-2">
              <Button variant="primary" size="sm" onClick={createCategory}>
                Create
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowNew(false);
                  setCatName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400">No categories yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="pb-2">Name</th>
                <th className="pb-2">Description</th>
                <th className="pb-2">Items</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-medium">
                    <FolderOpen className="w-4 h-4 inline mr-2" />
                    {cat.name}
                  </td>
                  <td className="py-2 text-gray-500">
                    {cat.description || "—"}
                  </td>
                  <td className="py-2">{cat._count?.items ?? 0}</td>
                  <td className="py-2">
                    <ProtectedComponent permission="crm.sales-enablement.categories.delete">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory(cat.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </ProtectedComponent>
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
