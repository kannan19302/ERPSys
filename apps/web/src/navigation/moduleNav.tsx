import React from 'react';
import {
  Activity, Award, BarChart3, Bell, BookOpen, Box, Brain, Briefcase, Building, Building2,
  Calendar, CalendarDays, CheckSquare, ClipboardCheck, ClipboardList, Clock,
  Code2, Coffee, Cpu, CreditCard, Database, DollarSign, ExternalLink, Eye,
  FileCode2, FileSliders, FileText, FolderOpen, GitFork, Globe, GraduationCap, Hammer,
  HardDrive, HelpCircle, History, Home, Image, Inbox, Key, Layers, LayoutDashboard,
  LayoutGrid, Mail, MapPin, MessageSquare, Monitor, Package, Percent, PieChart, Play,
  Plug, QrCode, Receipt, RefreshCw, Scale, Send, Server, Settings, Shield, ShieldAlert,
  ShieldCheck, ShoppingCart, Smartphone, Smile, Star, Store, Target, Trash2, TrendingUp, Truck,
  Upload, User as UserIcon, UserMinus, UserPlus, Users, Video, Wallet, Warehouse,
  Workflow, Wrench, Zap, Link, GitBranch, Calculator, AlertTriangle, Phone, RotateCcw,
} from 'lucide-react';
import type { SidebarItem } from './types';
import { getModuleDescriptor } from '@unerp/shared/module-registry';
import type { NavItem as DescriptorNavItem } from '@unerp/shared/module-registry';
import { resolveIcon } from './iconMap';
import './descriptors';

/** Reads the same `localStorage` shape the legacy `/settings` branch checks,
 * so descriptor `visibility` predicates get an equivalent context. */
function readNavContext(): { role: string; isSuperAdmin: boolean; installedSlugs: string[] } {
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let role = '';
  let isSuperAdmin = false;
  if (userJson) {
    try {
      const u = JSON.parse(userJson);
      role = u.role || '';
      isSuperAdmin = u.role === 'SUPER_ADMIN' || u.email === 'admin@uni-erp.com';
    } catch { /* ignore malformed cached user */ }
  }
  return { role, isSuperAdmin, installedSlugs: [] };
}

/** Converts a framework-agnostic descriptor `NavItem` (string icon name) into
 * the `SidebarItem` shape the sidebar renderer expects (icon component). */
function toSidebarItems(items: DescriptorNavItem[]): SidebarItem[] {
  return items.map((item) => ({
    name: item.label,
    href: item.href,
    icon: item.icon ? resolveIcon(item.icon) : undefined,
    isHeader: item.isHeader,
    items: item.items ? toSidebarItems(item.items) : undefined,
  }));
}

/**
 * Returns the sidebar navigation for the module owning the given pathname.
 * Lifted verbatim from the former monolithic dashboard layout so behaviour is
 * unchanged. The return type is `ModuleNav`.
 *
 * Resolution order: the data-driven `AppModuleDescriptor` registry
 * (`@unerp/shared/module-registry`) is tried first; any module not yet
 * migrated off the legacy branch chain below falls back to its hardcoded
 * branch exactly as before.
 */
export const getAppSpecificNavigation = (pathname: string): { title: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; items: SidebarItem[] } => {
  let effectivePathname = pathname;
  if (pathname.startsWith('/app/')) {
    const parts = pathname.split('/');
    if (parts[2]) {
      effectivePathname = '/' + parts[2];
    }
  }

  const routeSegment = effectivePathname.split('/').filter(Boolean)[0];
  if (routeSegment) {
    const descriptor = getModuleDescriptor(routeSegment);
    if (descriptor) {
      const ctx = readNavContext();
      const isVisible = !descriptor.visibility || descriptor.visibility(ctx);
      if (isVisible) {
        const navItems = typeof descriptor.nav === 'function' ? descriptor.nav(ctx) : descriptor.nav;
        return {
          title: descriptor.title,
          icon: resolveIcon(descriptor.icon),
          items: toSidebarItems(navItems),
        };
      }
    }
  }

  if (effectivePathname.startsWith('/finance')) {
    return {
      title: 'Finance & Accounting',
      icon: CreditCard,
      items: [
        { name: 'Dashboard', href: '/finance', icon: Home },
        {
          name: 'Core Accounting',
          isHeader: true,
          items: [
            { name: 'Chart of Accounts', href: '/finance/advanced/chart-of-accounts', icon: CreditCard },
            { name: 'Journal Entries', href: '/finance/advanced/journal-entries', icon: FileSliders },
            { name: 'Financial Periods', href: '/finance/advanced/financial-periods', icon: Activity },
            { name: 'Close Tasks Checklist', href: '/finance/advanced/close-tasks', icon: ClipboardCheck },
            { name: 'Fixed Assets', href: '/finance/advanced/fixed-assets', icon: Building2 },
            { name: 'Lease Accounting', href: '/finance/advanced/leases', icon: FileText },
            { name: 'Subscription Billing', href: '/finance/advanced/subscriptions', icon: CreditCard },
            { name: 'Recurring Invoices', href: '/finance/advanced/recurring', icon: RefreshCw },
            { name: 'Revenue Recognition', href: '/finance/advanced/revenue-schedules', icon: TrendingUp },
            { name: 'Dynamic Allocations', href: '/finance/advanced/allocations', icon: PieChart },
          ]
        },
        {
          name: 'Payables & Treasury',
          isHeader: true,
          items: [
            { name: 'Bank Accounts', href: '/finance/advanced/bank-accounts', icon: Wallet },
            { name: 'Bank Reconciliation', href: '/finance/advanced/reconciliations', icon: GitFork },
            { name: 'AP Automation', href: '/finance/advanced/ap-automation', icon: ShoppingCart },
            { name: 'AI Invoice Capture', href: '/finance/advanced/invoice-capture', icon: FileText },
            { name: 'AP Match Rules', href: '/finance/advanced/ap-match-rules', icon: ShoppingCart },
            { name: 'AP Exception Queue', href: '/finance/advanced/exception-queue', icon: AlertTriangle },
            { name: 'Payment Batches', href: '/finance/advanced/payment-batches', icon: CreditCard },
            { name: 'AR Automation', href: '/finance/advanced/ar-automation', icon: ClipboardList },
            { name: 'Treasury & Investments', href: '/finance/advanced/treasury', icon: BarChart3 },
            { name: 'Expense Management', href: '/finance/advanced/expense-reports', icon: Receipt },
            { name: 'Expense Policies & Rates', href: '/finance/advanced/expense-policies', icon: ShieldCheck },
            { name: 'Cash Position', href: '/finance/advanced/cash-position', icon: DollarSign },
            { name: 'Cash Flow Forecast', href: '/finance/advanced/cash-flow-forecast', icon: Activity },
          ]
        },
        {
          name: 'Tax & Compliance',
          isHeader: true,
          items: [
            { name: 'Tax Engine', href: '/finance/advanced/tax-engine', icon: GitFork },
            { name: 'Tax Filing', href: '/finance/advanced/tax-filing', icon: ShieldAlert },
            { name: '1099 / Vendor Tax Reporting', href: '/finance/advanced/1099-reporting', icon: FileText },
            { name: 'Economic Nexus Monitoring', href: '/finance/advanced/tax-nexus', icon: ShieldAlert },
            { name: 'Finance Audit Trail', href: '/finance/advanced/audit-logs', icon: Eye },
            { name: 'Account Reconciliation', href: '/finance/advanced/account-reconciliation', icon: GitFork },
          ]
        },
        {
          name: 'Planning & Reporting',
          isHeader: true,
          items: [
            { name: 'Budgeting & Planning', href: '/finance/advanced/budgeting', icon: PieChart },
            { name: 'Budget Scenarios', href: '/finance/advanced/budget-scenarios', icon: Layers },
            { name: 'Scenario Comparison', href: '/finance/advanced/scenario-comparison', icon: BarChart3 },
            { name: 'Rolling Forecasts (xP&A)', href: '/finance/advanced/forecast-scenarios', icon: TrendingUp },
            { name: 'Accounting Books (Multi-GAAP)', href: '/finance/advanced/accounting-books', icon: BookOpen },
            { name: 'Financial Reports', href: '/finance/advanced/reports', icon: FolderOpen },
            { name: 'Exchange Rates', href: '/finance/advanced/exchange-rates', icon: DollarSign },
            { name: 'Financial Ratios', href: '/finance/advanced/financial-ratios', icon: Scale },
            { name: 'Consolidation', href: '/finance/advanced/consolidation', icon: Building2 },
          ]
        },
      ]
    };
  }
  if (pathname.startsWith('/hr')) {
    return {
      title: 'Human Resources',
      icon: Users,
      items: [
        { name: 'Employee Directory', href: '/hr', icon: Users },
        { name: 'Self-Service Portal', href: '/hr/advanced/self-service', icon: UserIcon },
        {
          name: 'Talent Management',
          isHeader: true,
          items: [
            { name: 'Recruitment', href: '/hr/advanced/recruitment', icon: Briefcase },
            { name: 'Onboarding Checklists', href: '/hr/advanced/onboarding', icon: UserPlus },
            { name: 'Offboarding Checklists', href: '/hr/advanced/offboarding', icon: UserMinus },
            { name: 'Goals & OKRs', href: '/hr/advanced/goals', icon: Target },
            { name: 'Skills Matrix', href: '/hr/advanced/skills', icon: Star },
            { name: 'Performance Appraisals', href: '/hr/advanced/appraisals', icon: Award },
            { name: '360° Feedback', href: '/hr/advanced/feedback', icon: MessageSquare },
            { name: 'Succession Plan', href: '/hr/advanced/succession', icon: TrendingUp },
          ]
        },
        {
          name: 'Operations & Service',
          isHeader: true,
          items: [
            { name: 'Attendance Record', href: '/hr/advanced/attendance', icon: Clock },
            { name: 'Shift Scheduling', href: '/hr/advanced/shifts', icon: CalendarDays },
            { name: 'Documents Manager', href: '/hr/advanced/documents', icon: FileText },
            { name: 'Trainings & Certs', href: '/hr/advanced/trainings', icon: GraduationCap },
            { name: 'Operations & Service Hub', href: '/hr/advanced/operations-service', icon: Monitor },
          ]
        },
        {
          name: 'Compensation & BI',
          isHeader: true,
          items: [
            { name: 'Payroll & Salaries', href: '/hr/advanced/payroll', icon: DollarSign },
            { name: 'Leave Management', href: '/hr/advanced/leaves', icon: Coffee },
            { name: 'Benefits Admin', href: '/hr/advanced/benefits', icon: CreditCard },
            { name: 'Position Control', href: '/hr/advanced/positions', icon: ClipboardCheck },
            { name: 'Workforce Analytics', href: '/hr/advanced/analytics', icon: BarChart3 },
          ]
        }
      ] as SidebarItem[]
    };
  }
  if (pathname.startsWith('/crm')) {
    return {
      title: 'CRM & Sales',
      icon: BarChart3,
      items: [
        { name: 'Dashboard', href: '/crm', icon: Home },
        {
          name: 'Account Management',
          isHeader: true,
          items: [
            { name: 'Customers', href: '/crm/customers', icon: Users },
            { name: 'Vendors', href: '/crm/vendors', icon: Building },
            { name: 'Contacts', href: '/crm/contacts', icon: Users },
            { name: 'Contracts', href: '/crm/contracts', icon: FileText },
            { name: 'Customer Portal', href: '/crm/customer-portal', icon: Users },
          ]
        },
        {
          name: 'Sales Pipeline',
          isHeader: true,
          items: [
            { name: 'Leads', href: '/crm/leads', icon: TrendingUp },
            { name: 'Opportunities', href: '/crm/opportunities', icon: BarChart3 },
            { name: 'Products', href: '/crm/products', icon: Package },
            { name: 'Price Books', href: '/crm/price-books', icon: BookOpen },
            { name: 'Quotations', href: '/crm/quotations', icon: FileText },
            { name: 'E-Signatures', href: '/crm/quotations/signatures', icon: FileText },
            { name: 'Sales Orders', href: '/crm/sales-orders', icon: ClipboardList },
            { name: 'Pipeline Risk Alerts', href: '/crm/forecasting/pipeline-risk', icon: TrendingUp },
            { name: 'Revenue Intelligence', href: '/crm/forecasting/revenue-intelligence', icon: TrendingUp },
            { name: 'Conversation Intelligence', href: '/crm/conversation-intelligence', icon: Phone },
            { name: 'Conversion Analytics', href: '/crm/forecasting/conversion-analytics', icon: BarChart3 },
            { name: 'AI Drafting', href: '/crm/ai-drafting', icon: FileText },
            { name: 'Sales Coaching', href: '/crm/coaching', icon: Phone },
            { name: 'Deal Rooms', href: '/crm/deal-rooms', icon: FileText },
          ]
        },
        {
          name: 'Marketing & Outreach',
          isHeader: true,
          items: [
            { name: 'Marketing & Outreach Hub', href: '/crm/marketing-outreach', icon: Target },
          ]
        },
        {
          name: 'Automation & Workflows',
          isHeader: true,
          items: [
            { name: 'Workflow Rules', href: '/crm/workflows', icon: Zap },
            { name: 'Approvals', href: '/crm/approvals', icon: CheckSquare },
            { name: 'Activities', href: '/crm/activities', icon: Activity },
            { name: 'Documents', href: '/crm/documents', icon: FolderOpen },
          ]
        },
        {
          name: 'Customer Service',
          isHeader: true,
          items: [
            { name: 'Cases & SLA', href: '/crm/cases', icon: HelpCircle },
            { name: 'SLA Dashboard', href: '/crm/cases/sla', icon: Clock },
          ]
        },
        {
          name: 'Sales Enablement',
          isHeader: true,
          items: [
            { name: 'Sales Enablement Hub', href: '/crm/sales-enablement', icon: BookOpen },
            { name: 'Segments', href: '/crm/segments', icon: Target },
          ]
        },
        {
          name: 'Teams & Territories',
          isHeader: true,
          items: [
            { name: 'Territories', href: '/crm/territories', icon: MapPin },
            { name: 'Assignment Rules', href: '/crm/territories/assignment-rules', icon: MapPin },
            { name: 'Commissions', href: '/crm/commissions', icon: DollarSign },
            { name: 'Commission Plans', href: '/crm/commission-plans', icon: DollarSign },
            { name: 'Sales Cadences', href: '/crm/sequences/cadences', icon: BookOpen },
            { name: 'Gamification & Leaderboards', href: '/crm/gamification', icon: TrendingUp },
          ]
        },
        {
          name: 'Analytics & Reports',
          isHeader: true,
          items: [
            { name: 'Forecasting', href: '/crm/forecasting', icon: TrendingUp },
            { name: 'Account Plans', href: '/crm/account-plans', icon: Shield },
            { name: 'Account Hierarchy', href: '/crm/account-hierarchy', icon: Building2 },
            { name: 'Reports', href: '/crm/reports', icon: PieChart },
            { name: 'Dashboards', href: '/crm/dashboards', icon: Layers },
            { name: 'Advanced', href: '/crm/advanced', icon: Settings },
          ]
        },
        {
          name: 'CRM Intelligence & AI',
          isHeader: true,
          items: [
            { name: 'Intelligence Hub', href: '/crm/intelligence', icon: Brain },
            { name: 'Predictive Lead Scoring', href: '/crm/intelligence/lead-scoring', icon: Target },
            { name: 'Customer Health & Churn', href: '/crm/intelligence/health', icon: ShieldAlert },
            { name: 'Deal Velocity', href: '/crm/intelligence/deal-velocity', icon: Clock },
            { name: 'Attribution & Journey', href: '/crm/intelligence/journey', icon: Workflow },
            { name: 'Sentiment & Health', href: '/crm/intelligence/sentiment', icon: Smile },
            { name: 'CLV Analytics', href: '/crm/intelligence/clv', icon: DollarSign },
            { name: 'Partner Management', href: '/crm/intelligence/partners', icon: Users },
            { name: 'Campaign Analytics', href: '/crm/intelligence/campaigns', icon: Target },
          ]
        },
        {
          name: 'Settings',
          isHeader: true,
          items: [
            { name: 'Custom Fields', href: '/crm/settings/custom-fields', icon: Database },
            { name: 'Record Types', href: '/crm/settings/record-types', icon: Layers },
            { name: 'Approval Processes', href: '/crm/settings/approvals', icon: ShieldCheck },
            { name: 'Lead Scoring', href: '/crm/settings/lead-scoring', icon: Zap },
            { name: 'Duplicate Rules', href: '/crm/settings/duplicate-rules', icon: Users },
            { name: 'Pipelines', href: '/crm/settings/pipelines', icon: GitBranch },
            { name: 'SLA Policies', href: '/crm/settings/sla-policies', icon: Clock },
            { name: 'Email Integration', href: '/crm/settings/email-integration', icon: Mail },
          ]
        },
      ] as SidebarItem[]
    };
  }
  if (pathname.startsWith('/inventory')) {
    return {
      title: 'Inventory & Stock',
      icon: Package,
      items: [
        { name: 'Inventory Dashboard', href: '/inventory', icon: Home },
        { name: 'Products Catalog', href: '/inventory/products', icon: Package },
        { name: 'Warehouse Stock Levels', href: '/inventory/stock-levels', icon: Layers },
        { name: 'Warehouse Directory', href: '/inventory/warehouses', icon: Warehouse },
        {
          name: 'Material Transactions',
          isHeader: true,
          items: [
            { name: 'Stock Entries', href: '/inventory/stock-entries', icon: FileText },
            { name: 'Stock Ledger', href: '/inventory/stock-ledger', icon: History },
            { name: 'Valuation Costing', href: '/inventory/valuations', icon: TrendingUp },
          ]
        },
        {
          name: 'Quality & Control',
          isHeader: true,
          items: [
            { name: 'QA Inspections', href: '/inventory/qa-inspections', icon: ShieldCheck },
            { name: 'Serial Numbers', href: '/inventory/serial-numbers', icon: QrCode },
            { name: 'Batch & Lot Control', href: '/inventory/batches', icon: Package },
          ]
        },
        {
          name: 'Storage & Audit',
          isHeader: true,
          items: [
            { name: 'Bin Configurations', href: '/inventory/bin-locations', icon: MapPin },
            { name: 'Cycle Count Audits', href: '/inventory/cycle-counts', icon: ClipboardCheck },
            { name: 'Cycle Count Schedules', href: '/inventory/cycle-count-schedules', icon: ClipboardCheck },
            { name: 'License Plates & Put-away', href: '/inventory/license-plates', icon: Package },
            { name: 'Traceability', href: '/inventory/traceability', icon: QrCode },
            { name: 'Stock Reservations & Analytics', href: '/inventory/stock-reservations', icon: ClipboardCheck },
            { name: 'Kits & Assembly', href: '/inventory/kits', icon: Package },
            { name: 'Transfer Approvals', href: '/inventory/transfer-approvals', icon: ShieldCheck },
            { name: 'Movement History & Labels', href: '/inventory/movement-history', icon: ClipboardCheck },
            { name: 'Wave Picking', href: '/inventory/pick-waves', icon: Truck },
            { name: 'Mobile Scan Pick/Pack', href: '/inventory/mobile-pick', icon: Smartphone },
            { name: 'Consignment Inventory', href: '/inventory/consignment', icon: Truck },
            { name: 'Reorder Rules & Automation', href: '/inventory/reorder-rules', icon: ShoppingCart },
            { name: 'QA Templates & Routing', href: '/inventory/qa-templates', icon: ShieldCheck },
            { name: 'Expiry, FEFO & Recalls', href: '/inventory/expiry-fefo', icon: AlertTriangle },
            { name: 'Cross-Docking', href: '/inventory/cross-dock', icon: Link },
            { name: 'Slotting Optimization', href: '/inventory/slotting', icon: MapPin },
            { name: 'Dock Scheduling', href: '/inventory/dock-scheduling', icon: Truck },
            { name: 'Demand Forecasting', href: '/inventory/demand-forecasting', icon: TrendingUp },
            { name: 'Returns to Vendor (RTV)', href: '/inventory/rtv', icon: RotateCcw },
            { name: 'Labor Management', href: '/inventory/labor-management', icon: Users },
            { name: 'Supplier Quality', href: '/inventory/supplier-quality', icon: ClipboardList },
            { name: 'Automation Rules', href: '/inventory/automation-rules', icon: Zap },
            { name: 'Inventory Analytics', href: '/inventory/inventory-analytics', icon: BarChart3 },
            { name: 'Logistics & Shipping', href: '/inventory/logistics', icon: Truck },
            { name: 'Quality & Compliance', href: '/inventory/quality-compliance', icon: ShieldCheck },
            { name: 'Warehouse Operations', href: '/inventory/warehouse-ops', icon: Truck },
            { name: 'Lot & Serial Tracking', href: '/inventory/lot-serial', icon: ClipboardList },
            { name: 'Landed Cost', href: '/inventory/landed-cost', icon: Calculator },
            { name: 'Stock Valuation', href: '/inventory/stock-valuation', icon: DollarSign },
            { name: 'Transfer Orders', href: '/inventory/transfer-orders', icon: Truck },
            { name: 'Yard Management', href: '/inventory/yard-management', icon: Truck },
            { name: 'Stock Takes', href: '/inventory/stock-takes', icon: ClipboardList },
            { name: 'Hazmat', href: '/inventory/hazmat', icon: AlertTriangle },
            { name: 'Approved Suppliers', href: '/inventory/asl', icon: CheckSquare },
            { name: 'Container & Pallets', href: '/inventory/container-pallet', icon: Package },
            { name: 'Catch-Weight & Recall', href: '/inventory/catch-weight-recall', icon: AlertTriangle },
            { name: 'Packaging & GS1', href: '/inventory/packaging-gs1', icon: Layers },
            { name: 'Cold Chain & Write-Off', href: '/inventory/cold-chain-writeoff', icon: Box },
          { name: 'Velocity & ABC-XYZ', href: '/inventory/velocity-abc-xyz', icon: TrendingUp },
          { name: 'Customer Returns', href: '/inventory/customer-returns', icon: Package },
          { name: 'Min-Max Replenishment', href: '/inventory/minmax-replen', icon: TrendingUp },
          { name: 'Freight Claims', href: '/inventory/freight-claims', icon: AlertTriangle },
          { name: 'Vendor-Managed Inventory', href: '/inventory/vmi', icon: Box },
          { name: 'Inventory Costing', href: '/inventory/costing', icon: TrendingUp },
          { name: 'Lot/Batch Expiry', href: '/inventory/lot-expiry', icon: AlertTriangle },
            { name: 'Demand Forecasting', href: '/inventory/demand-forecasting', icon: TrendingUp },
          ]
        },
        {
          name: 'System & Configuration',
          isHeader: true,
          items: [
            { name: 'Advanced Hub', href: '/inventory/advanced', icon: Settings },
          ]
        }
      ] as SidebarItem[]
    };
  }
  if (pathname.startsWith('/procurement')) {
    return {
      title: 'Procurement',
      icon: ShoppingCart,
      items: [
        { name: 'Procurement Dashboard', href: '/procurement', icon: ShoppingCart },
        { name: 'Purchase Requisitions', href: '/procurement/requisitions', icon: ClipboardCheck },
        { name: 'Blanket Agreements', href: '/procurement/blanket-agreements', icon: Layers },
        { name: 'Purchase Orders', href: '/procurement/purchase-orders', icon: FileText },
        { name: 'Purchase Receipts (GRN)', href: '/procurement/purchase-receipts', icon: Truck },
        { name: 'Supplier Returns', href: '/procurement/returns', icon: History },
        { name: 'Sourcing (RFQs)', href: '/procurement/rfqs', icon: ClipboardList },
        { name: 'Supplier Bids', href: '/procurement/supplier-quotations', icon: FileText },
        { name: 'Supplier Directory', href: '/procurement/vendors', icon: Building2 },
        { name: 'Supplier Portal', href: '/procurement/portal', icon: Store }
      ]
    };
  }
  if (pathname.startsWith('/sales')) {
    return {
      title: 'Sales & Orders',
      icon: ClipboardList,
      items: [
        { name: 'Sales Dashboard', href: '/sales', icon: Home },
        { name: 'Customer Quotations', href: '/sales/quotations', icon: FileText },
        { name: 'Sales Orders', href: '/sales/orders', icon: ClipboardList },
        { name: 'CPQ Pricing', href: '/sales/cpq', icon: Calculator },
        { name: 'Fulfillment & SLAs', href: '/sales/fulfillment', icon: Truck },
        { name: 'Delivery Notes', href: '/sales/delivery-notes', icon: Truck },
        { name: 'Customer Returns', href: '/sales/returns', icon: History }
      ] as SidebarItem[]
    };
  }
  if (pathname.startsWith('/supply-chain')) {
    return {
      title: 'Supply Chain',
      icon: Truck,
      items: [
        { name: 'Dashboard', href: '/supply-chain', icon: Home },
        {
          name: 'Operations',
          isHeader: true,
          items: [
            { name: 'Operations Hub', href: '/supply-chain/operations', icon: Package },
          ]
        },
        {
          name: 'Planning & Analytics',
          isHeader: true,
          items: [
            { name: 'Demand Forecast', href: '/supply-chain/demand-forecast', icon: TrendingUp },
            { name: 'Analytics', href: '/supply-chain/analytics', icon: BarChart3 },
          ]
        },
      ]
    };
  }
  if (pathname.startsWith('/projects')) {
    return {
      title: 'Project Management',
      icon: Briefcase,
      items: [
        { name: 'Gantt & Tasks', href: '/projects', icon: Briefcase },
        { name: 'Portfolio Hub', href: '/projects/portfolios', icon: Target },
        { name: 'Client Portal', href: '/projects/client-portal', icon: Home },
        {
          name: 'Advanced Tools',
          isHeader: true,
          items: [
            { name: 'Resource Workloads', href: '/projects/workloads', icon: Clock },
            { name: 'Project Health & CPM', href: '/projects/health', icon: Activity },
            { name: 'Revenue Recognition', href: '/projects/revenue-recognition', icon: DollarSign },
            { name: 'WIP & Job Costing', href: '/projects/wip-reports', icon: DollarSign },
          ]
        }
      ]
    };
  }
  if (pathname.startsWith('/manufacturing')) {
    return {
      title: 'Manufacturing',
      icon: Hammer,
      items: [
        { name: 'Work Orders', href: '/manufacturing', icon: Hammer },
        { name: 'Bills of Materials', href: '/manufacturing/boms', icon: ClipboardList },
        { name: 'MRP Replenishment', href: '/manufacturing/mrp', icon: Layers },
        { name: 'Operator Shop Floor', href: '/manufacturing/shop-floor', icon: Cpu },
        { name: 'Quality Control & NCR', href: '/manufacturing/quality', icon: ShieldCheck },
        { name: 'Finite Capacity Scheduling', href: '/manufacturing/scheduling', icon: Clock },
        { name: 'Product Configurator', href: '/manufacturing/configurator', icon: Settings },
        {
          name: 'Execution & MES',
          isHeader: true,
          items: [
            { name: 'MES Diagnostics', href: '/manufacturing/diagnostics', icon: Settings },
            { name: 'IoT Telemetry Sensors', href: '/manufacturing/diagnostics', icon: Activity },
          ]
        }
      ]
    };
  }
  if (pathname.startsWith('/analytics')) {
    return {
      title: 'Business Intelligence',
      icon: PieChart,
      items: [
        { name: 'BI Analytics Dashboard', href: '/analytics', icon: PieChart },
        { name: 'Dashboard Builder', href: '/analytics/builder', icon: LayoutDashboard },
        { name: 'Smart Insights', href: '/analytics/insights', icon: ShieldAlert },
        {
          name: 'Data Tools',
          isHeader: true,
          items: [
            { name: 'Visual Query Builder', href: '/analytics/query', icon: GitFork },
            { name: 'Pivot Matrix Aggregator', href: '/analytics/pivot', icon: Layers },
            { name: 'Predictive Analytics', href: '/analytics/predictive', icon: TrendingUp },
            { name: 'Advanced BI Analytics', href: '/analytics/advanced', icon: BarChart3 },
          ]
        }
      ]
    };
  }
  if (pathname.startsWith('/drive')) {
    return {
      title: 'Drive',
      icon: FolderOpen,
      items: [
        { name: 'My Drive', href: '/drive', icon: FolderOpen },
        { name: 'Shared with me', href: '/drive?view=shared', icon: Users },
        { name: 'Recent', href: '/drive?view=recent', icon: Clock },
        { name: 'Starred', href: '/drive?view=starred', icon: Star },
        { name: 'Trash', href: '/drive?view=trash', icon: Trash2 },
        {
          name: 'Document Tools',
          isHeader: true,
          items: [
            { name: 'Generated Documents', href: '/drive/templates', icon: FileText },
            { name: 'Template Designer', href: '/drive/designer', icon: Settings },
          ]
        },
        {
          name: 'Advanced & Tools',
          isHeader: true,
          items: [
            { name: 'E-Signatures & OCR', href: '/drive/advanced', icon: FileText },
            { name: 'Storage Quotas', href: '/drive/quotas', icon: Database },
            { name: 'Media Conversion', href: '/drive/media', icon: Image },
          ]
        }
      ]
    };
  }
  if (pathname.startsWith('/storage')) {
    return {
      title: 'Files & Storage',
      icon: HardDrive,
      items: [
        { name: 'Files Explorer', href: '/storage', icon: HardDrive },
        { name: 'Storage & Templates Pro', href: '/storage/advanced', icon: Database },
      ]
    };
  }
  if (pathname.startsWith('/connect') || pathname.startsWith('/communication')) {
    return {
      title: 'Connect',
      icon: MessageSquare,
      items: [
        { name: 'Chat & Spaces', href: '/connect', icon: MessageSquare },
        { name: 'Advanced Messaging & Threading', href: '/communication/advanced', icon: Mail }
      ]
    };
  }
  if (pathname.startsWith('/pos')) {
    return {
      title: 'POS & Retail',
      icon: Store,
      items: [
        { name: 'POS Terminal', href: '/pos', icon: Store },
        { name: 'POS Orders', href: '/pos/orders', icon: ShoppingCart },
        { name: 'Customers & Loyalty', href: '/pos/customers', icon: Users },
        { name: 'Sales Analytics', href: '/pos/reports', icon: BarChart3 },
        { name: 'Advanced POS Features', href: '/pos/advanced', icon: Activity },
        {
          name: 'Retail Tools',
          isHeader: true,
          items: [
            { name: 'Held / Parked Carts', href: '/pos/held-orders', icon: Clock },
            { name: 'Promotions Engine', href: '/pos/promotions', icon: Percent },
            { name: 'Layaway Plans', href: '/pos/layaway', icon: DollarSign },
          ]
        },
        {
          name: 'Customizer',
          isHeader: true,
          items: [
            { name: 'Receipt Designer', href: '/pos/designer', icon: Settings },
            { name: 'Printer Diagnostics', href: '/pos/diagnostics', icon: Activity },
          ]
        }
      ]
    };
  }
  if (pathname.startsWith('/ecommerce')) {
    return {
      title: 'E-Commerce',
      icon: Store,
      items: [
        { name: 'Storefront Settings', href: '/ecommerce', icon: Settings },
        { name: 'Categories', href: '/ecommerce/categories', icon: Layers },
        { name: 'Product Listings', href: '/ecommerce/listings', icon: Package },
      ]
    };
  }
  if (pathname.startsWith('/workflows')) {
    return {
      title: 'Workflows',
      icon: GitFork,
      items: [
        { name: 'Approval Workflows', href: '/workflows', icon: GitFork },
        { name: 'Advanced Workflow Engine', href: '/workflows/advanced', icon: Workflow },
        {
          name: 'SLA Escalations',
          isHeader: true,
          items: [
            { name: 'Escalation Logs', href: '/workflows/escalations', icon: ShieldAlert },
            { name: 'Workflow Simulator', href: '/workflows/simulation', icon: Play },
          ]
        }
      ]
    };
  }
  if (pathname.startsWith('/education')) {
    return {
      title: 'Education',
      icon: GraduationCap,
      items: [
        { name: 'Dashboard', href: '/education', icon: Home },
        {
          name: 'Academic',
          isHeader: true,
          items: [
            { name: 'Student Registry', href: '/education/students', icon: Users },
            { name: 'Course Catalog', href: '/education/courses', icon: BookOpen },
            { name: 'Timetable', href: '/education/timetable', icon: Calendar },
            { name: 'Grade Book', href: '/education/grades', icon: Award },
            { name: 'Attendance', href: '/education/attendance', icon: ClipboardCheck },
          ]
        },
        {
          name: 'Administration',
          isHeader: true,
          items: [
            { name: 'Fee Management', href: '/education/fees', icon: DollarSign },
            { name: 'Fee Payments', href: '/education/fees/pay', icon: CreditCard },
            { name: 'Library', href: '/education/library', icon: BookOpen },
          ]
        },
        {
          name: 'Reporting',
          isHeader: true,
          items: [
            { name: 'Reports & Analytics', href: '/education/reports', icon: BarChart3 },
          ]
        },
      ]
    };
  }
  if (pathname.startsWith('/healthcare')) {
    return {
      title: 'Healthcare',
      icon: Activity,
      items: [
        { name: 'Dashboard', href: '/healthcare', icon: Home },
        {
          name: 'Patient Care',
          isHeader: true,
          items: [
            { name: 'Patient Registry', href: '/healthcare/patients', icon: Users },
            { name: 'Appointments', href: '/healthcare/appointments', icon: Calendar },
            { name: 'Clinical Notes', href: '/healthcare/clinical', icon: ClipboardList },
            { name: 'Prescriptions', href: '/healthcare/prescriptions', icon: FileText },
            { name: 'Lab Results', href: '/healthcare/lab-results', icon: Activity },
          ]
        },
        {
          name: 'Staff & Integration',
          isHeader: true,
          items: [
            { name: 'Practitioners', href: '/healthcare/practitioners', icon: Users },
            { name: 'Vitals Dashboard', href: '/healthcare/vitals', icon: Activity },
            { name: 'FHIR / SMART', href: '/healthcare/fhir', icon: Globe },
          ]
        },
        {
          name: 'Reporting',
          isHeader: true,
          items: [
            { name: 'Reports', href: '/healthcare/reports', icon: BarChart3 },
          ]
        },
      ]
    };
  }
  if (pathname.startsWith('/real-estate')) {
    return {
      title: 'Real Estate',
      icon: Building2,
      items: [
        { name: 'Dashboard', href: '/real-estate', icon: Home },
        {
          name: 'Portfolio',
          isHeader: true,
          items: [
            { name: 'Properties', href: '/real-estate/properties', icon: Building2 },
            { name: 'Leases', href: '/real-estate/leases', icon: FileText },
            { name: 'Tenant Directory', href: '/real-estate/tenants', icon: Users },
          ]
        },
        {
          name: 'Operations',
          isHeader: true,
          items: [
            { name: 'Maintenance', href: '/real-estate/maintenance', icon: Wrench },
            { name: 'Agent Commissions', href: '/real-estate/commissions', icon: DollarSign },
          ]
        },
        {
          name: 'Reporting',
          isHeader: true,
          items: [
            { name: 'Reports', href: '/real-estate/reports', icon: BarChart3 },
          ]
        },
      ]
    };
  }
  if (pathname.startsWith('/field-service')) {
    return {
      title: 'Field Service',
      icon: Wrench,
      items: [
        { name: 'Dashboard', href: '/field-service', icon: Home },
        {
          name: 'Service Management',
          isHeader: true,
          items: [
            { name: 'Service Tickets', href: '/field-service/tickets', icon: ClipboardList },
            { name: 'Dispatch Board', href: '/field-service/dispatch', icon: MapPin },
            { name: 'Checklists', href: '/field-service/checklists', icon: ClipboardCheck },
            { name: 'Preventive Maintenance', href: '/field-service/preventive', icon: Wrench },
          ]
        },
        {
          name: 'Team',
          isHeader: true,
          items: [
            { name: 'Technicians', href: '/field-service/technicians', icon: Users },
            { name: 'Customer Directory', href: '/field-service/customers', icon: Users },
          ]
        },
        {
          name: 'Reporting',
          isHeader: true,
          items: [
            { name: 'Reports', href: '/field-service/reports', icon: BarChart3 },
          ]
        },
      ]
    };
  }
  if (pathname.startsWith('/communication') || pathname.startsWith('/connect')) {
    return {
      title: 'Connect',
      icon: MessageSquare,
      items: [
        { name: 'Dashboard', href: '/communication', icon: Home },
        {
          name: 'Messaging',
          isHeader: true,
          items: [
            { name: 'Spaces & Channels', href: '/communication/spaces', icon: Users },
            { name: 'Direct Messages', href: '/communication/dm', icon: MessageSquare },
            { name: 'Chat Client', href: '/connect', icon: MessageSquare },
          ]
        },
        {
          name: 'Collaboration',
          isHeader: true,
          items: [
            { name: 'Meetings', href: '/communication/meetings', icon: Video },
            { name: 'Calendar', href: '/communication/calendar', icon: Calendar },
          ]
        },
        {
          name: 'Settings',
          isHeader: true,
          items: [
            { name: 'Notifications', href: '/communication/notifications', icon: Bell },
          ]
        },
      ]
    };
  }
  if (pathname.startsWith('/settings')) {
    // Check if user is a super admin
    const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let isSuperAdmin = false;
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        isSuperAdmin = u.role === 'SUPER_ADMIN' || u.email === 'admin@uni-erp.com';
      } catch { }
    }

    const items: SidebarItem[] = [
      { name: 'Dashboard', href: '/saas/portal', icon: Home },
      {
        name: 'Identity & Access',
        isHeader: true,
        items: [
          { name: 'Identity & Access Hub', href: '/saas/security', icon: Users },
          { name: 'Permissions Matrix', href: '/saas/security?tab=permissions', icon: LayoutGrid },
          { name: 'Login impersonation', href: '/saas/security?tab=impersonate', icon: UserIcon },
          { name: 'Delegations & OOO', href: '/saas/security?tab=delegations', icon: Users },
        ]
      },
      {
        name: 'Security & Compliance',
        isHeader: true,
        items: [
          { name: 'Security Policies Hub', href: '/saas/security', icon: ShieldAlert },
          { name: 'Compliance & Governance Hub', href: '/saas/compliance', icon: ShieldCheck },
        ]
      },
      {
        name: 'Automation & Workflows',
        isHeader: true,
        items: [
          { name: 'Approval Operations Hub', href: '/workflows', icon: CheckSquare },
          { name: 'Workflow Builder Hub', href: '/builder/erp/workflows', icon: GitFork },
          { name: 'Automation Rules', href: '/saas/admin?tab=automation', icon: Zap },
        ]
      },
      {
        name: 'Branding & Communication',
        isHeader: true,
        items: [
          { name: 'Branding & Communication Hub', href: '/saas/settings?tab=branding', icon: Image },
        ]
      },
      {
        name: 'System Operations',
        isHeader: true,
        items: [
          { name: 'System Operations Hub', href: '/saas/admin', icon: Activity },
          { name: 'Backup & Restore', href: '/saas/admin?tab=backups', icon: Database },
          { name: 'DB Schema Manager', href: '/saas/admin?tab=db', icon: Database },
          { name: 'Bulk Operations', href: '/saas/admin?tab=bulk', icon: Layers },
        ]
      },
      {
        name: 'Platform Configuration',
        isHeader: true,
        items: [
          { name: 'General & Branding Hub', href: '/saas/settings?tab=branding', icon: Settings },
          { name: 'Integrations Settings', href: '/saas/settings?tab=integrations', icon: Plug },
          { name: 'Module Manager', href: '/apps/store', icon: Settings },
          { name: 'Custom Domains', href: '/saas/settings?tab=domains', icon: Globe },
          { name: 'Environment Manager', href: '/saas/admin?tab=environments', icon: Server },
          { name: 'System Updates', href: '/saas/admin?tab=updates', icon: Cpu },
          { name: 'Marketplace', href: '/apps/store', icon: Box },
          { name: 'Subscription & Billing', href: '/saas/billing', icon: CreditCard },
          { name: 'Organization Hierarchy', href: '/saas/team/org-hierarchy', icon: Building },
        ]
      },
      {
        name: 'Data & Integration',
        isHeader: true,
        items: [
          { name: 'API Platform Hub', href: '/saas/api-keys', icon: Key },
          { name: 'Import / Export Hub', href: '/saas/exports', icon: Upload },
          { name: 'i18n Localization', href: '/saas/settings?tab=localization', icon: Globe },
          { name: 'DevOps & Telemetry', href: '/saas/admin?tab=devops', icon: Server },
          { name: 'Data Quality', href: '/saas/admin?tab=data-quality', icon: ShieldCheck },
        ]
      },
      {
        name: 'Reports',
        isHeader: true,
        items: [
          { name: 'Scheduled Reports', href: '/saas/admin?tab=reports', icon: FileText },
          { name: 'Activity Feed', href: '/saas/admin?tab=activity', icon: Activity },
          { name: 'Notification Prefs', href: '/saas/settings?tab=notifications', icon: Bell },
          { name: 'Tenant Usage Analytics', href: '/saas/admin?tab=analytics', icon: BarChart3 },
        ]
      }
    ];

    if (isSuperAdmin) {
      items.push({
        name: 'Super Admin Tools',
        isHeader: true,
        items: [
          { name: 'Super Admin Dashboard', href: '/settings/super-admin', icon: Home },
          { name: 'Tenants', href: '/settings/super-admin/tenants', icon: Building },
          { name: 'Admin Users', href: '/settings/super-admin/admins', icon: Users },
          { name: 'System Health', href: '/settings/super-admin/health', icon: Activity },
        ]
      });
    }

    return {
      title: 'Settings',
      icon: Settings,
      items
    };
  }
  if (pathname.startsWith('/super-admin')) {
    return {
      title: 'Super Admin',
      icon: ShieldAlert,
      items: [
        { name: 'Dashboard', href: '/super-admin', icon: Home },
        { name: 'Tenants', href: '/super-admin/tenants', icon: Building },
        { name: 'Admin Users', href: '/super-admin/admins', icon: Users },
        { name: 'System Health', href: '/super-admin/health', icon: Activity },
      ]
    };
  }
  // `/saas` is migrated to the AppModuleDescriptor registry — see
  // apps/web/src/navigation/descriptors/saasPortal.ts. No legacy branch here;
  // the registry lookup above handles it.
  if (pathname.startsWith('/builder')) {
    return {
      title: 'Studio',
      icon: Cpu,
      items: [
        { name: 'Studio Home', href: '/builder', icon: Home },
        {
          name: 'Build',
          isHeader: true,
          items: [
            { name: 'App Studio Overview', href: '/builder/erp', icon: Cpu },
            { name: 'Custom Apps', href: '/builder/erp/modules', icon: Database },
            { name: 'Form Builder', href: '/builder/erp/forms', icon: FileCode2 },
            { name: 'Workflow Builder', href: '/builder/erp/workflows', icon: Workflow },
            { name: 'Dashboard Builder', href: '/builder/erp/dashboards', icon: BarChart3 },
            { name: 'Business Logic', href: '/builder/erp/logic', icon: Play },
            { name: 'Data & Import', href: '/builder/erp/data', icon: Layers },
            { name: 'Customize an App', href: '/builder/erp/customize', icon: Settings },
          ]
        },
        {
          name: 'Web Studio',
          isHeader: true,
          items: [
            { name: 'Web Studio Overview', href: '/builder/web', icon: Globe },
            { name: 'Sites', href: '/builder/web/sites', icon: Globe },
            { name: 'CMS Collections', href: '/builder/web/collections', icon: Database },
            { name: 'Blog Posts', href: '/builder/web/blog', icon: FileText },
            { name: 'Asset Manager', href: '/builder/web/assets', icon: Image },
            { name: 'Templates', href: '/builder/web/templates', icon: Code2 },
            { name: 'Navigation Menus', href: '/builder/web/menus', icon: Layers },
            { name: 'SEO Manager', href: '/builder/web/seo', icon: BarChart3 },
            { name: 'Orders', href: '/builder/web/orders', icon: ShoppingCart },
            { name: 'Form Submissions', href: '/builder/web/submissions', icon: Inbox },
            { name: 'Pages (legacy)', href: '/builder/web/pages', icon: FileText },
          ]
        },
        {
          name: 'Marketplace',
          isHeader: true,
          items: [
            { name: 'App Store', href: '/apps/store', icon: Store },
            { name: 'Installed Apps', href: '/apps', icon: LayoutGrid },
            { name: 'Developer Portal', href: '/apps/developer', icon: Code2 },
          ]
        },
        {
          name: 'Manage',
          isHeader: true,
          items: [
            { name: 'Manage Overview', href: '/builder/manage', icon: Server },
            { name: 'Releases', href: '/builder/manage/releases', icon: History },
            { name: 'Environments', href: '/builder/manage/environments', icon: GitFork },
            { name: 'Run Logs', href: '/builder/manage/logs', icon: Activity },
            { name: 'Access Control', href: '/builder/manage/access', icon: Shield },
            { name: 'Connectors', href: '/builder/manage/connectors', icon: Link },
            { name: 'Marketplace', href: '/builder/manage/marketplace', icon: Store },
            { name: 'Query Builder', href: '/builder/manage/query-builder', icon: Database },
            { name: 'Widget SDK', href: '/builder/manage/widgets', icon: Settings },
            { name: 'Git Control', href: '/builder/manage/git', icon: GitBranch },
            { name: 'Export & Mobile', href: '/builder/manage/mobile-export', icon: Smartphone },
          ]
        },
      ] as SidebarItem[]
    };
  }

  if (pathname.startsWith('/ai')) {
    return {
      title: 'AI Copilot',
      icon: Zap,
      items: [
        { name: 'AI Copilot', href: '/ai', icon: Zap },
        {
          name: 'Capabilities',
          isHeader: true,
          items: [
            { name: 'Ask Data (NL Query)', href: '/ai', icon: MessageSquare },
            { name: 'Invoice Scanner', href: '/ai', icon: FileText },
            { name: 'Email Drafter', href: '/ai', icon: Mail },
            { name: 'Form Generator', href: '/ai', icon: LayoutGrid },
            { name: 'Workflow Generator', href: '/ai', icon: GitBranch },
          ]
        },
        {
          name: 'More AI Tools',
          isHeader: true,
          items: [
            { name: 'Visual Query Builder', href: '/analytics/query', icon: GitFork },
          ]
        },
      ]
    };
  }

  return {
    title: 'UniERP Hub',
    icon: Building,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home }
    ]
  };
};
