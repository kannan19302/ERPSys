'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface QualityInspection {
  id: string;
  inspectionNumber: string;
  referenceType: string;
  referenceId: string;
  product: { name: string; sku: string };
  status: 'PENDING' | 'PASSED' | 'FAILED';
  inspectedQty: number;
  passedQty: number;
  rejectedQty: number;
  inspectedBy: string;
  inspectedDate: string;
  checklist: Array<{ parameter: string; status: 'PASS' | 'FAIL'; reading?: string }>;
}

export default function QaInspectionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);

  // Modal & Forms
  const [isQaModalOpen, setIsQaModalOpen] = useState(false);
  const [qaRefType, setQaRefType] = useState('Stock Entry');
  const [qaRefId, setQaRefId] = useState('');
  const [qaProduct, setQaProduct] = useState('');
  const [qaInsQty, setQaInsQty] = useState(1);
  const [qaPassQty, setQaPassQty] = useState(1);
  const [qaRejQty, setQaRejQty] = useState(0);
  const [qaChecklist, setQaChecklist] = useState<Array<{ parameter: string; status: 'PASS' | 'FAIL'; reading?: string }>>([
    { parameter: 'Visual Verification', status: 'PASS' }
  ]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pRes, qaRes] = await Promise.all([
        fetch('/api/v1/inventory/products', { headers }),
        fetch('/api/v1/inventory/quality-inspections', { headers })
      ]);

      if (pRes.ok) {
        const prods = await pRes.json();
        setProducts(prods);
        if (prods.length > 0) setQaProduct(prods[0].id);
      }
      if (qaRes.ok) setInspections(await qaRes.json());
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
          referenceType: 'Stock Entry',
          referenceId: 'ste-1',
          product: { name: 'Refined Vibranium Alloy Ingot', sku: 'SKU-VIB-001' },
          status: 'PASSED',
          inspectedQty: 10,
          passedQty: 10,
          rejectedQty: 0,
          inspectedBy: 'QA Auditor',
          inspectedDate: new Date().toISOString(),
          checklist: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveQualityInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/inventory/quality-inspections', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          referenceType: qaRefType,
          referenceId: qaRefId,
          productId: qaProduct,
          inspectedQty: qaInsQty,
          passedQty: qaPassQty,
          rejectedQty: qaRejQty,
          checklist: qaChecklist
        })
      });
      if (!res.ok) throw new Error();
      setIsQaModalOpen(false);
      setQaRefId('');
      setQaChecklist([{ parameter: 'Visual Verification', status: 'PASS' }]);
      loadData();
    } catch {
      // Mock local update
      const selectedProdObj = products.find(p => p.id === qaProduct);
      const newMock: QualityInspection = {
        id: `qa-mock-${Date.now()}`,
        inspectionNumber: `QA-MOCK-${Math.floor(1000 + Math.random() * 9000)}`,
        referenceType: qaRefType,
        referenceId: qaRefId,
        product: {
          name: selectedProdObj?.name || 'Vibranium Ingot',
          sku: selectedProdObj?.sku || 'SKU-VIB-001'
        },
        status: qaRejQty > 0 ? 'FAILED' : 'PASSED',
        inspectedQty: qaInsQty,
        passedQty: qaPassQty,
        rejectedQty: qaRejQty,
        inspectedBy: 'Local Auditor',
        inspectedDate: new Date().toISOString(),
        checklist: qaChecklist
      };
      setInspections(prev => [newMock, ...prev]);
      setIsQaModalOpen(false);
      setQaRefId('');
      setQaChecklist([{ parameter: 'Visual Verification', status: 'PASS' }]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="QA Inspections"
        description="Verify raw material shipments, inspect production lots, and log compliance checklists."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'QA Inspections' }]}
        actions={
          <Button variant="primary" onClick={() => setIsQaModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={14} />
            Log QA Audit
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback registry)</span>
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
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Ref Type/ID</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Qty Checked</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Audit Date</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(insp => (
                <tr key={insp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>{insp.inspectionNumber}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{insp.product.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{insp.product.sku}</span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{insp.referenceType} ({insp.referenceId.slice(0, 8)})</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Passed: {Number(insp.passedQty)} / Total: {Number(insp.inspectedQty)}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <Badge variant={insp.status === 'PASSED' ? 'success' : 'danger'}>{insp.status}</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{new Date(insp.inspectedDate).toLocaleDateString()}</td>
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

      {/* CREATE QUALITY INSPECTION MODAL OVERLAY */}
      {isQaModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div className="frappe-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: 'var(--shadow-xl)', background: 'var(--color-bg-elevated)' }}>
            <div className="frappe-card-header flex items-center justify-between" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)' }}>Log Quality Inspection Audit</span>
              <button onClick={() => setIsQaModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Close</button>
            </div>
            <div className="frappe-card-body" style={{ padding: 'var(--space-5)' }}>
              <form onSubmit={handleSaveQualityInspection} className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="frappe-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Reference Slip Type *</label>
                    <select
                      className="frappe-input"
                      value={qaRefType}
                      onChange={(e) => setQaRefType(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                    >
                      <option value="Stock Entry">Stock Entry</option>
                      <option value="Purchase Receipt">Purchase Receipt</option>
                    </select>
                  </div>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Reference ID *</label>
                    <input
                      type="text"
                      className="frappe-input"
                      value={qaRefId}
                      onChange={(e) => setQaRefId(e.target.value)}
                      placeholder="STE-XX or PO-XX"
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      required
                    />
                  </div>
                </div>

                <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product to Inspect *</label>
                  <select
                    className="frappe-input"
                    value={qaProduct}
                    onChange={(e) => setQaProduct(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                <div className="frappe-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Inspected Qty</label>
                    <input
                      type="number"
                      className="frappe-input"
                      value={qaInsQty}
                      onChange={(e) => setQaInsQty(parseFloat(e.target.value) || 1)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      required
                    />
                  </div>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Passed Qty</label>
                    <input
                      type="number"
                      className="frappe-input"
                      value={qaPassQty}
                      onChange={(e) => {
                        const passed = parseFloat(e.target.value) || 0;
                        setQaPassQty(passed);
                        setQaRejQty(Math.max(0, qaInsQty - passed));
                      }}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      required
                    />
                  </div>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Rejected Qty</label>
                    <input
                      type="number"
                      className="frappe-input"
                      value={qaRejQty}
                      onChange={(e) => setQaRejQty(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-muted pt-4" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <div className="flex items-center justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span className="text-xs font-bold" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>QA Checklist Parameters</span>
                    <button
                      type="button"
                      onClick={() => setQaChecklist([...qaChecklist, { parameter: '', status: 'PASS' }])}
                      className="frappe-btn frappe-btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      Add Parameter
                    </button>
                  </div>

                  {qaChecklist.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center mb-2" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <input
                        type="text"
                        className="frappe-input flex-1"
                        placeholder="e.g. Dimensions Check"
                        value={item.parameter}
                        onChange={(e) => {
                          const updated = [...qaChecklist];
                          if (updated[idx]) {
                            updated[idx].parameter = e.target.value;
                            setQaChecklist(updated);
                          }
                        }}
                        style={{ flex: 1, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                        required
                      />
                      <select
                        className="frappe-input"
                        style={{ width: '90px', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                        value={item.status}
                        onChange={(e) => {
                          const updated = [...qaChecklist];
                          if (updated[idx]) {
                            updated[idx].status = e.target.value as 'PASS' | 'FAIL';
                            setQaChecklist(updated);
                          }
                        }}
                      >
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                      </select>
                      <input
                        type="text"
                        className="frappe-input flex-1"
                        placeholder="Reading/Note"
                        value={item.reading || ''}
                        onChange={(e) => {
                          const updated = [...qaChecklist];
                          if (updated[idx]) {
                            updated[idx].reading = e.target.value;
                            setQaChecklist(updated);
                          }
                        }}
                        style={{ flex: 1, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                      {qaChecklist.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = qaChecklist.filter((_, i) => i !== idx);
                            setQaChecklist(updated);
                          }}
                          style={{ border: 'none', background: 'none', color: 'var(--color-danger-text)', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 border-t border-muted pt-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <Button variant="outline" type="button" onClick={() => setIsQaModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Submit Audit Report
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
