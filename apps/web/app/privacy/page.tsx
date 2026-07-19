"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Mail, Calendar } from "lucide-react";

const SECTIONS = [
  { id: "collect", title: "1. Information We Collect" },
  { id: "use", title: "2. How We Use Information" },
  { id: "roles", title: "3. Controller & Processor Roles" },
  { id: "sharing", title: "4. Information Sharing" },
  { id: "isolation", title: "5. Data Isolation & Security" },
  { id: "transfers", title: "6. International Data Transfers" },
  { id: "rights", title: "7. Your Rights & Choices" },
  { id: "retention", title: "8. Data Retention Policy" },
  { id: "cookies", title: "9. Cookies & Tracking" },
  { id: "children", title: "10. Children’s Privacy" },
  { id: "breach", title: "11. Security Incident Notification" },
  { id: "changes", title: "12. Changes to Policy" },
  { id: "contact", title: "13. Contact Information" },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("collect");

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
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  return (
    <div className={styles.s1}>
      {/* Header */}
      <header className={styles.s2}>
        <div className={styles.s3}>
          <div className={styles.s4}>
            <Link href="/" className={`hover-text-primary ${styles.s26}`}>
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <div className={styles.s5} />
            <Link href="/" className={styles.s27}>
              <div className={styles.s6}>
                <Shield size={16} className={styles.s24} />
              </div>
              <span className={styles.s7}>UniERP</span>
            </Link>
          </div>
          <div className={styles.s8}>
            <Calendar size={14} /> Last updated: July 19, 2026
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className={`legal-layout ${styles.s9}`}>
        {/* Sidebar Nav */}
        <aside className={`legal-sidebar ${styles.s10}`}>
          <h4 className={styles.s11}>Sections</h4>
          <nav className={styles.s12}>
            {SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={(e) => handleSectionClick(e, sec.id)}
                style={{
                  color:
                    sec.id === activeSection
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                  fontWeight: sec.id === activeSection ? 600 : 400,
                  background:
                    sec.id === activeSection
                      ? "var(--color-primary-light)"
                      : "transparent",
                }}
                className={styles.s13}
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
            This policy outlines how UniERP collects, secures, processes, and
            manages data inside our multi-tenant SaaS infrastructure.
          </p>

          <hr className={styles.s17} />

          <section id="collect" className={styles.s18}>
            <h2 className={styles.s19}>1. Information We Collect</h2>
            <p>
              We collect information in three categories when you establish an
              organization or use the platform:
            </p>
            <ul className={styles.s20}>
              <li>
                <strong>Account Sign-up Data:</strong> First name, last name,
                organization name, work email address, and hashed passwords of
                the system administrators.
              </li>
              <li>
                <strong>Tenant Client Data:</strong> Financial records, employee
                directory profiles, CRM contacts, physical warehouse item
                details, and configuration fields recorded by your users. This
                content is isolated to your tenant space.
              </li>
              <li>
                <strong>Platform Log Information:</strong> Access timestamps,
                client browser agents, host header identifiers, originating IP
                addresses, and database change query events tracked by the
                structured compliance logger.
              </li>
            </ul>
          </section>

          <section id="use" className={styles.s18}>
            <h2 className={styles.s19}>2. How We Use Information</h2>
            <p>We process collectable information for these core reasons:</p>
            <ul className={styles.s20}>
              <li>
                To initialize and host your isolated tenant database space.
              </li>
              <li>
                To manage platform routing, domain resolutions, and handle
                secure cookie tokens.
              </li>
              <li>
                To compile metrics charts and operational reports inside your
                active dashboard session.
              </li>
              <li>
                To record auditable changes to database schemas and security
                settings.
              </li>
              <li>
                To distribute security advisories, billing invoices, or support
                notifications to system admins.
              </li>
            </ul>
          </section>

          <section id="roles" className={styles.s18}>
            <h2 className={styles.s19}>3. Controller & Processor Roles</h2>
            <p>
              For <strong>Account Sign-up Data</strong> (the
              administrator&apos;s own name, work email, and login credentials),
              UniERP acts as the <strong>data controller</strong>: we determine
              why and how that data is processed, as described in this policy.
            </p>
            <p>
              For <strong>Tenant Client Data</strong> — the financial records,
              employee profiles, CRM contacts, and other business records your
              users enter into your isolated workspace — your organization is
              the <strong>data controller</strong> and UniERP acts solely as a{" "}
              <strong>data processor</strong>, processing that data only on your
              instructions and for the purpose of providing the platform. If
              your organization is itself subject to GDPR, UK GDPR, or a similar
              regime, a Data Processing Addendum (DPA) governing our processor
              obligations is available on request to{" "}
              <a
                href="mailto:legal@unerp.dev"
                style={{ color: "var(--color-primary)" }}
              >
                legal@unerp.dev
              </a>
              .
            </p>
          </section>

          <section id="sharing" className={styles.s18}>
            <h2 className={styles.s19}>4. Information Sharing</h2>
            <p>
              We do not sell, rent, or trade your tenant records or system
              accounts to external third-party agencies. We may share details
              only under these specific scopes:
            </p>
            <ul className={styles.s20}>
              <li>
                <strong>Trusted Subprocessors:</strong> Cloud hosting
                infrastructure (AWS/PostgreSQL nodes) and email delivery
                channels (SMTP hosts) strictly bound to processing agreements.
              </li>
              <li>
                <strong>Compliance with Law:</strong> To satisfy valid legal
                request warrants, regulatory inquiries, or court orders if
                required.
              </li>
              <li>
                <strong>Safety & Protection:</strong> To detect, prevent, or
                address software security vulnerabilities, malicious activity,
                or critical technical flaws.
              </li>
            </ul>
          </section>

          <section id="isolation" className={styles.s18}>
            <h2 className={styles.s19}>5. Data Isolation & Security</h2>
            <p>
              Our multi-tenant architecture is built from the ground up to
              protect your privacy:
            </p>
            <ul className={styles.s20}>
              <li>
                <strong>Tenant Scoping:</strong> Every tenant-scoped database
                table enforces PostgreSQL row-level security (RLS) tied to your
                organization&apos;s tenant identifier — the database itself, not
                just application code, refuses to return or write rows belonging
                to another tenant.
              </li>
              <li>
                <strong>Encryption:</strong> Transmission uses TLS in transit,
                and sensitive fields (MFA secrets, API credentials) are
                encrypted at rest using authenticated encryption.
              </li>
              <li>
                <strong>Authentication:</strong> Passwords are hashed (never
                stored in plaintext), sessions use short-lived rotating tokens,
                and optional multi-factor authentication is available for every
                account.
              </li>
              <li>
                <strong>Change Audits:</strong> Administrative settings changes
                and security-relevant events are recorded to an audit log and
                login-history record visible to your organization&apos;s
                administrators.
              </li>
            </ul>
          </section>

          <section id="transfers" className={styles.s18}>
            <h2 className={styles.s19}>6. International Data Transfers</h2>
            <p>
              Our infrastructure providers may process and store data in
              countries other than your own. Where we transfer personal data out
              of the European Economic Area, the United Kingdom, or Switzerland,
              we rely on recognized safeguards such as the European
              Commission&apos;s Standard Contractual Clauses (SCCs) or an
              equivalent adequacy mechanism. Details of the specific safeguard
              used for a given transfer are available on request.
            </p>
          </section>

          <section id="rights" className={styles.s18}>
            <h2 className={styles.s19}>7. Your Rights & Choices</h2>
            <p>
              Depending on your location (for example, the EU/UK under GDPR,
              California under the CCPA/CPRA, or other regional data protection
              laws), you may have some or all of the following rights over your
              personal data:
            </p>
            <ul className={styles.s20}>
              <li>
                <strong>Right of Access:</strong> Request a copy of the personal
                data we hold about you. Every user can self-service export their
                own profile data at any time from their profile page.
              </li>
              <li>
                <strong>Right of Erasure:</strong> Request deletion of your
                personal data or your organization&apos;s entire tenant
                workspace, subject to legal retention obligations (e.g.
                financial records law may require retaining invoices for a
                statutory period).
              </li>
              <li>
                <strong>Right of Correction:</strong> Correct inaccurate or
                incomplete personal data directly in your profile and account
                settings.
              </li>
              <li>
                <strong>Right to Data Portability:</strong> Receive your
                personal data in a structured, commonly used, machine-readable
                format (JSON export).
              </li>
              <li>
                <strong>Right to Object / Restrict Processing:</strong> Object
                to certain processing of your data, or ask us to restrict how we
                use it, subject to our legitimate interests and legal
                obligations.
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Where processing is
                based on consent, withdraw that consent at any time without
                affecting the lawfulness of processing before withdrawal.
              </li>
              <li>
                <strong>Right to Lodge a Complaint:</strong> Lodge a complaint
                with your local data protection supervisory authority if you
                believe we have not handled your personal data lawfully.
              </li>
            </ul>
            <p>
              To exercise any of these rights, contact us using the details in
              Section 13. We will respond within the timeframe required by
              applicable law.
            </p>
          </section>

          <section id="retention" className={styles.s18}>
            <h2 className={styles.s19}>8. Data Retention Policy</h2>
            <p>
              Active workspaces retain data for the lifetime of your
              subscription. Deleted workspaces undergo standard archival
              procedures:
            </p>
            <ul className={styles.s20}>
              <li>
                Production host databases purge cancelled tenant rows within 30
                calendar days, except where longer retention is required by law
                (e.g. tax or financial recordkeeping obligations).
              </li>
              <li>
                Encrypted backups are retained on a rolling cycle and are
                overwritten as part of our standard backup lifecycle, ensuring
                deleted data does not persist indefinitely.
              </li>
              <li>
                Security-relevant records (login history, audit logs) are
                retained separately for a limited period to support fraud
                investigation and account-recovery requests.
              </li>
            </ul>
          </section>

          <section id="cookies" className={styles.s18}>
            <h2 className={styles.s19}>9. Cookies & Tracking</h2>
            <p>
              We employ cookies solely for core operational integrity.
              Non-essential advertising or third-party tracking cookies are not
              used.
            </p>
            <ul className={styles.s20}>
              <li>
                <strong>Session Cookies:</strong> httpOnly, secure cookies
                identifying your active login and enabling silent session
                renewal.
              </li>
              <li>
                <strong>CSRF Cookie:</strong> A non-sensitive token used to
                protect state-changing requests from cross-site forgery.
              </li>
            </ul>
          </section>

          <section id="children" className={styles.s18}>
            <h2 className={styles.s19}>10. Children&apos;s Privacy</h2>
            <p>
              UniERP is a business software platform intended for use by
              organizations and their employees, and is not directed at,
              marketed to, or knowingly used to collect personal data from
              individuals under the age of 16. If we become aware that we have
              inadvertently collected personal data from a child under this age,
              we will take steps to delete it promptly.
            </p>
          </section>

          <section id="breach" className={styles.s18}>
            <h2 className={styles.s19}>11. Security Incident Notification</h2>
            <p>
              If we become aware of a security incident that compromises the
              confidentiality, integrity, or availability of your personal data,
              we will notify affected organization administrators without undue
              delay, and in any event within the timeframe required by
              applicable law (for example, 72 hours under GDPR Article 33 where
              notification to a supervisory authority is required), describing
              the nature of the incident and the steps we are taking in
              response.
            </p>
          </section>

          <section id="changes" className={styles.s18}>
            <h2 className={styles.s19}>12. Changes to Policy</h2>
            <p>
              We reserve the right to modify this Privacy Policy to ensure
              alignment with standard data protection acts. Modifications are
              posted here with a new timestamp. Significant updates trigger
              inline alerts on admin dashboards.
            </p>
          </section>

          <section id="contact" className={styles.s18}>
            <h2 className={styles.s19}>13. Contact Information</h2>
            <p>
              To execute rights or register data privacy concerns, you can
              contact our privacy officer at:
            </p>
            <div className={styles.s21}>
              <Mail size={20} className={styles.s25} />
              <div>
                <span className={styles.s22}>Data Protection Desk</span>
                <a href="mailto:privacy@unerp.dev" className={styles.s23}>
                  privacy@unerp.dev
                </a>
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
