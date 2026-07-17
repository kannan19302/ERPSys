'use client';

import React, { useState } from 'react';
import { useCart } from './cart';

const section = (extra?: React.CSSProperties): React.CSSProperties => ({ padding: '64px 20px', ...extra });
const container = (max = 1100): React.CSSProperties => ({ maxWidth: max, margin: '0 auto' });

// ── Rich Text ──
export function RichTextBlock({ title, content, align = 'left' }: any) {
  return (
    <section style={section()}>
      <div style={{ ...container(760), textAlign: align }}>
        {title && <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 16 }}>{title}</h2>}
        <div style={{ fontSize: '1.05rem', lineHeight: 1.7, opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: content || '<p>Add your content in the inspector. HTML is supported.</p>' }} />
      </div>
    </section>
  );
}

// ── Image ──
export function ImageBlock({ url, caption, rounded = true, maxWidth = 960 }: any) {
  return (
    <section style={section()}>
      <div style={{ ...container(maxWidth), textAlign: 'center' }}>
        {url ? <img src={url} alt={caption || ''} style={{ width: '100%', borderRadius: rounded ? 14 : 0 }} />
          : <div style={{ height: 280, background: 'rgba(128,128,128,0.12)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>Select an image in the inspector</div>}
        {caption && <p style={{ marginTop: 12, opacity: 0.6, fontSize: '0.9rem' }}>{caption}</p>}
      </div>
    </section>
  );
}

// ── Gallery ──
export function GalleryBlock({ images, columns = 3, title }: any) {
  const list: string[] = Array.isArray(images) ? images : String(images || '').split('\n').map((s) => s.trim()).filter(Boolean);
  return (
    <section style={section()}>
      <div style={container()}>
        {title && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: 36 }}>{title}</h2>}
        {list.length === 0 ? <div style={{ textAlign: 'center', opacity: 0.5, padding: 40 }}>Add image URLs in the inspector.</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16 }}>
            {list.map((src, i) => <img key={i} src={src} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12 }} />)}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Columns ──
export function ColumnsBlock({ col1Title, col1Body, col2Title, col2Body, col3Title, col3Body }: any) {
  const cols = [[col1Title, col1Body], [col2Title, col2Body], [col3Title, col3Body]].filter(([t, b]) => t || b);
  const shown = cols.length ? cols : [['Column one', 'Edit in inspector'], ['Column two', 'Edit in inspector']];
  return (
    <section style={section()}>
      <div style={{ ...container(), display: 'grid', gridTemplateColumns: `repeat(${shown.length}, 1fr)`, gap: 32 }}>
        {shown.map(([t, b], i) => (
          <div key={i}>
            {t && <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 10 }}>{t}</h3>}
            <p style={{ opacity: 0.75, lineHeight: 1.6 }}>{b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Logo Cloud ──
export function LogoCloudBlock({ title = 'Trusted by leading teams', logos }: any) {
  const list: string[] = Array.isArray(logos) ? logos : String(logos || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const fallback = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli'];
  return (
    <section style={section({ background: 'rgba(128,128,128,0.04)' })}>
      <div style={{ ...container(), textAlign: 'center' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem', opacity: 0.55, marginBottom: 28 }}>{title}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center', alignItems: 'center' }}>
          {(list.length ? list : fallback).map((l, i) => list.length
            ? <img key={i} src={l} alt="" style={{ height: 32, opacity: 0.7 }} />
            : <span key={i} style={{ fontSize: '1.3rem', fontWeight: 800, opacity: 0.35 }}>{l}</span>)}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ──
export function CtaBannerBlock({ title = 'Ready to get started?', subtitle, buttonText = 'Get Started', buttonUrl = '#' }: any) {
  return (
    <section style={section({ background: 'var(--color-primary, #4f46e5)', color: '#fff' })}>
      <div style={{ ...container(760), textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 12 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: 28 }}>{subtitle}</p>}
        <a href={buttonUrl} style={{ display: 'inline-block', padding: '14px 32px', background: '#fff', color: 'var(--color-primary, #4f46e5)', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>{buttonText}</a>
      </div>
    </section>
  );
}

// ── Navbar ──
export function NavbarBlock({ brand = 'Your Brand', links, showCart = true }: any) {
  const cart = useCart();
  const list: { label: string; url: string }[] = Array.isArray(links) ? links
    : String(links || 'Home=/\nProducts=/products\nAbout=/about\nContact=/contact').split('\n').map((l) => { const [label, url] = l.split('='); return { label: (label || '').trim(), url: (url || '#').trim() }; }).filter((l) => l.label);
  return (
    <header style={{ borderBottom: '1px solid rgba(128,128,128,0.15)', position: 'sticky', top: 0, background: 'var(--color-bg-elevated,#fff)', zIndex: 50 }}>
      <nav style={{ ...container(), display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
        <strong style={{ fontSize: '1.2rem' }}>{brand}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {list.map((l, i) => <a key={i} href={l.url} style={{ textDecoration: 'none', color: 'inherit', opacity: 0.8, fontSize: '0.95rem' }}>{l.label}</a>)}
          {showCart && <span style={{ position: 'relative', fontSize: '0.95rem', fontWeight: 600 }}>🛒{cart.count > 0 && <span style={{ position: 'absolute', top: -8, right: -12, background: 'var(--color-primary,#4f46e5)', color: '#fff', borderRadius: 999, fontSize: 10, padding: '1px 6px' }}>{cart.count}</span>}</span>}
        </div>
      </nav>
    </header>
  );
}

// ── Footer ──
export function FooterBlock({ brand = 'Your Brand', tagline, links, copyright }: any) {
  const list: { label: string; url: string }[] = Array.isArray(links) ? links
    : String(links || 'Privacy=/privacy\nTerms=/terms\nContact=/contact').split('\n').map((l) => { const [label, url] = l.split('='); return { label: (label || '').trim(), url: (url || '#').trim() }; }).filter((l) => l.label);
  return (
    <footer style={{ background: '#0f172a', color: '#e2e8f0', padding: '56px 20px 32px' }}>
      <div style={{ ...container(), display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ maxWidth: 320 }}>
          <strong style={{ fontSize: '1.3rem' }}>{brand}</strong>
          {tagline && <p style={{ opacity: 0.6, marginTop: 10, lineHeight: 1.6 }}>{tagline}</p>}
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {list.map((l, i) => <a key={i} href={l.url} style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem' }}>{l.label}</a>)}
        </div>
      </div>
      <div style={{ ...container(), marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', opacity: 0.5 }}>{copyright || `© ${new Date().getFullYear()} ${brand}. All rights reserved.`}</div>
    </footer>
  );
}

// ── Contact Form (posts to public submissions inbox) ──
export function ContactFormBlock({ title = 'Get in touch', subtitle, formName = 'contact', buttonText = 'Send Message', fields, tenantSlug }: any) {
  const fieldList: { name: string; label: string; type?: string; required?: boolean }[] = Array.isArray(fields) && fields.length ? fields : [
    { name: 'name', label: 'Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'message', label: 'Message', type: 'textarea', required: true },
  ];
  const [data, setData] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    try {
      const q = tenantSlug ? `?tenant=${encodeURIComponent(tenantSlug)}` : '';
      const res = await fetch(`/api/v1/public/web/forms/submit${q}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formName, data, pageSlug: typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '') : undefined }),
      });
      setState(res.ok ? 'done' : 'error');
      if (res.ok) setData({});
    } catch { setState('error'); }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(128,128,128,0.3)', fontSize: '1rem', fontFamily: 'inherit', background: 'var(--color-bg, #fff)', color: 'inherit' };

  return (
    <section style={section()}>
      <div style={container(560)}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{title}</h2>
          {subtitle && <p style={{ opacity: 0.7 }}>{subtitle}</p>}
        </div>
        {state === 'done' ? (
          <div style={{ textAlign: 'center', padding: 40, background: 'rgba(16,185,129,0.1)', borderRadius: 14, color: '#059669', fontWeight: 600 }}>✓ Thanks! Your message was received.</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {fieldList.map((f) => (
              <div key={f.name}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', fontWeight: 600 }}>{f.label}{f.required && ' *'}</label>
                {f.type === 'textarea'
                  ? <textarea required={f.required} value={data[f.name] || ''} onChange={(e) => setData((p) => ({ ...p, [f.name]: e.target.value }))} style={{ ...inp, minHeight: 120, resize: 'vertical' }} />
                  : <input type={f.type || 'text'} required={f.required} value={data[f.name] || ''} onChange={(e) => setData((p) => ({ ...p, [f.name]: e.target.value }))} style={inp} />}
              </div>
            ))}
            {state === 'error' && <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>Something went wrong. Please try again.</div>}
            <button type="submit" disabled={state === 'sending'} style={{ padding: '14px', borderRadius: 10, border: 'none', background: 'var(--color-primary,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              {state === 'sending' ? 'Sending…' : buttonText}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ── Cart + Checkout ──
export function CartBlock({ title = 'Your Cart', tenantSlug }: any) {
  const cart = useCart();
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [state, setState] = useState<'idle' | 'placing' | 'done' | 'error'>('idle');
  const [order, setOrder] = useState<any>(null);

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.items.length === 0) return;
    setState('placing');
    try {
      const q = tenantSlug ? `?tenant=${encodeURIComponent(tenantSlug)}` : '';
      const res = await fetch(`/api/v1/public/web/checkout${q}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, items: cart.items }),
      });
      if (res.ok) { setOrder(await res.json()); cart.clear(); setState('done'); }
      else setState('error');
    } catch { setState('error'); }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '11px 13px', borderRadius: 10, border: '1px solid rgba(128,128,128,0.3)', fontSize: '0.95rem', fontFamily: 'inherit', background: 'var(--color-bg,#fff)', color: 'inherit' };

  if (state === 'done') {
    return (
      <section style={section()}>
        <div style={{ ...container(560), textAlign: 'center', padding: 48, background: 'rgba(16,185,129,0.08)', borderRadius: 16 }}>
          <div style={{ fontSize: 40 }}>✓</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0' }}>Order placed!</h2>
          <p style={{ opacity: 0.8 }}>Confirmation <strong>{order?.orderNumber}</strong> · Total <strong>${order?.total}</strong></p>
        </div>
      </section>
    );
  }

  return (
    <section style={section()}>
      <div style={{ ...container(900), display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 20 }}>{title}</h2>
          {cart.items.length === 0 ? <p style={{ opacity: 0.6 }}>Your cart is empty.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, border: '1px solid rgba(128,128,128,0.18)', borderRadius: 12 }}>
                  {it.image && <div style={{ width: 54, height: 54, borderRadius: 8, background: `#f1f5f9 center/cover url(${it.image})`, flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{it.name}</div>
                    <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>${it.price}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button type="button" onClick={() => cart.setQty(i, it.qty - 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(128,128,128,0.3)', background: 'none', cursor: 'pointer' }}>−</button>
                    <span style={{ minWidth: 20, textAlign: 'center' }}>{it.qty}</span>
                    <button type="button" onClick={() => cart.setQty(i, it.qty + 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(128,128,128,0.3)', background: 'none', cursor: 'pointer' }}>+</button>
                  </div>
                  <strong>${(it.price * it.qty).toFixed(2)}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(128,128,128,0.2)', fontSize: '1.1rem', fontWeight: 700 }}>
                <span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={checkout} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Checkout</h3>
          <input required placeholder="Full name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} style={inp} />
          <input required type="email" placeholder="Email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} style={inp} />
          <input placeholder="Phone (optional)" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} style={inp} />
          <textarea placeholder="Shipping address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} style={{ ...inp, minHeight: 70, resize: 'vertical' }} />
          {state === 'error' && <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>Checkout failed. Try again.</div>}
          <button type="submit" disabled={state === 'placing' || cart.items.length === 0} style={{ padding: '14px', borderRadius: 10, border: 'none', background: cart.items.length ? 'var(--color-primary,#4f46e5)' : '#cbd5e1', color: '#fff', fontWeight: 700, cursor: cart.items.length ? 'pointer' : 'not-allowed' }}>
            {state === 'placing' ? 'Placing order…' : `Place Order · $${cart.subtotal.toFixed(2)}`}
          </button>
        </form>
      </div>
    </section>
  );
}
