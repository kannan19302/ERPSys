// @ts-nocheck
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { Plus, Edit3, Trash2, PieChart } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

export default function WinLossCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "BOTH" as string,
    sortOrder: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(
        "/crm/competitor-intelligence/win-loss-categories",
      );
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const save = useCallback(async () => {
    try {
      if (editId) {
        await apiSend(
          `/crm/competitor-intelligence/win-loss-categories/${editId}`,
          "PUT",
          form,
        );
      } else {
        await apiSend(
          "/crm/competitor-intelligence/win-loss-categories",
          "POST",
          form,
        );
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", description: "", type: "BOTH", sortOrder: 0 });
      load();
    } catch (e) {
      console.error(e);
    }
  }, [form, editId, load]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await apiSend(
          `/crm/competitor-intelligence/win-loss-categories/${id}`,
          "DELETE",
        );
        load();
      } catch (e) {
        console.error(e);
      }
    },
    [load],
  );

  const startEdit = useCallback((cat: any) => {
    setForm({
      name: cat.name,
      description: cat.description || "",
      type: cat.type,
      sortOrder: cat.sortOrder ?? 0,
    });
    setEditId(cat.id);
    setShowForm(true);
  }, []);

  return (
    <div className="ui-page">
      <PageHeader
        title="Win/Loss Categories"
        description="Manage win/loss reason categories"
      />
      <Button
        onClick={() => {
          setShowForm(true);
          setEditId(null);
          setForm({ name: "", description: "", type: "BOTH", sortOrder: 0 });
        }}
        style={{ marginBottom: "1rem" }}
      >
        <Plus size={16} /> Add Category
      </Button>

      {showForm && (
        <Card style={{ marginBottom: "1rem" }}>
          <div className="ui-card-header">
            <h3 className="ui-card-title">
              {editId ? "Edit" : "New"} Category
            </h3>
          </div>
          <div className="ui-card-body">
            <div className="ui-form-group">
              <label className="ui-label">Name</label>
              <input
                className="ui-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Description</label>
              <input
                className="ui-input"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Type</label>
              <select
                className="ui-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="WIN_REASON">Win Reason</option>
                <option value="LOSS_REASON">Loss Reason</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Sort Order</label>
              <input
                className="ui-input"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button onClick={save}>Save</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading && <Spinner />}

      <Card>
        <div className="ui-card-header">
          <h3 className="ui-card-title">Categories ({categories.length})</h3>
        </div>
        <div className="ui-card-body">
          {categories.map((cat: any) => (
            <div
              key={cat.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <strong>{cat.name}</strong>
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  <Badge variant="info">{cat.type.replace(/_/g, " ")}</Badge>
                  {cat.description && (
                    <span style={{ marginLeft: "0.5rem" }}>
                      {cat.description}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => startEdit(cat)}
                >
                  <Edit3 size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => remove(cat.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
          {!loading && categories.length === 0 && (
            <p style={{ color: "#666" }}>
              No categories yet. Create your first win/loss category.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
