"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "@unerp/ui";
import { Plus, Trash2, Package, Eye } from "lucide-react";

export default function CpqBundleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [bundle, setBundle] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [validation, setValidation] = useState<Record<string, unknown> | null>(
    null,
  );

  const fetchBundle = async () => {
    setLoading(true);
    try {
      const [bRes, iRes] = await Promise.all([
        fetch(`/api/crm/cpq/bundles/${id}`),
        fetch(`/api/crm/cpq/bundles/${id}/items`),
      ]);
      if (bRes.ok) setBundle(await bRes.json());
      if (iRes.ok) setItems(await iRes.json());
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBundle();
  }, [id]);

  const handlePreview = async () => {
    try {
      const res = await fetch(`/api/crm/cpq/bundles/${id}/preview`, {
        method: "POST",
      });
      if (res.ok) setPreview(await res.json());
    } catch {
      toast.error("Failed to preview");
    }
  };

  const handleValidate = async () => {
    try {
      const res = await fetch(`/api/crm/cpq/bundles/${id}/validate`, {
        method: "POST",
      });
      if (res.ok) setValidation(await res.json());
    } catch {
      toast.error("Failed to validate");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Remove this item from bundle?")) return;
    try {
      await fetch(`/api/crm/cpq/bundles/${id}/items/${itemId}`, {
        method: "DELETE",
      });
      toast.success("Item removed");
      fetchBundle();
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const itemColumns: Column<Record<string, unknown>>[] = [
    { key: "productId", header: "Product ID" },
    { key: "quantity", header: "Qty" },
    { key: "sortOrder", header: "Sort Order" },
    {
      key: "actions",
      header: "",
      render: (row: Record<string, unknown>) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleRemoveItem(row.id as string);
          }}
        >
          <Trash2 size={14} />
        </Button>
      ),
    },
  ];

  if (loading)
    return (
      <div className="ui-flex-center" style={{ padding: "3rem" }}>
        <Spinner />
      </div>
    );
  if (!bundle)
    return (
      <div className="ui-flex-center" style={{ padding: "3rem" }}>
        Bundle not found
      </div>
    );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title={bundle.name as string}
        description={`Bundle price: $${Number(bundle.bundlePrice).toFixed(2)}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "CPQ", href: "/crm/cpq" },
          { label: "Bundles", href: "/crm/cpq/bundles" },
          { label: bundle.name as string },
        ]}
        actions={
          <div className="ui-flex-row ui-gap-2">
            <Button size="sm" variant="outline" onClick={handlePreview}>
              <Eye size={14} /> Preview
            </Button>
            <Button size="sm" variant="outline" onClick={handleValidate}>
              Validate
            </Button>
          </div>
        }
      />

      <div className="ui-grid-2">
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-text-md ui-font-semibold">Details</h3>
          </div>
          <div className="ui-stack-2" style={{ padding: "1rem" }}>
            <div>
              <strong>Price:</strong> ${Number(bundle.bundlePrice).toFixed(2)}
            </div>
            <div>
              <strong>Currency:</strong> {bundle.currency as string}
            </div>
            <div>
              <strong>Savings:</strong> {Number(bundle.savingsPct).toFixed(1)}%
            </div>
            <div>
              <strong>Status:</strong>{" "}
              {bundle.isActive ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="default">Inactive</Badge>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="ui-card-header">
            <h3 className="ui-text-md ui-font-semibold">
              Items ({items.length})
            </h3>
            <ProtectedComponent permission="crm.cpq-bundles.update">
              <Button size="sm" onClick={() => setShowAddItem(true)}>
                <Plus size={14} /> Add Item
              </Button>
            </ProtectedComponent>
          </div>
          <DataTable columns={itemColumns} data={items} />
        </Card>
      </div>

      {preview && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-text-md ui-font-semibold">Pricing Preview</h3>
          </div>
          <div className="ui-grid-3" style={{ padding: "1rem" }}>
            <div>
              <strong>Individual Total:</strong> $
              {Number(
                (preview as Record<string, unknown>).individualTotal,
              ).toFixed(2)}
            </div>
            <div>
              <strong>Bundle Price:</strong> $
              {Number((preview as Record<string, unknown>).bundlePrice).toFixed(
                2,
              )}
            </div>
            <div>
              <strong>Savings:</strong> $
              {Number((preview as Record<string, unknown>).savings).toFixed(2)}{" "}
              (
              {Number((preview as Record<string, unknown>).savingsPct).toFixed(
                1,
              )}
              %)
            </div>
          </div>
        </Card>
      )}

      {validation && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-text-md ui-font-semibold">Validation</h3>
          </div>
          <div className="ui-stack-2" style={{ padding: "1rem" }}>
            <div>
              <strong>Status:</strong>{" "}
              <Badge
                variant={
                  (validation as Record<string, unknown>).isValid
                    ? "success"
                    : "danger"
                }
              >
                {(validation as Record<string, unknown>).status as string}
              </Badge>
            </div>
            {(
              (validation as Record<string, unknown>).issues as Array<{
                type: string;
                message: string;
              }>
            )?.map((issue: { type: string; message: string }, i: number) => (
              <div key={i} className="ui-text-sm ui-text-danger">
                {issue.message}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        title="Add Item to Bundle"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const data = Object.fromEntries(new FormData(form));
            try {
              const res = await fetch(`/api/crm/cpq/bundles/${id}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...data,
                  quantity: Number(data.quantity),
                }),
              });
              if (!res.ok) throw new Error();
              toast.success("Item added");
              setShowAddItem(false);
              fetchBundle();
            } catch {
              toast.error("Failed to add item");
            }
          }}
        >
          <div className="ui-form-group">
            <label className="ui-label">Product ID</label>
            <Input name="productId" required className="ui-input" />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Quantity</label>
            <Input
              name="quantity"
              type="number"
              defaultValue="1"
              className="ui-input"
            />
          </div>
          <div className="ui-form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddItem(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
