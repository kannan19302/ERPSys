'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { Plus, MessageSquare, Paperclip, Send, FileText, Image, X } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface GoalComment {
  id: string;
  comment: string;
  authorName: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  employeeId: string;
  category: string;
  type: string;
  progress: number;
  status: string;
  keyResults: Array<{ id: string; title: string; target: number; current: number }>;
  comments: GoalComment[];
}

export default function GoalsPage() {
  const client = useApiClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', title: '', description: '', category: 'INDIVIDUAL', type: 'QUARTERLY', startDate: '', endDate: '', keyResults: [{ title: '', target: 100 }] });
  const [msg, setMsg] = useState('');

  // Comment and attachment states
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [draftAttachments, setDraftAttachments] = useState<Record<string, { fileUrl: string; fileName: string }>>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalsRes, empRes] = await Promise.all([
        client.get<Goal[]>('/api/v1/advanced-hr/goals'),
        client.get<Array<{ id: string; firstName: string; lastName: string }>>('/api/v1/hr/employees'),
      ]);
      setGoals(goalsRes); setEmployees(empRes);
    } catch {} finally { setLoading(false); }
  };

  const createGoal = async (e: React.FormEvent) => { e.preventDefault();
    try { await client.post('/api/v1/advanced-hr/goals', form);
      { setMsg('Goal created'); setShowForm(false); fetchData(); }
    } catch {} };

  const updateKR = async (krId: string, current: number) => {
    await client.request(`/api/v1/advanced-hr/key-results/${krId}`, { method: 'PUT', body: JSON.stringify({ current }) });
    fetchData();
  };

  const submitComment = async (goalId: string) => {
    const text = commentTexts[goalId] || '';
    if (!text.trim()) return;
    const attachment = draftAttachments[goalId];

    try {
      await client.post(`/api/v1/advanced-hr/goals/${goalId}/comments`, {
          comment: text,
          fileUrl: attachment?.fileUrl || null,
          fileName: attachment?.fileName || null
        });
      {
        setCommentTexts({ ...commentTexts, [goalId]: '' });
        setDraftAttachments(prev => {
          const updated = { ...prev };
          delete updated[goalId];
          return updated;
        });
        fetchData();
      }
    } catch {}
  };

  const handleFileChange = (goalId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraftAttachments({
          ...draftAttachments,
          [goalId]: {
            fileUrl: reader.result as string,
            fileName: file.name
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadFile = (dataUrl: string, fileName: string) => {
    try {
      const parts = dataUrl.split(',');
      if (parts.length < 2) return;
      const part0 = parts[0];
      const part1 = parts[1];
      if (!part0 || !part1) return;
      
      const mimeMatch = part0.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(part1);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Failed to download file
    }
  };

  return (
    <RouteGuard permission="hr.goals.read">
    <div className="ui-stack-6">
      <PageHeader title="Goals & OKRs" description="Set objectives and track key results with efforts log comments" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Goals' }]} actions={<Button variant="primary" onClick={() => setShowForm(!showForm)}><Plus size={14} /> New Goal</Button>} />
      {msg && <div className={styles.message}>{msg}</div>}
      {showForm && <Card padding="md"><form onSubmit={createGoal} className="ui-stack-3">
        <select className="ui-input" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select>
        <input className="ui-input" placeholder="Goal Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        <div className="ui-grid-2 ui-gap-3"><input className="ui-input" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /><input className="ui-input" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} /></div>
        <Button variant="primary" type="submit">Create Goal</Button>
      </form></Card>}
      <div className="ui-stack-4">
        {loading && <div className="ui-flex-center p-8"><Spinner size="md" /></div>}
        {!loading && goals.map(g => (
          <Card key={g.id} padding="md">
            <div className={styles.goalHeader}>
              <h3 className={styles.goalTitle}>{g.title}</h3>
              <StatusBadge status={g.status} />
            </div>
            <div className={styles.goalHeader}>
              <span className={styles.meta}>{g.category} • {g.type}</span>
            </div>
            <div className={styles.track}>
              <div className={styles.progress} style={{ width: `${g.progress}%` }} />
            </div>
            <div className={styles.meta}>{g.progress}% complete</div>
            {g.keyResults?.map(kr => (
              <div key={kr.id} className={styles.keyResult}>
                <span className={styles.keyResultTitle}>{kr.title}</span>
                <input type="number" className={`ui-input ${styles.keyResultInput}`} defaultValue={kr.current} onBlur={e => updateKR(kr.id, parseInt(e.target.value) || 0)} />
                <span className={styles.meta}>/ {kr.target}</span>
              </div>
            ))}

            {/* Comments & Efforts log */}
            <div className={styles.comments}>
              <h4 className={styles.commentsTitle}>
                <MessageSquare size={14} /> Comments & Efforts Log ({g.comments?.length || 0})
              </h4>
              
              <div className={styles.commentList}>
                {g.comments?.map(c => (
                  <div key={c.id} className={styles.commentCard}>
                    <div className={styles.commentHeader}>
                      <span className="font-semibold">{c.authorName}</span>
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div>{c.comment}</div>
                    {c.fileUrl && (
                      <div className={styles.attachmentRow}>
                        {/\.(png|jpe?g|gif|webp)$/i.test(c.fileName || '') ? (
                          <Image size={12} className="ui-text-success" />
                        ) : (
                          <FileText size={12} className="ui-text-danger" />
                        )}
                        <button
                          onClick={() => downloadFile(c.fileUrl!, c.fileName!)}
                          className={styles.downloadButton}
                        >
                          {c.fileName} (Download / View)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {(!g.comments || g.comments.length === 0) && (
                  <div className={styles.empty}>No efforts logs or comments posted.</div>
                )}
              </div>

              {/* Add Comment Box */}
              <div className={styles.commentForm}>
                <div className={styles.commentInputRow}>
                  <input
                    type="text"
                    placeholder="Log efforts or add comments..."
                    className={`ui-input ${styles.commentInput}`}
                    value={commentTexts[g.id] || ''}
                    onChange={e => setCommentTexts({ ...commentTexts, [g.id]: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitComment(g.id);
                    }}
                  />
                  <Button variant="primary" className={styles.submitComment}
                    onClick={() => submitComment(g.id)}
                  >
                    <Send size={12} />
                  </Button>
                </div>
                
                {/* Attachment Section */}
                <div className={styles.attachmentControls}>
                  <label className={styles.attachmentLabel}>
                    <Paperclip size={12} />
                    <span>Attach Completion Proof (PDF/Image/Document)</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                      className={styles.fileInput}
                      onChange={e => handleFileChange(g.id, e)}
                    />
                  </label>
                  {(() => {
                    const attachment = draftAttachments[g.id];
                    if (!attachment) return null;
                    return (
                      <div className={styles.attachmentPreview}>
                        <span>{attachment.fileName}</span>
                        <X
                          size={10}
                          className={styles.removeAttachment}
                          onClick={() => setDraftAttachments(prev => {
                            const updated = { ...prev };
                            delete updated[g.id];
                            return updated;
                          })}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
    </RouteGuard>
  );
}
