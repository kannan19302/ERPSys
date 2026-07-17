'use client';
import styles from './page.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Modal, ListPageTemplate, type ListColumn, ChangeHistory, useToast } from '@unerp/ui';
import { RefreshCw, Download, Printer, Plus, Trash2, Package, ArrowRight, XSquare } from 'lucide-react';
import { DetailView, FormView, RouteGuard, useApiClient } from '@unerp/framework';
import { opportunityResource } from '@/modules/crm';

const STAGE_LABELS: Record<string, string> = {
  PROSPECTING: 'Prospecting',
  QUALIFICATION: 'Qualification',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};
const STAGE_ORDER = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const client = useApiClient();
  const { success, error } = useToast();

  const [opp, setOpp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showEdit, setShowEdit] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [itemForm, setItemForm] = useState({ description: '', quantity: 1, unitPrice: 0, discount: 0, productId: '' });
  const [submittingItem, setSubmittingItem] = useState(false);

  const fetchOpp = useCallback(async () => {
    try {
      const data = await client.get(`/crm/opportunities/${id}`);
      setOpp(data);
    } catch {}
  }, [id, client]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = (await client.get('/crm/products')) as any;
      setProducts(Array.isArray(data) ? data : []);
    } catch {}
  }, [client]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchOpp(), fetchProducts()]);
      setLoading(false);
    };
    init();
  }, [fetchOpp, fetchProducts]);

  const handleStageChange = async (newStage: string) => {
    try {
      const probability = newStage === 'CLOSED_WON' ? 100 : newStage === 'CLOSED_LOST' ? 0 : undefined;
      await client.patch(`/crm/opportunities/${id}/stage`, { stage: newStage, probability });
      success(`Deal moved to stage: ${STAGE_LABELS[newStage]}`);
      fetchOpp();
    } catch {
      error('Failed to change stage.');
    }
  };

  const handleAddLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingItem(true);
    try {
      await client.post(`/crm/opportunities/${id}/line-items`, {
        ...itemForm,
        quantity: Number(itemForm.quantity),
        unitPrice: Number(itemForm.unitPrice),
        discount: Number(itemForm.discount),
        productId: itemForm.productId || undefined,
      });
      success('Product added to deal.');
      setShowAddItem(false);
      setItemForm({ description: '', quantity: 1, unitPrice: 0, discount: 0, productId: '' });
      fetchOpp();
    } catch {
      error('Failed to add product.');
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleDeleteLineItem = async (itemId: string) => {
    try {
      await client.delete(`/crm/opportunities/${id}/line-items/${itemId}`);
      success('Line item removed.');
      fetchOpp();
    } catch {
      error('Failed to remove line item.');
    }
  };

  const exportCSV = () => {
    if (!opp) return;
    const csvContent = [
      ['Opportunity ID', opp.id],
      ['Opportunity Name', opp.name],
      ['Stage', opp.stage],
      ['Amount', opp.amount],
      ['Probability', opp.probability],
      ['Expected Close Date', opp.expectedCloseDate],
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `opportunity_${opp.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !opp) {
    return (
      <div className="ui-center-pad">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    );
  }

  const currentStageIdx = STAGE_ORDER.indexOf(opp.stage);
  const nextStage = currentStageIdx < STAGE_ORDER.length - 2 ? STAGE_ORDER[currentStageIdx + 1] : null;

  return (
    <RouteGuard permission="crm.opportunity.read">
      <div className="ui-stack-6">
        <DetailView
          resource={opportunityResource}
          id={id}
          onEdit={() => setShowEdit(true)}
          actions={
            <div className="ui-flex ui-gap-2">
              {nextStage && (
                <Button variant="primary" size="sm" onClick={() => handleStageChange(nextStage)}>
                  <ArrowRight size={14} className="mr-2" /> Move to {STAGE_LABELS[nextStage]}
                </Button>
              )}
              {!['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage) && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleStageChange('CLOSED_WON')}>
                    Mark Won
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleStageChange('CLOSED_LOST')}>
                    <XSquare size={14} className="mr-2" /> Mark Lost
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download size={14} className="mr-2" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer size={14} className="mr-2" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/crm/opportunities')}>
                Back
              </Button>
            </div>
          }
        >
          {/* Pipeline Progress */}
          <Card padding="md">
            <div className={styles.pipelineProgress}>
              <div className={styles.pipelineLine} />
              {STAGE_ORDER.filter(s => s !== 'CLOSED_LOST').map((step, idx) => {
                const active = idx <= currentStageIdx && opp.stage !== 'CLOSED_LOST';
                return (
                  <div key={idx} className={styles.pipelineStep}>
                    <div style={{ background: active ? 'var(--color-primary)' : 'var(--color-bg-sunken)', color: active ? 'white' : 'var(--color-text-secondary)' }} className={styles.s1}>
                      {idx + 1}
                    </div>
                    <span style={{ fontWeight: active ? 600 : 400, color: active ? 'var(--color-text)' : 'var(--color-text-tertiary)' }} className={styles.s2}>
                      {STAGE_LABELS[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className={styles.contentGrid}>
            <div>
              {/* Tab Selectors */}
              <div className={styles.tabs}>
                {[
                  { id: 'details', label: 'Deal Details' },
                  { id: 'items', label: `Line Items (${opp.lineItems?.length || 0})` },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>

              {activeTab === 'details' && opp.notes && (
                <Card padding="md" className="mb-4">
                  <h4 className={styles.sectionTitle}>Deal Notes</h4>
                  <p className={styles.notes}>{opp.notes}</p>
                </Card>
              )}

              {activeTab === 'items' && (
                <Card padding="md" className="ui-stack-4">
                  <div className="ui-flex-between">
                    <h4 className={styles.sectionTitleNoMargin}>Products & Items</h4>
                    <Button variant="primary" size="sm" onClick={() => setShowAddItem(true)}>
                      <Plus size={14} className="mr-1" /> Add Product
                    </Button>
                  </div>
                  <ListPageTemplate
                    columns={[
                      { key: 'product', header: 'Product', render: (v: any) => v ? <span><Package size={14} className={styles.s5} />{(v as any).name}</span> : <span className={styles.s3}>Custom</span> },
                      { key: 'description', header: 'Description' },
                      { key: 'quantity', header: 'Qty', render: (v: any) => String(Number(v)) },
                      { key: 'unitPrice', header: 'Price', render: (v: any) => `$${Number(v).toLocaleString()}` },
                      { key: 'discount', header: 'Discount', render: (v: any) => `${Number(v)}%` },
                      { key: 'totalAmount', header: 'Total', render: (v: any) => `$${Number(v).toLocaleString()}` },
                      { key: 'id', header: '', render: (v: any) => <button onClick={() => handleDeleteLineItem(String(v))} className="ui-btn-icon ui-text-danger"><Trash2 size={14} /></button> },
                    ] as ListColumn[]}
                    data={(opp.lineItems || []) as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No items"
                    emptyDescription="No line items linked yet."
                  />
                  {(opp.lineItems || []).length > 0 && (
                    <div className={styles.totalRow}>
                      <div className="text-right">
                        <div className="ui-text-xs-soft">Total Amount</div>
                        <div className={styles.totalAmount}>
                          ${(opp.lineItems || []).reduce((s: number, i: any) => s + Number(i.totalAmount), 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>

            <div>
              {/* Summary Stats */}
              <Card padding="md" className="ui-stack-4">
                <h4 className={styles.sectionTitleNoMargin}>KPI & Analytics</h4>
                <div className="ui-stack-3">
                  <div>
                    <div className="ui-text-xs-soft">Weighted Value</div>
                    <div className={styles.weightedValue}>
                      ${(Number(opp.amount || 0) * (Number(opp.probability || 0) / 100)).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="ui-text-xs-soft">Expected Close Date</div>
                    <div className="ui-heading-sm">
                      {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : 'Not Set'}
                    </div>
                  </div>
                  <div>
                    <div className="ui-text-xs-soft">Competitor</div>
                    <div className="ui-text-sm-muted">{opp.competitor || 'None Listed'}</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <ChangeHistory entityType="Opportunity" entityId={id} />
        </DetailView>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Opportunity">
          <FormView
            resource={opportunityResource}
            id={id}
            onSuccess={() => {
              setShowEdit(false);
              fetchOpp();
            }}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>

        {/* Add Item Modal */}
        <Modal open={showAddItem} onClose={() => setShowAddItem(false)} title="Add Product Item">
          <form onSubmit={handleAddLineItem} className={styles.itemForm}>
            <div className="ui-stack-2">
              <label className="ui-text-xs-label">Select Product</label>
              <select
                value={itemForm.productId}
                onChange={(e) => {
                  const p = products.find(prod => prod.id === e.target.value);
                  setItemForm({
                    ...itemForm,
                    productId: e.target.value,
                    unitPrice: p ? Number(p.sellPrice) : 0,
                    description: p ? p.name : '',
                  });
                }}
                className={styles.s4}
              >
                <option value="">-- Custom Item --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku}) - ${Number(p.sellPrice).toLocaleString()}</option>
                ))}
              </select>
            </div>

            <div className="ui-stack-2">
              <label className="ui-text-xs-label">Description</label>
              <input
                type="text"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                required
                className={styles.s4}
              />
            </div>

            <div className={styles.itemGrid}>
              <div className="ui-stack-2">
                <label className="ui-text-xs-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                  required
                  className={styles.s4}
                />
              </div>

              <div className="ui-stack-2">
                <label className="ui-text-xs-label">Unit Price</label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.unitPrice}
                  onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
                  required
                  className={styles.s4}
                />
              </div>

              <div className="ui-stack-2">
                <label className="ui-text-xs-label">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={itemForm.discount}
                  onChange={(e) => setItemForm({ ...itemForm, discount: Number(e.target.value) })}
                  required
                  className={styles.s4}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="outline" onClick={() => setShowAddItem(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={submittingItem}>{submittingItem ? 'Adding...' : 'Add Item'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
