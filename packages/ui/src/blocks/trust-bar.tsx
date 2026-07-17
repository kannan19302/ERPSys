

export interface TrustBarBlockProps {
  title?: string;
  logos?: string[];
}

export function TrustBarBlock({
  title = 'TRUSTED BY INNOVATIVE TEAMS WORLDWIDE',
  logos = ['/logo1.svg', '/logo2.svg', '/logo3.svg', '/logo4.svg']
}: TrustBarBlockProps) {
  return (
    <section className="trust-bar-block" style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.7 }}>
      <p style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '24px' }}>{title}</p>
      <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
        {logos.map((logo, i) => (
          <div key={i} style={{ width: 120, height: 40, backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 4 }} title={logo} />
        ))}
      </div>
    </section>
  );
}
