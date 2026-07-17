

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  company: string;
}

export interface SocialProofBlockProps {
  title?: string;
  testimonials?: TestimonialItem[];
}

export function SocialProofBlock({
  title = 'Loved by thousands',
  testimonials = [
    { quote: "This platform completely transformed how our team operates. It's incredibly intuitive.", name: "Jane Doe", role: "CEO", company: "TechCorp" },
    { quote: "The best investment we've made this year. Support is fantastic and the features just work.", name: "John Smith", role: "CTO", company: "GlobalNet" },
  ]
}: SocialProofBlockProps) {
  return (
    <section className="social-proof-block" style={{ padding: '80px 20px', backgroundColor: 'rgba(128,128,128,0.05)' }}>
      <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '48px', textAlign: 'center' }}>{title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {testimonials.map((t, i) => (
            <div key={i} className="ui-card" style={{ padding: '32px' }}>
              <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '24px', lineHeight: 1.6 }}>"{t.quote}"</p>
              <div>
                <strong style={{ display: 'block', fontSize: '1rem' }}>{t.name}</strong>
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{t.role}, {t.company}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
