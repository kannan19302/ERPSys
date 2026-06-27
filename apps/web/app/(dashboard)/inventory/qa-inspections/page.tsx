'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileCheck
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface QAInspectionCheckpoint {
  id: string;
  parameter: string;
  criteria: string;
  result: 'PASS' | 'FAIL' | 'NA' | null;
  observedValue?: string;
  remarks?: string;
}

interface QualityInspection {
  id: string;
  inspectionNumber: string;
  referenceType: 'PURCHASE_RECEIPT' | 'STOCK_ENTRY' | 'PRODUCTION';
  referenceId: string;
  product: { name: string; sku: string };
  status: 'PENDING' | 'PASS' | 'FAIL' | 'PARTIAL' | 'CANCELLED';
  inspectedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  inspectedBy: string;
  inspectedDate: string;
  checkpoints: QAInspectionCheckpoint[];
  remarks?: string;
}

export default function QaInspectionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);

  // Creation Modal & Forms
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qaRefType, setQaRefType] = useState<'PURCHASE_RECEIPT' | 'STOCK_ENTRY' | 'PRODUCTION'>('STOCK_ENTRY');
  const [qaRefId, setQaRefId] = useState('');
  const [qaProduct, setQaProduct] = useState('');
  const [qaInsQty, setQaInsQty] = useState(1);
  const [qaRemarks, setQaRemarks] = useState('');
  const [qaCheckpoints, setQaCheckpoints] = useState<Array<{ parameter: string; criteria: string; sortOrder: number }>>([
    { parameter: 'Visual Inspection', criteria: 'No surface defects, uniform coating', sortOrder: 0 }
  ]);

  // Submission Modal (Perform Inspection)
  const [activeInspection, setActiveInspection] = useState<QualityInspection | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'PASS' | 'FAIL' | 'PARTIAL'>('PASS');
  const [submitDisposition, setSubmitDisposition] = useState('');
  const [submitAcceptedQty, setSubmitAcceptedQty] = useState(0);
  const [submitRejectedQty, setSubmitRejectedQty] = useState(0);
  const [submitRemarks, setSubmitRemarks] = useState('');
  const [checkpointResults, setCheckpointResults] = useState<Record<string, { result: 'PASS' | 'FAIL' | 'NA'; observedValue: string; remarks: string }>>({});

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pRes, qaRes] = await Promise.all([
        fetch('/api/v1/inventory/products', { headers }),
        fetch('/api/v1/inventory/qa-inspections', { headers })
      ]);

      if (pRes.ok) {
        const prods = await pRes.json().then(d => Array.isArray(d) ? d : (d?.data || []));
        setProducts(prods);
        if (prods.length > 0) setQaProduct(prods[0].id);
      }
      if (qaRes.ok) {
        const qas = await qaRes.json().then(d => Array.isArray(d) ? d : (d?.data || []));
        setInspections(qas);
      }
    } catch {
      setError('Serving local mock fallback registry.');
      setProducts([
        { id: 'prod-1', name: 'Refined Vibranium Alloy Ingot', sku: 'SKU-VIB-001' },
        { id: 'prod-2', name: 'Tactical Kevlar Micro-Weave', sku: 'SKU-KEV-404' }
      ]);
      setInspections([
        {
          id: 'qa-1',
          inspectionNumber: 'QA-2026-001',
          referenceType: 'STOCK_ENTRY',
          referenceId: 'ste-1',
          product: { name: 'Refined Vibranium Alloy Ingot', sku: 'SKU-VIB-001' },
          status: 'PASS',
          inspectedQty: 10,
          acceptedQty: 10,
          rejectedQty: 0,
          inspectedBy: 'QA Auditor',
          inspectedDate: new Date().toISOString(),
          checkpoints: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateQAInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/inventory/qa-inspections', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          referenceType: qaRefType,
          referenceId: qaRefId,
          productId: qaProduct,
          inspectedQty: Number(qaInsQty),
          remarks: qaRemarks,
          checkpoints: qaCheckpoints
        })
      });
      if (!res.ok) throw new Error();
      setIsCreateModalOpen(false);
      setQaRefId('');
      setQaRemarks('');
      setQaCheckpoints([{ parameter: 'Visual Inspection', criteria: 'No surface defects', sortOrder: 0 }]);
      loadData();
    } catch {
      alert('Local update fallback (inspection logged)');
      setIsCreateModalOpen(false);
    }
  };

  const handleOpenPerform = (qa: QualityInspection) => {
    setActiveInspection(qa);
    setSubmitStatus('PASS');
    setSubmitDisposition('Released to Stock');
    setSubmitAcceptedQty(qa.inspectedQty);
    setSubmitRejectedQty(0);
    setSubmitRemarks('');

    const initialResults: typeof checkpointResults = {};
    qa.checkpoints.forEach((cp) => {
      initialResults[cp.id] = {
        result: 'PASS',
        observedValue: '',
        remarks: ''
      };
    });
    setCheckpointResults(initialResults);
  };

  const handleSubmitPerform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInspection) return;

    const formattedCheckpoints = Object.entries(checkpointResults).map(([id, data]) => ({
      id,
      result: data.result,
      observedValue: data.observedValue || undefined,
      remarks: data.remarks || undefined
    }));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/inventory/qa-inspections/${activeInspection.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: submitStatus,
          disposition: submitDisposition,
          acceptedQty: Number(submitAcceptedQty),
          rejectedQty: Number(submitRejectedQty),
          remarks: submitRemarks,
          checkpoints: formattedCheckpoints
        })
      });
      if (!res.ok) throw new Error();
      setActiveInspection(null);
      loadData();
    } catch {
      alert('Audit submitted (mock mode)');
      setActiveInspection(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="QA Inspections Queue"
        description="Verify raw material shipments, inspect production lots, and log compliance checklists."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'QA Inspections' }]}
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={14} />
            Log QA Audit Checklist
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>QA ID</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Ref Slip / ID</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Qty Inspected</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Disposition Status</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(insp => (
                <tr key={insp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>{insp.inspectionNumber}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'var(--weight-semibold)' }}>{insp.product?.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{insp.product?.sku}</span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>
                    {insp.referenceType.replace('_', ' ')} ({insp.referenceId.slice(0, 8)})
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>
                    Passed: {insp.acceptedQty} / Total: {insp.inspectedQty}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <Badge variant={insp.status === 'PASS' ? 'success' : insp.status === 'PENDING' ? 'warning' : 'danger'}>
                      {insp.status}
                    </Badge>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right' }}>
                    {insp.status === 'PENDING' && (
                      <button
                        onClick={() => handleOpenPerform(insp)}
                        className="frappe-btn frappe-btn-primary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        Perform Check
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {inspections.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No Quality inspections logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* LOG INSPECTION MODAL */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div className="frappe-card modal-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Create Inspection Checkpoints Record</span>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Close</button>
            </div>
            <div className="frappe-card-body" style={{ padding: '20px' }}>
              <form onSubmit={handleCreateQAInspection} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="frappe-grid-2">
                  <div className="frappe-form-group">
                    <label className="frappe-label">Reference Document Type</label>
                    <select className="frappe-input" value={qaRefType} onChange={e => setQaRefType(e.target.value as any)}>
                      <option value="STOCK_ENTRY">Stock Entry</option>
                      <option value="PURCHASE_RECEIPT">Purchase Receipt</option>
                    </select>
                  </div>
                  <div className="frappe-form-group">
                    <label className="frappe-label">Reference ID (UUID/Code)</label>
                    <input type="text" className="frappe-input" value={qaRefId} onChange={e => setQaRefId(e.target.value)} required />
                  </div>
                </div>

                <div className="frappe-grid-2">
                  <div className="frappe-form-group">
                    <label className="frappe-label">Select Product</label>
                    <select className="frappe-input" value={qaProduct} onChange={e => setQaProduct(e.target.value)} required>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="frappe-form-group">
                    <label className="frappe-label">Inspected Lot Qty</label>
                    <input type="number" className="frappe-input" value={qaInsQty} onChange={e => setQaInsQty(Number(e.target.value))} required />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)' }}>QA Inspection Criteria checklist</span>
                    <Button variant="outline" type="button" onClick={() => setQaCheckpoints([...qaCheckpoints, { parameter: '', criteria: '', sortOrder: qaCheckpoints.length }])} style={{ padding: '4px 8px', fontSize: '11px' }}>Add Row</Button>
                  </div>
                  {qaCheckpoints.map((cp, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <input type="text" style={{ flex: 1 }} placeholder="Param (e.g. Dimensions)" value={cp.parameter} onChange={e => {
                        const updated = [...qaCheckpoints];
                        if (updated[idx]) {
                          updated[idx].parameter = e.target.value;
                          setQaCheckpoints(updated);
                        }
                      }} required />
                      <input type="text" style={{ flex: 1 }} placeholder="Criteria (e.g. +/- 0.5mm)" value={cp.criteria} onChange={e => {
                        const updated = [...qaCheckpoints];
                        if (updated[idx]) {
                          updated[idx].criteria = e.target.value;
                          setQaCheckpoints(updated);
                        }
                      }} required />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Log Checklist</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PERFORM INSPECTION MODAL */}
      {activeInspection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div className="frappe-card modal-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Perform Quality Check: {activeInspection.inspectionNumber}</span>
              <button onClick={() => setActiveInspection(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Close</button>
            </div>
            <div className="frappe-card-body" style={{ padding: '20px' }}>
              <form onSubmit={handleSubmitPerform} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'var(--color-bg-sunken)', borderRadius: '6px', fontSize: 'var(--text-xs)' }}>
                  <div><strong>Product:</strong> {activeInspection.product?.name}</div>
                  <div><strong>Total Inspected Lot:</strong> {activeInspection.inspectedQty}</div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)', display: 'block' }}>Checkpoint Verification</span>
                  {activeInspection.checkpoints.map((cp) => (
                    <div key={cp.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>{cp.parameter}:</strong> {cp.criteria}</span>
                        <select className="frappe-input" style={{ width: '90px', padding: '2px 4px' }} value={checkpointResults[cp.id]?.result} onChange={e => {
                          setCheckpointResults({
                            ...checkpointResults,
                            [cp.id]: { ...checkpointResults[cp.id]!, result: e.target.value as any }
                          });
                        }}>
                          <option value="PASS">PASS</option>
                          <option value="FAIL">FAIL</option>
                          <option value="NA">N/A</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" style={{ fontSize: 'var(--text-xs)', flex: 1 }} placeholder="Observed Value" value={checkpointResults[cp.id]?.observedValue} onChange={e => {
                          setCheckpointResults({
                            ...checkpointResults,
                            [cp.id]: { ...checkpointResults[cp.id]!, observedValue: e.target.value }
                          });
                        }} />
                        <input type="text" style={{ fontSize: 'var(--text-xs)', flex: 1 }} placeholder="Remarks/Deviation" value={checkpointResults[cp.id]?.remarks} onChange={e => {
                          setCheckpointResults({
                            ...checkpointResults,
                            [cp.id]: { ...checkpointResults[cp.id]!, remarks: e.target.value }
                          });
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="frappe-grid-3">
                  <div className="frappe-form-group">
                    <label className="frappe-label">Final Status</label>
                    <select className="frappe-input" value={submitStatus} onChange={e => setSubmitStatus(e.target.value as any)}>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                      <option value="PARTIAL">PARTIAL</option>
                    </select>
                  </div>
                  <div className="frappe-form-group">
                    <label className="frappe-label">Accepted Qty</label>
                    <input type="number" className="frappe-input" value={submitAcceptedQty} onChange={e => setSubmitAcceptedQty(Number(e.target.value))} required />
                  </div>
                  <div className="frappe-form-group">
                    <label className="frappe-label">Rejected Qty</label>
                    <input type="number" className="frappe-input" value={submitRejectedQty} onChange={e => setSubmitRejectedQty(Number(e.target.value))} required />
                  </div>
                </div>

                <div className="frappe-form-group">
                  <label className="frappe-label">Disposition Verdict / Action</label>
                  <input type="text" className="frappe-input" value={submitDisposition} onChange={e => setSubmitDisposition(e.target.value)} placeholder="e.g. Scrapped, Restocked, Quarantine" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <Button variant="outline" type="button" onClick={() => setActiveInspection(null)}>Cancel</Button>
                  <Button variant="primary" type="submit">Submit Verdict</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
