'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash, Check, X } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface CheckItem {
  parameter: string;
  minVal: number | string;
  maxVal: number | string;
  type?: 'NUMERIC' | 'PASS_FAIL';
}

interface QualityPlan {
  id: string;
  name: string;
  code: string;
  productId: string;
  checks: Array<CheckItem> | string;
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
  const client = useApiClient();
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
  });
  const [planChecks, setPlanChecks] = useState<CheckItem[]>([
    { parameter: 'Thickness Check (mm)', minVal: '1.4', maxVal: '1.6', type: 'NUMERIC' }
  ]);

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
  });
  const [inspectChecklist, setInspectChecklist] = useState<any[]>([
    { parameter: 'Thickness Check', target: '1.5', actual: '1.5', status: 'PASS' }
  ]);

  // NCR Resolve Modal State
  const [isNcrModalOpen, setIsNcrModalOpen] = useState(false);
  const [selectedNcr, setSelectedNcr] = useState<NonConformanceReport | null>(null);
  const [ncrForm, setNcrForm] = useState({
    disposition: 'REWORK',
    status: 'RESOLVED',
  });

  useEffect(() => {
    void fetchData();
  }, [client]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plans, ncrs, products] = await Promise.all([
        client.get<QualityPlan[]>('/manufacturing/quality/plans'),
        client.get<NonConformanceReport[]>('/manufacturing/quality/ncr'),
        client.get<Product[]>('/inventory/products'),
      ]);
      setPlans(plans); setNcrs(ncrs); setProducts(products);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/manufacturing/quality/plans', {
          ...newPlan,
          checks: JSON.stringify(planChecks),
      });
      setIsPlanModalOpen(false);
      setNewPlan({ productId: '', name: '', code: '' });
      setPlanChecks([{ parameter: 'Thickness Check (mm)', minVal: '1.4', maxVal: '1.6', type: 'NUMERIC' }]);
      void fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleLogInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/manufacturing/quality/inspections', {
          ...inspectForm,
          inspectedQty: parseFloat(inspectForm.inspectedQty),
          passedQty: parseFloat(inspectForm.passedQty),
          checklistJson: JSON.stringify(inspectChecklist),
      });
      setIsInspectModalOpen(false);
      alert('Inspection checklist recorded successfully!');
      void fetchData();
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
      await client.request(`/manufacturing/quality/ncr/${selectedNcr.id}`, { method: 'PATCH', body: JSON.stringify(ncrForm) });
      setIsNcrModalOpen(false);
      void fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <RouteGuard permission="manufacturing.quality.read">
    <div className="ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <ShieldCheck size={28} className="ui-text-primary" />
            Quality Control & NCR Log
          </h1>
          <p className={styles.p2}>
            Manage quality inspection plans, template parameters builder, and resolve non-conformance reports.
          </p>
        </div>
        <div className="ui-flex ui-gap-3">
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className={styles.p3}
          >
            Create Inspection Plan
          </button>
          <button
            onClick={() => setIsInspectModalOpen(true)}
            className={styles.p4}
          >
            Log Inspection Run
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12">Loading quality logs...</div>
      ) : (
        <div className={styles.p5}>
          {/* Non Conformance Reports */}
          <div className={styles.p6}>
            <h3 className={styles.p7}>Non-Conformance Reports (NCR)</h3>
            <div className="ui-stack-3">
              {ncrs.map((ncr) => (
                <div
                  key={ncr.id}
                  className={styles.p8}
                >
                  <div className="ui-flex-between">
                    <h4 className="ui-heading-sm font-bold">{ncr.title}</h4>
                    <span style={{ background: ncr.status === 'RESOLVED' ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: ncr.status === 'RESOLVED' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s1}>
                      {ncr.status}
                    </span>
                  </div>

                  <p className="ui-text-xs-muted">{ncr.description}</p>

                  <div className={styles.p9}>
                    <div className="ui-text-micro">
                      <span><strong>Product:</strong> {ncr.product.name} ({ncr.product.sku})</span>
                      {ncr.workOrder && <span className={styles.p10}><strong>WO:</strong> {ncr.workOrder.workOrderNumber}</span>}
                    </div>
                    <div>
                      {ncr.status === 'OPEN' ? (
                        <button
                          onClick={() => handleOpenNcrModal(ncr)}
                          className={styles.p11}
                        >
                          Resolve NCR
                        </button>
                      ) : (
                        <span className="ui-text-micro ui-text-muted">
                          Resolved by: {ncr.resolvedBy || 'QC Team'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {ncrs.length === 0 && (
                <div className={styles.p12}>
                  No active NCR issues logged.
                </div>
              )}
            </div>
          </div>

          {/* Quality Standards & Plans */}
          <div className={styles.p13}>
            <h3 className={styles.p14}>Inspection templates</h3>
            <div className="ui-stack-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={styles.p15}
                >
                  <p className="ui-heading-sm font-bold">{plan.name}</p>
                  <p className={styles.p16}>Code: {plan.code}</p>
                  <div className={styles.p17}>
                    <p className={styles.p18}>Parameter Checks:</p>
                    <ul className={styles.p19}>
                      {(typeof plan.checks === 'string' ? JSON.parse(plan.checks) : plan.checks).map((check: CheckItem, idx: number) => (
                        <li key={idx} className="ui-text-muted">
                          {check.parameter}: {check.type === 'PASS_FAIL' ? 'Pass/Fail Check' : `Min ${check.minVal} / Max ${check.maxVal}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal (Checklist Builder) */}
      {isPlanModalOpen && (
        <div className={styles.p20}>
          <form onSubmit={handleCreatePlan} className={styles.p21}>
            <h3 className="ui-heading-lg">Build Quality Inspection Plan</h3>
            
            <div>
              <label className="ui-text-xs-label">Associate Product</label>
              <select required value={newPlan.productId} onChange={(e) => setNewPlan({ ...newPlan, productId: e.target.value })} className={styles.p22}>
                <option value="">Select Product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Template Name</label>
                <input required type="text" placeholder="e.g. Dimensions Check" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} className={styles.p23} />
              </div>
              <div>
                <label className="ui-text-xs-label">Plan Code</label>
                <input required type="text" placeholder="e.g. QP-LAP-01" value={newPlan.code} onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value })} className={styles.p24} />
              </div>
            </div>

            {/* Checklist items list */}
            <div>
              <div className="ui-flex-between mb-2">
                <label className={styles.p25}>Parameters & Validation Specs</label>
                <button
                  type="button"
                  onClick={() => setPlanChecks([...planChecks, { parameter: '', minVal: '0', maxVal: '100', type: 'NUMERIC' }])}
                  className={styles.p26}
                >
                  + Add Check Row
                </button>
              </div>

              <div className={styles.p27}>
                {planChecks.map((chk, idx) => (
                  <div key={idx} className={styles.p28}>
                    <input required type="text" placeholder="Param Name" value={chk.parameter} onChange={(e) => {
                      const updated = [...planChecks];
                      updated[idx]!.parameter = e.target.value;
                      setPlanChecks(updated);
                    }} className={styles.p29} />

                    <select value={chk.type} onChange={(e) => {
                      const updated = [...planChecks];
                      updated[idx]!.type = e.target.value as any;
                      setPlanChecks(updated);
                    }} className={styles.p30}>
                      <option value="NUMERIC">Numeric</option>
                      <option value="PASS_FAIL">Pass/Fail</option>
                    </select>

                    <input required type="text" placeholder="Min" disabled={chk.type === 'PASS_FAIL'} value={chk.minVal} onChange={(e) => {
                      const updated = [...planChecks];
                      updated[idx]!.minVal = e.target.value;
                      setPlanChecks(updated);
                    }} className={styles.p31} />

                    <input required type="text" placeholder="Max" disabled={chk.type === 'PASS_FAIL'} value={chk.maxVal} onChange={(e) => {
                      const updated = [...planChecks];
                      updated[idx]!.maxVal = e.target.value;
                      setPlanChecks(updated);
                    }} className={styles.p32} />

                    <button type="button" onClick={() => setPlanChecks(planChecks.filter((_, i) => i !== idx))} className={styles.p33}>
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button type="button" onClick={() => setIsPlanModalOpen(false)} className={styles.p34}>Cancel</button>
              <button type="submit" className={styles.p35}>Save Plan</button>
            </div>
          </form>
        </div>
      )}

      {/* Inspect Modal */}
      {isInspectModalOpen && (
        <div className={styles.p36}>
          <form onSubmit={handleLogInspection} className={styles.p37}>
            <h3 className="ui-heading-lg">Record Quality Check Results</h3>
            
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Audit Number</label>
                <input required type="text" placeholder="e.g. INSP-2026-001" value={inspectForm.inspectionNumber} onChange={(e) => setInspectForm({ ...inspectForm, inspectionNumber: e.target.value })} className={styles.p38} />
              </div>
              <div>
                <label className="ui-text-xs-label">Product</label>
                <select required value={inspectForm.productId} onChange={(e) => setInspectForm({ ...inspectForm, productId: e.target.value })} className={styles.p39}>
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Ref ID (WO or PO ID)</label>
                <input required type="text" placeholder="e.g. WO ID" value={inspectForm.referenceId} onChange={(e) => setInspectForm({ ...inspectForm, referenceId: e.target.value })} className={styles.p40} />
              </div>
              <div>
                <label className="ui-text-xs-label">Overall Result</label>
                <select value={inspectForm.status} onChange={(e) => setInspectForm({ ...inspectForm, status: e.target.value })} className={styles.p41}>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            </div>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Inspected Qty</label>
                <input required type="number" min="1" value={inspectForm.inspectedQty} onChange={(e) => setInspectForm({ ...inspectForm, inspectedQty: e.target.value })} className={styles.p42} />
              </div>
              <div>
                <label className="ui-text-xs-label">Passed Qty</label>
                <input required type="number" min="0" value={inspectForm.passedQty} onChange={(e) => setInspectForm({ ...inspectForm, passedQty: e.target.value })} className={styles.p43} />
              </div>
            </div>

            {/* Checklist checklist */}
            <div>
              <div className={styles.p44}>
                <label className={styles.p45}>Inspection Parameters Roster</label>
                <button
                  type="button"
                  onClick={() => setInspectChecklist([...inspectChecklist, { parameter: '', target: '1.0', actual: '1.0', status: 'PASS' }])}
                  className={styles.p46}
                >
                  + Add Item
                </button>
              </div>

              <div className={styles.p47}>
                {inspectChecklist.map((item, idx) => (
                  <div key={idx} className={styles.p48}>
                    <input required type="text" placeholder="Param" value={item.parameter} onChange={(e) => {
                      const updated = [...inspectChecklist];
                      updated[idx]!.parameter = e.target.value;
                      setInspectChecklist(updated);
                    }} className={styles.p49} />
                    <input required type="text" placeholder="Target" value={item.target} onChange={(e) => {
                      const updated = [...inspectChecklist];
                      updated[idx]!.target = e.target.value;
                      setInspectChecklist(updated);
                    }} className={styles.p50} />
                    <input required type="text" placeholder="Actual" value={item.actual} onChange={(e) => {
                      const updated = [...inspectChecklist];
                      updated[idx]!.actual = e.target.value;
                      setInspectChecklist(updated);
                    }} className={styles.p51} />
                    <select value={item.status} onChange={(e) => {
                      const updated = [...inspectChecklist];
                      updated[idx]!.status = e.target.value;
                      setInspectChecklist(updated);
                    }} className={styles.p52}>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                    <button type="button" onClick={() => setInspectChecklist(inspectChecklist.filter((_, i) => i !== idx))} className={styles.p53}>
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button type="button" onClick={() => setIsInspectModalOpen(false)} className={styles.p54}>Cancel</button>
              <button type="submit" className={styles.p55}>Submit Audit</button>
            </div>
          </form>
        </div>
      )}

      {/* NCR Resolve Modal */}
      {isNcrModalOpen && selectedNcr && (
        <div className={styles.p56}>
          <form onSubmit={handleResolveNcr} className={styles.p57}>
            <h3 className="ui-heading-lg">Resolve Non-Conformance Issue</h3>
            
            <p className="ui-text-xs-muted">
              Set resolution status and material disposition path for: <strong>{selectedNcr.title}</strong>
            </p>

            <div>
              <label className="ui-text-xs-label">Material Disposition Path</label>
              <select value={ncrForm.disposition} onChange={(e) => setNcrForm({ ...ncrForm, disposition: e.target.value })} className={styles.p58}>
                <option value="REWORK">Rework (Fix & test again)</option>
                <option value="SCRAP">Scrap (Dispose material completely)</option>
                <option value="ACCEPT_AS_IS">Accept As-Is (Minor cosmetic deviations)</option>
                <option value="RETURN_TO_VENDOR">Return to Vendor (Component defect)</option>
              </select>
            </div>

            <div>
              <label className="ui-text-xs-label">Resolution State</label>
              <select value={ncrForm.status} onChange={(e) => setNcrForm({ ...ncrForm, status: e.target.value })} className={styles.p59}>
                <option value="RESOLVED">RESOLVED</option>
                <option value="OPEN">OPEN / DELAYED</option>
              </select>
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button type="button" onClick={() => setIsNcrModalOpen(false)} className={styles.p60}>Cancel</button>
              <button type="submit" className={styles.p61}>Submit Resolution</button>
            </div>
          </form>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
