'use client';
import styles from './page.module.css';
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
    <div className="ui-stack-6">
      <div>
        <h1 className="text-2xl ui-hstack-2">
          <Layout className="ui-text-primary" />
          Template Designer
        </h1>
        <p className="ui-text-sm-muted">
          Drag-and-drop block-based template builder for invoices, purchase orders, payslips, and other document types.
        </p>
      </div>

      <div className={styles.p1}>
        {/* Block Palette */}
        <div className="ui-card p-4">
          <h3 className={styles.p2}>Add Block</h3>
          {(['header', 'text', 'image', 'table', 'signature', 'footer'] as const).map(type => (
            <button key={type} onClick={() => addBlock(type)} className={styles.p3} data-block-type={type}>
              <span className={styles.paletteIcon}>{blockTypeIcons[type]}</span>
              {type}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className={styles.p4}>
          <div className="ui-flex-between mb-4">
            <h3 className={styles.p5}>Template Canvas</h3>
            <div className="ui-flex ui-gap-2">
              <button className={styles.p6}>
                <Eye size={12} /> Preview PDF
              </button>
              <button className={styles.p7}>
                Save Template
              </button>
            </div>
          </div>
          <div className="ui-stack-2">
            {templateBlocks.map((block, idx) => (
              <div key={block.id} className={styles.templateBlock} data-block-type={block.type}>
                <div className="ui-flex-between">
                  <div className="ui-hstack-2">
                    <span className={styles.paletteIcon}>{blockTypeIcons[block.type]}</span>
                    <input value={block.label} onChange={e => setTemplateBlocks(prev => prev.map(b => b.id === block.id ? { ...b, label: e.target.value } : b))} className={styles.p8} />
                  </div>
                  <div className={styles.p9}>
                    <button onClick={() => moveBlock(block.id, 'up')} disabled={idx === 0} style={{ cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }} className={styles.s1}>↑</button>
                    <button onClick={() => moveBlock(block.id, 'down')} disabled={idx === templateBlocks.length - 1} style={{ cursor: idx === templateBlocks.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === templateBlocks.length - 1 ? 0.3 : 1 }} className={styles.s1}>↓</button>
                    <button onClick={() => removeBlock(block.id)} className={styles.p10}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <textarea value={block.content} onChange={e => setTemplateBlocks(prev => prev.map(b => b.id === block.id ? { ...b, content: e.target.value } : b))} className={styles.p11} />
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="ui-card p-4">
          <h3 className={styles.p12}>
            <Settings size={12} className={styles.p13} /> Template Settings
          </h3>
          {[
            { label: 'Template Name', value: 'Invoice Template', type: 'text' },
            { label: 'Page Size', value: 'A4', type: 'select' },
            { label: 'Orientation', value: 'Portrait', type: 'select' },
            { label: 'Primary Color', value: 'Primary theme', type: 'text' },
            { label: 'Font Family', value: 'Inter', type: 'select' },
            { label: 'Font Size (pt)', value: '10', type: 'number' },
            { label: 'Margin (mm)', value: '20', type: 'number' },
          ].map((prop, i) => (
            <div key={i} className={styles.p14}>
              <label className={styles.p15}>{prop.label}</label>
              <input defaultValue={prop.value} type={prop.type === 'color' ? 'color' : prop.type === 'number' ? 'number' : 'text'} className={styles.p16} />
            </div>
          ))}
          <div className={styles.p17}>
            <label className={styles.p18}>Logo Upload</label>
            <button className={styles.p19}>
              <Upload size={14} /> Upload Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
