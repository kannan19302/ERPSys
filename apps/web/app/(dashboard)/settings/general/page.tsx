'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, TextField, FormField, Select, Tabs,
} from '@unerp/ui';
import {
  Building, Hash, Calendar, Database, Check, Loader2, AlertCircle,
  Settings, Palette, Plug,
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface DemoStatus {
  loaded: boolean;
  modules: Record<string, boolean>;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` };
}

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    companyName: '', taxId: '', currency: 'USD', timezone: 'UTC',
    address: { street: '', city: '', state: '', zip: '', country: 'US' },
    primaryColor: '#6366f1',
    invoicePrefix: 'INV-', poPrefix: 'PO-', soPrefix: 'SO-',
    fiscalYearStartMonth: 1,
  });

  const [demoStatus, setDemoStatus] = useState<DemoStatus>({ loaded: false, modules: {} });
  const [demoLoading, setDemoLoading] = useState(false);

  const fetchDemoStatus = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/admin/demo/status', { headers: authHeaders() });
      if (res.ok) setDemoStatus(await res.json());
    } catch { /* unavailable */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:3001/api/v1/admin/settings', { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          const org = data.organization || {};
          const settings = data.tenant?.settings || {};
          setForm({
            companyName: org.name || '', taxId: org.taxId || '',
            currency: org.currency || 'USD', timezone: org.timezone || 'UTC',
            address: org.address || { street: '', city: '', state: '', zip: '', country: 'US' },
            primaryColor: settings.primaryColor || '#6366f1',
            invoicePrefix: settings.invoicePrefix || 'INV-',
            poPrefix: settings.poPrefix || 'PO-', soPrefix: settings.soPrefix || 'SO-',
            fiscalYearStartMonth: org.fiscalYearStartMonth || settings.fiscalYearStartMonth || 1,
          });
        }
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    })();
    fetchDemoStatus();
  }, [fetchDemoStatus]);

  const handleSave = async (updated?: Partial<typeof form>) => {
    setSaveStatus('saving');
    setMessage(null);
    try {
      const res = await fetch('http://localhost:3001/api/v1/admin/settings', {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ ...form, ...updated }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveStatus('error');
        setMessage({ type: 'error', text: (err as any).message || 'Failed to save' });
      }
    } catch {
      setSaveStatus('error');
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    }
  };

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/admin/demo/load', { method: 'POST', headers: authHeaders() });
      setMessage({ type: res.ok ? 'success' : 'error', text: res.ok ? 'Demo data loaded successfully.' : 'Failed to load demo data.' });
      if (res.ok) fetchDemoStatus();
    } catch { setMessage({ type: 'error', text: 'Error loading demo data.' }); }
    finally { setDemoLoading(false); }
  };

  const handleRemoveDemo = async () => {
    if (!window.confirm('Remove all demo data? This cannot be undone.')) return;
    setDemoLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/admin/demo/load', { method: 'DELETE', headers: authHeaders() });
      setMessage({ type: res.ok ? 'success' : 'error', text: res.ok ? 'Demo data removed.' : 'Failed to remove demo data.' });
      if (res.ok) fetchDemoStatus();
    } catch { setMessage({ type: 'error', text: 'Error removing demo data.' }); }
    finally { setDemoLoading(false); }
  };

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '56rem' }}>
      <PageHeader
        title="General Settings"
        description="Configure your organization profile, numbering series, and demo data"
        breadcrumbs={[
          { label: 'Administration', href: '/admin' },
          { label: 'Settings' },
          { label: 'General' },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {saveStatus === 'saving' && <Badge variant="warning"><Loader2 size={12} className="animate-spin" style={{ marginRight: 4 }} /> Saving</Badge>}
            {saveStatus === 'saved' && <Badge variant="success"><Check size={12} style={{ marginRight: 4 }} /> Saved</Badge>}
            {saveStatus === 'error' && <Badge variant="danger"><AlertCircle size={12} style={{ marginRight: 4 }} /> Error</Badge>}
          </div>
        }
      />

      {/* Settings Navigation */}
      <Tabs
        tabs={[
          { key: 'general', label: 'General', icon: <Settings size={14} /> },
          { key: 'branding', label: 'Branding', icon: <Palette size={14} /> },
          { key: 'integrations', label: 'Integrations', icon: <Plug size={14} /> },
        ]}
        value="general"
        onChange={(key) => {
          if (key !== 'general') window.location.href = `/admin/settings/${key}`;
        }}
      />

      {message && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
          background: message.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
          color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}>
          {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      {/* Organization Profile */}
      <SettingsSection icon={<Building size={18} />} title="Organization Profile" description="Basic details about your company">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <TextField label="Company Name" value={form.companyName} onChange={(e) => updateField('companyName', e.target.value)} onBlur={() => handleSave()} />
          <TextField label="Registration No. / Tax ID" placeholder="e.g. TX-123456" value={form.taxId} onChange={(e) => updateField('taxId', e.target.value)} onBlur={() => handleSave()} />
        </div>

        <TextField
          label="Street Address" placeholder="Street Address"
          value={form.address.street}
          onChange={(e) => updateField('address', { ...form.address, street: e.target.value })}
          onBlur={() => handleSave()}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <TextField label="City" placeholder="City" value={form.address.city} onChange={(e) => updateField('address', { ...form.address, city: e.target.value })} onBlur={() => handleSave()} />
          <TextField label="State" placeholder="State/Province" value={form.address.state} onChange={(e) => updateField('address', { ...form.address, state: e.target.value })} onBlur={() => handleSave()} />
          <TextField label="ZIP" placeholder="ZIP/Postal" value={form.address.zip} onChange={(e) => updateField('address', { ...form.address, zip: e.target.value })} onBlur={() => handleSave()} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="Primary Currency">
            <Select value={form.currency} onChange={(e) => { updateField('currency', e.target.value); handleSave({ currency: e.target.value }); }}>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </Select>
          </FormField>
          <FormField label="Timezone">
            <Select value={form.timezone} onChange={(e) => { updateField('timezone', e.target.value); handleSave({ timezone: e.target.value }); }}>
              <option value="UTC">UTC (Universal)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </Select>
          </FormField>
        </div>
      </SettingsSection>

      {/* Fiscal Year */}
      <SettingsSection icon={<Calendar size={18} />} title="Fiscal Year" description="Set your organization's fiscal year start month">
        <div style={{ maxWidth: 320 }}>
          <FormField label="Fiscal Year Start Month">
            <Select
              value={form.fiscalYearStartMonth}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateField('fiscalYearStartMonth', val);
                handleSave({ fiscalYearStartMonth: val });
              }}
            >
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </Select>
          </FormField>
        </div>
      </SettingsSection>

      {/* Numbering Series */}
      <SettingsSection icon={<Hash size={18} />} title="Numbering Series" description="Configure document number prefixes">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <TextField label="Invoice Prefix" placeholder="INV-" value={form.invoicePrefix} onChange={(e) => updateField('invoicePrefix', e.target.value)} onBlur={() => handleSave()} />
          <TextField label="Purchase Order Prefix" placeholder="PO-" value={form.poPrefix} onChange={(e) => updateField('poPrefix', e.target.value)} onBlur={() => handleSave()} />
          <TextField label="Sales Order Prefix" placeholder="SO-" value={form.soPrefix} onChange={(e) => updateField('soPrefix', e.target.value)} onBlur={() => handleSave()} />
        </div>
      </SettingsSection>

      {/* Demo Data */}
      <SettingsSection icon={<Database size={18} />} title="Demo Data" description="Load or remove sample data for testing and evaluation">
        <div style={{
          padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)', background: 'var(--color-bg)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Status:</span>
              <Badge variant={demoStatus.loaded ? 'success' : 'default'}>
                {demoStatus.loaded ? 'Loaded' : 'Not loaded'}
              </Badge>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="outline" onClick={handleLoadDemo} disabled={demoLoading}>
                {demoLoading ? <><Spinner size="sm" /> Processing...</> : 'Load Demo Data'}
              </Button>
              {demoStatus.loaded && (
                <Button variant="danger" onClick={handleRemoveDemo} disabled={demoLoading}>
                  Remove Demo Data
                </Button>
              )}
            </div>
          </div>

          {Object.keys(demoStatus.modules).length > 0 && (
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Per-module status:</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                {Object.entries(demoStatus.modules).map(([mod, loaded]) => (
                  <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <input type="checkbox" checked={loaded} readOnly style={{ accentColor: 'var(--color-primary)' }} />
                    <span style={{ textTransform: 'capitalize' }}>{mod}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ icon, title, description, children }: {
  icon: React.ReactNode; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <h3 style={{
            fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)', margin: 0,
          }}>
            <span style={{ color: 'var(--color-primary)' }}>{icon}</span> {title}
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: '4px 0 0' }}>{description}</p>
        </div>
        {children}
      </div>
    </Card>
  );
}
