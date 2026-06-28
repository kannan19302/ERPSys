'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@unerp/ui';
import { Settings, Save, Palette, MonitorSmartphone, Code, Globe, Eye } from 'lucide-react';

export default function WebSettingsPage() {
  const [activeTab, setActiveTab] = useState<'theme' | 'code' | 'general'>('theme');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<any>({
    activeTemplateId: null,
    globalCss: '',
    themeTokens: {
      colors: { primary: '#3B82F6', accent: '#10B981', background: '#ffffff', text: '#111827' },
      fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' }
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, templatesRes] = await Promise.all([
          fetch('/api/v1/builder/web-settings', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch('/api/v1/builder/web-templates', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        ]);
        
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData);
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        activeTemplateId: settings.activeTemplateId,
        globalCss: settings.globalCss || '',
        themeTokens: settings.themeTokens ? (typeof settings.themeTokens === 'string' ? JSON.parse(settings.themeTokens) : settings.themeTokens) : formData.themeTokens,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/builder/web-settings', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings.');
      }
    } catch (err) {
      alert('Error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleColorChange = (key: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      themeTokens: {
        ...prev.themeTokens,
        colors: { ...prev.themeTokens?.colors, [key]: value }
      }
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = templates?.find((t: any) => t.id === templateId);
    if (tmpl && tmpl.designTokens) {
      const tokens = typeof tmpl.designTokens === 'string' ? JSON.parse(tmpl.designTokens) : tmpl.designTokens;
      setFormData((prev: any) => ({
        ...prev,
        activeTemplateId: templateId,
        themeTokens: tokens
      }));
    }
  };

  if (isLoading) return <div style={{ padding: 'var(--space-6)' }}>Loading settings...</div>;

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', height: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Site Settings & Themes"
        description="Manage global design tokens, templates, and custom CSS for your public website."
        actions={
          <button className="frappe-btn frappe-btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexGrow: 1 }}>
        {/* Navigation */}
        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[
            { id: 'theme', label: 'Theme & Templates', icon: Palette },
            { id: 'general', label: 'General Info', icon: Globe },
            { id: 'code', label: 'Custom Code', icon: Code },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                background: activeTab === tab.id ? 'var(--color-bg-elevated)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === tab.id ? 'var(--weight-bold)' : 'var(--weight-medium)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="frappe-card" style={{ flexGrow: 1, padding: 'var(--space-5)', overflowY: 'auto' }}>
          
          {activeTab === 'theme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)' }}>Theme Templates</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  {templates?.map((t: any) => (
                    <div 
                      key={t.id} 
                      onClick={() => handleTemplateSelect(t.id)}
                      style={{ 
                        border: `2px solid ${formData.activeTemplateId === t.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <div style={{ height: '120px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t.thumbnail ? (
                          <img src={t.thumbnail} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#9ca3af' }}>No Preview</span>
                        )}
                      </div>
                      <div style={{ padding: 'var(--space-2) var(--space-3)', background: formData.activeTemplateId === t.id ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-bg-elevated)' }}>
                        <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>{t.name}</h4>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{t.description?.substring(0, 50)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)' }}>Design Tokens</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                  {/* Colors */}
                  <div>
                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Brand Colors</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {[
                        { key: 'primary', label: 'Primary Brand' },
                        { key: 'accent', label: 'Accent / Action' },
                        { key: 'background', label: 'Page Background' },
                        { key: 'text', label: 'Main Text' },
                      ].map(color => (
                        <div key={color.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 'var(--text-sm)' }}>{color.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                              {formData.themeTokens?.colors?.[color.key] || '#000000'}
                            </span>
                            <input 
                              type="color" 
                              value={formData.themeTokens?.colors?.[color.key] || '#000000'}
                              onChange={(e) => handleColorChange(color.key, e.target.value)}
                              style={{ width: '32px', height: '32px', padding: 0, border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography */}
                  <div>
                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Typography</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <div className="frappe-form-group">
                        <label className="frappe-label">Heading Font</label>
                        <select 
                          className="frappe-input" 
                          value={formData.themeTokens?.fonts?.heading || 'Inter, sans-serif'}
                          onChange={(e) => setFormData((prev: any) => ({...prev, themeTokens: {...prev.themeTokens, fonts: {...prev.themeTokens?.fonts, heading: e.target.value}}}))}
                        >
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Playfair Display, serif">Playfair Display</option>
                          <option value="Space Grotesk, sans-serif">Space Grotesk</option>
                          <option value="Cormorant Garamond, serif">Cormorant Garamond</option>
                        </select>
                      </div>
                      <div className="frappe-form-group">
                        <label className="frappe-label">Body Font</label>
                        <select 
                          className="frappe-input" 
                          value={formData.themeTokens?.fonts?.body || 'Inter, sans-serif'}
                          onChange={(e) => setFormData((prev: any) => ({...prev, themeTokens: {...prev.themeTokens, fonts: {...prev.themeTokens?.fonts, body: e.target.value}}}))}
                        >
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="DM Sans, sans-serif">DM Sans</option>
                          <option value="Nunito, sans-serif">Nunito</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'code' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>Custom CSS</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                Add global CSS that will be applied to all pages on your site.
              </p>
              <textarea 
                className="frappe-input" 
                style={{ width: '100%', height: '300px', fontFamily: 'monospace', resize: 'vertical' }}
                value={formData.globalCss}
                onChange={(e) => setFormData({ ...formData, globalCss: e.target.value })}
                placeholder={"/* Add your custom CSS here */\n.my-custom-class {\n  color: red;\n}"}
              />
            </div>
          )}

          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>General Site Information</h3>
              <div className="frappe-form-group">
                <label className="frappe-label">Site Name</label>
                <input className="frappe-input" type="text" defaultValue="UniERP Public Site" />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Favicon URL</label>
                <input className="frappe-input" type="text" defaultValue="/favicon.ico" />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Google Analytics ID</label>
                <input className="frappe-input" type="text" placeholder="G-XXXXXXXXXX" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
