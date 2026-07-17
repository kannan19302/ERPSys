'use client';

import React from 'react';
import { Image } from 'lucide-react';
import styles from './page.module.css';

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
    <div className="ui-stack-6">
      <div>
        <h1 className="text-2xl ui-hstack-2">
          <Image className="ui-text-primary" />
          Media Conversion Pipeline
        </h1>
        <p className="ui-text-sm-muted">
          Configure automatic media conversion rules for uploaded files. Enable WebP compression, thumbnail generation, and format conversions.
        </p>
      </div>

      {/* Stats summary */}
      <div className="ui-grid-auto-sm">
        {[
          { label: 'Active Rules', value: rules.filter(r => r.enabled).length.toString(), color: 'var(--color-success)' },
          { label: 'Inactive Rules', value: rules.filter(r => !r.enabled).length.toString(), color: 'var(--color-text-secondary)' },
          { label: 'Total Rules', value: rules.length.toString(), color: 'var(--color-primary)' },
          { label: 'Est. Savings', value: '~65%', color: 'var(--color-warning)' },
        ].map((m, i) => (
          <div key={i} className="ui-card p-4">
            <div className={styles.p1}>{m.label}</div>
            <div className={styles.p2} style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="ui-card p-5">
        <h3 className="ui-section-header">Auto-Conversion Pipeline</h3>
        {rules.map((rule, i) => (
          <div key={i} className={styles.rule} style={{ opacity: rule.enabled ? 1 : 0.6 }}>
            <div className="ui-hstack-3">
              <Image size={16} className="ui-text-primary" />
              <div>
                <div className="ui-heading-sm">
                  {rule.from} → {rule.to} <span className={styles.p3}>({rule.savings})</span>
                </div>
                <div className="ui-text-caption">{rule.desc}</div>
              </div>
            </div>
            <div className={styles.toggle} style={{ background: rule.enabled ? 'var(--color-primary)' : 'var(--color-border)' }}>
              <div className={styles.toggleHandle} style={{ left: rule.enabled ? '20px' : '2px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
