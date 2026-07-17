'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Modal, Badge, ChangeHistory, useToast } from '@unerp/ui';
import { Clock, AlertTriangle, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { DetailView, FormView, RouteGuard, useApiClient } from '@unerp/framework';
import { caseResource } from '@/modules/crm';

function TimeLeft({ deadline, label }: { deadline?: string | null; label: string }) {
  if (!deadline) {
    return (
      <div className={styles.p20}>
        <span className="ui-text-muted">{label}</span>
        <span className="ui-text-tertiary">—</span>
      </div>
    );
  }
  const remainingMs = new Date(deadline).getTime() - Date.now();
  const overdue = remainingMs < 0;
  const hoursLeft = remainingMs / (1000 * 60 * 60);
  const color = overdue ? 'var(--color-danger)' : hoursLeft <= 4 ? 'var(--color-warning)' : 'var(--color-success)';
  const text = overdue
    ? `Overdue by ${Math.abs(Math.round(hoursLeft))}h`
    : hoursLeft >= 24 ? `${Math.round(hoursLeft / 24)}d left` : `${Math.max(0, Math.round(hoursLeft))}h left`;
  return (
    <div className={styles.p21}>
      <span className="ui-text-muted">{label}</span>
      <span className={styles.p22}>
        {new Date(deadline).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {text}
      </span>
    </div>
  );
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const client = useApiClient();
  const { success, error } = useToast();

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const data = await client.get(`/crm/cases/${id}`);
      setTicket(data);
    } catch {}
  }, [id, client]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchTicket();
      setLoading(false);
    };
    init();
  }, [fetchTicket]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await client.patch(`/crm/cases/${id}`, { status: newStatus });
      success(`Ticket status set to: ${newStatus}`);
      fetchTicket();
    } catch {
      error('Failed to change ticket status.');
    }
  };

  if (loading || !ticket) {
    return (
      <div className="ui-center-pad">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    );
  }

  const isBreached = ticket.slaBreached
    || (ticket.slaResolveBy && new Date(ticket.slaResolveBy) < new Date() && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED');

  return (
    <RouteGuard permission="crm.cases.read">
      <div className="ui-stack-6">
        <DetailView
          resource={caseResource}
          id={id}
          onEdit={() => setShowEdit(true)}
          actions={
            <div className="ui-flex ui-gap-2">
              {ticket.status === 'OPEN' && (
                <Button variant="primary" size="sm" onClick={() => handleStatusChange('WORKING')}>
                  Assign to Me
                </Button>
              )}
              {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange('RESOLVED')}>
                  Resolve Ticket
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => router.push('/crm/cases')}>
                <ArrowLeft size={14} className="mr-2" /> Back
              </Button>
            </div>
          }
        >
          <div className={styles.p23}>
            <div>
              {ticket.description && (
                <Card padding="md" className="mb-4">
                  <h4 className={styles.p24}>Case Description</h4>
                  <p className={styles.p25}>{ticket.description}</p>
                </Card>
              )}
            </div>

            <div>
              {/* SLA Monitor */}
              <Card padding="md" className="ui-stack-4">
                <div className="ui-flex-between">
                  <h4 className={styles.p26}>
                    <Clock size={14} /> SLA Compliance
                  </h4>
                  {isBreached ? (
                    <Badge variant="danger"><AlertTriangle size={10} className={styles.p27} /> Breached</Badge>
                  ) : (
                    <Badge variant="success"><CheckCircle2 size={10} className={styles.p28} /> On Track</Badge>
                  )}
                </div>
                <div className="ui-stack-3">
                  <TimeLeft label="First Response by" deadline={ticket.slaFirstResponseBy} />
                  <TimeLeft label="Resolve by" deadline={ticket.slaResolveBy} />
                  {ticket.firstRespondedAt && (
                    <div className={styles.p29}>
                      <span className="ui-text-muted">Responded at</span>
                      <span className="font-semibold">{new Date(ticket.firstRespondedAt).toLocaleString()}</span>
                    </div>
                  )}
                  <div className={styles.p210}>
                    <span className="ui-text-muted">Opened at</span>
                    <span className="font-semibold">{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <ChangeHistory entityType="Case" entityId={id} />
        </DetailView>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Case">
          <FormView
            resource={caseResource}
            id={id}
            onSuccess={() => {
              setShowEdit(false);
              fetchTicket();
            }}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
