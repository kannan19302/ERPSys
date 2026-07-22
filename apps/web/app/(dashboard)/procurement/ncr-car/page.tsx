"use client";
import { useState, useEffect } from "react";
import { PageHeader, Button, Badge, Spinner, Tabs, Modal, DataTable } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { ProcurementTabLayout, PROCUREMENT_TABS } from "@/components/procurement/ProcurementTabLayout";
import { ShoppingCart, Plus } from "lucide-react";

export default function NcrCarPage() {
  const client = useApiClient();
  const [tab, setTab] = useState("ncr");
  const [ncrs, setNcrs] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNcrForm, setShowNcrForm] = useState(false);
  const [showCarForm, setShowCarForm] = useState<string | null>(null);
  const [ncrForm, setNcrForm] = useState({ vendorId: "", productId: "", defectType: "DIMENSIONAL", severity: "MINOR", defectQty: 0, totalQty: 0, description: "" });
  const [carForm, setCarForm] = useState({ rootCause: "", correctiveAction: "", dueDate: "" });

  const loadNcrs = () => {
    setLoading(true);
    client.get("/procurement/expansion/ncr").then((res: any) => { setNcrs(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  };

  const loadCars = () => {
    setLoading(true);
    client.get("/procurement/expansion/car").then((res: any) => { setCars(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { if (tab === "ncr") loadNcrs(); else loadCars(); }, [tab]);

  const createNcr = async () => {
    await client.post("/procurement/expansion/ncr", ncrForm);
    setShowNcrForm(false);
    setNcrForm({ vendorId: "", productId: "", defectType: "DIMENSIONAL", severity: "MINOR", defectQty: 0, totalQty: 0, description: "" });
    loadNcrs();
  };

  const createCar = async (ncrId: string) => {
    await client.post(`/procurement/expansion/ncr/${ncrId}/car`, carForm);
    setShowCarForm(null);
    setCarForm({ rootCause: "", correctiveAction: "", dueDate: "" });
    loadNcrs();
  };

  const severityVariant = (s: string): "default" | "success" | "warning" | "danger" | "info" | "primary" =>
    ({ MINOR: "success", MAJOR: "warning", CRITICAL: "danger" } as Record<string, "default" | "success" | "warning" | "danger" | "info" | "primary">)[s] || "default";
  const statusVariant = (s: string): "default" | "success" | "warning" | "danger" | "info" | "primary" =>
    ({ OPEN: "danger", UNDER_REVIEW: "warning", CAR_RAISED: "info", CLOSED: "success" } as Record<string, "default" | "success" | "warning" | "danger" | "info" | "primary">)[s] || "default";

  const ncrColumns = [
    { key: "ncrNumber", header: "NCR #" },
    { key: "vendor", header: "Vendor", render: (row: any) => row.vendor?.name },
    { key: "defectType", header: "Defect Type" },
    { key: "severity", header: "Severity", render: (row: any) => <Badge variant={severityVariant(row.severity)}>{row.severity}</Badge> },
    { key: "defectQty", header: "Defect Qty" },
    { key: "status", header: "Status", render: (row: any) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge> },
    { key: "createdAt", header: "Date", render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
    { key: "actions", header: "", render: (row: any) => row.status === "OPEN" ? <Button size="sm" onClick={() => setShowCarForm(row.id)}>Raise CAR</Button> : null },
  ];

  const carColumns = [
    { key: "carNumber", header: "CAR #" },
    { key: "vendor", header: "Vendor", render: (row: any) => row.vendor?.name },
    { key: "ncr", header: "NCR", render: (row: any) => row.ncr?.ncrNumber },
    { key: "rootCause", header: "Root Cause" },
    { key: "status", header: "Status", render: (row: any) => <Badge>{row.status}</Badge> },
    { key: "dueDate", header: "Due", render: (row: any) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "—" },
  ];

  return (
    <RouteGuard permission="procurement.purchase-order.read">
      <ProcurementTabLayout tabs={PROCUREMENT_TABS} moduleId="procurement" moduleLabel="Procurement" moduleIcon={ShoppingCart} moduleDescription="Manage procurement operations including purchase orders, vendors, and supplier quality.">
        <PageHeader title="Supplier NCR & CAR" description="Non-conformance reports and corrective action requests" actions={<Button onClick={() => setShowNcrForm(true)}><Plus size={16} /> New NCR</Button>} />

        <Tabs value={tab} onChange={setTab} tabs={[{ key: "ncr", label: "Non-Conformance Reports" }, { key: "car", label: "Corrective Action Requests" }]} />

        {loading ? <Spinner /> : tab === "ncr" ? (
          <DataTable columns={ncrColumns} data={ncrs} />
        ) : (
          <DataTable columns={carColumns} data={cars} />
        )}

        <Modal open={showNcrForm} onClose={() => setShowNcrForm(false)} title="Create NCR">
          <div className="ui-form-group"><label className="ui-label">Vendor ID</label><input className="ui-input" value={ncrForm.vendorId} onChange={e => setNcrForm({ ...ncrForm, vendorId: e.target.value })} /></div>
          <div className="ui-form-group"><label className="ui-label">Description</label><textarea className="ui-input" value={ncrForm.description} onChange={e => setNcrForm({ ...ncrForm, description: e.target.value })} /></div>
          <div className="ui-grid-3">
            <div className="ui-form-group"><label className="ui-label">Defect Type</label><select className="ui-input" value={ncrForm.defectType} onChange={e => setNcrForm({ ...ncrForm, defectType: e.target.value })}><option>DIMENSIONAL</option><option>COSMETIC</option><option>FUNCTIONAL</option><option>DOCUMENTATION</option></select></div>
            <div className="ui-form-group"><label className="ui-label">Severity</label><select className="ui-input" value={ncrForm.severity} onChange={e => setNcrForm({ ...ncrForm, severity: e.target.value })}><option>MINOR</option><option>MAJOR</option><option>CRITICAL</option></select></div>
            <div className="ui-form-group"><label className="ui-label">Defect Qty</label><input className="ui-input" type="number" value={ncrForm.defectQty} onChange={e => setNcrForm({ ...ncrForm, defectQty: Number(e.target.value) })} /></div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowNcrForm(false)}>Cancel</Button>
            <Button onClick={createNcr}>Create NCR</Button>
          </div>
        </Modal>

        <Modal open={!!showCarForm} onClose={() => setShowCarForm(null)} title="Raise Corrective Action Request">
          <div className="ui-form-group"><label className="ui-label">Root Cause</label><textarea className="ui-input" value={carForm.rootCause} onChange={e => setCarForm({ ...carForm, rootCause: e.target.value })} /></div>
          <div className="ui-form-group"><label className="ui-label">Corrective Action</label><textarea className="ui-input" value={carForm.correctiveAction} onChange={e => setCarForm({ ...carForm, correctiveAction: e.target.value })} /></div>
          <div className="ui-form-group"><label className="ui-label">Due Date</label><input className="ui-input" type="date" value={carForm.dueDate} onChange={e => setCarForm({ ...carForm, dueDate: e.target.value })} /></div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowCarForm(null)}>Cancel</Button>
            <Button onClick={() => showCarForm && createCar(showCarForm)}>Raise CAR</Button>
          </div>
        </Modal>
      </ProcurementTabLayout>
    </RouteGuard>
  );
}
