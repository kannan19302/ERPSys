"use client";
import { useState, useEffect } from "react";
import { ProtectedComponent } from "@unerp/ui";

const BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const api = {
  get: async (p: string) => {
    const r = await fetch(`${BASE}${p}`, { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  post: async (p: string, b?: unknown) => {
    const r = await fetch(`${BASE}${p}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: b ? JSON.stringify(b) : undefined,
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};
import { Plus, Loader2, AlertTriangle } from "lucide-react";

export default function HealthcarePharmacyPage() {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "inventory" | "batches" | "controlled"
  >("inventory");
  const [showDrugForm, setShowDrugForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [drugForm, setDrugForm] = useState({ name: "", isControlled: false });
  const [batchForm, setBatchForm] = useState({
    drugId: "",
    batchNumber: "",
    quantity: "0",
    expiryDate: "",
    unitCost: "0",
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [dispenseForm, setDispenseForm] = useState({
    drugId: "",
    patientId: "",
    quantity: "1",
    administeredBy: "",
  });
  const [controlledLogs, setControlledLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    api
      .get("/ext/healthcare/patients")
      .then((r: any) => setPatients(r.data || []))
      .catch(() => {});
  }, []);
  async function loadData() {
    setLoading(true);
    try {
      const [d, l] = await Promise.all([
        api.get("/ext/healthcare/deep/drugs"),
        api.get("/ext/healthcare/deep/pharmacy/controlled-logs"),
      ]);
      setDrugs(d.data || []);
      setControlledLogs(l.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }
  async function createDrug() {
    try {
      await api.post("/ext/healthcare/deep/drugs", drugForm);
      setShowDrugForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }
  async function createBatch() {
    try {
      await api.post("/ext/healthcare/deep/pharmacy/batches", batchForm);
      setShowBatchForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }
  async function dispenseDrug() {
    try {
      await api.post("/ext/healthcare/deep/pharmacy/dispense", dispenseForm);
      loadData();
    } catch (e: any) {
      alert(e.message || "Error");
    }
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Pharmacy</h1>
        <div className="flex gap-2">
          <ProtectedComponent permission="healthcare.pharmacy.create">
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => setShowDrugForm(true)}
            >
              <Plus className="w-4 h-4" /> New Drug
            </button>
          </ProtectedComponent>
          <ProtectedComponent permission="healthcare.pharmacy.create">
            <button
              className="ui-btn ui-btn-outline"
              onClick={() => setShowBatchForm(true)}
            >
              <Plus className="w-4 h-4" /> Add Batch
            </button>
          </ProtectedComponent>
        </div>
      </div>
      <div className="flex gap-1 mb-4 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "inventory" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory ({drugs.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "batches" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          onClick={() => setActiveTab("batches")}
        >
          Batches
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "controlled" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          onClick={() => setActiveTab("controlled")}
        >
          Controlled Substance Log
        </button>
      </div>
      {showDrugForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">New Drug</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Name</label>
              <input
                className="ui-input"
                value={drugForm.name}
                onChange={(e) =>
                  setDrugForm({ ...drugForm, name: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={drugForm.isControlled}
                  onChange={(e) =>
                    setDrugForm({ ...drugForm, isControlled: e.target.checked })
                  }
                />{" "}
                Controlled Substance
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn ui-btn-primary" onClick={createDrug}>
              Save
            </button>
            <button
              className="ui-btn ui-btn-ghost"
              onClick={() => setShowDrugForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showBatchForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">Add Batch</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Drug</label>
              <select
                className="ui-input"
                value={batchForm.drugId}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, drugId: e.target.value })
                }
              >
                <option value="">Select</option>
                {drugs.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Batch #</label>
              <input
                className="ui-input"
                value={batchForm.batchNumber}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, batchNumber: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Quantity</label>
              <input
                className="ui-input"
                type="number"
                value={batchForm.quantity}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, quantity: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Expiry Date</label>
              <input
                className="ui-input"
                type="date"
                value={batchForm.expiryDate}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, expiryDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn ui-btn-primary" onClick={createBatch}>
              Save
            </button>
            <button
              className="ui-btn ui-btn-ghost"
              onClick={() => setShowBatchForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="ui-card">
          {activeTab === "inventory" && (
            <>
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Drug</th>
                    <th>Stock</th>
                    <th>Controlled</th>
                    <th>Batches</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drugs.map((d: any) => (
                    <tr key={d.id}>
                      <td className="font-medium">{d.name}</td>
                      <td>
                        <span
                          className={
                            d.quantity < 10 ? "text-red-600 font-semibold" : ""
                          }
                        >
                          {d.quantity}
                        </span>
                      </td>
                      <td>
                        {d.isControlled ? (
                          <span className="ui-badge ui-badge-danger">Yes</span>
                        ) : (
                          <span className="ui-badge ui-badge-info">No</span>
                        )}
                      </td>
                      <td>{d.batches?.length || 0}</td>
                      <td>
                        <div className="flex gap-1">
                          {d.quantity > 0 && (
                            <button
                              className="ui-btn ui-btn-sm ui-btn-outline"
                              onClick={() => {
                                setDispenseForm({
                                  ...dispenseForm,
                                  drugId: d.id,
                                });
                              }}
                            >
                              Dispense
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dispenseForm.drugId && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">
                    Dispense{" "}
                    {drugs.find((d) => d.id === dispenseForm.drugId)?.name}
                  </h4>
                  <div className="ui-grid-3">
                    <div className="ui-form-group">
                      <label className="ui-label">Patient</label>
                      <select
                        className="ui-input"
                        value={dispenseForm.patientId}
                        onChange={(e) =>
                          setDispenseForm({
                            ...dispenseForm,
                            patientId: e.target.value,
                          })
                        }
                      >
                        <option value="">Select</option>
                        {patients.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Quantity</label>
                      <input
                        className="ui-input"
                        type="number"
                        value={dispenseForm.quantity}
                        onChange={(e) =>
                          setDispenseForm({
                            ...dispenseForm,
                            quantity: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Administered By</label>
                      <input
                        className="ui-input"
                        value={dispenseForm.administeredBy}
                        onChange={(e) =>
                          setDispenseForm({
                            ...dispenseForm,
                            administeredBy: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="ui-btn ui-btn-primary mt-2"
                    onClick={dispenseDrug}
                  >
                    Dispense
                  </button>
                </div>
              )}
            </>
          )}
          {activeTab === "batches" && (
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Drug</th>
                  <th>Batch #</th>
                  <th>Qty</th>
                  <th>Remaining</th>
                  <th>Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {drugs.flatMap((d: any) =>
                  (d.batches || []).map((b: any) => (
                    <tr key={b.id}>
                      <td>{d.name}</td>
                      <td>{b.batchNumber}</td>
                      <td>{b.quantity}</td>
                      <td>{b.remainingQty}</td>
                      <td
                        className={
                          b.expiryDate && new Date(b.expiryDate) < new Date()
                            ? "text-red-600"
                            : ""
                        }
                      >
                        {b.expiryDate
                          ? new Date(b.expiryDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        <span
                          className={`ui-badge ${b.status === "ACTIVE" ? "ui-badge-success" : "ui-badge-danger"}`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  )),
                )}
                )
              </tbody>
            </table>
          )}
          {activeTab === "controlled" && (
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Drug</th>
                  <th>Action</th>
                  <th>Qty</th>
                  <th>Administered By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {controlledLogs.map((l: any) => (
                  <tr key={l.id}>
                    <td>{l.drug?.name}</td>
                    <td>
                      <span className="ui-badge ui-badge-warning">
                        {l.action}
                      </span>
                    </td>
                    <td>{l.quantity}</td>
                    <td>{l.administeredBy}</td>
                    <td>{new Date(l.loggedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
