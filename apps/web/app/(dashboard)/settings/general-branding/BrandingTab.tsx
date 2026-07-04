'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, Check } from 'lucide-react';

export default function BrandingTab() {
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const getToken = () => localStorage.getItem('token');

  const fetchSettings = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch('/api/v1/admin/settings', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const settings = data.tenant?.settings || {};
        setPrimaryColor(settings.primaryColor || '#6366f1');
      }
    } catch { /* not loaded */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (colorVal: string) => {
    setSaveStatus('saving');
    try {
      const token = getToken();
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryColor: colorVal }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading branding settings...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%', maxWidth: '56rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {saveStatus === 'saving' && (
          <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)' }}>
            <Loader2 size={12} className="animate-spin" />
            Saving changes...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>
            <Check size={14} /> All changes saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>Error saving changes</span>
        )}
      </div>

      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><ImageIcon size={18} style={{ color: 'var(--color-primary)' }} /> Branding</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Customize the visual assets of your ERP client.</p>
        </div>
        <hr style={{ borderColor: 'var(--color-border)' }} />

        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
          <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
            <ImageIcon size={32} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <h4 style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>Company Logo</h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Upload your organization&apos;s logo. It will be used in the sidebar and on generated PDF documents.</p>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <button style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer' }}>Choose File</button>
            </div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', display: 'block', marginBottom: 'var(--space-1)' }}>Primary Brand Color (Hex)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <input
              type="color"
              style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', width: 40, height: 36, padding: 0 }}
              value={primaryColor}
              onChange={(e) => {
                const val = e.target.value;
                setPrimaryColor(val);
                handleSave(val);
              }}
            />
            <input
              style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              onBlur={() => handleSave(primaryColor)}
            />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Used for primary buttons, active states, and highlights.</p>
        </div>
      </div>
    </div>
  );
}
