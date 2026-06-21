'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Trash2, Plus, RefreshCw, Search } from 'lucide-react';

interface GeneratedDocument {
  id: string;
  name: string;
  templateName: string;
  format: string;
  generatedAt: string;
  generatedBy: string;
  size: string;
  entityType: string;
  entityId: string;
}

export default function DriveTemplatesPage() {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/storage/generated-documents', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDocuments(Array.isArray(data) ? data : (data?.data || []));
        }
      } catch {
        // Fallback data when API unavailable
        setDocuments([
          { id: 'gd-1', name: 'Invoice-2026-0185.pdf', templateName: 'Invoice Template', format: 'PDF', generatedAt: '2026-06-21 09:15', generatedBy: 'Admin', size: '142 KB', entityType: 'Invoice', entityId: 'INV-2026-0185' },
          { id: 'gd-2', name: 'PO-2026-0284.pdf', templateName: 'Purchase Order Template', format: 'PDF', generatedAt: '2026-06-20 14:30', generatedBy: 'Jane Smith', size: '98 KB', entityType: 'PurchaseOrder', entityId: 'PO-2026-0284' },
          { id: 'gd-3', name: 'Payslip-Jun-2026-EMP001.pdf', templateName: 'Payslip Template', format: 'PDF', generatedAt: '2026-06-15 08:00', generatedBy: 'System', size: '78 KB', entityType: 'Payslip', entityId: 'PS-2026-0601' },
          { id: 'gd-4', name: 'Contract-WayneCorp.pdf', templateName: 'Service Agreement', format: 'PDF', generatedAt: '2026-06-14 16:45', generatedBy: 'Legal Team', size: '256 KB', entityType: 'Contract', entityId: 'CON-2026-0042' },
          { id: 'gd-5', name: 'SalesQuote-Q3-Acme.pdf', templateName: 'Quotation Template', format: 'PDF', generatedAt: '2026-06-13 11:20', generatedBy: 'Sales Team', size: '124 KB', entityType: 'Quotation', entityId: 'QT-2026-0198' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.entityId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <FileText style={{ color: 'var(--color-primary)' }} />
          Generated Documents
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Browse and download PDFs generated from document templates (invoices, purchase orders, payslips, contracts).
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search documents, templates, entity IDs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: 'var(--space-2.5) var(--space-4) var(--space-2.5) var(--space-8)',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)', fontSize: 'var(--text-sm)', color: 'var(--color-text)'
            }}
          />
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
        }}>
          <Plus size={16} /> Generate New
        </button>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              {['Document', 'Template', 'Entity', 'Generated By', 'Date', 'Size', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => (
              <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <FileText size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 'var(--weight-semibold)' }}>{doc.name}</span>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{doc.templateName}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ fontSize: '10px', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)', color: 'var(--color-primary)', fontWeight: 'var(--weight-semibold)' }}>{doc.entityId}</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{doc.generatedBy}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{doc.generatedAt}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '11px' }}>{doc.size}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '4px' }}><Eye size={14} /></button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)', padding: '4px' }}><Download size={14} /></button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '4px' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                  No generated documents found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
