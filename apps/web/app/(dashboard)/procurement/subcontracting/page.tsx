"use client";
import { useState, useEffect } from "react";
import { PageHeader, Button, Badge, Spinner, Modal, DataTable } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { ProcurementTabLayout, PROCUREMENT_TABS } from "@/components/procurement/ProcurementTabLayout";
import { ShoppingCart, Plus } from "lucide-react";

export default function SubcontractingPage() {
  const client = useApiClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vendorId: "", productId: "", quantity: 1, unitCost: 0, deliveryDate: "" });

  const load = () => {
    setLoading(true);
    client.get("/procurement/expansion/subcontracting").then((res: any) => { setOrders(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await client.post("/procurement/expansion/subcontracting", form);
    setShowCreate(false);
    setForm({ vendorId: "", productId: "", quantity: 1, unitCost: 0, deliveryDate: "" });
    load();
  };

  const statusVariant = (s: string): "default" | "success" | "warning" | "danger" | "info" | "primary" =>
    ({ SENT: "primary", MATERIALS_SHIPPED: "info", RECEIVED: "success", COMPLETED: "success", CANCELLED: "danger" } as Record<string, "default" | "success" | "warning" | "danger" | "info" | "primary">)[s] || "default";

  const columns = [
    { key: "id", header: "ID" },
    { key: "status", header: "Status", render: (row: any) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge> },
    { key: "vendor", header: "Vendor", render: (row: any) => row.vendor?.name },
    { key: "product", header: "Product", render: (row: any) => row.product?.name },
    { key: "quantity", header: "Qty" },
    { key: "totalCost", header: "Total Cost", render: (row: any) => `$${Number(row.totalCost).toLocaleString()}` },
    { key: "deliveryDate", header: "Delivery", render: (row: any) => row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString() : "—" },
  ];

  return (
    <RouteGuard permission="procurement.purchase-order.read">
      <ProcurementTabLayout tabs={PROCUREMENT_TABS} moduleId="procurement" moduleLabel="Procurement" moduleIcon={ShoppingCart} moduleDescription="Manage procurement operations including purchase orders, vendors, and supplier quality.">
        <PageHeader title="Subcontracting Orders" description="Manage subcontracting orders and material shipments to vendors" actions={<Button onClick={() => setShowCreate(true)}><Plus size={16} /> New Order</Button>} />

        {loading ? <Spinner /> : (
          <DataTable
            columns={columns}
            data={orders}
            onRowClick={(r: any) => {}}
          />
        )}

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Subcontracting Order">
          <div className="ui-form-group">
            <label className="ui-label">Vendor ID</label>
            <input className="ui-input" value={form.vendorId} onChange={e => setForm({ ...form, vendorId: e.target.value })} />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Product ID</label>
            <input className="ui-input" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} />
          </div>
          <div className="ui-grid-2">
            <div className="ui-form-group">
              <label className="ui-label">Quantity</label>
              <input className="ui-input" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Unit Cost</label>
              <input className="ui-input" type="number" step="0.01" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: Number(e.target.value) })} />
            </div>
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Delivery Date</label>
            <input className="ui-input" type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} />
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </Modal>
      </ProcurementTabLayout>
    </RouteGuard>
  );
}
