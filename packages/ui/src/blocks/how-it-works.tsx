

export interface StepItem {
  title: string;
  description: string;
}

export interface HowItWorksBlockProps {
  title?: string;
  steps?: StepItem[];
}

export function HowItWorksBlock({
  title = 'How it works in 3 easy steps',
  steps = [
    { title: 'Sign up', description: 'Create your account in less than 60 seconds.' },
    { title: 'Connect your data', description: 'Easily import or sync your existing systems.' },
    { title: 'Start growing', description: 'Use our powerful tools to scale your business.' },
  ]
}: HowItWorksBlockProps) {
  return (
    <section className="how-it-works-block" style={{ padding: '80px 20px' }}>
      <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '48px', textAlign: 'center' }}>{title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--color-primary, #333)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>{i + 1}</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ opacity: 0.7, lineHeight: 1.5, maxWidth: 600 }}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
