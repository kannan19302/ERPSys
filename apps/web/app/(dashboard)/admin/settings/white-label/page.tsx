'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Upload, Smartphone, PaintBucket, Loader2 } from 'lucide-react';
import { useToast } from '@/components/builder/ToastProvider';

const API_BASE = '/api/v1/admin/platform';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function WhiteLabelSettings() {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    appName: 'UniERP',
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
    borderRadius: '8px',
    fontFamily: 'Inter',
    enablePWA: true,
    theme: 'light',
    logoUrl: '',
  });

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/white-label`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch {
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/white-label`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast('White-label settings saved successfully!', 'success');
        document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
        document.documentElement.style.setProperty('--color-secondary', settings.secondaryColor);
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>White-label & PWA Settings</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Customize the appearance and behavior of your ERP portal.</p>
        </div>
        <button 
          className="frappe-btn frappe-btn-primary" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div className="frappe-card" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <PaintBucket size={18} /> Branding & Colors
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          <div className="frappe-form-group">
            <label className="frappe-label">Application Name</label>
            <input 
              type="text" 
              className="frappe-input" 
              value={settings.appName} 
              onChange={e => setSettings({...settings, appName: e.target.value})} 
            />
          </div>
          
          <div className="frappe-form-group">
            <label className="frappe-label">Font Family</label>
            <select 
              className="frappe-input" 
              value={settings.fontFamily} 
              onChange={e => setSettings({...settings, fontFamily: e.target.value})}
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Outfit">Outfit</option>
              <option value="System">System Default</option>
            </select>
          </div>

          <div className="frappe-form-group">
            <label className="frappe-label">Primary Color</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input 
                type="color" 
                value={settings.primaryColor} 
                onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: 'var(--radius-md)' }}
              />
              <input 
                type="text" 
                className="frappe-input" 
                value={settings.primaryColor} 
                onChange={e => setSettings({...settings, primaryColor: e.target.value})} 
                style={{ flex: 1 }}
              />
            </div>
          </div>
          
          <div className="frappe-form-group">
            <label className="frappe-label">Secondary Color</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input 
                type="color" 
                value={settings.secondaryColor} 
                onChange={e => setSettings({...settings, secondaryColor: e.target.value})}
                style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: 'var(--radius-md)' }}
              />
              <input 
                type="text" 
                className="frappe-input" 
                value={settings.secondaryColor} 
                onChange={e => setSettings({...settings, secondaryColor: e.target.value})} 
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <Upload size={24} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto var(--space-2)' }} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Upload Custom Logo</p>
          <button className="frappe-btn frappe-btn-secondary">Choose File</button>
        </div>
      </div>

      <div className="frappe-card">
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Smartphone size={18} /> Progressive Web App (PWA)
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 'var(--weight-medium)' }}>Enable PWA Support</h4>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>Allow users to install this ERP as a native application on their devices.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={settings.enablePWA}
              onChange={e => setSettings({...settings, enablePWA: e.target.checked})}
              style={{ width: '20px', height: '20px' }}
            />
          </label>
        </div>
        
        {settings.enablePWA && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div className="frappe-form-group">
              <label className="frappe-label">PWA Manifest Name</label>
              <input type="text" className="frappe-input" value={settings.appName} readOnly style={{ opacity: 0.7 }} />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>Derived from Application Name above.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '64px', height: '64px', background: settings.primaryColor, borderRadius: '16px', margin: '0 auto var(--space-2)' }}></div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>App Icon (192x192)</p>
                <button className="frappe-btn frappe-btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', marginTop: 'var(--space-2)' }}>Upload</button>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '64px', height: '64px', background: settings.primaryColor, borderRadius: '16px', margin: '0 auto var(--space-2)' }}></div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Splash Icon (512x512)</p>
                <button className="frappe-btn frappe-btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', marginTop: 'var(--space-2)' }}>Upload</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
