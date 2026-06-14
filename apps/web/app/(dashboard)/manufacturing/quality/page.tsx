'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface CheckItem {
  parameter: string;
  minVal: number;
  maxVal: number;
}

interface QualityPlan {
  id: string;
  name: string;
  code: string;
  productId: string;
  checks: Array<CheckItem>;
  status: string;
}

interface NonConformanceReport {
  id: string;
  title: string;
  description: string | null;
  disposition: string;
  status: string;
  loggedBy: string | null;
  resolvedBy: string | null;
  createdAt: string;
  product: Product;
  workOrder?: {
    workOrderNumber: string;
  } | null;
}

export default function QualityManagement() {
  const [plans, setPlans] = useState<QualityPlan[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New Plan Form State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    productId: '',
    name: '',
    code: '',
    checks: '[{"parameter": "Thickness Check (mm)", "minVal": 1.4, "maxVal": 1.6}]',
  });

  // Log Inspection Form State
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [inspectForm, setInspectForm] = useState({
    inspectionNumber: '',
    referenceType: 'Work Order',
    referenceId: '',
    productId: '',
    status: 'PASSED',
    inspectedQty: '10',
    passedQty: '10',
    inspectedBy: 'admin@unerp.dev',
    checklistJson: '[{"parameter": "Thickness Check", "target": "1.5", "actual": "1.5", "status": "PASS"}]',
  });

  // NCR Resolve Modal State
  const [isNcrModalOpen, setIsNcrModalOpen] = useState(false);
  const [selectedNcr, setSelectedNcr] = useState<NonConformanceReport | null>(null);
  const [ncrForm, setNcrForm] = useState({
    disposition: 'REWORK',
    status: 'RESOLVED',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [plansRes, ncrRes, productsRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/manufacturing/quality/plans', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/manufacturing/quality/ncr', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/inventory/products', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (plansRes.ok) setPlans(await plansRes.json());
      if (ncrRes.ok) setNcrs(await ncrRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/quality/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPlan),
      });

      if (!res.ok) throw new Error('Failed to create quality plan');
      setIsPlanModalOpen(false);
      setNewPlan({ productId: '', name: '', code: '', checks: '[{"parameter": "Thickness Check (mm)", "minVal": 1.4, "maxVal": 1.6}]' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleLogInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/quality/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...inspectForm,
          inspectedQty: parseFloat(inspectForm.inspectedQty),
          passedQty: parseFloat(inspectForm.passedQty),
        }),
      });

      if (!res.ok) throw new Error('Failed to record inspection');
      setIsInspectModalOpen(false);
      alert('Inspection checklist recorded successfully!');
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleOpenNcrModal = (ncr: NonConformanceReport) => {
    setSelectedNcr(ncr);
    setNcrForm({
      disposition: ncr.disposition,
      status: 'RESOLVED',
    });
    setIsNcrModalOpen(true);
  };

  const handleResolveNcr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNcr) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/manufacturing/quality/ncr/${selectedNcr.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ncrForm),
      });

      if (!res.ok) throw new Error('Failed to resolve NCR record');
      setIsNcrModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldCheck size={28} style={{ color: 'var(--color-primary)' }} />
            Quality Control & NCR Log
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Manage quality inspection plans, log test checklists, and track non-conformance reports.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            onClick={() => setIsPlanModalOpen(true)}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-2.5) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
              color: 'var(--color-text)'
            }}
          >
            Create Inspection Plan
          </button>
          <button
            onClick={() => setIsInspectModalOpen(true)}
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              padding: 'var(--space-2.5) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
            }}
          >
            Log Inspection Run
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading quality logs...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
          {/* Non Conformance Reports */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)' }}>Non-Conformance Reports (NCR)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {ncrs.map((ncr) => (
                <div
                  key={ncr.id}
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{ncr.title}</h4>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      background: ncr.status === 'RESOLVED' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                      color: ncr.status === 'RESOLVED' ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>
                      {ncr.status}
                    </span>
                  </div>

                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{ncr.description}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                      <span><strong>Product:</strong> {ncr.product.name} ({ncr.product.sku})</span>
                      {ncr.workOrder && <span style={{ marginLeft: '10px' }}><strong>WO:</strong> {ncr.workOrder.workOrderNumber}</span>}
                    </div>
                    <div>
                      {ncr.status === 'OPEN' ? (
                        <button
                          onClick={() => handleOpenNcrModal(ncr)}
                          style={{
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            padding: 'var(--space-1) var(--space-2.5)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Resolve NCR
                        </button>
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                          Resolved by: {ncr.resolvedBy || 'QC Team'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {ncrs.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
                  No active NCR issues logged.
                </div>
              )}
            </div>
          </div>

          {/* Quality Standards & Plans */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)' }}>Inspection Gate Templates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-4)',
                  }}
                >
                  <p style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{plan.name}</p>
                  <p style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold', marginTop: '2px' }}>Code: {plan.code}</p>
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Parameter Checks:</p>
                    <ul style={{ paddingLeft: 'var(--space-4)', marginTop: '4px', fontSize: 'var(--text-xs)' }}>
                      {(typeof plan.checks === 'string' ? JSON.parse(plan.checks) : plan.checks).map((check: CheckItem, idx: number) => (
                        <li key={idx} style={{ color: 'var(--color-text-secondary)' }}>
                          {check.parameter}: Min {check.minVal} / Max {check.maxVal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
              {plans.length === 0 && (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No custom plans created yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {isPlanModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreatePlan} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '450px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Create Quality Inspection Plan</h3>
            
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Associate Product</label>
              <select required value={newPlan.productId} onChange={(e) => setNewPlan({ ...newPlan, productId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="">Select Product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Plan Template Name</label>
              <input required type="text" placeholder="e.g. Outgoing QC Standards" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Plan Code</label>
              <input required type="text" placeholder="e.g. QP-LAP-01" value={newPlan.code} onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Checks Configuration (JSON Array)</label>
              <textarea required value={newPlan.checks} onChange={(e) => setNewPlan({ ...newPlan, checks: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)', height: '80px', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsPlanModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Save Plan</button>
            </div>
          </form>
        </div>
      )}

      {/* Inspect Modal */}
      {isInspectModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleLogInspection} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '450px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Record Inspection Checklist Results</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Audit Number</label>
                <input required type="text" placeholder="e.g. INSP-2026-001" value={inspectForm.inspectionNumber} onChange={(e) => setInspectForm({ ...inspectForm, inspectionNumber: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product ID</label>
                <select required value={inspectForm.productId} onChange={(e) => setInspectForm({ ...inspectForm, productId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Ref ID (WO or PO ID)</label>
                <input required type="text" placeholder="e.g. woId_cuid" value={inspectForm.referenceId} onChange={(e) => setInspectForm({ ...inspectForm, referenceId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status Result</label>
                <select value={inspectForm.status} onChange={(e) => setInspectForm({ ...inspectForm, status: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Inspected Qty</label>
                <input required type="number" min="1" value={inspectForm.inspectedQty} onChange={(e) => setInspectForm({ ...inspectForm, inspectedQty: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Passed Qty</label>
                <input required type="number" min="0" value={inspectForm.passedQty} onChange={(e) => setInspectForm({ ...inspectForm, passedQty: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Checklist Logging (JSON Array)</label>
              <textarea required value={inspectForm.checklistJson} onChange={(e) => setInspectForm({ ...inspectForm, checklistJson: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)', height: '60px', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsInspectModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Submit Audit</button>
            </div>
          </form>
        </div>
      )}

      {/* NCR Resolve Modal */}
      {isNcrModalOpen && selectedNcr && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleResolveNcr} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Resolve Non-Conformance Issue</h3>
            
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Set resolution status and material disposition path for: <strong>{selectedNcr.title}</strong>
            </p>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Material Disposition Path</label>
              <select value={ncrForm.disposition} onChange={(e) => setNcrForm({ ...ncrForm, disposition: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="REWORK">Rework (Fix & test again)</option>
                <option value="SCRAP">Scrap (Dispose material completely)</option>
                <option value="ACCEPT_AS_IS">Accept As-Is (Minor cosmetic deviations)</option>
                <option value="RETURN_TO_VENDOR">Return to Vendor (Component defect)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Resolution State</label>
              <select value={ncrForm.status} onChange={(e) => setNcrForm({ ...ncrForm, status: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="RESOLVED">RESOLVED</option>
                <option value="OPEN">OPEN / DELAYED</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsNcrModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Submit Resolution</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
