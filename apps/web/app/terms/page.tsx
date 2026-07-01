'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Mail, Calendar, ExternalLink } from 'lucide-react';

const SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description', title: '2. Description of Service' },
  { id: 'registration', title: '3. Registration & Tenant Accounts' },
  { id: 'billing', title: '4. Fees, Billing, & Renewals' },
  { id: 'ip', title: '5. Intellectual Property Rights' },
  { id: 'termination', title: '6. Account Termination' },
  { id: 'warranties', title: '7. Disclaimer of Warranties' },
  { id: 'liability', title: '8. Limitation of Liability' },
  { id: 'governing-law', title: '9. Governing Law & Jurisdiction' },
  { id: 'changes', title: '10. Changes to Terms' },
  { id: 'contact', title: '11. Contact Information' },
];

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('acceptance');

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
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 var(--space-2)' }}>Terms of Service</h1>
          <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-10)' }}>
            Please read these terms carefully before creating a tenant organization or using the UniERP cloud platform.
          </p>

          <hr style={{ border: 0, height: 1, background: 'var(--color-border)', margin: '0 0 var(--space-8)' }} />

          <section id="acceptance" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>1. Acceptance of Terms</h2>
            <p>
              By registering an organization or accessing the platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you are entering into these terms on behalf of a company, partnership, or other legal entity, you represent that you have the authority to bind such entity and its affiliates to these terms. If you do not have such authority or do not agree to these terms, you must not accept them and are prohibited from accessing the services.
            </p>
          </section>

          <section id="description" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>2. Description of Service</h2>
            <p>
              UniERP provides a modular, multi-tenant Enterprise Resource Planning (ERP) platform. Services include, but are not limited to, core ledger bookkeeping, payroll calculators, contact trackers, inventory status engines, and custom zero-code form templates. The services are offered on a software-as-a-service (SaaS) subscription model. We reserve the right to modify, suspend, or discontinue any modules or characteristics of the service at any time with or without prior notice.
            </p>
          </section>

          <section id="registration" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>3. Registration & Tenant Accounts</h2>
            <p>
              To utilize UniERP, you must create a tenant organization and set up a system administrator profile. Each tenant organization is logically isolated at the database level. You agree to:
            </p>
            <ul style={{ paddingLeft: 'var(--space-6)', margin: 'var(--space-3) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>Provide accurate, complete, and current information during the signup process.</li>
              <li>Maintain the security and confidentiality of your credentials and administration keys.</li>
              <li>Remain fully responsible for all transactions, configurations, and actions conducted under your tenant workspace.</li>
              <li>Notify us immediately of any unauthorized breach of security or compromise of your administrator credentials.</li>
            </ul>
          </section>

          <section id="billing" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>4. Fees, Billing, & Renewals</h2>
            <p>
              Some core modules are offered under a Free tier. Higher usage tiers, dedicated processing limits, and premium industry modules require active subscriptions.
            </p>
            <p style={{ marginTop: 'var(--space-3)' }}>
              Subscriptions are billed in advance on a recurring monthly or annual basis. Fees are non-refundable unless required by local consumer protection regulations. Failure to maintain active payment cards or settle outstanding invoices within 14 calendar days of due dates may lead to workspace suspension or archival.
            </p>
          </section>

          <section id="ip" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>5. Intellectual Property Rights</h2>
            <p>
              All software components, custom CSS stylesheets, design token architectures, layout definitions, and visual brands of UniERP are the exclusive property of UniERP and its licensors. You retain full and complete ownership of any data, records, documents, or files uploaded, posted, or created by your users within your isolated tenant workspace.
            </p>
          </section>

          <section id="termination" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>6. Account Termination</h2>
            <p>
              You may request full erasure of your tenant workspace and associated user details at any time by contacting our system support. Upon cancellation, your tenant data will be permanently purged from active production hosts within 30 calendar days. We reserve the right to suspend or terminate workspaces that violate our security guidelines, consume excessive API compute limits, or conduct unauthorized activities.
            </p>
          </section>

          <section id="warranties" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>7. Disclaimer of Warranties</h2>
            <p style={{ fontStyle: 'italic' }}>
              The service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We expressly disclaim all warranties of any kind, whether express or implied, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We make no warranty that the service will be uninterrupted, timely, secure, or error-free.
            </p>
          </section>

          <section id="liability" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, UniERP and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, arising out of your access to or use of the platform.
            </p>
          </section>

          <section id="governing-law" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>9. Governing Law & Jurisdiction</h2>
            <p>
              These Terms of Service shall be governed by, and construed in accordance with, the laws of the jurisdiction in which our corporate operations reside, without giving effect to any principles of conflicts of law. You agree that any dispute arising from these terms will be submitted to the exclusive jurisdiction of the state or federal courts in that region.
            </p>
          </section>

          <section id="changes" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>10. Changes to Terms</h2>
            <p>
              We reserve the right to update these terms from time to time to align with legal guidelines or operational shifts. Significant changes will be broadcast to organization administrators via email or dashboard announcements. Your continued use of the services after such updates constitutes explicit acceptance of the new terms.
            </p>
          </section>

          <section id="contact" style={{ scrollMarginTop: '120px', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4)', letterSpacing: '-0.02em' }}>11. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service or need to escalate compliance issues, please contact us at:
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
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block' }}>Compliance Operations</span>
                <a href="mailto:legal@unerp.dev" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none' }}>legal@unerp.dev</a>
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
