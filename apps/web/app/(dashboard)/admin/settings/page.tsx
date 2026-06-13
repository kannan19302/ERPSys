'use client';

import React, { useState, useEffect } from 'react';
import { Building, Image as ImageIcon, LayoutGrid, Plug, Shield, Loader2, Check } from 'lucide-react';

type Tab = 'general' | 'branding' | 'modules' | 'integrations';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
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
    }
  });

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
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
          }
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
  }, []);

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const handleSave = async (updatedFields?: Partial<typeof formData>) => {
    setSaveStatus('saving');
    setMessage(null);
    
    const fieldsToSave = {
      ...formData,
      ...updatedFields
    };

    try {
      const token = localStorage.getItem('token');
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

  const handleModuleToggle = (modId: keyof typeof formData.modules) => {
    const nextModules = {
      ...formData.modules,
      [modId]: !formData.modules[modId]
    };
    setFormData(prev => ({
      ...prev,
      modules: nextModules
    }));
    handleSave({ modules: nextModules });
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Workspace Settings</h1>
          <p className="text-muted-foreground text-sm">Configure your tenant-level organization settings, branding, and modules.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-muted/40 px-3 py-1.5 rounded-lg border border-border h-fit font-medium">
          {saveStatus === 'saving' && (
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-warning" />
              <span>Saving changes...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-success flex items-center gap-1.5">
              <Check size={14} className="text-success" />
              <span>All changes saved</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-danger flex items-center gap-1.5 font-bold">
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

      <div className="frappe-card overflow-hidden">
        <div className="flex flex-col md:flex-row h-full min-h-[600px]">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-muted/30 border-r border-border p-4 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'general' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building size={16} /> General
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'branding' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon size={16} /> Branding & Appearance
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'modules' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid size={16} /> Features & Modules
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'integrations' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Plug size={16} /> Integrations
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 md:p-8">
            {activeTab === 'general' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Building size={18} className="text-primary"/> Organization Profile</h3>
                  <p className="text-sm text-muted-foreground mt-1">Basic details about your company.</p>
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
                    className="frappe-input mb-2" 
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
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><ImageIcon size={18} className="text-primary"/> Branding & Appearance</h3>
                  <p className="text-sm text-muted-foreground mt-1">Customize the look and feel of your ERP tenant.</p>
                </div>
                <hr className="border-border" />
                
                <div className="flex gap-6 items-start">
                  <div className="w-32 h-32 bg-muted rounded-xl flex items-center justify-center border border-border border-dashed">
                    <ImageIcon size={32} className="text-muted-foreground opacity-50" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium text-sm">Company Logo</h4>
                    <p className="text-xs text-muted-foreground">Upload your organization's logo. It will be used in the sidebar and on generated PDF documents.</p>
                    <div className="mt-2">
                      <button className="frappe-btn frappe-btn-secondary text-xs">Choose File</button>
                    </div>
                  </div>
                </div>

                <div className="frappe-form-group mt-4">
                  <label className="frappe-label">Primary Brand Color (Hex)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      className="w-10 h-10 p-0 border border-border rounded cursor-pointer"
                      value={formData.primaryColor}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({...formData, primaryColor: val});
                        handleSave({ primaryColor: val });
                      }}
                    />
                    <input 
                      className="frappe-input w-32 font-mono text-sm" 
                      value={formData.primaryColor}
                      onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                      onBlur={() => handleSave()}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Used for primary buttons, active states, and highlights.</p>
                </div>
              </div>
            )}

            {activeTab === 'modules' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><LayoutGrid size={18} className="text-primary"/> Features & Modules</h3>
                  <p className="text-sm text-muted-foreground mt-1">Enable or disable specific ERP modules for your workspace.</p>
                </div>
                <hr className="border-border" />
                
                <div className="flex flex-col gap-4">
                  {[
                    { id: 'finance', name: 'Finance & Accounting', desc: 'General ledger, invoicing, chart of accounts.' },
                    { id: 'hr', name: 'Human Resources', desc: 'Employee directory, payroll, and leave management.' },
                    { id: 'crm', name: 'CRM & Sales', desc: 'Customer registry, sales orders, pipelines.' },
                    { id: 'inventory', name: 'Inventory & Warehouse', desc: 'Stock levels, multi-warehouse, item tracking.' },
                    { id: 'manufacturing', name: 'Manufacturing (MRP)', desc: 'Bill of Materials, work orders, production.' },
                    { id: 'pos', name: 'Point of Sale (POS)', desc: 'Retail terminal interface, barcode scanning.' }
                  ].map((mod) => (
                    <div key={mod.id} className="flex items-start justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{mod.name}</span>
                        <span className="text-xs text-muted-foreground">{mod.desc}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.modules[mod.id as keyof typeof formData.modules] || false}
                          onChange={() => handleModuleToggle(mod.id as keyof typeof formData.modules)}
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Plug size={18} className="text-primary"/> Integrations</h3>
                  <p className="text-sm text-muted-foreground mt-1">Connect your workspace to external services.</p>
                </div>
                <hr className="border-border" />
                
                <div className="flex flex-col gap-4">
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
                      <div className="font-medium text-sm flex items-center gap-2"><Shield size={16} className="text-primary"/> SMTP / Email Gateway</div>
                      <button className="frappe-btn frappe-btn-secondary text-xs py-1 px-3">Configure</button>
                    </div>
                    <div className="p-4 text-xs text-muted-foreground">
                      Configure your own SMTP server to send invoices, quotes, and password resets from your own domain.
                    </div>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
                      <div className="font-medium text-sm flex items-center gap-2">Stripe Payments</div>
                      <button className="frappe-btn frappe-btn-secondary text-xs py-1 px-3">Connect</button>
                    </div>
                    <div className="p-4 text-xs text-muted-foreground">
                      Allow customers to pay invoices online via credit card.
                    </div>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
                      <div className="font-medium text-sm flex items-center gap-2">Webhook Endpoint</div>
                      <button className="frappe-btn frappe-btn-primary text-xs py-1 px-3">Add Webhook</button>
                    </div>
                    <div className="p-4 text-xs text-muted-foreground">
                      Receive real-time HTTP POST payloads when events happen in your workspace (e.g. Invoice Created).
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
