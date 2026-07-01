'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield, ChevronRight, Menu, X, Check,
  CreditCard, Users, BarChart3, Package, Hammer, Activity,
  Heart, GraduationCap, Building2, Wrench, Store,
  Zap, ArrowRight, Star, Sun, Moon, Play, RefreshCw, Plus
} from 'lucide-react';
import './landing.css';

/* ═══════════════════════════════════════════════════════════════
   Landing Page — UniERP Revamp
   Interactive SaaS Landing Page with Odoo/ERPNext Aesthetics
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
  { icon: Users, title: 'CRM & Sales', desc: 'Contact management, deal pipelines, quotations, sales orders, and revenue analytics.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
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

const PLAYGROUND_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'finance', label: 'Finance & Ledger', icon: CreditCard },
  { id: 'hr', label: 'HR & Directory', icon: Users },
  { id: 'crm', label: 'CRM Sales Board', icon: Activity },
  { id: 'inventory', label: 'Inventory Control', icon: Package },
  { id: 'builder', label: 'Builder Studio', icon: Zap },
];

const DASHBOARD_CHART_DATA = [
  { month: 'Jan', value: 95 },
  { month: 'Feb', value: 110 },
  { month: 'Mar', value: 105 },
  { month: 'Apr', value: 125 },
  { month: 'May', value: 130 },
  { month: 'Jun', value: 142 },
  { month: 'Jul', value: 138 },
  { month: 'Aug', value: 155 },
  { month: 'Sep', value: 162 },
  { month: 'Oct', value: 158 },
  { month: 'Nov', value: 175 },
  { month: 'Dec', value: 190 },
];

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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Interactive states for Playground
  const [playgroundTab, setPlaygroundTab] = useState('dashboard');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const [financeInvoices, setFinanceInvoices] = useState([
    { id: 'INV-2026-001', customer: 'Acme Corp', amount: 4500, status: 'PAID' },
    { id: 'INV-2026-002', customer: 'Globex Inc', amount: 8200, status: 'PAID' },
    { id: 'INV-2026-003', customer: 'Initech', amount: 2100, status: 'OVERDUE' },
    { id: 'INV-2026-004', customer: 'Stark Ind', amount: 12000, status: 'DRAFT' },
  ]);

  const [employees, setEmployees] = useState([
    { name: 'Sarah Chen', role: 'COO', dept: 'Operations', status: 'Present' },
    { name: 'John Doe', role: 'Engineer', dept: 'Engineering', status: 'Present' },
    { name: 'Emma Watson', role: 'Designer', dept: 'Product', status: 'Away' },
    { name: 'Alex Mercer', role: 'Recruiter', dept: 'HR', status: 'On Leave' },
  ]);

  const [crmDeals, setCrmDeals] = useState({
    leads: [{ company: 'Wayne Enterprises', value: 50000 }, { company: 'Cyberdyne', value: 35000 }],
    contacted: [{ company: 'Hooli Corp', value: 20000 }],
    proposal: [{ company: 'Pied Piper', value: 15000 }],
    won: [{ company: 'Globex Partners', value: 80000 }]
  });
  const [crmNotification, setCrmNotification] = useState('');

  const [inventoryItems, setInventoryItems] = useState([
    { sku: 'SKU-IND-502', name: 'Industrial Steel Bracket', warehouse: 'WH-Main', qty: 4200, status: 'In Stock' },
    { sku: 'SKU-CPU-801', name: 'Micro-Controller Core', warehouse: 'WH-Main', qty: 120, status: 'Low Stock' },
    { sku: 'SKU-CAB-304', name: 'Copper Coaxial Cable', warehouse: 'WH-Transit', qty: 800, status: 'In Stock' },
    { sku: 'SKU-SEN-009', name: 'Proximity Sensor', warehouse: 'WH-Main', qty: 0, status: 'Out of Stock' },
  ]);
  const [inventoryLog, setInventoryLog] = useState('');

  const [builderFields, setBuilderFields] = useState([
    { name: 'Vendor Name', type: 'Text' },
    { name: 'Expected Delivery Date', type: 'Date' },
  ]);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number | null>(null);
  const [isSimulatingWorkflow, setIsSimulatingWorkflow] = useState(false);

  // Pricing calculator states
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [teamSize, setTeamSize] = useState(10);

  useRevealObserver();

  // Scroll listener for sticky nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Theme Sync on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

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

  // Playround Handlers
  const addSimulatedInvoice = () => {
    const nextId = `INV-2026-00${financeInvoices.length + 1}`;
    const customers = ['Wayne Ent.', 'Oscorp Corp', 'Cyberdyne Co', 'Umbrella Inc'];
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)] || 'New Client';
    const randomAmount = Math.floor(Math.random() * 8 + 2) * 1250;
    setFinanceInvoices([
      ...financeInvoices,
      { id: nextId, customer: randomCustomer, amount: randomAmount, status: 'DRAFT' }
    ]);
  };

  const toggleEmployeeStatus = (index: number) => {
    const statuses = ['Present', 'Away', 'On Leave'];
    setEmployees(prev => prev.map((emp, i) => {
      if (i === index) {
        const nextIdx = (statuses.indexOf(emp.status) + 1) % statuses.length;
        const nextStatus = statuses[nextIdx] || 'Present';
        return { ...emp, status: nextStatus };
      }
      return emp;
    }));
  };

  const simulateDealWon = () => {
    if (crmDeals.proposal.length === 0) {
      setCrmDeals(prev => ({
        ...prev,
        proposal: [{ company: 'Pied Piper', value: 15000 }],
      }));
      setCrmNotification('Reset pipeline state.');
      setTimeout(() => setCrmNotification(''), 3000);
      return;
    }
    const targetDeal = crmDeals.proposal[0]!;
    setCrmDeals(prev => ({
      ...prev,
      proposal: [],
      won: [...prev.won, targetDeal]
    }));
    setCrmNotification(`Success! ${targetDeal.company} ($${targetDeal.value.toLocaleString()}) moved to WON.`);
    setTimeout(() => setCrmNotification(''), 4000);
  };

  const triggerInventoryReorder = () => {
    let reorderedCount = 0;
    setInventoryItems(prev => prev.map(item => {
      if (item.status === 'Low Stock' || item.status === 'Out of Stock') {
        reorderedCount++;
        return { ...item, qty: item.status === 'Low Stock' ? 2500 : 1200, status: 'In Stock' };
      }
      return item;
    }));
    setInventoryLog(`Restocked ${reorderedCount} depleted items automatically via webhook reorder workflow.`);
    setTimeout(() => setInventoryLog(''), 4000);
  };

  const addBuilderField = (type: string) => {
    const fieldNames: Record<string, string> = {
      'Signature': 'Authorized Signature',
      'Attachment': 'Quote File Upload',
      'Number': 'Requisition Amount',
    };
    const name = fieldNames[type] || 'Custom Field';
    setBuilderFields([...builderFields, { name, type }]);
  };

  const runWorkflowSimulation = () => {
    if (isSimulatingWorkflow) return;
    setIsSimulatingWorkflow(true);
    setActiveWorkflowStep(0);
    const stepsCount = 4;
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= stepsCount) {
        clearInterval(interval);
        setActiveWorkflowStep(null);
        setIsSimulatingWorkflow(false);
      } else {
        setActiveWorkflowStep(currentStep);
      }
    }, 1200);
  };

  // Pricing calculations
  const isStarterDisabled = teamSize > 5;
  const professionalUnitPrice = billingPeriod === 'annual' ? 39 : 49;
  const professionalTotal = teamSize * professionalUnitPrice;

  const industry = INDUSTRIES[activeIndustry];

  return (
    <div className="landing-root">
      {/* ── 1. Floating Glassmorphism Navbar ── */}
      <div className="landing-nav-wrapper">
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
            <button
              onClick={toggleTheme}
              className="landing-theme-toggle-btn"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
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
      </div>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={() => { toggleTheme(); setMobileOpen(false); }}
            className="landing-theme-toggle-btn"
            style={{ width: 'fit-content', alignSelf: 'center', padding: '12px' }}
          >
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <Link href="/login" onClick={() => setMobileOpen(false)} style={{ textAlign: 'center' }}>Sign In</Link>
          <Link href="/register" className="landing-btn-primary" onClick={() => setMobileOpen(false)} style={{ textAlign: 'center' }}>
            Get Started
          </Link>
        </div>
      </div>

      {/* ── 2. Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-glow landing-hero-glow-1" />
        <div className="landing-hero-glow landing-hero-glow-2" />

        <div className="landing-hero-badge">
          <Zap size={14} />
          <span>Next-Gen Enterprise Engine</span>
        </div>

        <h1>
          Run Your Entire Business{' '}
          <span className="landing-hero-gradient-text">On a Composable Core</span>
        </h1>

        <p>
          A unified, multi-tenant ERP platform for scaling operations.
          Over 25 modules spanning Finance, HR, CRM, Inventory, and Manufacturing — fully modular and integrated.
        </p>

        <div className="landing-hero-ctas">
          <Link href="/register" className="landing-btn-primary">
            Start Free <ArrowRight size={16} />
          </Link>
          <a href="#playground" className="landing-btn-outline" onClick={(e) => handleAnchorClick(e, '#playground')}>
            Try Live Demo
          </a>
        </div>

        <div className="landing-hero-stats">
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">25+</div>
            <div className="landing-hero-stat-label">Modules</div>
          </div>
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">99.99%</div>
            <div className="landing-hero-stat-label">Uptime</div>
          </div>
          <div className="landing-hero-stat">
            <div className="landing-hero-stat-value">10K+</div>
            <div className="landing-hero-stat-label">Companies</div>
          </div>
        </div>

        {/* ── Dashboard Playground Console ── */}
        <div className="landing-preview" id="playground">
          <div className="landing-preview-frame">
            <div className="landing-preview-topbar">
              <div className="landing-preview-dot" style={{ background: '#ff5f57' }} />
              <div className="landing-preview-dot" style={{ background: '#febc2e' }} />
              <div className="landing-preview-dot" style={{ background: '#28c840' }} />
              <span className="landing-preview-topbar-url">
                localhost:3000/apps/studio
              </span>
            </div>
            
            <div className="landing-preview-body">
              {/* Interactive Sidebar */}
              <div className="landing-preview-sidebar">
                <div className="landing-preview-sidebar-title">Modules</div>
                {PLAYGROUND_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={`landing-preview-sidebar-item${playgroundTab === tab.id ? ' active' : ''}`}
                      onClick={() => setPlaygroundTab(tab.id)}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Content Pane */}
              <div className="landing-preview-content">
                {/* ── A. Dashboard Pane ── */}
                {playgroundTab === 'dashboard' && (
                  <div className="playground-tab-pane">
                    <div className="playground-pane-header">
                      <h3>Enterprise Command Center</h3>
                      <span className="playground-badge">Real-Time</span>
                    </div>
                    <div className="landing-preview-cards">
                      {[
                        { label: 'Monthly Revenue', value: '$142,380', change: '+12.4%', color: 'var(--color-primary)' },
                        { label: 'Active Users', value: '1,280', change: '+8.3%', color: 'var(--color-success)' },
                        { label: 'Procurement RFQs', value: '47', change: '-2.1%', color: 'var(--color-warning)' },
                        { label: 'Net Yield', value: '98.6%', change: '+1.5%', color: 'var(--color-info)' },
                      ].map((card) => (
                        <div key={card.label} className="landing-preview-card">
                          <div className="landing-preview-card-label">{card.label}</div>
                          <div className="landing-preview-card-value" style={{ color: card.color }}>{card.value}</div>
                          <div className="landing-preview-card-change">{card.change} vs last month</div>
                        </div>
                      ))}
                    </div>
                    <div className="landing-preview-chart">
                      <div className="chart-header">
                        <span>Revenue Growth Trend (2026)</span>
                        {hoveredBar !== null && (
                          <span className="chart-tooltip">
                            {DASHBOARD_CHART_DATA[hoveredBar]?.month}: ${DASHBOARD_CHART_DATA[hoveredBar]?.value}K
                          </span>
                        )}
                      </div>
                      <div className="landing-preview-bars">
                        {DASHBOARD_CHART_DATA.map((bar, i) => (
                          <div
                            key={i}
                            className="landing-preview-bar-wrapper"
                            onMouseEnter={() => setHoveredBar(i)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <div className="landing-preview-bar" style={{ height: `${(bar.value / 200) * 100}%` }} />
                            <span className="bar-axis-label">{bar.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── B. Finance Pane ── */}
                {playgroundTab === 'finance' && (
                  <div className="playground-tab-pane">
                    <div className="playground-pane-header">
                      <h3>Finance & Double-Entry Ledger</h3>
                      <button className="playground-action-btn" onClick={addSimulatedInvoice}>
                        <Plus size={14} /> Create Invoice
                      </button>
                    </div>
                    <div className="playground-table-container">
                      <table className="playground-table">
                        <thead>
                          <tr>
                            <th>Invoice ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financeInvoices.map((inv) => (
                            <tr key={inv.id}>
                              <td className="font-mono">{inv.id}</td>
                              <td>{inv.customer}</td>
                              <td>${inv.amount.toLocaleString()}</td>
                              <td>
                                <span className={`status-badge ${inv.status.toLowerCase()}`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="playground-ledger-balance">
                      <div className="ledger-block">
                        <span className="label">Total Debit Accounts</span>
                        <span className="value">$26,800.00</span>
                      </div>
                      <div className="ledger-block">
                        <span className="label">Total Credit Accounts</span>
                        <span className="value">$26,800.00</span>
                      </div>
                      <div className="ledger-status success">
                        <Check size={14} /> Trial Balance Verified
                      </div>
                    </div>
                  </div>
                )}

                {/* ── C. HR Pane ── */}
                {playgroundTab === 'hr' && (
                  <div className="playground-tab-pane">
                    <div className="playground-pane-header">
                      <h3>Employee Directory & Attendance</h3>
                      <p className="subtitle">Click any status to toggle live attendance state.</p>
                    </div>
                    <div className="playground-grid-2">
                      {employees.map((emp, index) => (
                        <div key={emp.name} className="playground-employee-card">
                          <div className="avatar" style={{ background: `var(--color-primary-light)` }}>
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="details">
                            <h4>{emp.name}</h4>
                            <p>{emp.role} • <span className="dept-tag">{emp.dept}</span></p>
                          </div>
                          <button
                            className={`attendance-toggle ${emp.status.toLowerCase().replace(' ', '-')}`}
                            onClick={() => toggleEmployeeStatus(index)}
                          >
                            {emp.status}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── D. CRM Pane ── */}
                {playgroundTab === 'crm' && (
                  <div className="playground-tab-pane">
                    <div className="playground-pane-header">
                      <h3>Active Sales pipeline</h3>
                      <button className="playground-action-btn" onClick={simulateDealWon}>
                        <RefreshCw size={14} /> Simulate Deal Won
                      </button>
                    </div>
                    {crmNotification && (
                      <div className="playground-notification success">{crmNotification}</div>
                    )}
                    <div className="playground-kanban-board">
                      {/* Leads Column */}
                      <div className="kanban-col">
                        <div className="col-header">Leads ({crmDeals.leads.length})</div>
                        {crmDeals.leads.map((deal) => (
                          <div key={deal.company} className="kanban-card">
                            <h5>{deal.company}</h5>
                            <span className="value">${deal.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      {/* Contacted Column */}
                      <div className="kanban-col">
                        <div className="col-header">Contacted ({crmDeals.contacted.length})</div>
                        {crmDeals.contacted.map((deal) => (
                          <div key={deal.company} className="kanban-card">
                            <h5>{deal.company}</h5>
                            <span className="value">${deal.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      {/* Proposal Column */}
                      <div className="kanban-col">
                        <div className="col-header">Proposal ({crmDeals.proposal.length})</div>
                        {crmDeals.proposal.map((deal) => (
                          <div key={deal.company} className="kanban-card highlight">
                            <h5>{deal.company}</h5>
                            <span className="value">${deal.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      {/* Won Column */}
                      <div className="kanban-col">
                        <div className="col-header">Won ({crmDeals.won.length})</div>
                        {crmDeals.won.map((deal) => (
                          <div key={deal.company} className="kanban-card won">
                            <h5>{deal.company}</h5>
                            <span className="value">${deal.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── E. Inventory Pane ── */}
                {playgroundTab === 'inventory' && (
                  <div className="playground-tab-pane">
                    <div className="playground-pane-header">
                      <h3>Inventory & Stock Reorder Points</h3>
                      <button className="playground-action-btn" onClick={triggerInventoryReorder}>
                        <RefreshCw size={14} /> Auto-Reorder Items
                      </button>
                    </div>
                    {inventoryLog && (
                      <div className="playground-notification warning">{inventoryLog}</div>
                    )}
                    <div className="playground-table-container">
                      <table className="playground-table">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Warehouse</th>
                            <th>Qty</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryItems.map((item) => (
                            <tr key={item.sku}>
                              <td className="font-mono">{item.sku}</td>
                              <td>{item.name}</td>
                              <td>{item.warehouse}</td>
                              <td>{item.qty.toLocaleString()} units</td>
                              <td>
                                <span className={`status-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── F. Builder Studio Pane ── */}
                {playgroundTab === 'builder' && (
                  <div className="playground-tab-pane">
                    <div className="playground-pane-header">
                      <h3>Zero-Code Builder & Flow Automation</h3>
                      <button
                        className="playground-action-btn primary"
                        onClick={runWorkflowSimulation}
                        disabled={isSimulatingWorkflow}
                      >
                        <Play size={14} /> {isSimulatingWorkflow ? 'Running...' : 'Run Simulation'}
                      </button>
                    </div>
                    <div className="playground-grid-2 gap-4">
                      {/* Left: Form Canvas */}
                      <div className="playground-builder-canvas">
                        <h4>Visual Form Canvas</h4>
                        <div className="canvas-elements">
                          {builderFields.map((field, i) => (
                            <div key={i} className="canvas-field">
                              <label>{field.name}</label>
                              <input
                                type="text"
                                placeholder={`Simulated ${field.type} input...`}
                                disabled
                              />
                            </div>
                          ))}
                        </div>
                        <div className="builder-add-controls">
                          <span>Add Field:</span>
                          <button onClick={() => addBuilderField('Number')}>+ Number</button>
                          <button onClick={() => addBuilderField('Signature')}>+ Signature</button>
                          <button onClick={() => addBuilderField('Attachment')}>+ File Upload</button>
                        </div>
                      </div>

                      {/* Right: Flow Automation */}
                      <div className="playground-builder-flow">
                        <h4>Automation Workflows</h4>
                        <div className="flow-steps">
                          {[
                            '1. Purchase Requisition Submitted',
                            '2. Auto-Check Budget Thresholds',
                            '3. Routing to VP for Approval (> $10k)',
                            '4. Generate ERP Purchase Order'
                          ].map((step, idx) => (
                            <div
                              key={idx}
                              className={`flow-step-node${activeWorkflowStep === idx ? ' active' : ''}${activeWorkflowStep !== null && idx < activeWorkflowStep ? ' completed' : ''}`}
                            >
                              <div className="node-indicator" />
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Logo Cloud ── */}
      <section className="landing-logos">
        <div className="landing-logos-title">Empowering teams at modern corporations</div>
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
            <div className="landing-section-eyebrow">Enterprise Core</div>
            <h2 className="landing-section-title">Everything You Need, Tightly Integrated</h2>
            <p className="landing-section-desc">
              All essential modules are engineered on a shared architecture. No fragile integrations, unified database records, and native cross-module workflows.
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
            <div className="landing-section-eyebrow">Industry Configurations</div>
            <h2 className="landing-section-title">Built For Specialized Verticals</h2>
            <p className="landing-section-desc">
              Get running in minutes with templates designed for Healthcare, Education, Real Estate, Field Service, and POS.
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
                <div className="visual-header-title">
                  {industry.label} Administration Dashboard
                </div>
                <div className="landing-industry-mockup-row">
                  {industry.metrics.map((m) => (
                    <div key={m.label} className="landing-industry-mockup-card">
                      <h4>{m.label}</h4>
                      <div className="value">{m.value}</div>
                    </div>
                  ))}
                </div>
                <div className="simulated-chart-container">
                  {[45, 60, 35, 80, 55, 70, 90, 50, 75, 65].map((h, i) => (
                    <div
                      key={i}
                      className="simulated-chart-bar"
                      style={{
                        height: `${h}%`,
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
            <div className="landing-section-eyebrow">Onboarding</div>
            <h2 className="landing-section-title">Simple 3-Step Setup</h2>
            <p className="landing-section-desc">
              Forget years of ERP consultancies. Deploy your own secure organization workspace instantly.
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
            <div className="landing-section-eyebrow">Client Feedback</div>
            <h2 className="landing-section-title">Loved by Operators Worldwide</h2>
            <p className="landing-section-desc">
              Here is what administrators, builders, and CFOs say about migrating to UniERP.
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

      {/* ── 9. Pricing Section with Dynamic Calculator ── */}
      <section className="landing-section landing-section-alt" id="pricing">
        <div className="landing-container">
          <div className="landing-section-header landing-reveal">
            <div className="landing-section-eyebrow">Flexible Costing</div>
            <h2 className="landing-section-title">Simple, Interactive Pricing</h2>
            <p className="landing-section-desc">
              Calculate standard plan pricing based on your active organization size.
            </p>
          </div>

          {/* Pricing Calculator Controllers */}
          <div className="pricing-calculator-controls landing-reveal">
            <div className="billing-period-toggle">
              <button
                className={billingPeriod === 'monthly' ? 'active' : ''}
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly Billing
              </button>
              <button
                className={billingPeriod === 'annual' ? 'active' : ''}
                onClick={() => setBillingPeriod('annual')}
              >
                Annual Billing <span className="discount-tag">Save 20%</span>
              </button>
            </div>

            <div className="team-size-slider-group">
              <div className="slider-header">
                <span>Active Workspace Users:</span>
                <span className="team-count">{teamSize} users</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="team-size-slider"
              />
            </div>
          </div>

          <div className="landing-pricing-grid">
            {/* Card 1: Starter */}
            <div className={`landing-pricing-card${isStarterDisabled ? ' disabled' : ''} landing-reveal`}>
              <div className="landing-pricing-name">Starter</div>
              <div className="landing-pricing-desc">For small teams getting started</div>
              <div className="landing-pricing-price">
                <span className="landing-pricing-amount">Free</span>
                <span className="landing-pricing-period">up to 5 users</span>
              </div>
              {isStarterDisabled && (
                <div className="plan-alert-badge">Exceeded maximum 5-user limit</div>
              )}
              <ul className="landing-pricing-features">
                <li><Check size={16} className="landing-pricing-check" /> Up to 5 users</li>
                <li><Check size={16} className="landing-pricing-check" /> 3 core modules</li>
                <li><Check size={16} className="landing-pricing-check" /> Community support</li>
                <li><Check size={16} className="landing-pricing-check" /> 1 GB cloud storage</li>
              </ul>
              <Link
                href="/register?plan=starter"
                className={`landing-pricing-btn landing-btn-outline${isStarterDisabled ? ' pointer-events-none opacity-50' : ''}`}
              >
                Get Started Free
              </Link>
            </div>

            {/* Card 2: Professional */}
            <div className="landing-pricing-card featured landing-reveal">
              <div className="landing-pricing-badge">Recommended</div>
              <div className="landing-pricing-name">Professional</div>
              <div className="landing-pricing-desc">For growing organizations of any scale</div>
              <div className="landing-pricing-price">
                <span className="landing-pricing-amount">${professionalUnitPrice}</span>
                <span className="landing-pricing-period">/user/mo</span>
              </div>
              <div className="total-pricing-display">
                Estimated Total: <strong>${professionalTotal.toLocaleString()}/month</strong>
              </div>
              <ul className="landing-pricing-features">
                <li><Check size={16} className="landing-pricing-check" /> All 25+ business modules</li>
                <li><Check size={16} className="landing-pricing-check" /> Zero-Code Builder Studio</li>
                <li><Check size={16} className="landing-pricing-check" /> Unlimited workflow automations</li>
                <li><Check size={16} className="landing-pricing-check" /> 50 GB cloud storage</li>
                <li><Check size={16} className="landing-pricing-check" /> Standard APIs & webhooks</li>
                <li><Check size={16} className="landing-pricing-check" /> 24/7 priority support</li>
              </ul>
              <Link
                href={`/register?plan=professional&users=${teamSize}&period=${billingPeriod}`}
                className="landing-pricing-btn landing-btn-primary"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Card 3: Enterprise */}
            <div className="landing-pricing-card landing-reveal">
              <div className="landing-pricing-name">Enterprise</div>
              <div className="landing-pricing-desc">For large-scale compliance and operations</div>
              <div className="landing-pricing-price">
                <span className="landing-pricing-amount">Custom</span>
                <span className="landing-pricing-period">contact sales</span>
              </div>
              <div className="total-pricing-display">
                {teamSize >= 50 ? (
                  <span className="text-success-text">Perfect fit for your organization size!</span>
                ) : (
                  <span>For larger enterprise compliance needs.</span>
                )}
              </div>
              <ul className="landing-pricing-features">
                <li><Check size={16} className="landing-pricing-check" /> Everything in Professional</li>
                <li><Check size={16} className="landing-pricing-check" /> Multi-Tenant RLS compliance audit</li>
                <li><Check size={16} className="landing-pricing-check" /> Dedicated hosting / On-premise options</li>
                <li><Check size={16} className="landing-pricing-check" /> Custom database integration consulting</li>
                <li><Check size={16} className="landing-pricing-check" /> SLA guarantee contract</li>
              </ul>
              <Link
                href="/register?plan=enterprise"
                className="landing-pricing-btn landing-btn-outline"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. CTA Banner ── */}
      <section className="landing-cta-banner">
        <div className="landing-container landing-reveal">
          <h2>Deploy Your Composable ERP Workspace Today</h2>
          <p>
            Join modern corporations running accounting, personnel directory, customer engagement, and inventory logistics under one dashboard.
          </p>
          <Link href="/register" className="landing-btn-primary">
            Create Organization Now <ArrowRight size={18} />
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
              An open-source, multi-tenant Enterprise Resource Planning application.
              Engineered for speed, customizability, and modular growth.
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
