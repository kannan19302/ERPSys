'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Spinner, Badge, TextField, FormField, Select,
} from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import {
  Building, Hash, Calendar, Database, Check, Loader2, AlertCircle,
} from 'lucide-react';
import styles from './GeneralSettingsTab.module.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface DemoStatus {
  loaded: boolean;
  modules: Record<string, boolean>;
}

export default function GeneralSettingsTab() {
  const client = useApiClient();
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
      setDemoStatus(await client.get('/admin/demo/status'));
    } catch { /* unavailable */ }
  }, [client]);

  useEffect(() => {
    (async () => {
      try {
          const data = await client.get<any>('/admin/settings');
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
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    })();
    fetchDemoStatus();
  }, [client, fetchDemoStatus]);

  const handleSave = async (updated?: Partial<typeof form>) => {
    setSaveStatus('saving');
    setMessage(null);
    try {
      await client.patch('/admin/settings', { ...form, ...updated });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    }
  };

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      await client.post('/admin/demo/load');
      setMessage({ type: 'success', text: 'Demo data loaded successfully.' });
      fetchDemoStatus();
    } catch { setMessage({ type: 'error', text: 'Error loading demo data.' }); }
    finally { setDemoLoading(false); }
  };

  const handleRemoveDemo = async () => {
    if (!window.confirm('Remove all demo data? This cannot be undone.')) return;
    setDemoLoading(true);
    try {
      await client.delete('/admin/demo/load');
      setMessage({ type: 'success', text: 'Demo data removed.' });
      fetchDemoStatus();
    } catch { setMessage({ type: 'error', text: 'Error removing demo data.' }); }
    finally { setDemoLoading(false); }
  };

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  return (
    <div className={styles.s1}>
      <div className="ui-flex-end">
        {saveStatus === 'saving' && <Badge variant="warning"><Loader2 size={12} className="animate-spin mr-1" /> Saving</Badge>}
        {saveStatus === 'saved' && <Badge variant="success"><Check size={12} className="mr-1" /> Saved</Badge>}
        {saveStatus === 'error' && <Badge variant="danger"><AlertCircle size={12} className="mr-1" /> Error</Badge>}
      </div>

      {message && (
        <div className={styles.s2} style={{background: message.type === 'success' ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}}
        >
          {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      <SettingsSection icon={<Building size={18} />} title="Organization Profile" description="Basic details about your company">
        <div className="ui-grid-2">
          <TextField label="Company Name" value={form.companyName} onChange={(e) => updateField('companyName', e.target.value)} onBlur={() => handleSave()} />
          <TextField label="Registration No. / Tax ID" placeholder="e.g. TX-123456" value={form.taxId} onChange={(e) => updateField('taxId', e.target.value)} onBlur={() => handleSave()} />
        </div>

        <TextField
          label="Street Address"
          placeholder="Street Address"
          value={form.address.street}
          onChange={(e) => updateField('address', { ...form.address, street: e.target.value })}
          onBlur={() => handleSave()}
        />

        <div className={styles.s3}>
          <TextField label="City" placeholder="City" value={form.address.city} onChange={(e) => updateField('address', { ...form.address, city: e.target.value })} onBlur={() => handleSave()} />
          <TextField label="State" placeholder="State/Province" value={form.address.state} onChange={(e) => updateField('address', { ...form.address, state: e.target.value })} onBlur={() => handleSave()} />
          <TextField label="ZIP" placeholder="ZIP/Postal" value={form.address.zip} onChange={(e) => updateField('address', { ...form.address, zip: e.target.value })} onBlur={() => handleSave()} />
        </div>

        <div className="ui-grid-2">
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

      <SettingsSection icon={<Calendar size={18} />} title="Fiscal Year" description="Set your organization's fiscal year start month">
        <div className={styles.s4}>
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

      <SettingsSection icon={<Hash size={18} />} title="Numbering Series" description="Configure document number prefixes">
        <div className={styles.s5}>
          <TextField label="Invoice Prefix" placeholder="INV-" value={form.invoicePrefix} onChange={(e) => updateField('invoicePrefix', e.target.value)} onBlur={() => handleSave()} />
          <TextField label="Purchase Order Prefix" placeholder="PO-" value={form.poPrefix} onChange={(e) => updateField('poPrefix', e.target.value)} onBlur={() => handleSave()} />
          <TextField label="Sales Order Prefix" placeholder="SO-" value={form.soPrefix} onChange={(e) => updateField('soPrefix', e.target.value)} onBlur={() => handleSave()} />
        </div>
      </SettingsSection>

      <SettingsSection icon={<Database size={18} />} title="Demo Data" description="Load or remove sample data for testing and evaluation">
        <div className={styles.s6}
        >
          <div className="ui-flex-between">
            <div className="ui-hstack-2">
              <span className="ui-heading-sm">Status:</span>
              <Badge variant={demoStatus.loaded ? 'success' : 'default'}>
                {demoStatus.loaded ? 'Loaded' : 'Not loaded'}
              </Badge>
            </div>
            <div className="ui-flex ui-gap-2">
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
              <span className={styles.s7}>Per-module status:</span>
              <div className={styles.s8}>
                {Object.entries(demoStatus.modules).map(([mod, loaded]) => (
                  <label key={mod} className={styles.s9}>
                    <input type="checkbox" checked={loaded} readOnly className={styles.s10} />
                    <span className={styles.s11}>{mod}</span>
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
      <div className="p-5 ui-stack-4">
        <div>
          <h3 className={styles.s12}
          >
            <span className="ui-text-primary">{icon}</span> {title}
          </h3>
          <p className={styles.s13}>{description}</p>
        </div>
        {children}
      </div>
    </Card>
  );
}
