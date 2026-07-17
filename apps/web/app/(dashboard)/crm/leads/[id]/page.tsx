'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Modal, ChangeHistory, useToast } from '@unerp/ui';
import { DetailView, FormView, RouteGuard, useApiClient } from '@unerp/framework';
import { leadResource } from '@/modules/crm';
import styles from './page.module.css';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const client = useApiClient();
  const { success, error } = useToast();
  const id = params.id as string;
  const [showEdit, setShowEdit] = useState(false);
  const [recalcing, setRecalcing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [convertForm, setConvertForm] = useState({ customerName: '', opportunityName: '', opportunityAmount: '' });

  const recalcScore = async () => {
    setRecalcing(true);
    try {
      await client.post(`/crm/leads/${id}/recalculate-score`, {});
      success('Lead score recalculated.');
      window.location.reload();
    } catch {
      error('Failed to recalculate score.');
    } finally {
      setRecalcing(false);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setConverting(true);
    try {
      await client.post(`/crm/leads/${id}/convert`, {
        customerName: convertForm.customerName || undefined,
        opportunityName: convertForm.opportunityName || undefined,
        opportunityAmount: convertForm.opportunityAmount ? Number(convertForm.opportunityAmount) : undefined,
      });
      success('Lead converted successfully.');
      router.push('/crm/opportunities');
    } catch {
      error('Conversion failed.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <RouteGuard permission="crm.lead.read">
      <div className="ui-stack-6">
        <DetailView
          resource={leadResource}
          id={id}
          onEdit={() => setShowEdit(true)}
          actions={
            <div className="ui-flex ui-gap-2">
              <Button variant="outline" onClick={() => setShowConvert(true)} disabled={converting}>
                Convert Lead
              </Button>
              <Button variant="outline" onClick={recalcScore} disabled={recalcing}>
                {recalcing ? 'Recalculating…' : 'Recalculate Score'}
              </Button>
              <Button variant="outline" onClick={() => router.push('/crm/leads')}>
                Back to List
              </Button>
            </div>
          }
        >
          <ChangeHistory entityType="Lead" entityId={id} />
        </DetailView>

        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Lead">
          <FormView
            resource={leadResource}
            id={id}
            onSuccess={() => setShowEdit(false)}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>

        <Modal open={showConvert} onClose={() => setShowConvert(false)} title="Convert Lead">
          <form onSubmit={handleConvert} className="ui-stack-4">
            <p className="ui-text-sm-muted">
              Convert this lead into a Customer account and Opportunity.
            </p>
            <div className="ui-form-group">
              <label className="ui-label">Customer Name</label>
              <input
                type="text"
                placeholder="Customer Name"
                value={convertForm.customerName}
                onChange={e => setConvertForm({ ...convertForm, customerName: e.target.value })}
                className="ui-input"
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Opportunity Name</label>
              <input
                type="text"
                placeholder="Opportunity Name"
                value={convertForm.opportunityName}
                onChange={e => setConvertForm({ ...convertForm, opportunityName: e.target.value })}
                className="ui-input"
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Opportunity Amount</label>
              <input
                type="number"
                placeholder="Opportunity Amount"
                value={convertForm.opportunityAmount}
                onChange={e => setConvertForm({ ...convertForm, opportunityAmount: e.target.value })}
                className="ui-input"
              />
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={() => setShowConvert(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={converting}>
                {converting ? 'Converting...' : 'Convert'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
