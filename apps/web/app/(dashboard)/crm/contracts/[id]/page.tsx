'use client';
import styles from './page.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Modal, Badge, ListPageTemplate, type ListColumn, ChangeHistory, useToast } from '@unerp/ui';
import { CheckCircle, Clock, DollarSign, AlertCircle, RefreshCw, Download, Printer } from 'lucide-react';
import { DetailView, FormView, RouteGuard, useApiClient } from '@unerp/framework';
import { contractResource } from '@/modules/crm';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const client = useApiClient();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('details');
  const [contract, setContract] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewForm, setRenewForm] = useState({ renewalTermMonths: '', newValue: '' });

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });

  const [salesOrderCreating, setSalesOrderCreating] = useState(false);
  const [revising, setRevising] = useState(false);

  const fetchContract = useCallback(async () => {
    try {
      const data = await client.get(`/crm/contracts/${id}`);
      setContract(data);
    } catch {}
  }, [id, client]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const handleSubmitApproval = async () => {
    try {
      await client.post(`/crm/contracts/${id}/submit-approval`, {});
      success('Contract submitted for approval.');
      fetchContract();
    } catch {
      error('Failed to submit contract for approval.');
    }
  };

  const handleApprove = async () => {
    try {
      await client.post(`/crm/contracts/${id}/approve`, {});
      success('Contract approved successfully.');
      fetchContract();
    } catch {
      error('Failed to approve contract.');
    }
  };

  const handleReject = async () => {
    try {
      await client.post(`/crm/contracts/${id}/reject`, {});
      success('Contract rejected.');
      fetchContract();
    } catch {
      error('Failed to reject contract.');
    }
  };

  const handleInviteSign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post(`/crm/contracts/${id}/invite-sign`, {
        signerName: inviteForm.name,
        signerEmail: inviteForm.email,
      });
      success('Signature invitation sent successfully.');
      setShowInvite(false);
      fetchContract();
    } catch {
      error('Failed to send signature invitation.');
    }
  };

  const handleSign = async () => {
    try {
      await client.post(`/crm/contracts/${id}/sign`, {});
      success('Contract signed successfully. Status is now ACTIVE.');
      fetchContract();
    } catch {
      error('Failed to sign contract.');
    }
  };

  const handleCreateSalesOrder = async () => {
    setSalesOrderCreating(true);
    try {
      const order: any = await client.post(`/crm/contracts/${id}/sales-order`, {});
      success(`Sales Order ${order.orderNumber} generated successfully from contract!`);
      router.push(`/crm/sales-orders`);
    } catch {
      error('Failed to generate Sales Order.');
    } finally {
      setSalesOrderCreating(false);
    }
  };

  const handleReviseContract = async () => {
    setRevising(true);
    try {
      const clone: any = await client.post(`/crm/contracts/${id}/revise`, {});
      success('Active contract cloned into a new DRAFT revision copy.');
      router.push(`/crm/contracts/${clone.id}`);
    } catch {
      error('Failed to revise contract.');
    } finally {
      setRevising(false);
    }
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenewing(true);
    try {
      const payload = {
        renewalTermMonths: renewForm.renewalTermMonths ? Number(renewForm.renewalTermMonths) : undefined,
        newValue: renewForm.newValue ? Number(renewForm.newValue) : undefined,
      };
      const renewed: any = await client.post(`/crm/contracts/${id}/renew`, payload);
      success('Contract renewed successfully.');
      setShowRenew(false);
      router.push(`/crm/contracts/${renewed.id}`);
    } catch {
      error('An error occurred while renewing.');
    } finally {
      setRenewing(false);
    }
  };

  const exportCSV = () => {
    if (!contract) return;
    const csvContent = [
      ['Contract ID', contract.id],
      ['Contract Number', contract.contractNumber],
      ['Title', contract.title],
      ['Category', contract.type],
      ['Agreement Type', contract.contractType],
      ['Value', `${contract.currency} ${contract.value}`],
      ['Start Date', contract.startDate],
      ['End Date', contract.endDate],
      ['Status', contract.status],
      ['Approval Status', contract.approvalStatus],
      ['Signature Status', contract.signatureStatus],
    ];

    const csvString = csvContent.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contract_${contract.contractNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!contract) {
    return (
      <div className="ui-center-pad">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    );
  }

  const isTerminal = ['TERMINATED', 'RENEWED'].includes(contract.status);

  return (
    <RouteGuard permission="crm.contracts.read">
      <div className="ui-stack-6">
        <DetailView
          resource={contractResource}
          id={id}
          onEdit={() => setShowEdit(true)}
          actions={
            <div className="ui-flex ui-gap-2">
              {!isTerminal && contract.status !== 'DRAFT' && (
                <Button variant="outline" size="sm" onClick={() => setShowRenew(true)}>
                  <RefreshCw size={14} className="mr-2" /> Renew
                </Button>
              )}
              {(contract.status === 'ACTIVE' || contract.signatureStatus === 'SIGNED') && (
                <Button variant="outline" size="sm" onClick={handleReviseContract} disabled={revising}>
                  <RefreshCw size={14} className="mr-2" /> {revising ? 'Revising...' : 'Revise/Amend'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download size={14} className="mr-2" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer size={14} className="mr-2" /> Print PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/crm/contracts')}>
                Back to List
              </Button>
            </div>
          }
        >
          {/* Approval & Signature Progress Timeline */}
          <Card padding="md">
            <div className={styles.p20}>
              <div className={styles.p21} />
              {[
                { label: 'Draft', active: true },
                { label: 'Pending Approval', active: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(contract.approvalStatus) || contract.signatureStatus === 'SIGNED' || contract.status === 'ACTIVE' },
                { label: 'Approved', active: ['APPROVED'].includes(contract.approvalStatus) || contract.signatureStatus === 'SIGNED' || contract.status === 'ACTIVE' },
                { label: 'Signed', active: contract.signatureStatus === 'SIGNED' || contract.status === 'ACTIVE' },
                { label: 'Active', active: contract.status === 'ACTIVE' }
              ].map((step, idx) => (
                <div key={idx} className={styles.p22}>
                  <div style={{ background: step.active ? 'var(--color-success)' : 'var(--color-bg-sunken)', color: step.active ? 'white' : 'var(--color-text-secondary)' }} className={styles.s1}>
                    {idx + 1}
                  </div>
                  <span style={{ fontWeight: step.active ? 600 : 400, color: step.active ? 'var(--color-text)' : 'var(--color-text-tertiary)' }} className={styles.s2}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Action sidebars & tabs */}
          <div className={styles.p23}>
            <div>
              {/* Tab Selectors */}
              <div className={styles.p24}>
                {[
                  { id: 'details', label: 'Details & Terms' },
                  { id: 'items', label: 'Products & Lines' },
                  { id: 'revisions', label: 'Amendments & Lineage' },
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

              {activeTab === 'details' && contract.terms && (
                <Card padding="md">
                  <h4 className={styles.p25}>Terms & Clauses</h4>
                  <p className={styles.p26}>{contract.terms}</p>
                </Card>
              )}

              {activeTab === 'items' && (
                <Card padding="none">
                  <div className={styles.p27}>
                    <h4 className={styles.p28}>Linked Products / Services</h4>
                  </div>
                  <ListPageTemplate
                    columns={[
                      { key: 'product', header: 'SKU', render: (v: any) => <span className="font-mono">{(v as any)?.sku || '—'}</span> },
                      { key: 'product', header: 'Product', render: (v: any) => String((v as any)?.name || '—') },
                      { key: 'quantity', header: 'Quantity' },
                      { key: 'unitPrice', header: 'Unit Price', render: (v: any) => `${contract.currency} ${Number(v).toLocaleString()}` },
                      { key: 'discount', header: 'Discount', render: (v: any) => Number(v) > 0 ? <span className="ui-text-danger">-{contract.currency} {Number(v).toLocaleString()}</span> : '—' },
                      { key: 'id', header: 'Total', render: (v: any, row: any) => <span className="font-semibold">{contract.currency} {((Number(row.quantity) * Number(row.unitPrice)) - Number(row.discount)).toLocaleString()}</span> },
                    ] as any[]}
                    data={(contract.lineItems || []) as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No items"
                    emptyDescription="No items linked to this contract."
                  />
                </Card>
              )}

              {activeTab === 'revisions' && (
                <Card padding="md">
                  <h4 className={styles.p29}>Contract History Lineage</h4>
                  {contract.renewedFrom && (
                    <div className={styles.p210}>
                      <span className="ui-text-xs-tertiary">Renewed From Contract</span>
                      <div>
                        <a onClick={() => router.push(`/crm/contracts/${contract.renewedFrom!.id}`)} className={styles.p211}>
                          {contract.renewedFrom.contractNumber} — {contract.renewedFrom.title}
                        </a>
                      </div>
                    </div>
                  )}
                  {contract.revisedFrom && (
                    <div className={styles.p212}>
                      <span className="ui-text-xs-tertiary">Revised From (Historical Edit)</span>
                      <div>
                        <a onClick={() => router.push(`/crm/contracts/${contract.revisedFrom!.id}`)} className={styles.p213}>
                          {contract.revisedFrom.contractNumber} — {contract.revisedFrom.title}
                        </a>
                      </div>
                    </div>
                  )}
                  {!(contract.renewedFrom || contract.revisedFrom) && (
                    <span className={styles.p214}>No revisions or renewal lineage available.</span>
                  )}
                </Card>
              )}
            </div>

            <div className="ui-stack-6">
              {/* Approval Lifecycle Control */}
              <Card padding="md">
                <h4 className={styles.p215}>Approval Status</h4>
                <div className="ui-stack-3">
                  <div className="ui-flex-between">
                    <span className="ui-text-xs-tertiary">Status</span>
                    <Badge variant={contract.approvalStatus === 'APPROVED' ? 'success' : contract.approvalStatus === 'REJECTED' ? 'danger' : 'warning'}>
                      {contract.approvalStatus}
                    </Badge>
                  </div>

                  {contract.approvalStatus === 'DRAFT' && contract.status === 'DRAFT' && (
                    <Button size="sm" variant="primary" onClick={handleSubmitApproval}>
                      Submit for Approval
                    </Button>
                  )}

                  {contract.approvalStatus === 'PENDING_APPROVAL' && (
                    <div className={styles.p216}>
                      <Button size="sm" variant="primary" className="flex-1" onClick={handleApprove}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" className="flex-1" onClick={handleReject}>
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Signature Lifecycle Control */}
              <Card padding="md">
                <h4 className={styles.p217}>Signatures</h4>
                <div className="ui-stack-3">
                  <div className="ui-flex-between">
                    <span className="ui-text-xs-tertiary">Sign Status</span>
                    <Badge variant={contract.signatureStatus === 'SIGNED' ? 'success' : contract.signatureStatus === 'PENDING_SIGNATURE' ? 'warning' : 'default'}>
                      {contract.signatureStatus}
                    </Badge>
                  </div>

                  {contract.signerName && (
                    <div className="ui-text-xs-muted">
                      Signer: {contract.signerName} ({contract.signerEmail})
                    </div>
                  )}

                  {contract.approvalStatus === 'APPROVED' && contract.signatureStatus === 'UNSIGNED' && (
                    <Button size="sm" variant="outline" onClick={() => setShowInvite(true)}>
                      Invite Signer
                    </Button>
                  )}

                  {contract.signatureStatus === 'PENDING_SIGNATURE' && (
                    <Button size="sm" variant="primary" onClick={handleSign}>
                      Sign Contract
                    </Button>
                  )}
                </div>
              </Card>

              {/* ERP Integration Actions */}
              {(contract.approvalStatus === 'APPROVED' || contract.status === 'ACTIVE') && contract.customer && (
                <Card padding="md">
                  <h4 className={styles.p218}>Conversions</h4>
                  <Button size="sm" variant="primary" className="w-full" onClick={handleCreateSalesOrder} disabled={salesOrderCreating}>
                    {salesOrderCreating ? 'Converting...' : 'Generate Sales Order'}
                  </Button>
                </Card>
              )}
            </div>
          </div>

          <ChangeHistory entityType="Contract" entityId={id} />
        </DetailView>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Update Contract" size="lg">
          <FormView
            resource={contractResource}
            id={id}
            onSuccess={() => {
              setShowEdit(false);
              fetchContract();
            }}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>

        {/* Renew Modal */}
        <Modal open={showRenew} onClose={() => setShowRenew(false)} title="Renew Contract" size="md">
          <form onSubmit={handleRenew} className="ui-stack-4">
            <p className={styles.p219}>
              Renewing creates a new follow-on contract starting where this one ends, and marks this contract as RENEWED.
            </p>
            <div className="ui-form-group">
              <label className="ui-label">Renewal Term (months)</label>
              <input
                type="number"
                placeholder={contract.renewalTermMonths ? String(contract.renewalTermMonths) : '12'}
                value={renewForm.renewalTermMonths}
                onChange={(e) => setRenewForm({ ...renewForm, renewalTermMonths: e.target.value })}
                className="ui-input"
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">New Value (optional)</label>
              <input
                type="number"
                placeholder={String(contract.value)}
                value={renewForm.newValue}
                onChange={(e) => setRenewForm({ ...renewForm, newValue: e.target.value })}
                className="ui-input"
              />
            </div>
            <div className={styles.p220}>
              <Button variant="secondary" type="button" onClick={() => setShowRenew(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={renewing}>
                {renewing ? 'Renewing...' : 'Confirm Renewal'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Invite Modal */}
        <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Signer" size="md">
          <form onSubmit={handleInviteSign} className="ui-stack-4">
            <div className="ui-form-group">
              <label className="ui-label">Signer Name</label>
              <input
                type="text"
                placeholder="Name"
                required
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                className="ui-input"
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Signer Email</label>
              <input
                type="email"
                placeholder="Email"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="ui-input"
              />
            </div>
            <div className={styles.p221}>
              <Button variant="secondary" type="button" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Send Invitation</Button>
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
