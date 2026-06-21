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
    return <div className="p-8 text-center text-muted-foreground">Loading branding settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Branding & Appearance</h1>
          <p className="text-muted-foreground text-sm">Customize the system UI themes, color palettes, and logos.</p>
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

      <div className="frappe-card p-6 md:p-8 flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><ImageIcon size={18} className="text-primary"/> Branding</h3>
          <p className="text-sm text-muted-foreground mt-1">Customize the visual assets of your ERP client.</p>
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
              value={primaryColor}
              onChange={e => {
                const val = e.target.value;
                setPrimaryColor(val);
                handleSave(val);
              }}
            />
            <input
              className="frappe-input w-32 font-mono text-sm"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              onBlur={() => handleSave(primaryColor)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Used for primary buttons, active states, and highlights.</p>
        </div>
      </div>
    </div>
  );
}
