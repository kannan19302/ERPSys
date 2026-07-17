

export interface HeroBlockProps {
  title?: string;
  subtitle?: string;
  primaryCta?: string;
  secondaryCta?: string;
  primaryUrl?: string;
  secondaryUrl?: string;
  alignment?: 'left' | 'center';
}

export function HeroBlock({
  title = 'Your Big Headline Here',
  subtitle = 'This is a compelling subheadline that explains the value proposition clearly and concisely.',
  primaryCta = 'Get Started',
  secondaryCta = 'Learn More',
  primaryUrl = '#',
  secondaryUrl = '#',
  alignment = 'center'
}: HeroBlockProps) {
  return (
    <section className="hero-block" style={{ padding: '80px 20px', textAlign: alignment }}>
      <div className="container" style={{ maxWidth: 800, margin: alignment === 'center' ? '0 auto' : '0' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px', lineHeight: 1.2 }}>{title}</h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '32px', opacity: 0.8, lineHeight: 1.6 }}>{subtitle}</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: alignment === 'center' ? 'center' : 'flex-start' }}>
          <a href={primaryUrl} className="ui-btn ui-btn-primary" style={{ padding: '12px 24px', fontSize: '1.1rem' }}>{primaryCta}</a>
          <a href={secondaryUrl} className="ui-btn ui-btn-secondary" style={{ padding: '12px 24px', fontSize: '1.1rem' }}>{secondaryCta}</a>
        </div>
      </div>
    </section>
  );
}
