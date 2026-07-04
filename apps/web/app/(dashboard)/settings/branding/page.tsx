'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, Check } from 'lucide-react';

export default function BrandingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const getToken = () => localStorage.getItem('token');

  const fetchSettings = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch('http://localhost:3001/api/v1/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const settings = data.tenant?.settings || {};
        setPrimaryColor(settings.primaryColor || '#6366f1');
      }
    } catch {
      // not loaded
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (colorVal: string) => {
    setSaveStatus('saving');
    try {
      const token = getToken();
      const res = await fetch('http://localhost:3001/api/v1/admin/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ primaryColor: colorVal })
      });
      if (res.ok) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading branding settings...</div>;
  }

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%', maxWidth: '56rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-semibold)' }}>Branding & Appearance</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Customize the system UI themes, color palettes, and logos.</p>
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

      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><ImageIcon size={18} style={{ color: 'var(--color-primary)' }}/> Branding</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Customize the visual assets of your ERP client.</p>
        </div>
        <hr className="border-border" />

        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
          <div style={{ borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
            <ImageIcon size={32} style={{ color: 'var(--color-text-secondary)', opacity: '0.5' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <h4 style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>Company Logo</h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Upload your organization's logo. It will be used in the sidebar and on generated PDF documents.</p>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <button style={{ fontSize: 'var(--text-xs)' }}>Choose File</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-4)' }}>
          <label className="frappe-label">Primary Brand Color (Hex)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <input
              type="color"
              style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              value={primaryColor}
              onChange={e => {
                const val = e.target.value;
                setPrimaryColor(val);
                handleSave(val);
              }}
            />
            <input
              style={{ fontSize: 'var(--text-sm)' }}
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              onBlur={() => handleSave(primaryColor)}
            />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Used for primary buttons, active states, and highlights.</p>
        </div>
      </div>
    </div>
  );
}
