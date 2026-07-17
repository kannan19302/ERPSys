'use client';
import styles from './page.module.css';
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
    <div className={styles.s1}>
      {/* Header */}
      <header className={styles.s2}>
        <div className={styles.s3}>
          <div className={styles.s4}>
            <Link href="/"  className={`hover-text-primary ${styles.s28}`}>
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <div className={styles.s5} />
            <Link href="/" className={styles.s29}>
              <div className={styles.s6}><Shield size={16} className={styles.s26} /></div>
              <span className={styles.s7}>UniERP</span>
            </Link>
          </div>
          <div className={styles.s8}>
            <Calendar size={14} /> Last updated: June 28, 2026
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div  className={`legal-layout ${styles.s9}`}>
        
        {/* Sidebar Nav */}
        <aside  className={`legal-sidebar ${styles.s10}`}>
          <h4 className={styles.s11}>Sections</h4>
          <nav className={styles.s12}>
            {SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={(e) => handleSectionClick(e, sec.id)}
                style={{ color: sec.id === activeSection ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: sec.id === activeSection ? 600 : 400, background: sec.id === activeSection ? 'var(--color-primary-light)' : 'transparent' }} className={styles.s13}
              >
                {sec.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content Body */}
        <main className={styles.s14}>
          <h1 className={styles.s15}>Terms of Service</h1>
          <p className={styles.s16}>
            Please read these terms carefully before creating a tenant organization or using the UniERP cloud platform.
          </p>

          <hr className={styles.s17} />

          <section id="acceptance" className={styles.s18}>
            <h2 className={styles.s19}>1. Acceptance of Terms</h2>
            <p>
              By registering an organization or accessing the platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you are entering into these terms on behalf of a company, partnership, or other legal entity, you represent that you have the authority to bind such entity and its affiliates to these terms. If you do not have such authority or do not agree to these terms, you must not accept them and are prohibited from accessing the services.
            </p>
          </section>

          <section id="description" className={styles.s18}>
            <h2 className={styles.s19}>2. Description of Service</h2>
            <p>
              UniERP provides a modular, multi-tenant Enterprise Resource Planning (ERP) platform. Services include, but are not limited to, core ledger bookkeeping, payroll calculators, contact trackers, inventory status engines, and custom zero-code form templates. The services are offered on a software-as-a-service (SaaS) subscription model. We reserve the right to modify, suspend, or discontinue any modules or characteristics of the service at any time with or without prior notice.
            </p>
          </section>

          <section id="registration" className={styles.s18}>
            <h2 className={styles.s19}>3. Registration & Tenant Accounts</h2>
            <p>
              To utilize UniERP, you must create a tenant organization and set up a system administrator profile. Each tenant organization is logically isolated at the database level. You agree to:
            </p>
            <ul className={styles.s20}>
              <li>Provide accurate, complete, and current information during the signup process.</li>
              <li>Maintain the security and confidentiality of your credentials and administration keys.</li>
              <li>Remain fully responsible for all transactions, configurations, and actions conducted under your tenant workspace.</li>
              <li>Notify us immediately of any unauthorized breach of security or compromise of your administrator credentials.</li>
            </ul>
          </section>

          <section id="billing" className={styles.s18}>
            <h2 className={styles.s19}>4. Fees, Billing, & Renewals</h2>
            <p>
              Some core modules are offered under a Free tier. Higher usage tiers, dedicated processing limits, and premium industry modules require active subscriptions.
            </p>
            <p className={styles.s21}>
              Subscriptions are billed in advance on a recurring monthly or annual basis. Fees are non-refundable unless required by local consumer protection regulations. Failure to maintain active payment cards or settle outstanding invoices within 14 calendar days of due dates may lead to workspace suspension or archival.
            </p>
          </section>

          <section id="ip" className={styles.s18}>
            <h2 className={styles.s19}>5. Intellectual Property Rights</h2>
            <p>
              All software components, custom CSS stylesheets, design token architectures, layout definitions, and visual brands of UniERP are the exclusive property of UniERP and its licensors. You retain full and complete ownership of any data, records, documents, or files uploaded, posted, or created by your users within your isolated tenant workspace.
            </p>
          </section>

          <section id="termination" className={styles.s18}>
            <h2 className={styles.s19}>6. Account Termination</h2>
            <p>
              You may request full erasure of your tenant workspace and associated user details at any time by contacting our system support. Upon cancellation, your tenant data will be permanently purged from active production hosts within 30 calendar days. We reserve the right to suspend or terminate workspaces that violate our security guidelines, consume excessive API compute limits, or conduct unauthorized activities.
            </p>
          </section>

          <section id="warranties" className={styles.s18}>
            <h2 className={styles.s19}>7. Disclaimer of Warranties</h2>
            <p className={styles.s22}>
              The service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We expressly disclaim all warranties of any kind, whether express or implied, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We make no warranty that the service will be uninterrupted, timely, secure, or error-free.
            </p>
          </section>

          <section id="liability" className={styles.s18}>
            <h2 className={styles.s19}>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, UniERP and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, arising out of your access to or use of the platform.
            </p>
          </section>

          <section id="governing-law" className={styles.s18}>
            <h2 className={styles.s19}>9. Governing Law & Jurisdiction</h2>
            <p>
              These Terms of Service shall be governed by, and construed in accordance with, the laws of the jurisdiction in which our corporate operations reside, without giving effect to any principles of conflicts of law. You agree that any dispute arising from these terms will be submitted to the exclusive jurisdiction of the state or federal courts in that region.
            </p>
          </section>

          <section id="changes" className={styles.s18}>
            <h2 className={styles.s19}>10. Changes to Terms</h2>
            <p>
              We reserve the right to update these terms from time to time to align with legal guidelines or operational shifts. Significant changes will be broadcast to organization administrators via email or dashboard announcements. Your continued use of the services after such updates constitutes explicit acceptance of the new terms.
            </p>
          </section>

          <section id="contact" className={styles.s18}>
            <h2 className={styles.s19}>11. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service or need to escalate compliance issues, please contact us at:
            </p>
            <div className={styles.s23}>
              <Mail size={20} className={styles.s27} />
              <div>
                <span className={styles.s24}>Compliance Operations</span>
                <a href="mailto:legal@unerp.dev" className={styles.s25}>legal@unerp.dev</a>
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
