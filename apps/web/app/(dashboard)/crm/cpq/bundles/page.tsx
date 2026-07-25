"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  PageHeader,
  Spinner,
  Badge,
  Modal,
  useToast,
  DataTable,
  Input,
  ProtectedComponent,
  type Column,
  type SortOrder,
} from "@unerp/ui";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

export default function CpqBundlesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [bundles, setBundles] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/crm/cpq/bundles?${params}`);
      const data = await res.json();
      setBundles(data.data || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bundle?")) return;
    try {
      await fetch(`/api/crm/cpq/bundles/${id}`, { method: "DELETE" });
      addToast("Bundle deleted", "success");
      fetchBundles();
    } catch {
      addToast("Failed to delete bundle", "error");
    }
  };

  const columns: Column[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "bundlePrice",
      label: "Bundle Price",
      sortable: true,
      render: (v: unknown) => `$${Number(v).toFixed(2)}`,
    },
    {
      key: "savingsPct",
      label: "Savings %",
      render: (v: unknown) => `${Number(v).toFixed(1)}%`,
    },
    { key: "currency", label: "Currency" },
    {
      key: "isActive",
      label: "Status",
      render: (v: unknown) =>
        v ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Inactive</Badge>
        ),
    },
    {
      key: "_count",
      label: "Items",
      render: (v: unknown) => String((v as Record<string, number>)?.items ?? 0),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="ui-flex-row ui-gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              router.push(`/crm/cpq/bundles/${row.id}`);
            }}
          >
            <Pencil size={14} />
          </Button>
          <ProtectedComponent permission="crm.cpq-bundles.delete">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleDelete(row.id as string);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </ProtectedComponent>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Product Bundles"
        description="Manage product bundle configurations and pricing"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "CPQ & Quoting", href: "/crm/cpq" },
          { label: "Bundles" },
        ]}
        actions={
          <ProtectedComponent permission="crm.cpq-bundles.create">
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} /> New Bundle
            </Button>
          </ProtectedComponent>
        }
      />

      <Card>
        {loading ? (
          <div className="ui-flex-center" style={{ padding: "2rem" }}>
            <Spinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={bundles}
            sortBy={sortBy}
            sortOrder={sortOrder}
            page={page}
            totalPages={totalPages}
            onSortChange={(key, order) => {
              setSortBy(key);
              setSortOrder(order);
            }}
            onPageChange={setPage}
            onSearch={setSearch}
            onRowClick={(row) => router.push(`/crm/cpq/bundles/${row.id}`)}
          />
        )}
      </Card>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Product Bundle"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setCreating(true);
            const form = e.target as HTMLFormElement;
            const data = Object.fromEntries(new FormData(form));
            try {
              const res = await fetch("/api/crm/cpq/bundles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...data,
                  bundlePrice: Number(data.bundlePrice),
                }),
              });
              if (!res.ok) throw new Error();
              addToast("Bundle created", "success");
              setShowCreate(false);
              fetchBundles();
            } catch {
              addToast("Failed to create bundle", "error");
            }
            setCreating(false);
          }}
        >
          <div className="ui-form-group">
            <label className="ui-label">Name</label>
            <Input name="name" required className="ui-input" />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Bundle Price</label>
            <Input
              name="bundlePrice"
              type="number"
              step="0.01"
              required
              className="ui-input"
            />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Description</label>
            <Input name="description" className="ui-input" />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Currency</label>
            <Input name="currency" defaultValue="USD" className="ui-input" />
          </div>
          <div className="ui-form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Bundle"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
