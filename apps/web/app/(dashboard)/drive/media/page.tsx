'use client';

import React from 'react';
import { Image } from 'lucide-react';

export default function DriveMediaPage() {
  const rules = [
    { from: 'PNG/JPEG', to: 'WebP', savings: '~65%', enabled: true, desc: 'Convert uploaded images to WebP for faster page loads' },
    { from: 'Images', to: 'Thumbnails', savings: '150×150px', enabled: true, desc: 'Generate thumbnail previews for all uploaded images' },
    { from: 'HEIC/HEIF', to: 'JPEG', savings: 'Compatibility', enabled: true, desc: 'Convert Apple HEIC photos to widely supported JPEG' },
    { from: 'PDF', to: 'Preview PNG', savings: 'First page', enabled: false, desc: 'Generate a PNG preview of the first page of uploaded PDFs' },
    { from: 'Video', to: 'Poster Frame', savings: 'First frame', enabled: false, desc: 'Extract first frame as video poster image' },
    { from: 'SVG', to: 'PNG Raster', savings: 'Fallback', enabled: false, desc: 'Rasterize SVG uploads into PNG for legacy viewer support' },
    { from: 'TIFF', to: 'JPEG', savings: '~80%', enabled: false, desc: 'Convert large TIFF scans to compressed JPEG for faster access' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Image style={{ color: 'var(--color-primary)' }} />
          Media Conversion Pipeline
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Configure automatic media conversion rules for uploaded files. Enable WebP compression, thumbnail generation, and format conversions.
        </p>
      </div>

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        {[
          { label: 'Active Rules', value: rules.filter(r => r.enabled).length.toString(), color: 'var(--color-success)' },
          { label: 'Inactive Rules', value: rules.filter(r => !r.enabled).length.toString(), color: 'var(--color-text-secondary)' },
          { label: 'Total Rules', value: rules.length.toString(), color: 'var(--color-primary)' },
          { label: 'Est. Savings', value: '~65%', color: 'var(--color-warning)' },
        ].map((m, i) => (
          <div key={i} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>{m.label}</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Auto-Conversion Pipeline</h3>
        {rules.map((rule, i) => (
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
  );
}
