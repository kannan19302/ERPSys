'use client';
import styles from './WebFormsTab.module.css';
import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Badge, Modal, FormField, Input, useToast } from '@unerp/ui';
import {
  Plus, FileText, Copy, CheckCircle, AlertCircle,
  Trash2, Eye,
} from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface FormField {
  name: string;
  label: string;
  type: 'TEXT' | 'EMAIL' | 'PHONE' | 'SELECT' | 'TEXTAREA' | 'NUMBER';
  required: boolean;
}

interface WebForm {
  id: string;
  name: string;
  fields: FormField[];
  redirectUrl: string | null;
  notifyEmail: string | null;
  assignToId: string | null;
  campaignId: string | null;
  isActive: boolean;
  _count?: { submissions: number };
  createdAt: string;
}

export default function WebFormsTab() {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<WebForm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewFormId, setPreviewFormId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form creation state
  const [formName, setFormName] = useState('');
  const [fields, setFields] = useState<FormField[]>([{ name: 'full_name', label: 'Full Name', type: 'TEXT', required: true }]);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [assignToId, setAssignToId] = useState('');
  const [campaignId, setCampaignId] = useState('');

  const toast = useToast();
  const client = useApiClient();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await client.get<any>('/crm/forms');
      setForms(Array.isArray(d) ? d : (d?.data || []));
    } catch (err) {
      setError('Could not load web forms. Please try again.');
      toast.error('Could not load forms', err instanceof Error ? err.message : undefined);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: formName,
      fields,
      redirectUrl: redirectUrl || undefined,
      notifyEmail: notifyEmail || undefined,
      assignToId: assignToId || undefined,
      campaignId: campaignId || undefined,
    };

    try {
      await client.post('/crm/forms', payload);
      toast.success('Form created', `"${formName}" is ready to embed.`);
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error('Could not create form', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFields([{ name: 'full_name', label: 'Full Name', type: 'TEXT', required: true }]);
    setRedirectUrl('');
    setNotifyEmail('');
    setAssignToId('');
    setCampaignId('');
  };

  const addField = () => setFields(prev => [...prev, { name: '', label: '', type: 'TEXT', required: false }]);
  const removeField = (i: number) => setFields(prev => prev.filter((_, idx) => idx !== i));
  const updateField = (i: number, key: keyof FormField, value: string | boolean) => {
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, [key]: value } : f));
  };

  const copyEmbed = (id: string) => {
    const code = `<iframe src="${window.location.origin}/api/v1/crm/forms/${id}/embed" width="100%" height="500" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' };
  const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' };

  const previewForm = forms.find(f => f.id === previewFormId);

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button onClick={() => setIsModalOpen(true)} variant="primary" className="ui-hstack-2">
          <Plus size={16} />
          <span>New Form</span>
        </Button>
      </div>

      {error && (
        <div className={styles.style0}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="ui-center-pad"><Spinner size="lg" /></div>
      ) : forms.length === 0 ? (
        <Card>
          <div className="ui-empty-state">
            <FileText size={48} className="ui-hr-faded" />
            <div className="font-semibold">No Forms Created</div>
            <div className="text-sm">Create a web form to start capturing leads.</div>
          </div>
        </Card>
      ) : (
        <div className={styles.style1}>
          {forms.map(f => (
            <Card key={f.id}>
              <div className="p-5">
                <div className={styles.style2}>
                  <div>
                    <div className={styles.style3}>{f.name}</div>
                    <div className="ui-text-xs-muted mt-1">{f.fields.length} fields</div>
                  </div>
                  {f.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
                </div>
                <div className={styles.style4}>
                  <div><span className={styles.style5}>{f._count?.submissions || 0}</span> submissions</div>
                  {f.notifyEmail && <div>Notifies: {f.notifyEmail}</div>}
                </div>
                <div className="ui-flex ui-gap-2">
                  <Button variant="secondary" onClick={() => copyEmbed(f.id)} className={styles.style6}>
                    {copiedId === f.id ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copiedId === f.id ? 'Copied!' : 'Embed Code'}
                  </Button>
                  <Button variant="secondary" onClick={() => setPreviewFormId(previewFormId === f.id ? null : f.id)} className={styles.style7}>
                    <Eye size={14} />
                    Preview
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Preview */}
      {previewForm && (
        <Card>
          <div className={styles.style8}>
            <h3 className="ui-heading-base">Preview: {previewForm.name}</h3>
          </div>
          <div className={styles.style9}>
            <form onSubmit={e => e.preventDefault()} className="ui-stack-4">
              {previewForm.fields.map((f, i) => (
                <div key={i}>
                  <label style={labelStyle}>{f.label} {f.required && <span className="ui-text-danger">*</span>}</label>
                  {f.type === 'TEXTAREA' ? (
                    <textarea disabled className={`ui-input ${styles.s1}`} style={{ ...inputStyle }} placeholder={f.label} />
                  ) : f.type === 'SELECT' ? (
                    <select disabled className="ui-input" style={inputStyle}><option>Select {f.label}...</option></select>
                  ) : (
                    <input disabled type={f.type === 'EMAIL' ? 'email' : f.type === 'PHONE' ? 'tel' : f.type === 'NUMBER' ? 'number' : 'text'} className="ui-input" style={inputStyle} placeholder={f.label} />
                  )}
                </div>
              ))}
              <Button variant="primary" disabled className={styles.style10}>Submit</Button>
            </form>
          </div>
        </Card>
      )}

      {/* Create Form Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Web Form" size="lg"
        footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={submitting}>{submitting ? 'Creating...' : 'Create Form'}</Button></>}
      >
        <form onSubmit={handleCreate} className={styles.style11}>
          <FormField label="Form Name" required>
            <Input required placeholder="e.g. Contact Us" value={formName} onChange={e => setFormName(e.target.value)} />
          </FormField>

          {/* Field Builder */}
          <div>
            <div className={styles.style12}>
              <label style={{ ...labelStyle }} className={styles.s2}>Form Fields</label>
              <button type="button" onClick={addField} className={styles.style13}>
                <Plus size={14} /> Add Field
              </button>
            </div>
            <div className="ui-stack-3">
              {fields.map((f, i) => (
                <div key={i} className={styles.style14}>
                  <input type="text" required placeholder="field_name" value={f.name} onChange={e => updateField(i, 'name', e.target.value)} className={`ui-input ${styles.s3}`} style={{ ...inputStyle }} />
                  <input type="text" required placeholder="Label" value={f.label} onChange={e => updateField(i, 'label', e.target.value)} className={`ui-input ${styles.s3}`} style={{ ...inputStyle }} />
                  <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)} className={`ui-input ${styles.s3}`} style={{ ...inputStyle }}>
                    <option value="TEXT">Text</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                    <option value="SELECT">Select</option>
                    <option value="TEXTAREA">Textarea</option>
                    <option value="NUMBER">Number</option>
                  </select>
                  <label className={styles.style15}>
                    <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} />
                    Req
                  </label>
                  <button type="button" onClick={() => removeField(i)} className={styles.style16}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <label style={{ ...labelStyle }} className={styles.s4}>Settings</label>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Redirect URL">
                <Input placeholder="/thank-you" value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} />
              </FormField>
              <FormField label="Notify Email">
                <Input type="email" placeholder="sales@company.com" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} />
              </FormField>
              <FormField label="Assign To (User ID)">
                <Input placeholder="User ID" value={assignToId} onChange={e => setAssignToId(e.target.value)} />
              </FormField>
              <FormField label="Campaign ID">
                <Input placeholder="Campaign ID" value={campaignId} onChange={e => setCampaignId(e.target.value)} />
              </FormField>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
