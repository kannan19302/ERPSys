// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  User,
  Search,
  Menu as MenuIcon,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export interface TenantHeaderProps {
  settings?: {
    siteName?: string;
    logoUrl?: string;
    primaryColor?: string;
    themeTokens?: any;
  } | null;
  menus?: Array<{
    id: string;
    title: string;
    url: string;
    items?: Array<{ title: string; url: string }>;
  }>;
}

export function TenantHeader({ settings, menus }: TenantHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const siteName = settings?.siteName || "Enterprise Store";
  const logoUrl = settings?.logoUrl;

  const defaultNav = [
    { title: "Home", url: "/" },
    { title: "Shop", url: "/shop" },
    { title: "Blog", url: "/blog" },
    { title: "About", url: "/about" },
    { title: "Contact", url: "/contact" },
  ];

  const navLinks =
    menus && menus.length > 0
      ? menus.flatMap((m) => m.items || [{ title: m.title, url: m.url }])
      : defaultNav;

  return (
    <header className="tenant-site-header">
      <style jsx>{`
        .tenant-site-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e5e7eb;
          font-family: var(--font-body, system-ui, -apple-system, sans-serif);
        }
        .header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #111827;
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
        }
        .brand-logo-img {
          height: 36px;
          width: auto;
          object-fit: contain;
        }
        .brand-icon-fallback {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(
            135deg,
            var(--color-primary, #3b82f6),
            #1d4ed8
          );
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.1rem;
        }
        .nav-menu {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .nav-link {
          text-decoration: none;
          color: #4b5563;
          font-weight: 500;
          font-size: 0.95rem;
          transition: color 0.15s ease;
        }
        .nav-link:hover {
          color: var(--color-primary, #2563eb);
        }
        .actions-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .action-icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }
        .action-icon-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #111827;
        }
        .desk-login-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.1rem;
          border-radius: 8px;
          background: #111827;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s ease;
        }
        .desk-login-btn:hover {
          background: #1f2937;
        }
        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          color: #374151;
        }
        @media (max-width: 768px) {
          .nav-menu {
            display: none;
          }
          .mobile-toggle {
            display: block;
          }
          .mobile-drawer {
            position: absolute;
            top: 72px;
            left: 0;
            right: 0;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            padding: 1rem 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
      <div className="header-inner">
        <Link href="/" className="brand-link">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="brand-logo-img" />
          ) : (
            <div className="brand-icon-fallback">
              {siteName.substring(0, 1).toUpperCase()}
            </div>
          )}
          <span>{siteName}</span>
        </Link>

        <nav className="nav-menu">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.url} className="nav-link">
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="actions-group">
          <Link
            href="/shop"
            className="action-icon-btn"
            title="Storefront / Shop"
          >
            <ShoppingBag size={18} />
          </Link>
          <Link
            href="/apps"
            className="desk-login-btn"
            title="Sign In to ERP Desk"
          >
            <User size={16} />
            <span>ERP Desk</span>
          </Link>
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-drawer">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.url}
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.title}
            </Link>
          ))}
          <Link
            href="/apps"
            className="desk-login-btn"
            style={{ justifyContent: "center", marginTop: "0.5rem" }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <User size={16} />
            <span>ERP Desk Log In</span>
          </Link>
        </div>
      )}
    </header>
  );
}

export function TenantFooter({ settings }: { settings?: any }) {
  const siteName = settings?.siteName || "Enterprise Store";
  const year = new Date().getFullYear();

  return (
    <footer className="tenant-site-footer">
      <style jsx>{`
        .tenant-site-footer {
          background: #0f172a;
          color: #94a3b8;
          padding: 4rem 1.5rem 2rem;
          font-family: var(--font-body, system-ui, -apple-system, sans-serif);
          border-top: 1px solid #1e293b;
        }
        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr repeat(3, 1fr);
          gap: 3rem;
        }
        .footer-brand h3 {
          color: #ffffff;
          font-size: 1.25rem;
          margin: 0 0 0.75rem 0;
          font-weight: 700;
        }
        .footer-brand p {
          font-size: 0.9rem;
          line-height: 1.6;
          max-width: 320px;
        }
        .footer-col h4 {
          color: #f8fafc;
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0 0 1.25rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .footer-col a {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.15s ease;
        }
        .footer-col a:hover {
          color: #ffffff;
        }
        .footer-bottom {
          max-width: 1280px;
          margin: 3rem auto 0;
          padding-top: 2rem;
          border-top: 1px solid #1e293b;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
        }
        .studio-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #64748b;
          text-decoration: none;
        }
        .studio-badge:hover {
          color: #38bdf8;
        }
        @media (max-width: 768px) {
          .footer-inner {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
      <div className="footer-inner">
        <div className="footer-brand">
          <h3>{siteName}</h3>
          <p>
            Customizable enterprise web portal and commerce storefront powered
            by UniERP Studio.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/shop">Storefront</Link>
            </li>
            <li>
              <Link href="/blog">Blog & News</Link>
            </li>
            <li>
              <Link href="/about">About Us</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul>
            <li>
              <Link href="/contact">Contact Support</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>ERP Portal</h4>
          <ul>
            <li>
              <Link href="/apps">Staff Desk Login</Link>
            </li>
            <li>
              <Link href="/apps/builder/web/pages">Studio Page Builder</Link>
            </li>
            <li>
              <Link href="/apps/ecommerce">Product Catalog</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          © {year} {siteName}. All rights reserved.
        </div>
        <Link href="/apps/builder" className="studio-badge">
          <Sparkles size={14} />
          <span>Customized with Builder Studio</span>
        </Link>
      </div>
    </footer>
  );
}
