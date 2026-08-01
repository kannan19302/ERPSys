"use client";
import styles from "./page.module.css";
import { GenericBuilderModal } from "@/components/builder/GenericBuilderModal";

import { useBuilderData } from "@/lib/hooks/useBuilderData";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  ConfirmDialog,
  StatCardRow,
  ListPageTemplate,
  type ListColumn,
} from "@unerp/ui";
import {
  FileText,
  PlusCircle,
  Eye,
  Clock,
  Edit3,
  Trash2,
  Search,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Product",
  "Insights",
  "Guide",
  "Case Study",
  "Tutorial",
];
const CATEGORY_COLORS: Record<string, string> = {
  Product: "var(--color-primary)",
  Insights: "#7c3aed",
  Guide: "#059669",
  "Case Study": "#d97706",
  Tutorial: "#dc2626",
};

export default function WebBlogPage() {
  const {
    data: POSTS_DB,
    loading,
    createItem,
    updateItem,
    deleteItem,
  } = useBuilderData<any>("blog-posts", []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleSave = async (data: any) => {
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const executeDeletePost = async (id: any) => {
    await deleteItem(id);
  };

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");

  const filtered = POSTS_DB.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      p.title.toLowerCase().includes(search.toLowerCase()),
  );

  const blogColumns: ListColumn[] = [
    { key: "title", header: "Post Title" },
    {
      key: "category",
      header: "Category",
      render: (v) => (
        <span
          style={{
            background: `${CATEGORY_COLORS[String(v)] || "var(--color-primary)"}20`,
            color: CATEGORY_COLORS[String(v)] || "var(--color-primary)",
          }}
          className={styles.s1}
        >
          {String(v)}
        </span>
      ),
    },
    { key: "author", header: "Author" },
    { key: "date", header: "Date" },
    {
      key: "views",
      header: "Views",
      render: (v) => Number(v).toLocaleString(),
    },
    { key: "readTime", header: "Read Time" },
    {
      key: "status",
      header: "Status",
      render: (v) => (
        <span
          style={{
            background:
              v === "Published"
                ? "var(--color-success-light)"
                : "var(--color-warning-light)",
            color:
              v === "Published"
                ? "var(--color-success)"
                : "var(--color-warning)",
          }}
          className={styles.s1}
        >
          {String(v)}
        </span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (_v, row) => {
        const p = row as unknown as { id: string };
        return (
          <div className="ui-flex ui-gap-1">
            <button
              className={`ui-btn ui-btn-secondary ${styles.s2}`}
              onClick={(e) => {
                e.stopPropagation();
                setEditingItem(row);
                setIsModalOpen(true);
              }}
            >
              <Edit3 size={12} />
            </button>
            <button
              className={`ui-btn ${styles.s3}`}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(p.id);
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Blog Posts"
        description="Write, edit, and publish blog content to your public website"
        actions={
          <div className="ui-flex ui-gap-2">
            <button
              className="ui-btn ui-btn-secondary"
              onClick={() => router.push("/builder/web")}
            >
              ← Web Studio
            </button>
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
            >
              <PlusCircle size={15} />
              <span>New Post</span>
            </button>
          </div>
        }
      />

      {/* Stats */}
      <StatCardRow
        stats={[
          {
            label: "Published Posts",
            value: POSTS_DB.length.toString(),
            color: "var(--color-primary)",
          },
          {
            label: "Total Views",
            value: POSTS_DB.reduce(
              (a, b) => a + (b.views || 0),
              0,
            ).toLocaleString(),
            color: "#059669",
          },
          { label: "Avg Read Time", value: "8 min", color: "#d97706" },
          {
            label: "Drafts",
            value: POSTS_DB.filter(
              (p) => p.status === "Draft",
            ).length.toString(),
            color: "#7c3aed",
          },
        ]}
      />

      {/* Filters */}
      <div className={styles.s4}>
        <div className={styles.s5}>
          <Search size={15} className="ui-input-icon-abs" />
          <input
            className={`ui-input ${styles.s6}`}
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.s7}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              style={{
                border: `1px solid ${cat === c ? "var(--color-primary)" : "var(--color-border)"}`,
                background:
                  cat === c ? "var(--color-primary-light)" : "transparent",
                color:
                  cat === c
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                fontWeight:
                  cat === c ? "var(--weight-semibold)" : "var(--weight-normal)",
              }}
              className={styles.s8}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <ListPageTemplate
        title=""
        columns={blogColumns}
        data={filtered as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No posts yet"
        emptyDescription='Click "New Post" to create your first blog post.'
      />

      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Item" : "Create New"}
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "slug", label: "Slug", type: "text", required: true },
          { name: "author", label: "Author", type: "text" },
        ]}
        initialData={editingItem}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            executeDeletePost(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title="Delete Blog Post"
        message="Are you sure you want to delete this blog post?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
