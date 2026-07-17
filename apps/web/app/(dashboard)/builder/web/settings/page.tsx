'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@unerp/ui';
import { Settings, Save, Palette, MonitorSmartphone, Code, Globe, Eye } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function WebSettingsPage() {
  const client = useApiClient();
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
        const [settingsData, templatesData] = await Promise.all([
          client.get('/builder/web-settings'), client.get<any[]>('/builder/web-templates')
        ]);
        setSettings(settingsData);
        setTemplates(templatesData);
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [client]);

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
      const updated = await client.patch('/builder/web-settings', formData);
      setSettings(updated);
      alert('Settings saved successfully!');
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

  if (isLoading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className={styles.s1}>
      {/* Header */}
      <PageHeader
        title="Site Settings & Themes"
        description="Manage global design tokens, templates, and custom CSS for your public website."
        actions={
          <button className="ui-btn ui-btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        }
      />

      <div className={styles.s2}>
        {/* Navigation */}
        <div className={styles.s3}>
          {[
            { id: 'theme', label: 'Theme & Templates', icon: Palette },
            { id: 'general', label: 'General Info', icon: Globe },
            { id: 'code', label: 'Custom Code', icon: Code },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{ background: activeTab === tab.id ? 'var(--color-bg-elevated)' : 'transparent', color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === tab.id ? 'var(--weight-bold)' : 'var(--weight-medium)' }} className={styles.s4}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className={`ui-card ${styles.s5}`} >
          
          {activeTab === 'theme' && (
            <div className="ui-stack-6">
              
              <div>
                <h3 className={styles.s6}>Theme Templates</h3>
                <div className={styles.s7}>
                  {templates?.map((t: any) => (
                    <div 
                      key={t.id} 
                      onClick={() => handleTemplateSelect(t.id)}
                      style={{ border: `2px solid ${formData.activeTemplateId === t.id ? 'var(--color-primary)' : 'var(--color-border)'}` }} className={styles.s8}
                    >
                      <div className={styles.s9}>
                        {t.thumbnail ? (
                          <img src={t.thumbnail} alt={t.name} className={styles.s10} />
                        ) : (
                          <span className={styles.s11}>No Preview</span>
                        )}
                      </div>
                      <div style={{ background: formData.activeTemplateId === t.id ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-bg-elevated)' }} className={styles.s12}>
                        <h4 className={styles.s13}>{t.name}</h4>
                        <p className={styles.s14}>{t.description?.substring(0, 50)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className={styles.s15} />

              <div>
                <h3 className={styles.s6}>Design Tokens</h3>
                
                <div className="ui-grid-2 ui-gap-6">
                  {/* Colors */}
                  <div>
                    <h4 className="ui-section-header">Brand Colors</h4>
                    <div className="ui-stack-3">
                      {[
                        { key: 'primary', label: 'Primary Brand' },
                        { key: 'accent', label: 'Accent / Action' },
                        { key: 'background', label: 'Page Background' },
                        { key: 'text', label: 'Main Text' },
                      ].map(color => (
                        <div key={color.key} className="ui-flex-between">
                          <span className="text-sm">{color.label}</span>
                          <div className="ui-hstack-2">
                            <span className={styles.s16}>
                              {formData.themeTokens?.colors?.[color.key] || '#000000'}
                            </span>
                            <input 
                              type="color" 
                              value={formData.themeTokens?.colors?.[color.key] || '#000000'}
                              onChange={(e) => handleColorChange(color.key, e.target.value)}
                              className={styles.s17}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography */}
                  <div>
                    <h4 className="ui-section-header">Typography</h4>
                    <div className="ui-stack-3">
                      <div className="ui-form-group">
                        <label className="ui-label">Heading Font</label>
                        <select 
                          className="ui-input" 
                          value={formData.themeTokens?.fonts?.heading || 'Inter, sans-serif'}
                          onChange={(e) => setFormData((prev: any) => ({...prev, themeTokens: {...prev.themeTokens, fonts: {...prev.themeTokens?.fonts, heading: e.target.value}}}))}
                        >
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Playfair Display, serif">Playfair Display</option>
                          <option value="Space Grotesk, sans-serif">Space Grotesk</option>
                          <option value="Cormorant Garamond, serif">Cormorant Garamond</option>
                        </select>
                      </div>
                      <div className="ui-form-group">
                        <label className="ui-label">Body Font</label>
                        <select 
                          className="ui-input" 
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
              <h3 className={styles.s18}>Custom CSS</h3>
              <p className={styles.s19}>
                Add global CSS that will be applied to all pages on your site.
              </p>
              <textarea 
                className={`ui-input ${styles.s20}`} 
                
                value={formData.globalCss}
                onChange={(e) => setFormData({ ...formData, globalCss: e.target.value })}
                placeholder={"/* Add your custom CSS here */\n.my-custom-class {\n  color: red;\n}"}
              />
            </div>
          )}

          {activeTab === 'general' && (
            <div className="ui-stack-4">
              <h3 className={styles.s18}>General Site Information</h3>
              <div className="ui-form-group">
                <label className="ui-label">Site Name</label>
                <input className="ui-input" type="text" defaultValue="UniERP Public Site" />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Favicon URL</label>
                <input className="ui-input" type="text" defaultValue="/favicon.ico" />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Google Analytics ID</label>
                <input className="ui-input" type="text" placeholder="G-XXXXXXXXXX" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
