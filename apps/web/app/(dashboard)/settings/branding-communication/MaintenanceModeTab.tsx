'use client';
import styles from './MaintenanceModeTab.module.css';
import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function MaintenanceModeTab() {
  const client = useApiClient();
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: 'System undergoing brief scheduled maintenance. Please refresh in a few minutes.',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchMaintenance = async () => {
      setLoading(true);
      try {
        setMaintenance(await client.get<typeof maintenance>('/admin/platform/maintenance'));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    void fetchMaintenance();
  }, [client]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await client.post('/admin/platform/maintenance', maintenance);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.s1}>
      <div className={styles.s2}
      >
        <ShieldAlert className={styles.s13} />
        <div>
          <h4 className={styles.s3}>Administrative Bypass Enforced</h4>
          <p className={styles.s4}>
            System Administrators and Super Admin accounts bypass maintenance barriers and can log in normally to verify changes or resolve issues.
          </p>
        </div>
      </div>

      <div className="ui-card p-5">
        {loading ? (
          <div className="ui-flex-center p-8">
            <RefreshCw size={24} className="spin ui-text-muted" />
          </div>
        ) : (
          <form onSubmit={handleSave} className={styles.s5}>
            <div className={styles.s6}>
              <div>
                <span className={styles.s7}>System Lockout Status</span>
                <span className="ui-text-xs-muted">Currently {maintenance.enabled ? 'blocking standard sessions' : 'available publicly'}</span>
              </div>
              <button
                type="button"
                onClick={() => setMaintenance({ ...maintenance, enabled: !maintenance.enabled })}
                style={{ color: maintenance.enabled ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s8}
              >
                {maintenance.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div>
              <label className="ui-label">Maintenance Display Message</label>
              <textarea
                value={maintenance.message}
                onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
                required
                rows={4}
                placeholder="Message displayed to users when they attempt to connect during maintenance."
                className={styles.s9}
              />
            </div>

            <div className={styles.s10}>
              <button type="submit" disabled={saving} style={{ cursor: saving ? 'wait' : 'pointer' }} className={styles.s11}>{saving ? 'Saving Status...' : 'Apply Status Settings'}</button>
              {saved && <span className={styles.s12}><CheckCircle size={12} /> Maintenance Mode saved</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
