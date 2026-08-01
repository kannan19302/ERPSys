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
  patch: async (p: string, b?: unknown) => {
    const r = await fetch(`${BASE}${p}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: b ? JSON.stringify(b) : undefined,
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};
import { Plus, Loader2 } from "lucide-react";

export default function HealthcareInsurancePage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"policies" | "claims">("policies");
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [policyForm, setPolicyForm] = useState({
    patientId: "",
    providerName: "",
    policyNumber: "",
    coverageType: "MEDICAL",
    startDate: "",
    endDate: "",
    deductible: "0",
    copay: "0",
  });
  const [claimForm, setClaimForm] = useState({
    policyId: "",
    claimNumber: "",
    serviceDate: "",
    billedAmount: "0",
    diagnosisCode: "",
    procedureCode: "",
  });

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
      const [p, c] = await Promise.all([
        api.get("/ext/healthcare/deep/insurance/policies"),
        api.get("/ext/healthcare/deep/insurance/claims"),
      ]);
      setPolicies(p.data || []);
      setClaims(c.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }
  async function createPolicy() {
    try {
      await api.post("/ext/healthcare/deep/insurance/policies", policyForm);
      setShowPolicyForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }
  async function createClaim() {
    try {
      await api.post("/ext/healthcare/deep/insurance/claims", claimForm);
      setShowClaimForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }
  async function updateClaimStatus(id: string, status: string) {
    try {
      await api.patch(`/ext/healthcare/deep/insurance/claims/${id}/status`, {
        status,
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Insurance Management</h1>
        <div className="flex gap-2">
          <ProtectedComponent permission="healthcare.insurance.create">
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => {
                setActiveTab("policies");
                setShowPolicyForm(true);
              }}
            >
              <Plus className="w-4 h-4" /> New Policy
            </button>
          </ProtectedComponent>
          <ProtectedComponent permission="healthcare.insurance.create">
            <button
              className="ui-btn ui-btn-outline"
              onClick={() => {
                setActiveTab("claims");
                setShowClaimForm(true);
              }}
            >
              <Plus className="w-4 h-4" /> New Claim
            </button>
          </ProtectedComponent>
        </div>
      </div>
      <div className="flex gap-1 mb-4 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "policies" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          onClick={() => setActiveTab("policies")}
        >
          Policies ({policies.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "claims" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          onClick={() => setActiveTab("claims")}
        >
          Claims ({claims.length})
        </button>
      </div>
      {showPolicyForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">New Insurance Policy</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Patient</label>
              <select
                className="ui-input"
                value={policyForm.patientId}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, patientId: e.target.value })
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
              <label className="ui-label">Provider</label>
              <input
                className="ui-input"
                value={policyForm.providerName}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, providerName: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Policy #</label>
              <input
                className="ui-input"
                value={policyForm.policyNumber}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, policyNumber: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Coverage Type</label>
              <select
                className="ui-input"
                value={policyForm.coverageType}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, coverageType: e.target.value })
                }
              >
                <option value="MEDICAL">Medical</option>
                <option value="DENTAL">Dental</option>
                <option value="VISION">Vision</option>
                <option value="PHARMACY">Pharmacy</option>
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Start Date</label>
              <input
                className="ui-input"
                type="date"
                value={policyForm.startDate}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, startDate: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Deductible</label>
              <input
                className="ui-input"
                type="number"
                value={policyForm.deductible}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, deductible: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn ui-btn-primary" onClick={createPolicy}>
              Save
            </button>
            <button
              className="ui-btn ui-btn-ghost"
              onClick={() => setShowPolicyForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showClaimForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">New Insurance Claim</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Policy</label>
              <select
                className="ui-input"
                value={claimForm.policyId}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, policyId: e.target.value })
                }
              >
                <option value="">Select</option>
                {policies.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.providerName} - {p.policyNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Claim #</label>
              <input
                className="ui-input"
                value={claimForm.claimNumber}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, claimNumber: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Service Date</label>
              <input
                className="ui-input"
                type="date"
                value={claimForm.serviceDate}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, serviceDate: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Billed Amount</label>
              <input
                className="ui-input"
                type="number"
                value={claimForm.billedAmount}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, billedAmount: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Diagnosis Code</label>
              <input
                className="ui-input"
                value={claimForm.diagnosisCode}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, diagnosisCode: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Procedure Code</label>
              <input
                className="ui-input"
                value={claimForm.procedureCode}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, procedureCode: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn ui-btn-primary" onClick={createClaim}>
              Submit
            </button>
            <button
              className="ui-btn ui-btn-ghost"
              onClick={() => setShowClaimForm(false)}
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
          {activeTab === "policies" ? (
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Provider</th>
                  <th>Policy #</th>
                  <th>Coverage</th>
                  <th>Status</th>
                  <th>Deductible</th>
                  <th>Claims</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p: any) => (
                  <tr key={p.id}>
                    <td className="font-medium">
                      {p.patient?.firstName} {p.patient?.lastName}
                    </td>
                    <td>{p.providerName}</td>
                    <td>{p.policyNumber}</td>
                    <td>{p.coverageType}</td>
                    <td>
                      <span
                        className={`ui-badge ${p.status === "ACTIVE" ? "ui-badge-success" : "ui-badge-danger"}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>${p.deductible}</td>
                    <td>{p.claims?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Policy</th>
                  <th>Service Date</th>
                  <th>Billed</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c: any) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.claimNumber}</td>
                    <td>{c.policy?.providerName}</td>
                    <td>{new Date(c.serviceDate).toLocaleDateString()}</td>
                    <td>${c.billedAmount}</td>
                    <td>{c.paidAmount ? `$${c.paidAmount}` : "-"}</td>
                    <td>
                      <span
                        className={`ui-badge ${c.status === "PAID" ? "ui-badge-success" : c.status === "DENIED" ? "ui-badge-danger" : "ui-badge-info"}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {c.status === "SUBMITTED" && (
                          <button
                            className="ui-btn ui-btn-sm ui-btn-outline"
                            onClick={() => updateClaimStatus(c.id, "IN_REVIEW")}
                          >
                            Review
                          </button>
                        )}
                        {c.status === "IN_REVIEW" && (
                          <button
                            className="ui-btn ui-btn-sm ui-btn-success"
                            onClick={() => updateClaimStatus(c.id, "APPROVED")}
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
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
