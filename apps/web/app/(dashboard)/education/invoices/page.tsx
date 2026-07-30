// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { ProtectedComponent } from "@unerp/ui";

const BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const api = {
  get: async (p: string) => { const r = await fetch(`${BASE}${p}`, { credentials: "include" }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  post: async (p: string, b?: unknown) => { const r = await fetch(`${BASE}${p}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: b ? JSON.stringify(b) : undefined }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
};
import { Plus, Loader2 } from "lucide-react";

export default function EducationInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    invoiceNumber: "",
    totalAmount: "0",
    dueDate: "",
    notes: "",
  });
  const [payForm, setPayForm] = useState({
    invoiceId: "",
    amount: "0",
    method: "CASH",
    reference: "",
  });
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [statusFilter]);
  async function loadData() {
    setLoading(true);
    try {
      const s = await api.get("/ext/education/deep/students");
      setStudents(s.data || []);
      const r = await api.get(
        "/ext/education/deep/invoices" +
          (statusFilter ? `?status=${statusFilter}` : ""),
      );
      setInvoices(r.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }
  async function createInvoice() {
    try {
      await api.post("/ext/education/deep/invoices", form);
      setShowForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }
  async function recordPayment() {
    try {
      await api.post(
        `/ext/education/deep/invoices/${payForm.invoiceId}/payments`,
        payForm,
      );
      setPayForm({ invoiceId: "", amount: "0", method: "CASH", reference: "" });
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Fee Invoices</h1>
        <ProtectedComponent permission="education.fees.create">
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </ProtectedComponent>
      </div>
      {showForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">Create Fee Invoice</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Student</label>
              <select
                className="ui-input"
                value={form.studentId}
                onChange={(e) =>
                  setForm({ ...form, studentId: e.target.value })
                }
              >
                <option value="">Select</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Invoice #</label>
              <input
                className="ui-input"
                value={form.invoiceNumber}
                onChange={(e) =>
                  setForm({ ...form, invoiceNumber: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Amount</label>
              <input
                className="ui-input"
                type="number"
                value={form.totalAmount}
                onChange={(e) =>
                  setForm({ ...form, totalAmount: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Due Date</label>
              <input
                className="ui-input"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn ui-btn-primary" onClick={createInvoice}>
              Create
            </button>
            <button
              className="ui-btn ui-btn-ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        <select
          className="ui-input w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="ui-card">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Student</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="font-medium">{inv.invoiceNumber}</td>
                    <td>
                      {inv.student?.firstName} {inv.student?.lastName}
                    </td>
                    <td>${inv.totalAmount}</td>
                    <td>${inv.paidAmount}</td>
                    <td>
                      {inv.dueDate
                        ? new Date(inv.dueDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <span
                        className={`ui-badge ${inv.status === "PAID" ? "ui-badge-success" : inv.status === "OVERDUE" ? "ui-badge-danger" : inv.status === "PARTIAL" ? "ui-badge-warning" : "ui-badge-info"}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      {inv.status !== "PAID" && (
                        <button
                          className="ui-btn ui-btn-sm ui-btn-outline"
                          onClick={() =>
                            setPayForm({ ...payForm, invoiceId: inv.id })
                          }
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payForm.invoiceId && (
            <div className="ui-card p-4 mt-4">
              <h4 className="font-semibold mb-2">Record Payment</h4>
              <div className="ui-grid-3">
                <div className="ui-form-group">
                  <label className="ui-label">Amount</label>
                  <input
                    className="ui-input"
                    type="number"
                    value={payForm.amount}
                    onChange={(e) =>
                      setPayForm({ ...payForm, amount: e.target.value })
                    }
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Method</label>
                  <select
                    className="ui-input"
                    value={payForm.method}
                    onChange={(e) =>
                      setPayForm({ ...payForm, method: e.target.value })
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Reference</label>
                  <input
                    className="ui-input"
                    value={payForm.reference}
                    onChange={(e) =>
                      setPayForm({ ...payForm, reference: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="ui-btn ui-btn-primary"
                  onClick={recordPayment}
                >
                  Record Payment
                </button>
                <button
                  className="ui-btn ui-btn-ghost"
                  onClick={() =>
                    setPayForm({
                      invoiceId: "",
                      amount: "0",
                      method: "CASH",
                      reference: "",
                    })
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
