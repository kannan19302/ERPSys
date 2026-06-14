'use client';

import React, { useState } from 'react';
import {
  HardDrive, Layout, BarChart3, Image, Settings, Eye,
  Trash2, Upload, FileText, Lock
} from 'lucide-react';

interface TemplateBlock {
  id: string;
  type: 'header' | 'text' | 'image' | 'table' | 'signature' | 'footer';
  label: string;
  content: string;
}

interface StorageTenant {
  id: string;
  name: string;
  usedMB: number;
  quotaMB: number;
  filesCount: number;
  plan: string;
}

export default function StorageAdvancedPage() {
  const [activeTab, setActiveTab] = useState<'designer' | 'quotas' | 'media'>('designer');

  const [templateBlocks, setTemplateBlocks] = useState<TemplateBlock[]>([
    { id: 'blk-1', type: 'header', label: 'Company Header', content: 'Acme Corporation — Invoice' },
    { id: 'blk-2', type: 'text', label: 'Invoice Details', content: 'Invoice #: {{invoiceNumber}}\nDate: {{date}}\nDue: {{dueDate}}' },
    { id: 'blk-3', type: 'table', label: 'Line Items', content: '{{lineItems}}' },
    { id: 'blk-4', type: 'text', label: 'Total', content: 'Subtotal: {{subtotal}}\nTax ({{taxRate}}%): {{tax}}\nTotal: {{total}}' },
    { id: 'blk-5', type: 'signature', label: 'Signature Block', content: 'Authorized Signature: _______________' },
    { id: 'blk-6', type: 'footer', label: 'Footer', content: '© 2026 Acme Corp | Terms & Conditions Apply' },
  ]);

  const [tenants] = useState<StorageTenant[]>([
    { id: 'st-1', name: 'Acme Corp', usedMB: 2450, quotaMB: 5000, filesCount: 1842, plan: 'Business' },
    { id: 'st-2', name: 'Stark Industries', usedMB: 8200, quotaMB: 10000, filesCount: 4521, plan: 'Enterprise' },
    { id: 'st-3', name: 'Wayne Enterprises', usedMB: 1200, quotaMB: 2000, filesCount: 890, plan: 'Starter' },
    { id: 'st-4', name: 'Oscorp', usedMB: 3100, quotaMB: 5000, filesCount: 2103, plan: 'Business' },
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

  const tabs = [
    { id: 'designer' as const, label: 'Template Designer', icon: <Layout size={14} /> },
    { id: 'quotas' as const, label: 'Storage Quotas', icon: <HardDrive size={14} /> },
    { id: 'media' as const, label: 'Media Conversion', icon: <Image size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <HardDrive style={{ color: 'var(--color-primary)' }} />
          Storage & Templates
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Drag-and-drop template designer, per-tenant storage quotas, and automatic media conversion.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Template Designer */}
      {activeTab === 'designer' && (
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
      )}

      {/* Storage Quotas */}
      {activeTab === 'quotas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {tenants.map(t => {
              const usagePercent = (t.usedMB / t.quotaMB) * 100;
              const usageColor = usagePercent > 90 ? 'var(--color-error)' : usagePercent > 70 ? 'var(--color-warning)' : 'var(--color-success)';
              return (
                <div key={t.id} style={{
                  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                  display: 'flex', flexDirection: 'column', gap: 'var(--space-3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{t.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{t.plan} Plan</div>
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: usageColor }}>
                      {usagePercent.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--color-bg)' }}>
                    <div style={{ width: `${usagePercent}%`, height: '100%', borderRadius: '3px', background: usageColor, transition: 'width 0.3s ease' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: '12px' }}>
                    <div><span style={{ color: 'var(--color-text-tertiary)' }}>Used:</span> <strong>{(t.usedMB / 1000).toFixed(1)} GB</strong></div>
                    <div><span style={{ color: 'var(--color-text-tertiary)' }}>Quota:</span> <strong>{(t.quotaMB / 1000).toFixed(0)} GB</strong></div>
                    <div><span style={{ color: 'var(--color-text-tertiary)' }}>Files:</span> <strong>{t.filesCount.toLocaleString()}</strong></div>
                    <div><span style={{ color: 'var(--color-text-tertiary)' }}>Available:</span> <strong>{((t.quotaMB - t.usedMB) / 1000).toFixed(1)} GB</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Media Conversion */}
      {activeTab === 'media' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Auto-Conversion Pipeline</h3>
            {[
              { from: 'PNG/JPEG', to: 'WebP', savings: '~65%', enabled: true, desc: 'Convert uploaded images to WebP for faster page loads' },
              { from: 'Images', to: 'Thumbnails', savings: '150×150px', enabled: true, desc: 'Generate thumbnail previews for all uploaded images' },
              { from: 'HEIC/HEIF', to: 'JPEG', savings: 'Compatibility', enabled: true, desc: 'Convert Apple HEIC photos to widely supported JPEG' },
              { from: 'PDF', to: 'Preview PNG', savings: 'First page', enabled: false, desc: 'Generate a PNG preview of the first page of uploaded PDFs' },
              { from: 'Video', to: 'Poster Frame', savings: 'First frame', enabled: false, desc: 'Extract first frame as video poster image' },
            ].map((rule, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-2)', opacity: rule.enabled ? 1 : 0.6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Image size={16} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                      {rule.from} → {rule.to} <span style={{ fontSize: '10px', color: 'var(--color-success)', marginLeft: '4px' }}>({rule.savings})</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{rule.desc}</div>
                  </div>
                </div>
                <div style={{
                  width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer',
                  background: rule.enabled ? 'var(--color-primary)' : 'var(--color-border)',
                  position: 'relative'
                }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: rule.enabled ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
