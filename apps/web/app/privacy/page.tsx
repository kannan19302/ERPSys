'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Mail, Calendar } from 'lucide-react';

const SECTIONS = [
  { id: 'collect', title: '1. Information We Collect' },
  { id: 'use', title: '2. How We Use Information' },
  { id: 'sharing', title: '3. Information Sharing' },
  { id: 'isolation', title: '4. Data Isolation & Security' },
  { id: 'rights', title: '5. Your Rights & Choices' },
  { id: 'retention', title: '6. Data Retention Policy' },
  { id: 'cookies', title: '7. Cookies & Tracking' },
  { id: 'changes', title: '8. Changes to Policy' },
  { id: 'contact', title: '9. Contact Information' },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('collect');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
      fontFamily: 'var(--font-sans)',
      lineHeight: 1.6,
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 100,
        padding: 'var(--space-4) var(--space-8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', width: '100%', maxWidth: '1200px', margin: '0 auto', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Link href="/" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              textDecoration: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              transition: 'color var(--duration-fast)',
            }} className="hover-text-primary">
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <div style={{ width: 1, height: 16, background: 'var(--color-border-strong)' }} />
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Shield size={16} style={{ margin: 'auto' }} /></div>
              <span style={{ fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>UniERP</span>
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            <Calendar size={14} /> Last updated: June 28, 2026
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'var(--space-12) var(--space-8)',
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: 'var(--space-12)',
      }} className="legal-layout">
        
        {/* Sidebar Nav */}
        <aside style={{
          position: 'sticky',
          top: '100px',
          height: 'fit-content',
        }} className="legal-sidebar">
          <h4 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-tertiary)' }}>Sections</h4>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={(e) => handleSectionClick(e, sec.id)}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--text-sm)',
                  color: sec.id === activeSection ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: sec.id === activeSection ? 600 : 400,
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: sec.id === activeSection ? 'var(--color-primary-light)' : 'transparent',
                  transition: 'all var(--duration-fast)',
                }}
              >
                {sec.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content Body */}
        <main style={{ maxWidth: '800px' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 var(--space-2)' }}>Privacy Policy</h1>
          <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-10)' }}>
            This policy outlines how UniERP collects, secures, processes, and manages data inside our multi-tenant SaaS infrastructure.
          </p>

          <hr style={{ border: 0, height: 1, background: 'var(--color-border)', margin: '0 0 var(--space-8)' }} />

          <section id="collect" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>1. Information We Collect</h2>
            <p>
              We collect information in three categories when you establish an organization or use the platform:
            </p>
            <ul style={{ paddingLeft: 'var(--space-6)', margin: 'var(--space-3) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><strong>Account Sign-up Data:</strong> First name, last name, organization name, work email address, and hashed passwords of the system administrators.</li>
              <li><strong>Tenant Client Data:</strong> Financial records, employee directory profiles, CRM contacts, physical warehouse item details, and configuration fields recorded by your users. This content is isolated to your tenant space.</li>
              <li><strong>Platform Log Information:</strong> Access timestamps, client browser agents, host header identifiers, originating IP addresses, and database change query events tracked by the structured compliance logger.</li>
            </ul>
          </section>

          <section id="use" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>2. How We Use Information</h2>
            <p>
              We process collectable information for these core reasons:
            </p>
            <ul style={{ paddingLeft: 'var(--space-6)', margin: 'var(--space-3) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>To initialize and host your isolated tenant database space.</li>
              <li>To manage platform routing, domain resolutions, and handle secure cookie tokens.</li>
              <li>To compile metrics charts and operational reports inside your active dashboard session.</li>
              <li>To record auditable changes to database schemas and security settings.</li>
              <li>To distribute security advisories, billing invoices, or support notifications to system admins.</li>
            </ul>
          </section>

          <section id="sharing" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>3. Information Sharing</h2>
            <p>
              We do not sell, rent, or trade your tenant records or system accounts to external third-party agencies. We may share details only under these specific scopes:
            </p>
            <ul style={{ paddingLeft: 'var(--space-6)', margin: 'var(--space-3) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><strong>Trusted Subprocessors:</strong> Cloud hosting infrastructure (AWS/PostgreSQL nodes) and email delivery channels (SMTP hosts) strictly bound to processing agreements.</li>
              <li><strong>Compliance with Law:</strong> To satisfy valid legal request warrants, regulatory inquiries, or court orders if required.</li>
              <li><strong>Safety & Protection:</strong> To detect, prevent, or address software security vulnerabilities, malicious activity, or critical technical flaws.</li>
            </ul>
          </section>

          <section id="isolation" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>4. Data Isolation & Security</h2>
            <p>
              Our multi-tenant architecture is built from the ground up to protect your privacy:
            </p>
            <ul style={{ paddingLeft: 'var(--space-6)', margin: 'var(--space-3) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><strong>Row-Level Security (RLS):</strong> The Postgres schema enforces absolute separation. Database queries are dynamically scoped by your active `tenant_id` at the database connector layer.</li>
              <li><strong>Encryption:</strong> Transmission uses TLS 1.3 protocols, and active databases store secrets using cryptographically strong keys.</li>
              <li><strong>Change Audits:</strong> Admin settings mutations are systematically compiled to audit logs.</li>
            </ul>
          </section>

          <section id="rights" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>5. Your Rights & Choices</h2>
            <p>
              Depending on your location (such as the EU under GDPR or California under CCPA), you possess specific data rights:
            </p>
            <ul style={{ paddingLeft: 'var(--space-6)', margin: 'var(--space-3) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><strong>Right of Access:</strong> You can download comprehensive lists of user profiles and ledger logs at any time.</li>
              <li><strong>Right of Erasure:</strong> You can request full purges of your tenant database space.</li>
              <li><strong>Right of Correction:</strong> System admins can modify profile records directly in settings pages.</li>
            </ul>
          </section>

          <section id="retention" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>6. Data Retention Policy</h2>
            <p>
              Active workspaces retain data for the lifetime of your subscription. Deleted workspaces undergo standard archival procedures:
            </p>
            <ul style={{ paddingLeft: 'var(--space-6)', margin: 'var(--space-3) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>Production host databases purge cancelled tenant rows within 30 calendar days.</li>
              <li>Encrypted backup logs overwrite old records on a 90-day retention loop, ensuring full physical removal.</li>
            </ul>
          </section>

          <section id="cookies" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>7. Cookies & Tracking</h2>
            <p>
              We employ cookies solely for core operational integrity. Non-essential advertising cookies are not used.
            </p>
            <ul style={{ paddingLeft: 'var(--space-6)', margin: 'var(--space-3) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><strong>Session Cookies:</strong> Temporary, HTTP-only secure cookie tokens identifying active logins.</li>
              <li><strong>CSRF Cookie:</strong> Essential anti-forgery keys protecting data mutations.</li>
            </ul>
          </section>

          <section id="changes" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>8. Changes to Policy</h2>
            <p>
              We reserve the right to modify this Privacy Policy to ensure alignment with standard data protection acts. Modifications are posted here with a new timestamp. Significant updates trigger inline alerts on admin dashboards.
            </p>
          </section>

          <section id="contact" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>9. Contact Information</h2>
            <p>
              To execute rights or register data privacy concerns, you can contact our privacy officer at:
            </p>
            <div style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-4)',
              background: 'var(--color-bg-sunken)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}>
              <Mail size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block' }}>Data Protection Desk</span>
                <a href="mailto:privacy@unerp.dev" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none' }}>privacy@unerp.dev</a>
              </div>
            </div>
          </section>
        </main>
      </div>

      <style>{`
        .hover-text-primary:hover {
          color: var(--color-primary) !important;
        }
        @media (max-width: 768px) {
          .legal-layout {
            grid-template-columns: 1fr !important;
          }
          .legal-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
