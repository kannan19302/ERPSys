'use client';
import styles from './EmailTemplatesTab.module.css';
import React, { useState, useEffect } from 'react';
import { Button, Modal } from '@unerp/ui';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  isActive: boolean;
}

export default function EmailTemplatesTab() {
  const client = useApiClient();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      setTemplates(await client.get<EmailTemplate[]>('/admin/platform/email-templates'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchTemplates(); }, [client]);

  const handleOpenCreate = () => {
    setEditingTemplate({ name: '', category: 'GENERAL', subject: '', body: '', isActive: true });
    setEditorOpen(true);
  };

  const handleOpenEdit = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email template?')) return;
    try {
      await client.delete(`/admin/platform/email-templates/${id}`);
      setTemplates((previous) => previous.filter((template) => template.id !== id));
      showFeedback(true, 'Template deleted successfully');
    } catch (e) { console.error(e); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.body) return;
    setSaving(true);
    try {
      await client.post('/admin/platform/email-templates', editingTemplate);
      setEditorOpen(false);
      setEditingTemplate(null);
      void fetchTemplates();
      showFeedback(true, 'Template saved successfully');
    } catch {
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
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={handleOpenCreate}>
          <Plus size={14} className="mr-2" /> Create Template
        </Button>
      </div>

      {feedback && (
        <div style={{ background: feedback.success ? 'var(--color-success-light)' : 'var(--color-error-light)', border: `1px solid ${feedback.success ? 'var(--color-success)' : 'var(--color-error)'}`, color: feedback.success ? 'var(--color-success)' : 'var(--color-error)' }} className={styles.s1}
        >
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="ui-flex-center p-8">
          <RefreshCw size={24} className="spin ui-text-muted" />
        </div>
      ) : (
        <div className={styles.p1}>
          {templates.map((t) => (
            <div key={t.id} className={styles.s2}
            >
              <div>
                <div className={styles.p2}>
                  <span className={styles.s3}
                  >
                    {t.category}
                  </span>
                  <span style={{ background: t.isActive ? 'var(--color-success-light)' : 'var(--color-bg-sunken)', color: t.isActive ? 'var(--color-success)' : 'var(--color-text-secondary)' }} className={styles.s4}
                  >
                    {t.isActive ? 'Active' : 'Draft'}
                  </span>
                </div>
                <h3 className={styles.p3}>{t.name}</h3>
                <p className={styles.p4}>
                  <strong>Subject:</strong> {t.subject}
                </p>
              </div>

              <div className={styles.p5}>
                <button onClick={() => handleOpenEdit(t)} className={styles.p6}>
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(t.id)} className={styles.p7}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className={styles.p8}>
              No custom email templates found. Create one to begin.
            </div>
          )}
        </div>
      )}

      <Modal
        open={editorOpen && !!editingTemplate}
        onClose={() => setEditorOpen(false)}
        title={editingTemplate?.id ? 'Edit Email Template' : 'New Email Template'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSave as any} disabled={saving}>
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </>
        }
      >
        {editingTemplate && (
          <form onSubmit={handleSave} className="ui-stack-4">
            <div className={styles.p9}>
              <div>
                <label className="ui-label">Template Name</label>
                <input value={editingTemplate.name} onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })} required placeholder="e.g. Welcome Message" className="ui-field-box" />
              </div>
              <div>
                <label className="ui-label">Category</label>
                <select value={editingTemplate.category} onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })} className="ui-field-box">
                  <option value="GENERAL">General</option>
                  <option value="AUTH">Authentication / MFA</option>
                  <option value="WORKFLOW">Workflow / Approvals</option>
                  <option value="ALERTS">Alerts & System Monitoring</option>
                </select>
              </div>
            </div>

            <div>
              <label className="ui-label">Subject Line</label>
              <input value={editingTemplate.subject} onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })} required placeholder="e.g. Account activation for {{user.name}}" className="ui-field-box" />
            </div>

            <div>
              <label className="ui-label">Email Body (HTML/Text)</label>
              <textarea value={editingTemplate.body} onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })} required rows={10} placeholder="Type your email template body here. Use variables like {{user.name}}, {{login.url}}, {{company.name}} to customize values." className={styles.p10} />
            </div>

            <div className={styles.p11}>
              <span className={styles.p12}>Supported Dynamic Placeholders:</span>
              <div className={styles.p13}>
                {['{{user.name}}', '{{user.email}}', '{{company.name}}', '{{login.url}}', '{{ticket.id}}', '{{approval.link}}'].map((v) => (
                  <code key={v} onClick={() => setEditingTemplate({ ...editingTemplate, body: (editingTemplate.body || '') + v })} className={styles.p14}>
                    {v}
                  </code>
                ))}
              </div>
            </div>

            <div className="ui-hstack-2">
              <input type="checkbox" id="tpl-active" checked={editingTemplate.isActive} onChange={(e) => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })} />
              <label htmlFor="tpl-active" className="text-sm">Active & available for workflows</label>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
