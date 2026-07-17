'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { Settings, Layout, CheckCircle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface POSTerminal {
  id: string;
  name: string;
  code: string;
}

export default function POSDesignerPage() {
  const client = useApiClient();
  const [terminals, setTerminals] = useState<POSTerminal[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<string>('');
  const [receiptTemplate, setReceiptTemplate] = useState('/* Custom styles */\n.receipt { font-family: monospace; font-size: 12px; }\n.header { text-align: center; font-weight: bold; }\n.item { display: flex; justify-content: space-between; }');
  const [layoutFormat, setLayoutFormat] = useState('THERMAL_80MM');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadTerminals = async () => {
      try {
        const data = await client.get<POSTerminal[]>('/pos/terminals');
        setTerminals(Array.isArray(data) ? data : []);
        if (data.length > 0) {
            const firstId = data[0]?.id;
            if (firstId) {
              setSelectedTerminal(firstId);
              loadTemplate(firstId);
            }
        }
      } catch {
        // ignore
      }
    };
    loadTerminals();
  }, [client]);

  const loadTemplate = async (termId: string) => {
    try {
      const data = await client.get<{ receiptTemplate?: string; layoutFormat?: string }>(`/pos/terminals/${termId}/receipt-template`);
      if (data.receiptTemplate) setReceiptTemplate(data.receiptTemplate);
      if (data.layoutFormat) setLayoutFormat(data.layoutFormat);
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!selectedTerminal) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await client.request(`/pos/terminals/${selectedTerminal}/receipt-template`, { method: 'PUT', body: JSON.stringify({ receiptTemplate, layoutFormat }) });
      {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      alert('Error saving template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RouteGuard permission="pos.designer.read">
    <div className={styles.p1}>
      <div>
        <h1 className="text-2xl ui-hstack-2">
          <Settings className="ui-text-primary" />
          Receipt Template Designer
        </h1>
        <p className="ui-text-sm-muted">
          Customize standard A4 invoices or raw thermal 80mm/58mm printing styles using CSS templates.
        </p>
      </div>

      <div className={styles.p2}>
        {/* Editor Form */}
        <div className={["ui-card", styles.p3].join(' ')} >
          <div className="ui-form-group">
            <label className={styles.p4}>Select POS Terminal</label>
            <select
              className={["ui-input", styles.p5].join(' ')}
              value={selectedTerminal}
              onChange={(e) => {
                setSelectedTerminal(e.target.value);
                loadTemplate(e.target.value);
              }}

            >
              {terminals.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          <div className="ui-form-group">
            <label className={styles.p6}>Layout Format Standard</label>
            <select
              className={["ui-input", styles.p7].join(' ')}
              value={layoutFormat}
              onChange={e => setLayoutFormat(e.target.value)}

            >
              <option value="THERMAL_80MM">80mm Raw Thermal Paper Layout</option>
              <option value="THERMAL_58MM">58mm Raw Thermal Paper Layout</option>
              <option value="A4_INVOICE">Standard A4 Invoice PDF Layout</option>
              <option value="CUSTOM_CSS">User-defined Custom CSS Compiled Layout</option>
            </select>
          </div>

          <div className="ui-form-group">
            <label className={styles.p8}>CSS Template Override</label>
            <textarea
              className={["ui-input", styles.p9].join(' ')}
              value={receiptTemplate}
              onChange={e => setReceiptTemplate(e.target.value)}

            />
          </div>

          <div className={styles.p10}>
            <button
              className={["ui-btn", styles.p11].join(' ')}
              onClick={handleSave}
              disabled={isSaving}

            >
              {isSaving ? 'Saving...' : 'Save Layout configuration'}
            </button>
            {saveSuccess && (
              <span className={styles.p12}>
                <CheckCircle size={14} /> Saved successfully
              </span>
            )}
          </div>
        </div>

        {/* Live Preview Pane */}
        <div className={["ui-card", styles.p13].join(' ')} >
          <h3 className={styles.p14}>
            <Layout size={16} /> Print Layout Visual Mock Preview
          </h3>

          <div style={{ maxWidth: layoutFormat === 'THERMAL_58MM' ? '240px' : layoutFormat === 'THERMAL_80MM' ? '320px' : '100%' }}>
            <div className={styles.p16}>
              <h4 className={styles.p17}>UNIVERSAL ERP STORE</h4>
              <p className={styles.p18}>123 Enterprise Way, Tech Hub</p>
              <p className={styles.p19}>Tel: (555) 019-2834</p>
            </div>

            <div className={styles.p20}>
              <div className="ui-flex-between">
                <span>Date: 2026-06-14</span>
                <span>Time: 10:45 AM</span>
              </div>
              <div className="ui-flex-between">
                <span>Receipt: #INV-99281</span>
                <span>Cashier: Admin</span>
              </div>
            </div>

            <div className={styles.p21}>
              <div className="ui-flex-between">
                <span>Wireless Mouse x2</span>
                <span>$40.00</span>
              </div>
              <div className="ui-flex-between">
                <span>Mechanical Keyboard x1</span>
                <span>$85.00</span>
              </div>
              <div className="ui-flex-between">
                <span>USB-C Hub Adapter x1</span>
                <span>$35.00</span>
              </div>
            </div>

            <div className={styles.p22}>
              <div className={styles.p23}>
                <span>Subtotal:</span>
                <span>$160.00</span>
              </div>
              <div className={styles.p24}>
                <span>VAT (10%):</span>
                <span>$16.00</span>
              </div>
              <div className={styles.p25}>
                <span>Total:</span>
                <span>$176.00</span>
              </div>
            </div>

            <div className={styles.p26}>
              <p className={styles.p27}>Thank you for shopping with us!</p>
              <p className="m-0">Scan QrCode on receipt for invoice PDF</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </RouteGuard>
  );
}
