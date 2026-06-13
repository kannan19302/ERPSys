'use client';

import React from 'react';
import Link from 'next/link';
import { Card, PageHeader, StatusBadge } from '@unerp/ui';
import {
  BarChart3, PieChart, TrendingUp,
  DollarSign, Receipt, FileText, Calculator, Activity,
  Wallet, Scale, Eye, GitCompare, RefreshCw, Shield,
  FolderOpen, ChevronRight
} from 'lucide-react';

const modules = [
  // Tier 1
  { href: '/finance/advanced/reports', label: 'Financial Reports', icon: <BarChart3 size={18} />, desc: 'P&L, Balance Sheet, Cash Flow, Trial Balance', badge: 'TIER 1' },
  
  // Tier 2
  { href: '/finance/advanced/budgeting', label: 'Budget vs Actuals', icon: <FileText size={18} />, desc: 'Compare budgets with actuals, variance analysis', badge: 'TIER 2' },
  { href: '/finance/advanced/exchange-rates', label: 'Multi-Currency', icon: <DollarSign size={18} />, desc: 'Exchange rates, currency conversion', badge: 'TIER 2' },
  { href: '/finance/advanced/tax-engine', label: 'Tax Computation', icon: <Calculator size={18} />, desc: 'Tax rules, components, auto-computation', badge: 'TIER 2' },
  { href: '/finance/advanced/recurring', label: 'Recurring Invoices', icon: <RefreshCw size={18} />, desc: 'Auto-generate recurring invoices', badge: 'TIER 2' },
  { href: '/finance/advanced/reconciliations', label: 'Bank Reconciliation', icon: <GitCompare size={18} />, desc: 'Statement import, auto-matching', badge: 'TIER 2' },

  // Tier 3
  { href: '/finance/advanced/expense-reports', label: 'Expense Management', icon: <Receipt size={18} />, desc: 'Employee reports, approvals, reimbursements', badge: 'TIER 3' },
  { href: '/finance/advanced/revenue-schedules', label: 'Revenue Recognition', icon: <TrendingUp size={18} />, desc: 'Deferred revenue, recognition schedules', badge: 'TIER 3' },
  { href: '/finance/advanced/fixed-assets', label: 'Fixed Assets', icon: <FolderOpen size={18} />, desc: 'Asset register, depreciation run', badge: 'TIER 3' },
  { href: '/finance/advanced/financial-periods', label: 'Period Close', icon: <Shield size={18} />, desc: 'Close checklist, validation checks', badge: 'TIER 3' },

  // Tier 4
  { href: '/finance/advanced/cash-position', label: 'Cash Position', icon: <Wallet size={18} />, desc: 'Real-time cash, projected cash flow', badge: 'TIER 4' },
  { href: '/finance/advanced/financial-ratios', label: 'Financial Ratios', icon: <Scale size={18} />, desc: 'Current ratio, ROI, debt-to-equity', badge: 'TIER 4' },
  { href: '/finance/advanced/cash-flow-forecast', label: 'Cash Flow Forecast', icon: <Activity size={18} />, desc: '3-month rolling forecast', badge: 'TIER 4' },
  { href: '/finance/advanced/audit-logs', label: 'Finance Audit Trail', icon: <Eye size={18} />, desc: 'Track changes to financial records', badge: 'TIER 4' },

  // Tier 5
  { href: '/finance/advanced/tax-filing', label: 'VAT/GST Returns', icon: <FileText size={18} />, desc: 'Auto-compute from transactions', badge: 'TIER 5' },
  { href: '/finance/advanced/account-reconciliation', label: 'Account Reconciliation', icon: <GitCompare size={18} />, desc: 'Sub-ledger to GL matching', badge: 'TIER 5' },
  { href: '/finance/advanced/consolidation', label: 'Consolidation', icon: <PieChart size={18} />, desc: 'Multi-entity consolidated statements', badge: 'TIER 5' },
];

export default function AdvancedFinancePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Advanced Finance"
        description="Financial operations, analytics, and compliance tools"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance', href: '/finance' }, { label: 'Advanced' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <Link key={mod.href} href={mod.href} className="no-underline">
            <Card padding="md" className="hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-primary/30 h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/5 text-primary flex-shrink-0">
                  {mod.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold m-0 truncate">{mod.label}</h3>
                    <StatusBadge status={mod.badge} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 m-0">{mod.desc}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}