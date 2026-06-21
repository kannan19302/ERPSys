'use client';

import React, { useState } from 'react';
import {
  Layout, FileText, Image, BarChart3, Lock, Settings, Eye,
  Trash2, Upload
} from 'lucide-react';

interface TemplateBlock {
  id: string;
  type: 'header' | 'text' | 'image' | 'table' | 'signature' | 'footer';
  label: string;
  content: string;
}

export default function DriveDesignerPage() {
  const [templateBlocks, setTemplateBlocks] = useState<TemplateBlock[]>([
    { id: 'blk-1', type: 'header', label: 'Company Header', content: 'Acme Corporation — Invoice' },
    { id: 'blk-2', type: 'text', label: 'Invoice Details', content: 'Invoice #: {{invoiceNumber}}\nDate: {{date}}\nDue: {{dueDate}}' },
    { id: 'blk-3', type: 'table', label: 'Line Items', content: '{{lineItems}}' },
    { id: 'blk-4', type: 'text', label: 'Total', content: 'Subtotal: {{subtotal}}\nTax ({{taxRate}}%): {{tax}}\nTotal: {{total}}' },
    { id: 'blk-5', type: 'signature', label: 'Signature Block', content: 'Authorized Signature: _______________' },
    { id: 'blk-6', type: 'footer', label: 'Footer', content: '© 2026 Acme Corp | Terms & Conditions Apply' },
  ]);

  const blockTypeColors: Record<TemplateBlock['type'], string> = {
    header: 'hsl(210, 70%, 50%)',
    text: 'hsl(150, 60%, 45%)',
    image: 'hsl(30, 80%, 50%)',
    table: 'hsl(280, 60%, 50%)',
    signature: 'hsl(0, 70%, 55%)',
    footer: 'hsl(190, 70%, 45%)',
  };

  const blockTypeIcons: Record<TemplateBlock['type'], React.ReactNode> = {
    header: <FileText size={14} />,
    text: <FileText size={14} />,
    image: <Image size={14} />,
    table: <BarChart3 size={14} />,
    signature: <Lock size={14} />,
    footer: <Layout size={14} />,
  };

  const addBlock = (type: TemplateBlock['type']) => {
    setTemplateBlocks(prev => [...prev, {
      id: `blk-${Date.now()}`,
      type,
      label: `New ${type} block`,
      content: type === 'table' ? '{{data}}' : 'Edit this content...',
    }]);
  };

  const removeBlock = (id: string) => {
    setTemplateBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (id: string, dir: 'up' | 'down') => {
    setTemplateBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === prev.length - 1)) return prev;
      const newArr = [...prev];
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      const currentItem = newArr[idx];
      const targetItem = newArr[swapIdx];
      if (currentItem && targetItem) {
        newArr[idx] = targetItem;
        newArr[swapIdx] = currentItem;
      }
      return newArr;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Layout style={{ color: 'var(--color-primary)' }} />
          Template Designer
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Drag-and-drop block-based template builder for invoices, purchase orders, payslips, and other document types.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 280px', gap: 'var(--space-4)', alignItems: 'start' }}>
        {/* Block Palette */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>Add Block</h3>
          {(['header', 'text', 'image', 'table', 'signature', 'footer'] as const).map(type => (
            <button key={type} onClick={() => addBlock(type)} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%',
              padding: 'var(--space-2.5) var(--space-3)', marginBottom: 'var(--space-1)',
              border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
              background: 'transparent', cursor: 'pointer', fontSize: '12px',
              color: 'var(--color-text)', textTransform: 'capitalize'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = blockTypeColors[type]; e.currentTarget.style.color = blockTypeColors[type]; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text)'; }}
            >
              <span style={{ color: blockTypeColors[type] }}>{blockTypeIcons[type]}</span>
              {type}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', minHeight: '500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Template Canvas</h3>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button style={{ background: 'none', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={12} /> Preview PDF
              </button>
              <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', fontWeight: 'var(--weight-semibold)' }}>
                Save Template
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {templateBlocks.map((block, idx) => (
              <div key={block.id} style={{
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)', borderLeft: `3px solid ${blockTypeColors[block.type]}`,
                display: 'flex', flexDirection: 'column', gap: 'var(--space-2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ color: blockTypeColors[block.type] }}>{blockTypeIcons[block.type]}</span>
                    <input value={block.label} onChange={e => setTemplateBlocks(prev => prev.map(b => b.id === block.id ? { ...b, label: e.target.value } : b))} style={{
                      border: 'none', background: 'transparent', fontWeight: 'var(--weight-semibold)',
                      fontSize: '12px', color: 'var(--color-text)', outline: 'none', width: '200px'
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button onClick={() => moveBlock(block.id, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: 'var(--color-text-tertiary)', fontSize: '14px', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                    <button onClick={() => moveBlock(block.id, 'down')} disabled={idx === templateBlocks.length - 1} style={{ background: 'none', border: 'none', cursor: idx === templateBlocks.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--color-text-tertiary)', fontSize: '14px', opacity: idx === templateBlocks.length - 1 ? 0.3 : 1 }}>↓</button>
                    <button onClick={() => removeBlock(block.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '0 4px' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <textarea value={block.content} onChange={e => setTemplateBlocks(prev => prev.map(b => b.id === block.id ? { ...b, content: e.target.value } : b))} style={{
                  width: '100%', minHeight: '50px', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: '12px',
                  color: 'var(--color-text)', resize: 'vertical', fontFamily: 'inherit'
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            <Settings size={12} style={{ display: 'inline', marginRight: '4px' }} /> Template Settings
          </h3>
          {[
            { label: 'Template Name', value: 'Invoice Template', type: 'text' },
            { label: 'Page Size', value: 'A4', type: 'select' },
            { label: 'Orientation', value: 'Portrait', type: 'select' },
            { label: 'Primary Color', value: '#2563eb', type: 'color' },
            { label: 'Font Family', value: 'Inter', type: 'select' },
            { label: 'Font Size (pt)', value: '10', type: 'number' },
            { label: 'Margin (mm)', value: '20', type: 'number' },
          ].map((prop, i) => (
            <div key={i} style={{ marginBottom: 'var(--space-2.5)' }}>
              <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)', display: 'block', marginBottom: '2px' }}>{prop.label}</label>
              <input defaultValue={prop.value} type={prop.type === 'color' ? 'color' : prop.type === 'number' ? 'number' : 'text'} style={{
                width: '100%', padding: '4px 8px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', fontSize: '12px',
                background: 'var(--color-bg)', color: 'var(--color-text)'
              }} />
            </div>
          ))}
          <div style={{ marginTop: 'var(--space-3)' }}>
            <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)', display: 'block', marginBottom: '4px' }}>Logo Upload</label>
            <button style={{
              width: '100%', padding: 'var(--space-3)', border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'transparent',
              color: 'var(--color-text-secondary)', fontSize: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)'
            }}>
              <Upload size={14} /> Upload Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
