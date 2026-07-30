// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  Badge,
  DataTable,
  type Column,
  Modal,
  TextField,
  KPICard,
  useToast,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { Truck, Plus, AlertTriangle, Package } from "lucide-react";

interface VanStockItem {
  id: string;
  technicianId: string;
  itemId: string;
  itemName: string;
  quantityOnVan: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  lastRestocked?: string;
  location?: string;
  notes?: string;
  technician?: { id: string; name: string };
}

export default function VanStockPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [items, setItems] = useState<VanStockItem[]>([]);
  const [lowStock, setLowStock] = useState<VanStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    technicianId: "",
    itemId: "",
    itemName: "",
    quantityOnVan: "0",
    minStockLevel: "5",
    maxStockLevel: "20",
    reorderPoint: "5",
    location: "",
    notes: "",
  });

  const loadData = async () => {
    try {
      const s = await client.get<VanStockItem[]>(
        "/ext/field-service/van-stock",
      );
      setItems(Array.isArray(s) ? s : []);
      const l = await client.get<VanStockItem[]>(
        "/ext/field-service/van-stock/low-stock",
      );
      setLowStock(Array.isArray(l) ? l : []);
    } catch (err) {
      notifyError(
        "Failed to load van stock",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client, notifyError]);

  const handleCreate = async () => {
    if (!form.technicianId || !form.itemId || !form.itemName) return;
    setCreating(true);
    try {
      await client.post("/ext/field-service/van-stock", {
        ...form,
        quantityOnVan: parseInt(form.quantityOnVan),
        minStockLevel: parseInt(form.minStockLevel),
        maxStockLevel: parseInt(form.maxStockLevel),
        reorderPoint: parseInt(form.reorderPoint),
      });
      setCreateOpen(false);
      setForm({
        technicianId: "",
        itemId: "",
        itemName: "",
        quantityOnVan: "0",
        minStockLevel: "5",
        maxStockLevel: "20",
        reorderPoint: "5",
        location: "",
        notes: "",
      });
      await loadData();
    } catch (err) {
      notifyError(
        "Failed to add stock",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setCreating(false);
    }
  };

  const adjustQty = async (id: string, qty: number) => {
    try {
      await client.patch(`/ext/field-service/van-stock/${id}/quantity`, {
        quantity: qty,
      });
      await loadData();
    } catch {
      notifyError("Failed to adjust", "");
    }
  };

  const columns: Column<VanStockItem>[] = [
    {
      key: "item",
      header: "Item",
      render: (r) => (
        <div>
          <span className="ui-heading-sm">{r.itemName}</span>
          <div className="ui-text-xs-tertiary">
            {r.technician?.name || r.technicianId.slice(0, 8)} ·{" "}
            {r.location || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "qty",
      header: "On Van",
      render: (r) => (
        <span
          className={
            r.quantityOnVan <= r.reorderPoint ? "text-red-600 font-bold" : ""
          }
        >
          {r.quantityOnVan}
        </span>
      ),
    },
    {
      key: "min",
      header: "Min / Max",
      render: (r) => (
        <span className="text-xs">
          {r.minStockLevel} / {r.maxStockLevel}
        </span>
      ),
    },
    {
      key: "reorder",
      header: "Reorder At",
      render: (r) => <span>{r.reorderPoint}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge
          variant={
            r.quantityOnVan <= r.reorderPoint
              ? "danger"
              : r.quantityOnVan <= r.minStockLevel
                ? "warning"
                : "success"
          }
        >
          {r.quantityOnVan <= r.reorderPoint
            ? "REORDER"
            : r.quantityOnVan <= r.minStockLevel
              ? "LOW"
              : "OK"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => adjustQty(r.id, r.quantityOnVan + 1)}
          >
            +
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => adjustQty(r.id, Math.max(0, r.quantityOnVan - 1))}
          >
            -
          </Button>
        </div>
      ),
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="field-service.van-stock.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Van Stock"
          description="Technician van inventory management"
          breadcrumbs={[
            { label: "Field Service", href: "/field-service" },
            { label: "Van Stock" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-2" /> Add Item
            </Button>
          }
        />
        <div className="ui-grid-auto">
          <KPICard
            title="Total Items"
            value={items.length}
            icon={<Package size={18} />}
            color="var(--color-primary)"
          />
          <KPICard
            title="Low Stock Alerts"
            value={lowStock.length}
            icon={<AlertTriangle size={18} />}
            color="var(--color-danger)"
          />
        </div>
        {lowStock.length > 0 && (
          <div className="ui-alert ui-alert-warning">
            <AlertTriangle size={16} /> {lowStock.length} item(s) below reorder
            point.
          </div>
        )}
        <Card padding="none">
          <DataTable
            columns={columns}
            data={items}
            rowKey={(r) => r.id}
            emptyTitle="No van stock"
            emptyMessage="Add items to technician vans."
            emptyIcon={<Truck size={48} />}
          />
        </Card>
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Add Van Stock"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Saving..." : "Add"}
              </Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField
              label="Technician ID"
              required
              value={form.technicianId}
              onChange={(e) =>
                setForm({ ...form, technicianId: e.target.value })
              }
            />
            <TextField
              label="Item ID"
              required
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            />
            <TextField
              label="Item Name"
              required
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
            />
            <TextField
              label="Quantity on Van"
              type="number"
              value={form.quantityOnVan}
              onChange={(e) =>
                setForm({ ...form, quantityOnVan: e.target.value })
              }
            />
            <div className="ui-grid-3 ui-gap-3">
              <TextField
                label="Min Stock"
                type="number"
                value={form.minStockLevel}
                onChange={(e) =>
                  setForm({ ...form, minStockLevel: e.target.value })
                }
              />
              <TextField
                label="Max Stock"
                type="number"
                value={form.maxStockLevel}
                onChange={(e) =>
                  setForm({ ...form, maxStockLevel: e.target.value })
                }
              />
              <TextField
                label="Reorder At"
                type="number"
                value={form.reorderPoint}
                onChange={(e) =>
                  setForm({ ...form, reorderPoint: e.target.value })
                }
              />
            </div>
            <TextField
              label="Location (shelf/bin)"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
