'use client';
import styles from './EmailTemplatesTab.module.css';
import React, { useState, useEffect } from 'react';
import {
  Card, Button, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, Textarea, KPICard,
} from '@unerp/ui';
import { Mail, Plus, Search, Edit2, Trash2, Copy, Eye, Send } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  isActive: boolean;
}

const FALLBACK: EmailTemplate[] = [
  { id: '1', name: 'Welcome Email', category: 'GENERAL', subject: 'Welcome {{customer.name}}!', body: 'Dear {{customer.name}},\n\nWelcome to our platform. We are excited to have you on board.\n\nBest regards,\n{{company.name}}', isActive: true },
  { id: '2', name: 'Quote Follow-up', category: 'QUOTATION', subject: 'Following up on your quote {{quotation.number}}', body: 'Hi {{customer.name}},\n\nI wanted to follow up on the quotation we sent. Let me know if you have any questions.\n\nBest,\n{{sender.name}}', isActive: true },
  { id: '3', name: 'Invoice Reminder', category: 'INVOICE', subject: 'Payment Reminder - {{invoice.number}}', body: 'Dear {{customer.name}},\n\nThis is a friendly reminder that invoice {{invoice.number}} for {{invoice.amount}} is due on {{invoice.dueDate}}.\n\nThank you,\n{{company.name}}', isActive: true },
  { id: '4', name: 'Meeting Confirmation', category: 'FOLLOWUP', subject: 'Meeting Confirmed - {{meeting.date}}', body: 'Hi {{contact.name}},\n\nThis confirms our meeting on {{meeting.date}} at {{meeting.time}}.\n\nLooking forward to it.\n{{sender.name}}', isActive: true },
];

const CATEGORIES = ['GENERAL', 'QUOTATION', 'INVOICE', 'FOLLOWUP'];
const categoryColors: Record<string, string> = { GENERAL: 'info', QUOTATION: 'primary', INVOICE: 'warning', FOLLOWUP: 'success' };

export default function EmailTemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({ name: '', category: 'GENERAL', subject: '', body: '' });
  const [creating, setCreating] = useState(false);
  const client = useApiClient();

  useEffect(() => {
    (async () => {
      try {
        const d = await client.get<any>('/crm/email-templates');
        setTemplates(Array.isArray(d) ? d : d?.data || FALLBACK);
      } catch { 
        setTemplates(FALLBACK); 
      } finally { 
        setLoading(false); 
      }
    })();
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject) return;
    setCreating(true);
    try {
      const d = await client.post<any>('/crm/email-templates', form);
      setTemplates(prev => [d, ...prev]);
      setCreateOpen(false);
      setForm({ name: '', category: 'GENERAL', subject: '', body: '' });
    } catch { /* handled */ } finally { 
      setCreating(false); 
    }
  };

  const filtered = templates.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<EmailTemplate>[] = [
    {
      key: 'name', header: 'Template',
      render: (row) => (
        <div className="ui-hstack-3">
          <div className={styles.style0}>
            <Mail size={16} />
          </div>
          <div>
            <div className="ui-heading-sm">{row.name}</div>
            <div className={styles.style1}>{row.subject}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => <Badge variant={(categoryColors[row.category] || 'default') as any}>{row.category}</Badge> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.isActive ? 'success' : 'default'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '', align: 'right' as const, width: '100px',
      render: (row) => (
        <div className={styles.style2}>
          <button title="Preview" onClick={(e) => { e.stopPropagation(); setSelected(row); setPreviewOpen(true); }} className={styles.style3}><Eye size={14} /></button>
          <button title="Duplicate" onClick={(e) => { e.stopPropagation(); }} className={styles.style4}><Copy size={14} /></button>
          <button title="Edit" onClick={(e) => { e.stopPropagation(); }} className={styles.style5}><Edit2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Template</Button>
      </div>

      <div className="ui-grid-auto">
        <KPICard title="Total Templates" value={templates.length} icon={<Mail size={18} />} color="var(--color-primary)" />
        <KPICard title="Active" value={templates.filter(t => t.isActive).length} icon={<Send size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div className={styles.style6}>
          <Search size={16} className={styles.style7} />
          <input type="text" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)}
            className={styles.style8} />
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
        <form onSubmit={handleCreate} className="ui-stack-4">
          <div className={styles.style9}>
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
              placeholder="Dear {{customer.name}},&#10;&#10;Thank you for..." className={styles.style10} />
          </FormField>
          <div className={styles.style11}>
            <strong>Available variables:</strong> {'{{customer.name}}'}, {'{{customer.email}}'}, {'{{company.name}}'}, {'{{sender.name}}'}, {'{{invoice.number}}'}, {'{{quotation.number}}'}, {'{{invoice.amount}}'}, {'{{invoice.dueDate}}'}
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => { setPreviewOpen(false); setSelected(null); }} title={selected?.name || 'Template Preview'} size="md"
        footer={<Button variant="secondary" onClick={() => { setPreviewOpen(false); setSelected(null); }}>Close</Button>}
      >
        {selected && (
          <div className="ui-stack-4">
            <div className="ui-flex-between">
              <Badge variant={(categoryColors[selected.category] || 'default') as any}>{selected.category}</Badge>
              <Badge variant={selected.isActive ? 'success' : 'default'}>{selected.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div>
              <div className={styles.style12}>Subject</div>
              <div className="ui-heading-sm">{selected.subject}</div>
            </div>
            <div className={styles.style13}>
              <div className={styles.style14}>Body</div>
              <pre className={styles.s1}>{selected.body}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
