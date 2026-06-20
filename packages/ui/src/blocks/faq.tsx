

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqBlockProps {
  title?: string;
  faqs?: FaqItem[];
}

export function FaqBlock({
  title = 'Frequently Asked Questions',
  faqs = [
    { question: 'Do you offer a free trial?', answer: 'Yes, we offer a 14-day free trial on all plans with no credit card required.' },
    { question: 'Can I cancel my subscription at any time?', answer: 'Absolutely. You can cancel your plan at any time from your account settings.' },
    { question: 'Do you provide onboarding support?', answer: 'Yes, our Pro and Enterprise plans include dedicated onboarding sessions.' },
  ]
}: FaqBlockProps) {
  return (
    <section className="faq-block" style={{ padding: '80px 20px' }}>
      <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '48px', textAlign: 'center' }}>{title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(128,128,128,0.2)', paddingBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>{f.question}</h3>
              <p style={{ opacity: 0.7, lineHeight: 1.6 }}>{f.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
