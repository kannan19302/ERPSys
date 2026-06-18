'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { Plus, MessageSquare, Paperclip, Send, FileText, Image, X } from 'lucide-react';

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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', title: '', description: '', category: 'INDIVIDUAL', type: 'QUARTERLY', startDate: '', endDate: '', keyResults: [{ title: '', target: 100 }] });
  const [msg, setMsg] = useState('');

  // Comment and attachment states
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [draftAttachments, setDraftAttachments] = useState<Record<string, { fileUrl: string; fileName: string }>>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalsRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/goals', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (goalsRes.ok) setGoals(await goalsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (empRes.ok) setEmployees(await empRes.json());
    } catch {} finally { setLoading(false); }
  };

  const createGoal = async (e: React.FormEvent) => { e.preventDefault();
    try { const res = await fetch('/api/v1/advanced-hr/goals', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      if (res.ok) { setMsg('Goal created'); setShowForm(false); fetchData(); }
    } catch {} };

  const updateKR = async (krId: string, current: number) => {
    await fetch(`/api/v1/advanced-hr/key-results/${krId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ current }) });
    fetchData();
  };

  const submitComment = async (goalId: string) => {
    const text = commentTexts[goalId] || '';
    if (!text.trim()) return;
    const attachment = draftAttachments[goalId];

    try {
      const res = await fetch(`/api/v1/advanced-hr/goals/${goalId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          comment: text,
          fileUrl: attachment?.fileUrl || null,
          fileName: attachment?.fileName || null
        })
      });
      if (res.ok) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Goals & OKRs" description="Set objectives and track key results with efforts log comments" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Goals' }]} actions={<Button variant="primary" onClick={() => setShowForm(!showForm)}><Plus size={14} /> New Goal</Button>} />
      {msg && <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{msg}</div>}
      {showForm && <Card padding="md"><form onSubmit={createGoal} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <select className="frappe-input" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select>
        <input className="frappe-input" placeholder="Goal Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}><input className="frappe-input" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /><input className="frappe-input" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} /></div>
        <Button variant="primary" type="submit">Create Goal</Button>
      </form></Card>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}><Spinner size="md" /></div>}
        {!loading && goals.map(g => (
          <Card key={g.id} padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{g.title}</h3>
              <StatusBadge status={g.status} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{g.category} • {g.type}</span>
            </div>
            <div style={{ background: 'var(--color-bg-sunken)', borderRadius: 4, height: 8, marginBottom: 12 }}>
              <div style={{ background: 'var(--color-primary)', borderRadius: 4, height: 8, width: `${g.progress}%` }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{g.progress}% complete</div>
            {g.keyResults?.map(kr => (
              <div key={kr.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <span style={{ flex: 1, fontSize: 13 }}>{kr.title}</span>
                <input type="number" className="frappe-input" style={{ width: 60, padding: '2px 6px', fontSize: 12 }} defaultValue={kr.current} onBlur={e => updateKR(kr.id, parseInt(e.target.value) || 0)} />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>/ {kr.target}</span>
              </div>
            ))}

            {/* Comments & Efforts log */}
            <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 12, paddingTop: 12 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <MessageSquare size={14} /> Comments & Efforts Log ({g.comments?.length || 0})
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', marginBottom: 12 }}>
                {g.comments?.map(c => (
                  <div key={c.id} style={{ background: 'var(--color-bg-sunken)', padding: 8, borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{c.authorName}</span>
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div>{c.comment}</div>
                    {c.fileUrl && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/\.(png|jpe?g|gif|webp)$/i.test(c.fileName || '') ? (
                          <Image size={12} style={{ color: 'var(--color-success)' }} />
                        ) : (
                          <FileText size={12} style={{ color: 'var(--color-danger)' }} />
                        )}
                        <button
                          onClick={() => downloadFile(c.fileUrl!, c.fileName!)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            font: 'inherit',
                            cursor: 'pointer',
                            fontSize: 11,
                            color: 'var(--color-primary)',
                            textDecoration: 'underline',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          {c.fileName} (Download / View)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {(!g.comments || g.comments.length === 0) && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 8 }}>No efforts logs or comments posted.</div>
                )}
              </div>

              {/* Add Comment Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Log efforts or add comments..."
                    className="frappe-input"
                    style={{ flex: 1, padding: '4px 8px', fontSize: 12 }}
                    value={commentTexts[g.id] || ''}
                    onChange={e => setCommentTexts({ ...commentTexts, [g.id]: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitComment(g.id);
                    }}
                  />
                  <Button
                    variant="primary"
                    style={{ padding: '4px 12px', height: 'auto' }}
                    onClick={() => submitComment(g.id)}
                  >
                    <Send size={12} />
                  </Button>
                </div>
                
                {/* Attachment Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    <Paperclip size={12} />
                    <span>Attach Completion Proof (PDF/Image/Document)</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                      style={{ display: 'none' }}
                      onChange={e => handleFileChange(g.id, e)}
                    />
                  </label>
                  {(() => {
                    const attachment = draftAttachments[g.id];
                    if (!attachment) return null;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-success)', background: 'var(--color-success-light)', padding: '2px 8px', borderRadius: 10 }}>
                        <span>{attachment.fileName}</span>
                        <X
                          size={10}
                          style={{ cursor: 'pointer' }}
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
  );
}