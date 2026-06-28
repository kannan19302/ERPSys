'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield, ChevronRight, Menu, X, Check,
  CreditCard, Users, BarChart3, Package, Hammer, Activity,
  Heart, GraduationCap, Building2, Wrench, Store,
  Zap, Globe, Lock, ArrowRight, Star,
} from 'lucide-react';
import './landing.css';

/* ═══════════════════════════════════════════════════════════════
   Landing Page — UniERP
   11-section premium SaaS landing page
   ═══════════════════════════════════════════════════════════════ */

// ── Data ──

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Industries', href: '#industries' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: 'http://localhost:3001/swagger' },
];

const FEATURES = [
  { icon: CreditCard, title: 'Finance & Accounting', desc: 'Double-entry bookkeeping, multi-currency, automated reconciliation, and real-time P&L reports.', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  { icon: Users, title: 'Human Resources', desc: 'Payroll, leave management, performance reviews, attendance tracking, and org charts.', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { icon: BarChart3, title: 'CRM & Sales', desc: 'Contact management, deal pipelines, quotations, sales orders, and revenue analytics.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { icon: Package, title: 'Inventory & Warehouse', desc: 'Multi-warehouse, serial/batch tracking, reorder automation, and barcode scanning.', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  { icon: Hammer, title: 'Manufacturing (MRP)', desc: 'Bill of materials, work orders, production planning, quality control, and scrap tracking.', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  { icon: Activity, title: 'Analytics & BI', desc: 'Custom dashboards, KPI widgets, pivot tables, scheduled reports, and data drill-downs.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
];

const INDUSTRIES = [
  {
    id: 'healthcare',
    icon: Heart,
    label: 'Healthcare',
    title: 'Complete Hospital Management',
    desc: 'From patient intake to billing — manage appointments, EHR, prescriptions, lab orders, and insurance claims in one platform.',
    features: ['Electronic Health Records (EHR)', 'Appointment Scheduling', 'Pharmacy & Drug Tracking', 'Insurance Claims Processing'],
    metrics: [
      { label: 'Patients', value: '12,847' },
      { label: 'Appointments', value: '2,341' },
      { label: 'Revenue', value: '$1.2M' },
    ],
  },
  {
    id: 'education',
    icon: GraduationCap,
    label: 'Education',
    title: 'Smart Campus Management',
    desc: 'Admissions, course scheduling, gradebooks, fee collection, library management, and attendance tracking.',
    features: ['Student Information System', 'Timetable Scheduling', 'Online Fee Collection', 'Library Management'],
    metrics: [
      { label: 'Students', value: '8,560' },
      { label: 'Courses', value: '342' },
      { label: 'Collections', value: '$890K' },
    ],
  },
  {
    id: 'realestate',
    icon: Building2,
    label: 'Real Estate',
    title: 'Property Portfolio Control',
    desc: 'Manage properties, leases, maintenance work orders, agent commissions, and investment analytics.',
    features: ['Property Registry & Units', 'Lease Lifecycle Management', 'Maintenance Dispatch', 'Investment Yield Analysis'],
    metrics: [
      { label: 'Properties', value: '1,247' },
      { label: 'Tenants', value: '3,891' },
      { label: 'NOI', value: '$4.5M' },
    ],
  },
  {
    id: 'fieldservice',
    icon: Wrench,
    label: 'Field Service',
    title: 'On-Site Service Excellence',
    desc: 'Service tickets, technician dispatch, mobile checklists, preventive maintenance, and auto-invoicing.',
    features: ['Service Ticket Management', 'Technician Scheduling & Maps', 'Mobile Checklist & Signatures', 'Auto-Invoicing for Parts & Labor'],
    metrics: [
      { label: 'Tickets', value: '5,120' },
      { label: 'Technicians', value: '248' },
      { label: 'SLA Met', value: '98.2%' },
    ],
  },
  {
    id: 'retail',
    icon: Store,
    label: 'Retail & POS',
    title: 'Unified Retail Operations',
    desc: 'Point-of-sale, barcode scanning, cash registers, shift management, and real-time inventory sync.',
    features: ['POS Terminal Interface', 'Barcode & Receipt Printing', 'Cash Register & Shifts', 'Omni-Channel Inventory'],
    metrics: [
      { label: 'Transactions', value: '42K' },
      { label: 'SKUs', value: '15,800' },
      { label: 'Daily Sales', value: '$85K' },
    ],
  },
];

const STEPS = [
  { num: 1, title: 'Register Your Organization', desc: 'Create an isolated tenant in under 30 seconds. No credit card required.' },
  { num: 2, title: 'Configure Your Modules', desc: 'Pick the modules you need — Finance, HR, CRM, or industry-specific solutions.' },
  { num: 3, title: 'Launch & Scale', desc: 'Onboard your team, import data, and go live. Scale as you grow.' },
];

const STATS = [
  { value: '25+', label: 'Modules' },
  { value: '200+', label: 'API Endpoints' },
  { value: '50+', label: 'Countries' },
  { value: '10K+', label: 'Users' },
];

const TESTIMONIALS = [
  {
    quote: 'UniERP replaced five separate tools for us. Finance, HR, and inventory now live in one place — our team saves 15 hours a week.',
    name: 'Sarah Chen',
    role: 'COO, Nexus Manufacturing',
    avatar: 'SC',
    color: '#6366f1',
  },
  {
    quote: 'The zero-code builder let us create custom workflows without a single developer. We deployed our approval chains in an afternoon.',
    name: 'Michael Torres',
    role: 'VP Operations, Apex Solutions',
    avatar: 'MT',
    color: '#10b981',
  },
  {
    quote: 'Multi-tenant isolation gives each of our franchise locations their own data space while we maintain a unified dashboard. Exactly what we needed.',
    name: 'Priya Kapoor',
    role: 'CTO, EduBridge Academy',
    avatar: 'PK',
    color: '#f59e0b',
  },
];

const PRICING = [
  {
    name: 'Starter',
    desc: 'For small teams getting started',
    price: 'Free',
    period: '',
    features: ['Up to 5 users', '3 core modules', 'Community support', '1 GB storage', 'Basic reports'],
    cta: 'Get Started Free',
    featured: false,
  },
  {
    name: 'Professional',
    desc: 'For growing businesses',
    price: '$49',
    period: '/user/mo',
    features: ['Unlimited users', 'All 25+ modules', 'Priority support', '50 GB storage', 'Custom dashboards', 'API access', 'Workflow engine'],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    desc: 'For large organizations',
    price: 'Custom',
    period: '',
    features: ['Everything in Professional', 'Dedicated account manager', 'SLA guarantee', 'Unlimited storage', 'SSO & SAML', 'On-premise option', 'Custom integrations'],
    cta: 'Contact Sales',
    featured: false,
  },
];

const LOGO_NAMES = [
  'Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli',
  'Pied Piper', 'Stark Ind.', 'Wayne Ent.', 'Oscorp', 'Cyberdyne',
];

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Modules', href: '#features' },
    { label: 'Integrations', href: '/register' },
    { label: 'Changelog', href: '#' },
  ],
  Resources: [
    { label: 'Documentation', href: 'http://localhost:3001/swagger' },
    { label: 'API Reference', href: 'http://localhost:3001/swagger' },
    { label: 'Community', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Tutorials', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#features' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#pricing' },
    { label: 'Partners', href: '#' },
    { label: 'Press Kit', href: '#' },
  ],
};

// ── Hook: Intersection Observer for reveal animation ──

function useRevealObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    const elements = document.querySelectorAll('.landing-reveal');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);
}

// ── Component ──

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeIndustry, setActiveIndustry] = useState(0);

  useRevealObserver();

  // Scroll listener for sticky nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smooth scroll for anchor links
  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#') && href.length > 1) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setMobileOpen(false);
    }
  }, []);

  const industry = INDUSTRIES[activeIndustry];

  return (
    <div className="landing-root">
      {/* ── 1. Navbar ── */}
      <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
        <Link href="/" className="landing-nav-logo">
          <div className="landing-nav-logo-icon">
            <Shield size={20} />
          </div>
          <span className="landing-nav-logo-text">UniERP</span>
        </Link>

        <ul className="landing-nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="landing-nav-link"
                onClick={(e) => handleAnchorClick(e, link.href)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="landing-nav-actions">
          <Link href="/login" className="landing-btn-ghost">Sign In</Link>
          <Link href="/register" className="landing-btn-primary">
            Get Started <ChevronRight size={16} />
          </Link>
          <button
            className="landing-nav-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`landing-mobile-menu${mobileOpen ? ' open' : ''}`}>
        <button className="landing-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X size={24} />
        </button>
        {NAV_LINKS.map((link) => (
          <a key={link.label} href={link.href} onClick={(e) => handleAnchorClick(e, link.href)}>
            {link.label}
          </a>
        ))}
        <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
        <Link href="/register" className="landing-btn-primary" onClick={() => setMobileOpen(false)} style={{ textAlign: 'center', marginTop: '8px' }}>
          Get Started
        </Link>
      </div>

      {/* ── 2. Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-glow landing-hero-glow-1" />
        <div className="landing-hero-glow landing-hero-glow-2" />

        <div className="landing-hero-badge">
          <Zap size={14} />
          <span>Open-source ERP for modern teams</span>
        </div>

        <h1>
          Run Your Entire Business{' '}
          <span className="landing-hero-gradient-text">From One Platform</span>
        </h1>

        <p>
          A composable, multi-tenant Enterprise Resource Planning system.
          Finance, HR, CRM, Inventory, Manufacturing, and 20+ more modules — unified.
        </p>

        <div className="landing-hero-ctas">
          <Link href="/register" className="landing-btn-primary">
            Start Free <ArrowRight size={16} />
          </Link>
          <a href="#features" className="landing-btn-outline" onClick={(e) => handleAnchorClick(e, '#features')}>
            Explore Features
          </a>
        </div>

        <div className="landing-hero-stats">
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">25+</div>
            <div className="landing-hero-stat-label">Modules</div>
          </div>
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">99.9%</div>
            <div className="landing-hero-stat-label">Uptime</div>
          </div>
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">10K+</div>
            <div className="landing-hero-stat-label">Companies</div>
          </div>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="landing-preview">
          <div className="landing-preview-frame">
            <div className="landing-preview-topbar">
              <div className="landing-preview-dot" style={{ background: '#ff5f57' }} />
              <div className="landing-preview-dot" style={{ background: '#febc2e' }} />
              <div className="landing-preview-dot" style={{ background: '#28c840' }} />
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                localhost:3000/dashboard
              </span>
            </div>
            <div className="landing-preview-body">
              <div className="landing-preview-sidebar">
                {['Dashboard', 'Finance', 'HR', 'CRM', 'Inventory', 'Analytics'].map((item, i) => (
                  <div key={item} className={`landing-preview-sidebar-item${i === 0 ? ' active' : ''}`}>
                    {item}
                  </div>
                ))}
              </div>
              <div className="landing-preview-content">
                <div className="landing-preview-cards">
                  {[
                    { label: 'Revenue', value: '$124.5K', color: '#6366f1' },
                    { label: 'Orders', value: '1,247', color: '#10b981' },
                    { label: 'Customers', value: '8,491', color: '#f59e0b' },
                    { label: 'Growth', value: '+23.1%', color: '#0ea5e9' },
                  ].map((card) => (
                    <div key={card.label} className="landing-preview-card">
                      <div className="landing-preview-card-label">{card.label}</div>
                      <div className="landing-preview-card-value" style={{ color: card.color }}>{card.value}</div>
                    </div>
                  ))}
                </div>
                <div className="landing-preview-chart">
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Revenue Trend</div>
                  <div className="landing-preview-bars">
                    {[40, 55, 35, 70, 60, 80, 65, 90, 75, 95, 85, 100].map((h, i) => (
                      <div key={i} className="landing-preview-bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Logo Cloud ── */}
      <section className="landing-logos">
        <div className="landing-logos-title">Trusted by teams at leading organizations</div>
        <div style={{ overflow: 'hidden' }}>
          <div className="landing-logos-track">
            {[...LOGO_NAMES, ...LOGO_NAMES].map((name, i) => (
              <span key={i} className="landing-logo-item">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Features Grid ── */}
      <section className="landing-section" id="features">
        <div className="landing-container">
          <div className="landing-section-header landing-reveal">
            <div className="landing-section-eyebrow">Capabilities</div>
            <h2 className="landing-section-title">Everything You Need, Nothing You Don&apos;t</h2>
            <p className="landing-section-desc">
              25+ tightly-integrated modules covering every business function — from accounting to manufacturing to field service.
            </p>
          </div>
          <div className="landing-features-grid">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`landing-feature-card landing-reveal landing-reveal-delay-${Math.min(i + 1, 5)}`}
                  style={{ '--feature-accent': feat.color } as React.CSSProperties}
                >
                  <div className="landing-feature-icon" style={{ background: feat.bg, color: feat.color }}>
                    <Icon size={24} />
                  </div>
                  <h3>{feat.title}</h3>
                  <p>{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Industry Modules ── */}
      <section className="landing-section landing-section-alt" id="industries">
        <div className="landing-container">
          <div className="landing-section-header landing-reveal">
            <div className="landing-section-eyebrow">Industry Solutions</div>
            <h2 className="landing-section-title">Built For Your Industry</h2>
            <p className="landing-section-desc">
              Purpose-built modules for Healthcare, Education, Real Estate, Field Service, and Retail — right out of the box.
            </p>
          </div>

          <div className="landing-industry-tabs landing-reveal">
            {INDUSTRIES.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <button
                  key={ind.id}
                  className={`landing-industry-tab${i === activeIndustry ? ' active' : ''}`}
                  onClick={() => setActiveIndustry(i)}
                >
                  <Icon size={16} />
                  {ind.label}
                </button>
              );
            })}
          </div>

          {industry && (
            <div className="landing-industry-panel landing-reveal">
              <div className="landing-industry-content">
                <h3>{industry.title}</h3>
                <p>{industry.desc}</p>
                <ul className="landing-industry-features">
                  {industry.features.map((feat) => (
                    <li key={feat}>
                      <span className="landing-industry-check">
                        <Check size={13} />
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="landing-industry-visual">
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {industry.label} Dashboard
                </div>
                <div className="landing-industry-mockup-row">
                  {industry.metrics.map((m) => (
                    <div key={m.label} className="landing-industry-mockup-card">
                      <h4>{m.label}</h4>
                      <div className="value">{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-end', padding: 'var(--space-4)', gap: 'var(--space-2)' }}>
                  {[45, 60, 35, 80, 55, 70, 90, 50, 75, 65].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h}%`,
                        borderRadius: '3px 3px 0 0',
                        background: `linear-gradient(to top, var(--color-primary), var(--color-primary-hover))`,
                        opacity: 0.6 + (i % 3) * 0.15,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 6. How It Works ── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header landing-reveal">
            <div className="landing-section-eyebrow">Getting Started</div>
            <h2 className="landing-section-title">Up and Running in Minutes</h2>
            <p className="landing-section-desc">
              No complex onboarding. No week-long implementations. Three simple steps to transform your operations.
            </p>
          </div>
          <div className="landing-steps">
            {STEPS.map((step, i) => (
              <div key={step.num} className={`landing-step landing-reveal landing-reveal-delay-${i + 1}`}>
                <div className="landing-step-number">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Stats ── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <div className="landing-stats-grid">
            {STATS.map((stat, i) => (
              <div key={stat.label} className={`landing-stat-card landing-reveal landing-reveal-delay-${i + 1}`}>
                <div className="landing-stat-number">{stat.value}</div>
                <div className="landing-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Testimonials ── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header landing-reveal">
            <div className="landing-section-eyebrow">Testimonials</div>
            <h2 className="landing-section-title">Loved by Teams Worldwide</h2>
            <p className="landing-section-desc">
              See what operations leaders and business owners say about transforming their workflows with UniERP.
            </p>
          </div>
          <div className="landing-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`landing-testimonial landing-reveal landing-reveal-delay-${i + 1}`}>
                <div className="landing-testimonial-stars">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={16} fill="#f59e0b" />
                  ))}
                </div>
                <p className="landing-testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="landing-testimonial-author">
                  <div className="landing-testimonial-avatar" style={{ background: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="landing-testimonial-name">{t.name}</div>
                    <div className="landing-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Pricing ── */}
      <section className="landing-section landing-section-alt" id="pricing">
        <div className="landing-container">
          <div className="landing-section-header landing-reveal">
            <div className="landing-section-eyebrow">Pricing</div>
            <h2 className="landing-section-title">Simple, Transparent Pricing</h2>
            <p className="landing-section-desc">
              Start free. Upgrade when you&apos;re ready. No hidden fees, no surprises.
            </p>
          </div>
          <div className="landing-pricing-grid">
            {PRICING.map((plan, i) => (
              <div
                key={plan.name}
                className={`landing-pricing-card${plan.featured ? ' featured' : ''} landing-reveal landing-reveal-delay-${i + 1}`}
              >
                {plan.featured && <div className="landing-pricing-badge">Most Popular</div>}
                <div className="landing-pricing-name">{plan.name}</div>
                <div className="landing-pricing-desc">{plan.desc}</div>
                <div className="landing-pricing-price">
                  <span className="landing-pricing-amount">{plan.price}</span>
                  {plan.period && <span className="landing-pricing-period">{plan.period}</span>}
                </div>
                <ul className="landing-pricing-features">
                  {plan.features.map((feat) => (
                    <li key={feat}>
                      <Check size={16} className="landing-pricing-check" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/register?plan=${plan.name.toLowerCase()}`}
                  className={`landing-pricing-btn ${plan.featured ? 'landing-btn-primary' : 'landing-btn-outline'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. CTA Banner ── */}
      <section className="landing-cta-banner">
        <div className="landing-container landing-reveal">
          <h2>Ready to Transform Your Business?</h2>
          <p>
            Join thousands of companies running their entire operations on UniERP.
            Start free — no credit card required.
          </p>
          <Link href="/register" className="landing-btn-primary">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── 11. Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div className="landing-footer-brand">
            <Link href="/" className="landing-nav-logo">
              <div className="landing-nav-logo-icon">
                <Shield size={18} />
              </div>
              <span className="landing-nav-logo-text">UniERP</span>
            </Link>
            <p>
              A composable, multi-tenant Enterprise Resource Planning system for modern businesses.
              Open-source. Industry-agnostic. Built to scale.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="landing-footer-col">
              <h4>{category}</h4>
              <ul>
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('#') ? (
                      <a href={link.href} onClick={(e) => handleAnchorClick(e, link.href)}>{link.label}</a>
                    ) : link.href.startsWith('http') ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="landing-footer-bottom">
          <div className="landing-footer-copyright">
            © {new Date().getFullYear()} UniERP. All rights reserved.
          </div>
          <div className="landing-footer-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <a href="#">Cookie Settings</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
