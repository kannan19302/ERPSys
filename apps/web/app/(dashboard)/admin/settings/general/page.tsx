'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Building, Loader2, Check, Database, Hash, Calendar } from 'lucide-react';

interface DemoStatus {
  loaded: boolean;
  modules: Record<string, boolean>;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    currency: 'USD',
    timezone: 'UTC',
    address: { street: '', city: '', state: '', zip: '', country: 'US' },
    primaryColor: '#6366f1',
    modules: {
      finance: true,
      hr: true,
      crm: true,
      inventory: true,
      manufacturing: false,
      pos: false,
    },
    invoicePrefix: 'INV-',
    poPrefix: 'PO-',
    soPrefix: 'SO-',
    fiscalYearStartMonth: 1,
  });

  const [demoStatus, setDemoStatus] = useState<DemoStatus>({ loaded: false, modules: {} });
  const [demoLoading, setDemoLoading] = useState(false);

  const getToken = () => localStorage.getItem('token');

  const fetchDemoStatus = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch('http://localhost:3001/api/v1/admin/demo/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setDemoStatus(await res.json());
      }
    } catch {
      // demo status unavailable
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch('http://localhost:3001/api/v1/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const org = data.organization || {};
        const settings = data.tenant?.settings || {};

        setFormData({
          companyName: org.name || '',
          taxId: org.taxId || '',
          currency: org.currency || 'USD',
          timezone: org.timezone || 'UTC',
          address: org.address || { street: '', city: '', state: '', zip: '', country: 'US' },
          primaryColor: settings.primaryColor || '#6366f1',
          modules: settings.modules || {
            finance: true,
            hr: true,
            crm: true,
            inventory: true,
            manufacturing: false,
            pos: false,
          },
          invoicePrefix: settings.invoicePrefix || 'INV-',
          poPrefix: settings.poPrefix || 'PO-',
          soPrefix: settings.soPrefix || 'SO-',
          fiscalYearStartMonth: org.fiscalYearStartMonth || settings.fiscalYearStartMonth || 1,
        });
      }
    } catch {
      // settings not loaded
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchDemoStatus();
  }, [fetchDemoStatus]);

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const handleSave = async (updatedFields?: Partial<typeof formData>) => {
    setSaveStatus('saving');
    setMessage(null);

    const fieldsToSave = {
      ...formData,
      ...updatedFields
    };

    try {
      const token = getToken();
      const res = await fetch('http://localhost:3001/api/v1/admin/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fieldsToSave)
      });

      if (res.ok) {
        setSaveStatus('saved');
      } else {
        const errorData = await res.json();
        setSaveStatus('error');
        setMessage({ type: 'error', text: errorData.message || 'Failed to update settings.' });
      }
    } catch {
      setSaveStatus('error');
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    }
  };

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      const token = getToken();
      const res = await fetch('http://localhost:3001/api/v1/admin/demo/load', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Demo data loaded successfully.' });
        fetchDemoStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to load demo data.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error loading demo data.' });
    } finally {
      setDemoLoading(false);
    }
  };

  const handleRemoveDemo = async () => {
    if (!window.confirm('Are you sure you want to remove all demo data? This action cannot be undone.')) return;
    setDemoLoading(true);
    try {
      const token = getToken();
      const res = await fetch('http://localhost:3001/api/v1/admin/demo/load', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Demo data removed successfully.' });
        fetchDemoStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to remove demo data.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error removing demo data.' });
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading general settings...</div>;
  }

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%', maxWidth: '56rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-semibold)' }}>General Settings</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Configure your tenant-level organization profile, numbering series, and demo data.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--text-xs)', paddingInline: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontWeight: 'var(--weight-medium)' }}>
          {saveStatus === 'saving' && (
            <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
              <Loader2 size={12} className="animate-spin text-warning" />
              <span>Saving changes...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <Check size={14} className="text-success" />
              <span>All changes saved</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'var(--weight-bold)' }}>
              <span>Error saving changes</span>
            </span>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          {message.text}
        </div>
      )}

      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Building size={18} style={{ color: 'var(--color-primary)' }}/> Organization Profile</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Basic details about your company.</p>
        </div>
        <hr className="border-border" />

        <div className="frappe-grid-2">
          <div className="frappe-form-group">
            <label className="frappe-label">Company Name</label>
            <input
              className="frappe-input"
              value={formData.companyName}
              onChange={e => setFormData({...formData, companyName: e.target.value})}
              onBlur={() => handleSave()}
            />
          </div>
          <div className="frappe-form-group">
            <label className="frappe-label">Registration No. / Tax ID</label>
            <input
              className="frappe-input"
              placeholder="e.g. TX-123456"
              value={formData.taxId}
              onChange={e => setFormData({...formData, taxId: e.target.value})}
              onBlur={() => handleSave()}
            />
          </div>
        </div>

        <div className="frappe-form-group">
          <label className="frappe-label">Primary Address</label>
          <input
            style={{ marginBottom: 'var(--space-2)' }}
            placeholder="Street Address"
            value={formData.address.street}
            onChange={e => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
            onBlur={() => handleSave()}
          />
          <div className="frappe-grid-3">
            <input
              className="frappe-input"
              placeholder="City"
              value={formData.address.city}
              onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
              onBlur={() => handleSave()}
            />
            <input
              className="frappe-input"
              placeholder="State/Province"
              value={formData.address.state}
              onChange={e => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
              onBlur={() => handleSave()}
            />
            <input
              className="frappe-input"
              placeholder="ZIP/Postal Code"
              value={formData.address.zip}
              onChange={e => setFormData({...formData, address: {...formData.address, zip: e.target.value}})}
              onBlur={() => handleSave()}
            />
          </div>
        </div>

        <div className="frappe-grid-2">
          <div className="frappe-form-group">
            <label className="frappe-label">Primary Currency</label>
            <select
              className="frappe-input"
              value={formData.currency}
              onChange={e => {
                const val = e.target.value;
                setFormData({...formData, currency: val});
                handleSave({ currency: val });
              }}
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
          <div className="frappe-form-group">
            <label className="frappe-label">Timezone</label>
            <select
              className="frappe-input"
              value={formData.timezone}
              onChange={e => {
                const val = e.target.value;
                setFormData({...formData, timezone: val});
                handleSave({ timezone: val });
              }}
            >
              <option value="UTC">UTC (Universal)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
        </div>

        {/* Fiscal Year Section */}
        <hr className="border-border" />
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Calendar size={18} style={{ color: 'var(--color-primary)' }}/> Fiscal Year</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Set your organization's fiscal year start month.</p>
        </div>
        <div className="frappe-grid-2">
          <div className="frappe-form-group">
            <label className="frappe-label">Fiscal Year Start Month</label>
            <select
              className="frappe-input"
              value={formData.fiscalYearStartMonth}
              onChange={e => {
                const val = Number(e.target.value);
                setFormData({...formData, fiscalYearStartMonth: val});
                handleSave({ fiscalYearStartMonth: val });
              }}
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Numbering Series Section */}
        <hr className="border-border" />
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Hash size={18} style={{ color: 'var(--color-primary)' }}/> Numbering Series</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Configure document number prefixes for invoices, purchase orders, and sales orders.</p>
        </div>
        <div className="frappe-grid-3">
          <div className="frappe-form-group">
            <label className="frappe-label">Invoice Prefix</label>
            <input
              className="frappe-input"
              placeholder="INV-"
              value={formData.invoicePrefix}
              onChange={e => setFormData({...formData, invoicePrefix: e.target.value})}
              onBlur={() => handleSave()}
            />
          </div>
          <div className="frappe-form-group">
            <label className="frappe-label">Purchase Order Prefix</label>
            <input
              className="frappe-input"
              placeholder="PO-"
              value={formData.poPrefix}
              onChange={e => setFormData({...formData, poPrefix: e.target.value})}
              onBlur={() => handleSave()}
            />
          </div>
          <div className="frappe-form-group">
            <label className="frappe-label">Sales Order Prefix</label>
            <input
              className="frappe-input"
              placeholder="SO-"
              value={formData.soPrefix}
              onChange={e => setFormData({...formData, soPrefix: e.target.value})}
              onBlur={() => handleSave()}
            />
          </div>
        </div>

        {/* Demo Data Section */}
        <hr className="border-border" />
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Database size={18} style={{ color: 'var(--color-primary)' }}/> Demo Data</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Load or remove sample data for testing and evaluation.</p>
        </div>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Demo Data Status: </span>
              <span className={`text-sm font-semibold ${demoStatus.loaded ? 'text-success' : 'text-muted-foreground'}`}>
                {demoStatus.loaded ? 'Loaded' : 'Not loaded'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                style={{ fontSize: 'var(--text-xs)' }}
                onClick={handleLoadDemo}
                disabled={demoLoading}
              >
                {demoLoading ? 'Processing...' : 'Load Demo Data'}
              </button>
              {demoStatus.loaded && (
                <button
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger, #dc2626)' }}
                  onClick={handleRemoveDemo}
                  disabled={demoLoading}
                >
                  Remove All Demo Data
                </button>
              )}
            </div>
          </div>
          {Object.keys(demoStatus.modules).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Per-module demo data status:</span>
              <div className="frappe-grid-3">
                {Object.entries(demoStatus.modules).map(([mod, loaded]) => (
                  <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <input type="checkbox" checked={loaded} readOnly className="accent-primary" />
                    <span style={{ textTransform: 'capitalize' }}>{mod}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
