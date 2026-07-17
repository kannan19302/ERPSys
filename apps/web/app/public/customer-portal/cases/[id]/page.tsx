'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Spinner, StatusBadge, useToast } from '@unerp/ui';
import { ArrowLeft, Send } from 'lucide-react';
import { portalGet, portalPost, getPortalToken, clearPortalToken, PortalApiError } from '../../../../../src/lib/portal-api';

interface CaseComment {
  id: string;
  body: string;
  authorType: string;
  createdAt: string;
}

interface CaseDetail {
  id: string;
  caseNumber: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  comments: CaseComment[];
}

export default function PortalCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { error: toastError, success } = useToast();
  const id = params.id as string;

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!getPortalToken()) router.push('/public/customer-portal/login');
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await portalGet<CaseDetail>(`/portal/cases/${id}`);
      setCaseDetail(data);
    } catch (e) {
      if (e instanceof PortalApiError && e.statusCode === 401) {
        clearPortalToken();
        router.push('/public/customer-portal/login');
        return;
      }
      toastError(e instanceof PortalApiError ? e.message : 'Failed to load case');
    } finally {
      setLoading(false);
    }
  }, [id, router, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await portalPost(`/portal/cases/${id}/comments`, { body: comment.trim() });
      setComment('');
      success('Comment added');
      load();
    } catch (e) {
      toastError(e instanceof PortalApiError ? e.message : 'Failed to add comment');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!caseDetail) {
    return <div className={styles.s2}>Case not found.</div>;
  }

  return (
    <div className={`ui-page ${styles.s3}`} >
      <Button variant="secondary" onClick={() => router.push('/public/customer-portal/dashboard')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to dashboard
      </Button>

      <Card className="ui-card">
        <div className={styles.s4}>
          <div>
            <h3>{caseDetail.caseNumber} — {caseDetail.subject}</h3>
            <p className={styles.s5}>{caseDetail.description}</p>
          </div>
          <StatusBadge status={caseDetail.status} />
        </div>

        <h4 className={styles.s6}>Conversation</h4>
        <div className={styles.s7}>
          {caseDetail.comments.length === 0 ? (
            <p className="ui-empty-state">No messages yet.</p>
          ) : (
            caseDetail.comments.map((c) => (
              <div
                key={c.id}
                style={{ background: c.authorType === 'PORTAL' ? 'var(--surface-secondary, #eef2ff)' : 'var(--surface-tertiary, #f4f4f5)', alignSelf: c.authorType === 'PORTAL' ? 'flex-end' : 'flex-start' }} className={styles.s8}
              >
                <div className={styles.s9}>
                  {c.authorType === 'PORTAL' ? 'You' : 'Support team'} · {new Date(c.createdAt).toLocaleString()}
                </div>
                {c.body}
              </div>
            ))
          )}
        </div>

        <div className={styles.s10}>
          <input
            className="ui-input"
            placeholder="Type a message…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} disabled={sending || !comment.trim()}>
            <Send size={14} /> Send
          </Button>
        </div>
      </Card>
    </div>
  );
}
