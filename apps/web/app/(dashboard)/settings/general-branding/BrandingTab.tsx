'use client';
import styles from './BrandingTab.module.css';
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function BrandingTab() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const fetchSettings = async () => {
    try {
      const data = await client.get<{ tenant?: { settings?: { primaryColor?: string } } }>('/admin/settings');
      setPrimaryColor(data.tenant?.settings?.primaryColor || '#6366f1');
    } catch { /* not loaded */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchSettings(); }, [client]);

  const handleSave = async (colorVal: string) => {
    setSaveStatus('saving');
    try {
      await client.request('/admin/settings', { method: 'PATCH', body: JSON.stringify({ primaryColor: colorVal }) });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) {
    return <div className={styles.s1}>Loading branding settings...</div>;
  }

  return (
    <div className={styles.s2}>
      <div className={styles.s3}>
        {saveStatus === 'saving' && (
          <span className={styles.s4}>
            <Loader2 size={12} className="animate-spin" />
            Saving changes...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className={styles.s5}>
            <Check size={14} /> All changes saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className={styles.s6}>Error saving changes</span>
        )}
      </div>

      <div className={styles.s7}>
        <div>
          <h3 className={styles.s8}><ImageIcon size={18} className="ui-text-primary" /> Branding</h3>
          <p className={styles.s9}>Customize the visual assets of your ERP client.</p>
        </div>
        <hr className={styles.s10} />

        <div className={styles.s11}>
          <div className={styles.s12}>
            <ImageIcon size={32} className={styles.s19} />
          </div>
          <div className="ui-stack-2">
            <h4 className={styles.s13}>Company Logo</h4>
            <p className="ui-text-xs-muted">Upload your organization&apos;s logo. It will be used in the sidebar and on generated PDF documents.</p>
            <div className={styles.s14}>
              <button className={styles.s15}>Choose File</button>
            </div>
          </div>
        </div>

        <div>
          <label className={styles.s16}>Primary Brand Color (Hex)</label>
          <div className="ui-hstack-3">
            <input
              type="color"
              className={styles.s17}
              value={primaryColor}
              onChange={(e) => {
                const val = e.target.value;
                setPrimaryColor(val);
                handleSave(val);
              }}
            />
            <input
              className={styles.s18}
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              onBlur={() => handleSave(primaryColor)}
            />
          </div>
          <p className="ui-text-xs-muted mt-1">Used for primary buttons, active states, and highlights.</p>
        </div>
      </div>
    </div>
  );
}
