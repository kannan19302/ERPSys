

export interface PlanItem {
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

export interface PricingBlockProps {
  title?: string;
  plans?: PlanItem[];
}

export function PricingBlock({
  title = 'Simple, transparent pricing',
  plans = [
    { name: 'Starter', price: '$29/mo', features: ['Up to 5 users', 'Basic analytics', '24h support response'] },
    { name: 'Pro', price: '$99/mo', features: ['Unlimited users', 'Advanced reporting', '1h support response', 'Custom domain'], recommended: true },
    { name: 'Enterprise', price: 'Custom', features: ['Dedicated account manager', 'SLA uptime guarantee', 'SSO integration'] },
  ]
}: PricingBlockProps) {
  return (
    <section className="pricing-block" style={{ padding: '80px 20px' }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '48px', textAlign: 'center' }}>{title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
          {plans.map((p, i) => (
            <div key={i} className="frappe-card" style={{ padding: '40px', position: 'relative', border: p.recommended ? '2px solid var(--color-primary, #333)' : undefined }}>
              {p.recommended && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-primary, #333)', color: 'white', padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 'bold' }}>RECOMMENDED</div>}
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>{p.name}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '32px' }}>{p.price}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '40px' }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ marginBottom: '12px', opacity: 0.8 }}>✓ {f}</li>
                ))}
              </ul>
              <button className={p.recommended ? "frappe-btn frappe-btn-primary" : "frappe-btn frappe-btn-default"} style={{ width: '100%' }}>Choose {p.name}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
