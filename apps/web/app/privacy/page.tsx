'use client';
import styles from './page.module.css';
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
    <div className={styles.s1}>
      {/* Header */}
      <header className={styles.s2}>
        <div className={styles.s3}>
          <div className={styles.s4}>
            <Link href="/"  className={`hover-text-primary ${styles.s26}`}>
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <div className={styles.s5} />
            <Link href="/" className={styles.s27}>
              <div className={styles.s6}><Shield size={16} className={styles.s24} /></div>
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
          <h1 className={styles.s15}>Privacy Policy</h1>
          <p className={styles.s16}>
            This policy outlines how UniERP collects, secures, processes, and manages data inside our multi-tenant SaaS infrastructure.
          </p>

          <hr className={styles.s17} />

          <section id="collect" className={styles.s18}>
            <h2 className={styles.s19}>1. Information We Collect</h2>
            <p>
              We collect information in three categories when you establish an organization or use the platform:
            </p>
            <ul className={styles.s20}>
              <li><strong>Account Sign-up Data:</strong> First name, last name, organization name, work email address, and hashed passwords of the system administrators.</li>
              <li><strong>Tenant Client Data:</strong> Financial records, employee directory profiles, CRM contacts, physical warehouse item details, and configuration fields recorded by your users. This content is isolated to your tenant space.</li>
              <li><strong>Platform Log Information:</strong> Access timestamps, client browser agents, host header identifiers, originating IP addresses, and database change query events tracked by the structured compliance logger.</li>
            </ul>
          </section>

          <section id="use" className={styles.s18}>
            <h2 className={styles.s19}>2. How We Use Information</h2>
            <p>
              We process collectable information for these core reasons:
            </p>
            <ul className={styles.s20}>
              <li>To initialize and host your isolated tenant database space.</li>
              <li>To manage platform routing, domain resolutions, and handle secure cookie tokens.</li>
              <li>To compile metrics charts and operational reports inside your active dashboard session.</li>
              <li>To record auditable changes to database schemas and security settings.</li>
              <li>To distribute security advisories, billing invoices, or support notifications to system admins.</li>
            </ul>
          </section>

          <section id="sharing" className={styles.s18}>
            <h2 className={styles.s19}>3. Information Sharing</h2>
            <p>
              We do not sell, rent, or trade your tenant records or system accounts to external third-party agencies. We may share details only under these specific scopes:
            </p>
            <ul className={styles.s20}>
              <li><strong>Trusted Subprocessors:</strong> Cloud hosting infrastructure (AWS/PostgreSQL nodes) and email delivery channels (SMTP hosts) strictly bound to processing agreements.</li>
              <li><strong>Compliance with Law:</strong> To satisfy valid legal request warrants, regulatory inquiries, or court orders if required.</li>
              <li><strong>Safety & Protection:</strong> To detect, prevent, or address software security vulnerabilities, malicious activity, or critical technical flaws.</li>
            </ul>
          </section>

          <section id="isolation" className={styles.s18}>
            <h2 className={styles.s19}>4. Data Isolation & Security</h2>
            <p>
              Our multi-tenant architecture is built from the ground up to protect your privacy:
            </p>
            <ul className={styles.s20}>
              <li><strong>Tenant Scoping:</strong> Application queries are scoped to your active `tenant_id`, with database-level row-security enforcement undergoing a release-blocking hardening review before it is represented as an active safeguard.</li>
              <li><strong>Encryption:</strong> Transmission uses TLS 1.3 protocols, and active databases store secrets using cryptographically strong keys.</li>
              <li><strong>Change Audits:</strong> Admin settings mutations are systematically compiled to audit logs.</li>
            </ul>
          </section>

          <section id="rights" className={styles.s18}>
            <h2 className={styles.s19}>5. Your Rights & Choices</h2>
            <p>
              Depending on your location (such as the EU under GDPR or California under CCPA), you possess specific data rights:
            </p>
            <ul className={styles.s20}>
              <li><strong>Right of Access:</strong> You can download comprehensive lists of user profiles and ledger logs at any time.</li>
              <li><strong>Right of Erasure:</strong> You can request full purges of your tenant database space.</li>
              <li><strong>Right of Correction:</strong> System admins can modify profile records directly in settings pages.</li>
            </ul>
          </section>

          <section id="retention" className={styles.s18}>
            <h2 className={styles.s19}>6. Data Retention Policy</h2>
            <p>
              Active workspaces retain data for the lifetime of your subscription. Deleted workspaces undergo standard archival procedures:
            </p>
            <ul className={styles.s20}>
              <li>Production host databases purge cancelled tenant rows within 30 calendar days.</li>
              <li>Encrypted backup logs overwrite old records on a 90-day retention loop, ensuring full physical removal.</li>
            </ul>
          </section>

          <section id="cookies" className={styles.s18}>
            <h2 className={styles.s19}>7. Cookies & Tracking</h2>
            <p>
              We employ cookies solely for core operational integrity. Non-essential advertising cookies are not used.
            </p>
            <ul className={styles.s20}>
              <li><strong>Session Cookies:</strong> Temporary, HTTP-only secure cookie tokens identifying active logins.</li>
              <li><strong>CSRF Cookie:</strong> Essential anti-forgery keys protecting data mutations.</li>
            </ul>
          </section>

          <section id="changes" className={styles.s18}>
            <h2 className={styles.s19}>8. Changes to Policy</h2>
            <p>
              We reserve the right to modify this Privacy Policy to ensure alignment with standard data protection acts. Modifications are posted here with a new timestamp. Significant updates trigger inline alerts on admin dashboards.
            </p>
          </section>

          <section id="contact" className={styles.s18}>
            <h2 className={styles.s19}>9. Contact Information</h2>
            <p>
              To execute rights or register data privacy concerns, you can contact our privacy officer at:
            </p>
            <div className={styles.s21}>
              <Mail size={20} className={styles.s25} />
              <div>
                <span className={styles.s22}>Data Protection Desk</span>
                <a href="mailto:privacy@unerp.dev" className={styles.s23}>privacy@unerp.dev</a>
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
