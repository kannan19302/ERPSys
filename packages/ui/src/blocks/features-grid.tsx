import React from 'react';

export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

export interface FeaturesGridBlockProps {
  title?: string;
  subtitle?: string;
  features?: FeatureItem[];
}

export function FeaturesGridBlock({
  title = 'Everything you need',
  subtitle = 'Powerful features to help you manage your business faster.',
  features = [
    { title: 'Lightning Fast', description: 'Built on modern architecture to ensure sub-second response times.' },
    { title: 'Bank-grade Security', description: 'Your data is encrypted at rest and in transit with AES-256.' },
    { title: 'Global Scale', description: 'Deploy instantly to edge networks worldwide.' },
    { title: '24/7 Support', description: 'Our team is always here to help you succeed.' },
  ]
}: FeaturesGridBlockProps) {
  return (
    <section className="features-grid-block" style={{ padding: '80px 20px' }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '16px' }}>{title}</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.8, maxWidth: 600, margin: '0 auto' }}>{subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
          {features.map((f, i) => (
            <div key={i} className="frappe-card" style={{ padding: '24px' }}>
              <div style={{ width: 48, height: 48, backgroundColor: 'rgba(128,128,128,0.1)', borderRadius: 8, marginBottom: 16 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ opacity: 0.7, lineHeight: 1.5 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
