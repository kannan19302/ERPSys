'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, Textarea, KPICard,
} from '@unerp/ui';
import { Mail, Plus, Search, Edit2, Trash2, Copy, Eye, Send } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  isActive: boolean;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const FALLBACK: EmailTemplate[] = [
  { id: '1', name: 'Welcome Email', category: 'GENERAL', subject: 'Welcome {{customer.name}}!', body: 'Dear {{customer.name}},\n\nWelcome to our platform. We are excited to have you on board.\n\nBest regards,\n{{company.name}}', isActive: true },
  { id: '2', name: 'Quote Follow-up', category: 'QUOTATION', subject: 'Following up on your quote {{quotation.number}}', body: 'Hi {{customer.name}},\n\nI wanted to follow up on the quotation we sent. Let me know if you have any questions.\n\nBest,\n{{sender.name}}', isActive: true },
  { id: '3', name: 'Invoice Reminder', category: 'INVOICE', subject: 'Payment Reminder - {{invoice.number}}', body: 'Dear {{customer.name}},\n\nThis is a friendly reminder that invoice {{invoice.number}} for {{invoice.amount}} is due on {{invoice.dueDate}}.\n\nThank you,\n{{company.name}}', isActive: true },
  { id: '4', name: 'Meeting Confirmation', category: 'FOLLOWUP', subject: 'Meeting Confirmed - {{meeting.date}}', body: 'Hi {{contact.name}},\n\nThis confirms our meeting on {{meeting.date}} at {{meeting.time}}.\n\nLooking forward to it.\n{{sender.name}}', isActive: true },
];

const CATEGORIES = ['GENERAL', 'QUOTATION', 'INVOICE', 'FOLLOWUP'];
const categoryColors: Record<string, string> = { GENERAL: 'info', QUOTATION: 'primary', INVOICE: 'warning', FOLLOWUP: 'success' };

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({ name: '', category: 'GENERAL', subject: '', body: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/crm/email-templates', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) { const d = await res.json(); setTemplates(Array.isArray(d) ? d : d?.data || FALLBACK); }
        else { setTemplates(FALLBACK); }
      } catch { setTemplates(FALLBACK); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject) return;
    setCreating(true);
    try {
      const res = await fetch('/api/v1/crm/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify(form),
      });
      if (res.ok) { const d = await res.json(); setTemplates(prev => [d, ...prev]); }
      setCreateOpen(false);
      setForm({ name: '', category: 'GENERAL', subject: '', body: '' });
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const filtered = templates.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<EmailTemplate>[] = [
    {
      key: 'name', header: 'Template',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.subject}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => <Badge variant={(categoryColors[row.category] || 'default') as any}>{row.category}</Badge> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.isActive ? 'success' : 'default'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '', align: 'right' as const, width: '100px',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
          <button title="Preview" onClick={(e) => { e.stopPropagation(); setSelected(row); setPreviewOpen(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}><Eye size={14} /></button>
          <button title="Duplicate" onClick={(e) => { e.stopPropagation(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}><Copy size={14} /></button>
          <button title="Edit" onClick={(e) => { e.stopPropagation(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}><Edit2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Email Templates" description="Create and manage reusable email templates with variable substitution"
        breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Email Templates' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Template</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Templates" value={templates.length} icon={<Mail size={18} />} color="var(--color-primary)" />
        <KPICard title="Active" value={templates.filter(t => t.isActive).length} icon={<Send size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input type="text" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} loading={loading} rowKey={(r) => r.id}
          onRowClick={(r) => { setSelected(r); setPreviewOpen(true); }}
          emptyTitle="No email templates" emptyMessage="Create your first template to streamline outreach." emptyIcon={<Mail size={48} />} />
      </Card>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Email Template" size="lg"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create Template'}</Button></>}
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Template Name" required placeholder="Welcome Email" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormField label="Category" required>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
              </Select>
            </FormField>
          </div>
          <TextField label="Subject Line" required placeholder="Welcome {{customer.name}}!" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            hint="Use {{variable}} syntax for dynamic content" />
          <FormField label="Email Body" required hint="Supports HTML and {{variable}} placeholders">
            <Textarea rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Dear {{customer.name}},&#10;&#10;Thank you for..." style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </FormField>
          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-sunken)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            <strong>Available variables:</strong> {'{{customer.name}}'}, {'{{customer.email}}'}, {'{{company.name}}'}, {'{{sender.name}}'}, {'{{invoice.number}}'}, {'{{quotation.number}}'}, {'{{invoice.amount}}'}, {'{{invoice.dueDate}}'}
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => { setPreviewOpen(false); setSelected(null); }} title={selected?.name || 'Template Preview'} size="md"
        footer={<Button variant="secondary" onClick={() => { setPreviewOpen(false); setSelected(null); }}>Close</Button>}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant={(categoryColors[selected.category] || 'default') as any}>{selected.category}</Badge>
              <Badge variant={selected.isActive ? 'success' : 'default'}>{selected.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Subject</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{selected.subject}</div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Body</div>
              <pre style={{ fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>{selected.body}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
