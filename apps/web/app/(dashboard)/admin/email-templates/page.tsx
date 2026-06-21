'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Plus, Edit2, Trash2, CheckCircle, RefreshCw, X } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  isActive: boolean;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/platform/email-templates', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreate = () => {
    setEditingTemplate({
      name: '',
      category: 'GENERAL',
      subject: '',
      body: '',
      isActive: true,
    });
    setEditorOpen(true);
  };

  const handleOpenEdit = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email template?')) return;
    try {
      const res = await fetch(`/api/v1/admin/platform/email-templates/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setTemplates(templates.filter(t => t.id !== id));
        showFeedback(true, 'Template deleted successfully');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.body) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/platform/email-templates', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(editingTemplate),
      });
      if (res.ok) {
        setEditorOpen(false);
        setEditingTemplate(null);
        fetchTemplates();
        showFeedback(true, 'Template saved successfully');
      } else {
        showFeedback(false, 'Failed to save email template');
      }
    } catch (e) {
      showFeedback(false, 'Network error saving email template');
    } finally {
      setSaving(false);
    }
  };

  const showFeedback = (success: boolean, message: string) => {
    setFeedback({ success, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Mail style={{ color: 'var(--color-primary)' }} />
            System Email Templates
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Design and manage structured transactional email templates triggered by system workflow events.
          </p>
        </div>
        <button onClick={handleOpenCreate} style={{
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          <Plus size={16} />
          Create Template
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          background: feedback.success ? 'rgba(var(--color-success-rgb), 0.1)' : 'rgba(var(--color-error-rgb), 0.1)',
          border: `1px solid ${feedback.success ? 'var(--color-success)' : 'var(--color-error)'}`,
          color: feedback.success ? 'var(--color-success)' : 'var(--color-error)',
          fontSize: 'var(--text-sm)'
        }}>
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {templates.map(t => (
            <div key={t.id} style={{
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', gap: 'var(--space-3)'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 'var(--weight-bold)', padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)'
                  }}>{t.category}</span>
                  <span style={{
                    fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                    background: t.isActive ? 'rgba(var(--color-success-rgb), 0.1)' : 'rgba(var(--color-text-secondary-rgb), 0.1)',
                    color: t.isActive ? 'var(--color-success)' : 'var(--color-text-secondary)'
                  }}>{t.isActive ? 'Active' : 'Draft'}</span>
                </div>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: '1px' }}>{t.name}</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
                  <strong>Subject:</strong> {t.subject}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                <button onClick={() => handleOpenEdit(t)} style={{
                  background: 'transparent', border: '1px solid var(--color-border)', padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-1)'
                }}>
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(t.id)} style={{
                  background: 'transparent', border: '1px solid var(--color-border)', padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-1)'
                }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
              No custom email templates found. Create one to begin.
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {editorOpen && editingTemplate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)'
        }}>
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)'
            }}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                {editingTemplate.id ? 'Edit Email Template' : 'New Email Template'}
              </h2>
              <button onClick={() => setEditorOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 'var(--space-4)', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Template Name</label>
                  <input value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} required placeholder="e.g. Welcome Message" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Category</label>
                  <select value={editingTemplate.category} onChange={e => setEditingTemplate({ ...editingTemplate, category: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                    <option value="GENERAL">General</option>
                    <option value="AUTH">Authentication / MFA</option>
                    <option value="WORKFLOW">Workflow / Approvals</option>
                    <option value="ALERTS">Alerts & System Monitoring</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Subject Line</label>
                <input value={editingTemplate.subject} onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })} required placeholder="e.g. Account activation for {{user.name}}" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Email Body (HTML/Text)</label>
                <textarea value={editingTemplate.body} onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} required rows={10} placeholder="Type your email template body here. Use variables like {{user.name}}, {{login.url}}, {{company.name}} to customize values." style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'monospace', fontSize: '12px' }} />
              </div>

              <div style={{ background: 'var(--color-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', display: 'block', marginBottom: 'var(--space-1)' }}>Supported Dynamic Placeholders:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {['{{user.name}}', '{{user.email}}', '{{company.name}}', '{{login.url}}', '{{ticket.id}}', '{{approval.link}}'].map(v => (
                    <code key={v} onClick={() => setEditingTemplate({ ...editingTemplate, body: (editingTemplate.body || '') + v })} style={{ fontSize: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                      {v}
                    </code>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input type="checkbox" id="tpl-active" checked={editingTemplate.isActive} onChange={e => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })} />
                <label htmlFor="tpl-active" style={{ fontSize: 'var(--text-sm)' }}>Active & available for workflows</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setEditorOpen(false)} style={{
                  background: 'transparent', border: '1px solid var(--color-border)', padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', cursor: 'pointer'
                }}>Cancel</button>
                <button type="submit" disabled={saving} style={{
                  background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-5)',
                  borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: saving ? 'wait' : 'pointer'
                }}>{saving ? 'Saving...' : 'Save Template'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
