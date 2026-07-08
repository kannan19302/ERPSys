'use client';

import React from 'react';
import Link from 'next/link';
import { Card, PageHeader, StatusBadge } from '@unerp/ui';
import {
  BarChart3, PieChart, TrendingUp,
  DollarSign, Receipt, FileText, Calculator, Activity,
  Wallet, Scale, Eye, GitCompare, RefreshCw,
  FolderOpen, ChevronRight, CreditCard, FileSliders,
  Building2, ShoppingCart, ClipboardList,
  ShieldAlert, Calendar, Link2
} from 'lucide-react';

const groups = [
  {
    title: 'Core Accounting',
    description: 'General ledger, chart of accounts, journal entries, and period management',
    icon: <CreditCard size={20} />,
    modules: [
      { href: '/finance/advanced/chart-of-accounts', label: 'Chart of Accounts', icon: <CreditCard size={18} />, desc: 'Manage your chart of accounts, account types, and GL structure' },
      { href: '/finance/advanced/journal-entries', label: 'Journal Entries', icon: <FileSliders size={18} />, desc: 'Record, approve, and post journal entries to the general ledger' },
      { href: '/finance/advanced/financial-periods', label: 'Financial Periods', icon: <Activity size={18} />, desc: 'Period close checklist, validation checks, and opening/closing balances' },
      { href: '/finance/advanced/fixed-assets', label: 'Fixed Assets', icon: <Building2 size={18} />, desc: 'Asset register, depreciation runs, and disposal management' },
      { href: '/finance/advanced/recurring', label: 'Recurring Invoices', icon: <RefreshCw size={18} />, desc: 'Auto-generate recurring invoices based on schedules' },
      { href: '/finance/advanced/revenue-schedules', label: 'Revenue Recognition', icon: <TrendingUp size={18} />, desc: 'Deferred revenue and recognition schedules' },
    ]
  },
  {
    title: 'Payables & Treasury',
    description: 'Bank accounts, AP/AR automation, treasury management, and cash flow',
    icon: <Wallet size={20} />,
    modules: [
      { href: '/finance/advanced/bank-accounts', label: 'Bank Accounts', icon: <Wallet size={18} />, desc: 'Manage bank accounts, opening balances, and reconciliation setup' },
      { href: '/finance/advanced/ap-automation', label: 'AP Automation', icon: <ShoppingCart size={18} />, desc: 'Accounts payable workflow, invoice matching, and payment runs' },
      { href: '/finance/advanced/ar-automation', label: 'AR Automation & Dunning', icon: <ClipboardList size={18} />, desc: 'Dunning levels, automated reminders, fee escalation, and collection cadences' },
      { href: '/finance/advanced/ar-aging', label: 'AR Aging Report', icon: <BarChart3 size={18} />, desc: 'Receivables by aging bucket: Current, 1–30, 31–60, 61–90, 90+ days' },
      { href: '/finance/advanced/customer-statement', label: 'Customer Statement', icon: <FileText size={18} />, desc: 'Full invoice/payment ledger per customer for any period' },
      { href: '/finance/advanced/credit-risk', label: 'Credit Risk Management', icon: <ShieldAlert size={18} />, desc: 'Credit limits, holds, risk ratings, and utilization monitoring' },
      { href: '/finance/advanced/payment-terms', label: 'Payment Terms Templates', icon: <Calendar size={18} />, desc: 'Configure credit and discount term templates (Net 30, Net 60, 2/10 Net 30)' },
      { href: '/finance/advanced/invoice-analytics', label: 'Invoice Analytics', icon: <TrendingUp size={18} />, desc: 'Track sales trends, collection velocities, and payment behaviors' },
      { href: '/finance/advanced/bank-feeds', label: 'Bank Feeds & Connections', icon: <Link2 size={18} />, desc: 'Connect direct external bank statement feeds using Plaid/OAuth' },
      { href: '/finance/advanced/bank-recon', label: 'Bank Statement Auto-Match', icon: <GitCompare size={18} />, desc: 'Match Statement transfers to General Ledger entries automatically' },
      { href: '/finance/advanced/treasury', label: 'Treasury & Investments', icon: <BarChart3 size={18} />, desc: 'Treasury operations, investment tracking, and liquidity management' },
      { href: '/finance/advanced/reconciliations', label: 'Bank Reconciliation', icon: <GitCompare size={18} />, desc: 'Statement import, auto-matching, and reconciliation reports' },
      { href: '/finance/advanced/expense-reports', label: 'Expense Management', icon: <Receipt size={18} />, desc: 'Employee expense reports, approvals, and reimbursements' },
      { href: '/finance/advanced/cash-position', label: 'Cash Position', icon: <DollarSign size={18} />, desc: 'Real-time cash position and projected cash flow' },
      { href: '/finance/advanced/cash-flow-forecast', label: 'Cash Flow Forecast', icon: <Activity size={18} />, desc: '3-month rolling cash flow forecast' },
    ]
  },
  {
    title: 'Tax & Compliance',
    description: 'Tax computation, filing, audit trails, and account reconciliation',
    icon: <ShieldAlert size={20} />,
    modules: [
      { href: '/finance/advanced/tax-engine', label: 'Tax Engine', icon: <Calculator size={18} />, desc: 'Tax rules, components, and auto-computation engine' },
      { href: '/finance/advanced/tax-filing', label: 'Tax Filing', icon: <FileText size={18} />, desc: 'Auto-compute VAT/GST returns from transactions' },
      { href: '/finance/advanced/tax-filing-summary', label: 'Tax Filing Summary', icon: <ShieldAlert size={18} />, desc: 'Computed tax return liabilities and compliance filings dashboard' },
      { href: '/finance/advanced/audit-logs', label: 'Finance Audit Trail', icon: <Eye size={18} />, desc: 'Track changes to financial records and compliance logs' },
      { href: '/finance/advanced/account-reconciliation', label: 'Account Reconciliation', icon: <GitCompare size={18} />, desc: 'Sub-ledger to GL matching and account validation' },
    ]
  },
  {
    title: 'Planning & Reporting',
    description: 'Budgeting, financial reports, multi-currency, and consolidated statements',
    icon: <PieChart size={20} />,
    modules: [
      { href: '/finance/advanced/budgeting', label: 'Budgeting & Planning', icon: <FileText size={18} />, desc: 'Compare budgets with actuals, variance analysis' },
      { href: '/finance/advanced/reports', label: 'Financial Reports', icon: <FolderOpen size={18} />, desc: 'P&L, Balance Sheet, Cash Flow, Trial Balance' },
      { href: '/finance/advanced/exchange-rates', label: 'Multi-Currency', icon: <DollarSign size={18} />, desc: 'Exchange rates, currency conversion, revaluation' },
      { href: '/finance/advanced/financial-ratios', label: 'Financial Ratios', icon: <Scale size={18} />, desc: 'Current ratio, ROI, debt-to-equity analysis' },
      { href: '/finance/advanced/consolidation', label: 'Consolidation', icon: <PieChart size={18} />, desc: 'Multi-entity consolidated financial statements' },
      { href: '/finance/advanced/intercompany/netting', label: 'Intercompany Netting Match', icon: <Link2 size={18} />, desc: 'Map internal receivables (AR) and payables (AP) transactions' },
      { href: '/finance/advanced/intercompany/eliminations', label: 'Intercompany Eliminations Ledger', icon: <Scale size={18} />, desc: 'Consolidated elimination entry postings and compliance logs' },
    ]
  }
];

export default function AdvancedFinancePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Advanced Finance"
        description="Financial operations, analytics, and compliance tools"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance', href: '/finance' }, { label: 'Advanced' }]}
      />

      {groups.map((group) => (
        <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1) 0' }}>
            <div style={{ color: 'var(--color-primary)' }}>
              {group.icon}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{group.title}</h2>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{group.description}</p>
            </div>
          </div>

          <div className="frappe-grid-3">
            {group.modules.map((mod) => (
              <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
                <Card padding="md" className="hover:shadow-md transition-all hover:border-primary/30" style={{ cursor: 'pointer', border: '1px solid var(--color-border)', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                    <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', flexShrink: 0 }}>
                      {mod.icon}
                    </div>
                    <div style={{ flex: '1', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.label}</h3>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', margin: 0 }}>{mod.desc}</p>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: 'var(--space-1)' }} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}