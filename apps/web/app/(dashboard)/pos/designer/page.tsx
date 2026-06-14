'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Layout, CheckCircle } from 'lucide-react';

interface POSTerminal {
  id: string;
  name: string;
  code: string;
}

export default function POSDesignerPage() {
  const [terminals, setTerminals] = useState<POSTerminal[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<string>('');
  const [receiptTemplate, setReceiptTemplate] = useState('/* Custom styles */\n.receipt { font-family: monospace; font-size: 12px; }\n.header { text-align: center; font-weight: bold; }\n.item { display: flex; justify-content: space-between; }');
  const [layoutFormat, setLayoutFormat] = useState('THERMAL_80MM');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadTerminals = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/v1/pos/terminals', { headers });
        if (res.ok) {
          const data = await res.json();
          setTerminals(Array.isArray(data) ? data : []);
          if (data.length > 0) {
            const firstId = data[0].id;
            setSelectedTerminal(firstId);
            loadTemplate(firstId);
          }
        }
      } catch {
        // ignore
      }
    };
    loadTerminals();
  }, []);

  const loadTemplate = async (termId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`/api/v1/pos/terminals/${termId}/receipt-template`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.receiptTemplate) setReceiptTemplate(data.receiptTemplate);
        if (data.layoutFormat) setLayoutFormat(data.layoutFormat);
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!selectedTerminal) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/pos/terminals/${selectedTerminal}/receipt-template`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiptTemplate, layoutFormat })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save receipt template settings.');
      }
    } catch {
      alert('Error saving template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: '100%' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Settings style={{ color: 'var(--color-primary)' }} />
          Receipt Template Designer
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Customize standard A4 invoices or raw thermal 80mm/58mm printing styles using CSS templates.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Editor Form */}
        <div className="frappe-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-5)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <div className="frappe-form-group">
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Select POS Terminal</label>
            <select 
              className="frappe-input"
              value={selectedTerminal} 
              onChange={(e) => {
                setSelectedTerminal(e.target.value);
                loadTemplate(e.target.value);
              }}
              style={{
                width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)'
              }}
            >
              {terminals.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          <div className="frappe-form-group">
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Layout Format Standard</label>
            <select 
              className="frappe-input"
              value={layoutFormat} 
              onChange={e => setLayoutFormat(e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }}
            >
              <option value="THERMAL_80MM">80mm Raw Thermal Paper Layout</option>
              <option value="THERMAL_58MM">58mm Raw Thermal Paper Layout</option>
              <option value="A4_INVOICE">Standard A4 Invoice PDF Layout</option>
              <option value="CUSTOM_CSS">User-defined Custom CSS Compiled Layout</option>
            </select>
          </div>

          <div className="frappe-form-group">
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>CSS Template Override</label>
            <textarea 
              className="frappe-input"
              value={receiptTemplate} 
              onChange={e => setReceiptTemplate(e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'monospace', fontSize: '11px', marginTop: 'var(--space-1.5)', height: '220px', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <button 
              className="frappe-btn"
              onClick={handleSave}
              disabled={isSaving}
              style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-xs)' }}
            >
              {isSaving ? 'Saving...' : 'Save Layout configuration'}
            </button>
            {saveSuccess && (
              <span style={{ color: 'var(--color-success)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Saved successfully
              </span>
            )}
          </div>
        </div>

        {/* Live Preview Pane */}
        <div className="frappe-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-5)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layout size={16} /> Print Layout Visual Mock Preview
          </h3>
          
          <div style={{
            background: 'white',
            color: 'black',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontFamily: 'monospace',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            maxWidth: layoutFormat === 'THERMAL_58MM' ? '240px' : layoutFormat === 'THERMAL_80MM' ? '320px' : '100%',
            margin: '0 auto',
            minHeight: '380px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>UNIVERSAL ERP STORE</h4>
              <p style={{ margin: 0, fontSize: '10px', color: '#666' }}>123 Enterprise Way, Tech Hub</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#666' }}>Tel: (555) 019-2834</p>
            </div>

            <div style={{ fontSize: '10px', color: '#333', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Date: 2026-06-14</span>
                <span>Time: 10:45 AM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Receipt: #INV-99281</span>
                <span>Cashier: Admin</span>
              </div>
            </div>

            <div style={{ borderBottom: '1px dashed #ccc', borderTop: '1px dashed #ccc', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Wireless Mouse x2</span>
                <span>$40.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mechanical Keyboard x1</span>
                <span>$85.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>USB-C Hub Adapter x1</span>
                <span>$35.00</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end', fontSize: '11px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <span>Subtotal:</span>
                <span>$160.00</span>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <span>VAT (10%):</span>
                <span>$16.00</span>
              </div>
              <div style={{ display: 'flex', gap: '20px', fontWeight: 'bold', fontSize: '13px' }}>
                <span>Total:</span>
                <span>$176.00</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px dashed #ccc', fontSize: '10px', color: '#666' }}>
              <p style={{ margin: '0 0 4px 0' }}>Thank you for shopping with us!</p>
              <p style={{ margin: 0 }}>Scan QrCode on receipt for invoice PDF</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
