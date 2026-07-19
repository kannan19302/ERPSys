"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Mail, Calendar, ExternalLink } from "lucide-react";

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "description", title: "2. Description of Service" },
  { id: "registration", title: "3. Registration & Tenant Accounts" },
  { id: "acceptable-use", title: "4. Acceptable Use Policy" },
  { id: "billing", title: "5. Fees, Billing, & Renewals" },
  { id: "third-party", title: "6. Third-Party Services & Integrations" },
  { id: "data-processing", title: "7. Data Protection" },
  { id: "ip", title: "8. Intellectual Property Rights" },
  { id: "termination", title: "9. Account Termination" },
  { id: "warranties", title: "10. Disclaimer of Warranties" },
  { id: "liability", title: "11. Limitation of Liability" },
  { id: "indemnification", title: "12. Indemnification" },
  { id: "governing-law", title: "13. Governing Law & Jurisdiction" },
  { id: "general", title: "14. General Provisions" },
  { id: "changes", title: "15. Changes to Terms" },
  { id: "contact", title: "16. Contact Information" },
];

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState("acceptance");

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
            <Link href="/" className={`hover-text-primary ${styles.s28}`}>
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <div className={styles.s5} />
            <Link href="/" className={styles.s29}>
              <div className={styles.s6}>
                <Shield size={16} className={styles.s26} />
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
          <h1 className={styles.s15}>Terms of Service</h1>
          <p className={styles.s16}>
            Please read these terms carefully before creating a tenant
            organization or using the UniERP cloud platform.
          </p>

          <hr className={styles.s17} />

          <section id="acceptance" className={styles.s18}>
            <h2 className={styles.s19}>1. Acceptance of Terms</h2>
            <p>
              By registering an organization or accessing the platform, you
              agree to be bound by these Terms of Service and our Privacy
              Policy. If you are entering into these terms on behalf of a
              company, partnership, or other legal entity, you represent that
              you have the authority to bind such entity and its affiliates to
              these terms. If you do not have such authority or do not agree to
              these terms, you must not accept them and are prohibited from
              accessing the services.
            </p>
          </section>

          <section id="description" className={styles.s18}>
            <h2 className={styles.s19}>2. Description of Service</h2>
            <p>
              UniERP provides a modular, multi-tenant Enterprise Resource
              Planning (ERP) platform. Services include, but are not limited to,
              core ledger bookkeeping, payroll calculators, contact trackers,
              inventory status engines, and custom zero-code form templates. The
              services are offered on a software-as-a-service (SaaS)
              subscription model. We reserve the right to modify, suspend, or
              discontinue any modules or characteristics of the service at any
              time with or without prior notice.
            </p>
          </section>

          <section id="registration" className={styles.s18}>
            <h2 className={styles.s19}>3. Registration & Tenant Accounts</h2>
            <p>
              To utilize UniERP, you must create a tenant organization and set
              up a system administrator profile. Each tenant organization is
              logically isolated at the database level. You agree to:
            </p>
            <ul className={styles.s20}>
              <li>
                Provide accurate, complete, and current information during the
                signup process.
              </li>
              <li>
                Maintain the security and confidentiality of your credentials
                and administration keys.
              </li>
              <li>
                Remain fully responsible for all transactions, configurations,
                and actions conducted under your tenant workspace.
              </li>
              <li>
                Notify us immediately of any unauthorized breach of security or
                compromise of your administrator credentials.
              </li>
            </ul>
          </section>

          <section id="acceptable-use" className={styles.s18}>
            <h2 className={styles.s19}>4. Acceptable Use Policy</h2>
            <p>You agree not to use the platform to:</p>
            <ul className={styles.s20}>
              <li>
                Violate any applicable local, national, or international law or
                regulation.
              </li>
              <li>
                Upload or transmit malicious code, or attempt to gain
                unauthorized access to another tenant&apos;s workspace, our
                infrastructure, or any account not your own.
              </li>
              <li>
                Probe, scan, or test the vulnerability of the platform except
                through an authorized responsible-disclosure or
                penetration-testing engagement agreed with us in writing.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                service, including via excessive automated requests, or attempt
                to bypass rate limits or usage quotas.
              </li>
              <li>
                Reverse-engineer, decompile, or attempt to extract the source
                code of the platform, except to the extent such restriction is
                prohibited by applicable law.
              </li>
              <li>
                Use the service to store or transmit content that is unlawful,
                infringing, defamatory, or that violates the privacy or
                intellectual property rights of a third party.
              </li>
            </ul>
            <p>
              We may suspend access immediately, without prior notice, where
              necessary to protect the security or integrity of the platform or
              other tenants.
            </p>
          </section>

          <section id="billing" className={styles.s18}>
            <h2 className={styles.s19}>5. Fees, Billing, & Renewals</h2>
            <p>
              Some core modules are offered under a Free tier, including a
              full-featured evaluation period. Higher usage tiers, dedicated
              processing limits, and premium industry modules require an active
              paid subscription. Pricing is based on platform resource usage and
              subscription tier — we do not charge on a per-user basis.
            </p>
            <p className={styles.s21}>
              Subscriptions are billed in advance on a recurring monthly,
              quarterly, or annual basis depending on the plan selected. Fees
              are non-refundable except where required by applicable consumer
              protection law, or as otherwise stated at the time of purchase.
              Failure to maintain a valid payment method or settle outstanding
              invoices within the grace period disclosed in your billing
              dashboard may result in your workspace being placed into a
              read-only state or, ultimately, suspended.
            </p>
          </section>

          <section id="third-party" className={styles.s18}>
            <h2 className={styles.s19}>
              6. Third-Party Services & Integrations
            </h2>
            <p>
              The platform integrates with third-party services you may choose
              to enable, including but not limited to payment processors (e.g.
              Stripe, Razorpay), identity providers (e.g. Google, Microsoft
              Entra ID), and communication providers (email/SMS delivery,
              CAPTCHA verification). Your use of these integrations is also
              subject to that provider&apos;s own terms and privacy policy. We
              are not responsible for the acts or omissions of independent
              third-party providers, though we select and configure them with
              reasonable care.
            </p>
          </section>

          <section id="data-processing" className={styles.s18}>
            <h2 className={styles.s19}>7. Data Protection</h2>
            <p>
              Our collection and use of personal data in connection with the
              service is described in our{" "}
              <Link href="/privacy" style={{ color: "var(--color-primary)" }}>
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference. Where you
              upload personal data belonging to your own employees, customers,
              or other third parties into your tenant workspace, you are
              responsible for ensuring you have a lawful basis to do so, and for
              complying with your own obligations as a data controller under
              applicable data protection law.
            </p>
          </section>

          <section id="ip" className={styles.s18}>
            <h2 className={styles.s19}>8. Intellectual Property Rights</h2>
            <p>
              All software components, custom CSS stylesheets, design token
              architectures, layout definitions, and visual brands of UniERP are
              the exclusive property of UniERP and its licensors. You retain
              full and complete ownership of any data, records, documents, or
              files uploaded, posted, or created by your users within your
              isolated tenant workspace. You grant us only the limited license
              necessary to host, process, and display that data back to you as
              part of operating the service.
            </p>
          </section>

          <section id="termination" className={styles.s18}>
            <h2 className={styles.s19}>9. Account Termination</h2>
            <p>
              You may request full erasure of your tenant workspace and
              associated user details at any time by contacting our system
              support, or by using the self-service data export and account
              deletion options in your settings. Upon cancellation, your tenant
              data will be permanently purged from active production hosts
              within 30 calendar days, subject to any longer retention required
              by law (see our Privacy Policy). We reserve the right to suspend
              or terminate workspaces that violate this Acceptable Use Policy,
              consume excessive platform resources beyond their plan&apos;s
              allocation without upgrading, or conduct unauthorized activities.
            </p>
          </section>

          <section id="warranties" className={styles.s18}>
            <h2 className={styles.s19}>10. Disclaimer of Warranties</h2>
            <p className={styles.s22}>
              The service is provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis. We expressly disclaim all warranties of
              any kind, whether express or implied, including, but not limited
              to, the implied warranties of merchantability, fitness for a
              particular purpose, and non-infringement. We make no warranty that
              the service will be uninterrupted, timely, secure, or error-free,
              or that any specific uptime level will be maintained, except to
              the extent expressly committed in a separate service-level
              agreement.
            </p>
          </section>

          <section id="liability" className={styles.s18}>
            <h2 className={styles.s19}>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, UniERP and its
              affiliates shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of
              profits or revenues, whether incurred directly or indirectly, or
              any loss of data, use, goodwill, or other intangible losses,
              arising out of your access to or use of the platform. To the
              maximum extent permitted by law, our aggregate liability arising
              out of or relating to these Terms will not exceed the amount you
              paid us for the service in the twelve (12) months preceding the
              event giving rise to the claim. Nothing in these Terms limits
              liability that cannot be excluded or limited under applicable law
              (for example, liability for death, personal injury, or fraud).
            </p>
          </section>

          <section id="indemnification" className={styles.s18}>
            <h2 className={styles.s19}>12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless UniERP and its
              affiliates, officers, and employees from any claim, demand, loss,
              or damages, including reasonable legal fees, arising out of your
              breach of these Terms, your violation of applicable law, or the
              data you upload to your tenant workspace infringing the rights of
              a third party.
            </p>
          </section>

          <section id="governing-law" className={styles.s18}>
            <h2 className={styles.s19}>13. Governing Law & Jurisdiction</h2>
            <p>
              These Terms of Service shall be governed by, and construed in
              accordance with, the laws of the jurisdiction in which our
              corporate operations reside, without giving effect to any
              principles of conflicts of law. You agree that any dispute arising
              from these terms will be submitted to the exclusive jurisdiction
              of the state or federal courts in that region, except where
              applicable consumer protection law grants you the right to bring a
              claim in your own jurisdiction.
            </p>
          </section>

          <section id="general" className={styles.s18}>
            <h2 className={styles.s19}>14. General Provisions</h2>
            <ul className={styles.s20}>
              <li>
                <strong>Severability:</strong> If any provision of these Terms
                is held unenforceable, the remaining provisions remain in full
                force and effect.
              </li>
              <li>
                <strong>Entire Agreement:</strong> These Terms, together with
                the Privacy Policy and any order form or enterprise contract you
                have signed, constitute the entire agreement between you and
                UniERP regarding the service.
              </li>
              <li>
                <strong>Assignment:</strong> You may not assign these Terms
                without our prior written consent; we may assign these Terms in
                connection with a merger, acquisition, or sale of assets.
              </li>
              <li>
                <strong>Force Majeure:</strong> Neither party is liable for
                delays or failures caused by events beyond its reasonable
                control, including natural disasters, war, labor disputes, or
                internet/utility outages.
              </li>
              <li>
                <strong>Export Control:</strong> You agree to comply with all
                applicable export control and economic sanctions laws in your
                use of the service.
              </li>
              <li>
                <strong>No Waiver:</strong> Our failure to enforce any provision
                of these Terms is not a waiver of our right to enforce it later.
              </li>
            </ul>
          </section>

          <section id="changes" className={styles.s18}>
            <h2 className={styles.s19}>15. Changes to Terms</h2>
            <p>
              We reserve the right to update these terms from time to time to
              align with legal guidelines or operational shifts. Significant
              changes will be broadcast to organization administrators via email
              or dashboard announcements. Your continued use of the services
              after such updates constitutes explicit acceptance of the new
              terms.
            </p>
          </section>

          <section id="contact" className={styles.s18}>
            <h2 className={styles.s19}>16. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service or need to
              escalate compliance issues, please contact us at:
            </p>
            <div className={styles.s23}>
              <Mail size={20} className={styles.s27} />
              <div>
                <span className={styles.s24}>Compliance Operations</span>
                <a href="mailto:legal@unerp.dev" className={styles.s25}>
                  legal@unerp.dev
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
