'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { DemoBanner } from '@unerp/ui';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Award, Coffee, CalendarDays, DollarSign, Clock, Monitor, FileText, UserPlus, UserMinus, Target, Star, TrendingUp, HelpCircle, CheckSquare, Trash2, Percent } from 'lucide-react';
import {
  Home,
  CreditCard,
  Users,
  BarChart3,
  Package,
  ShieldAlert,
  LayoutDashboard,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  Building,
  ShoppingCart,
  ShoppingBag,
  ClipboardList,
  Truck,
  Briefcase,
  Hammer,
  PieChart,
  FolderOpen,
  MessageSquare,
  Store,
  Wallet,
  FileSliders,
  GitFork,
  HardDrive,
  Activity,
  Mail,
  GraduationCap,
  Building2,
  Wrench,
  Key,
  Globe,
  Smartphone,
  Server,
  Cloud,
  LayoutGrid,
  History,
  ShieldCheck,
  QrCode,
  MapPin,
  ClipboardCheck,
  Warehouse,
  Layers,
  Play,
  Cpu,
  FileCode2,
  Workflow,
  Database,
  Inbox,
  Image,
  Code2,
  Zap,
  BookOpen,
  Send,
  Upload,
  Plug,
  Webhook,
  ExternalLink,
  Box,
  Shield,
  Download,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  isHeader?: boolean;
  items?: SidebarItem[];
}

const getAppSpecificNavigation = (pathname: string): { title: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; items: SidebarItem[] } => {
  let effectivePathname = pathname;
  if (pathname.startsWith('/app/')) {
    const parts = pathname.split('/');
    if (parts[2]) {
      effectivePathname = '/' + parts[2];
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
            { name: 'Fixed Assets', href: '/finance/advanced/fixed-assets', icon: Building2 },
          ]
        },
        {
          name: 'Payables & Treasury',
          isHeader: true,
          items: [
            { name: 'Bank Accounts', href: '/finance/advanced/bank-accounts', icon: Wallet },
            { name: 'AP Automation', href: '/finance/advanced/ap-automation', icon: ShoppingCart },
            { name: 'AR Automation', href: '/finance/advanced/ar-automation', icon: ClipboardList },
            { name: 'Treasury & Investments', href: '/finance/advanced/treasury', icon: BarChart3 },
          ]
        },
        {
          name: 'Tax & Compliance',
          isHeader: true,
          items: [
            { name: 'Tax Engine', href: '/finance/advanced/tax-engine', icon: GitFork },
            { name: 'Tax Filing', href: '/finance/advanced/tax-filing', icon: ShieldAlert },
          ]
        },
        {
          name: 'Planning & Reporting',
          isHeader: true,
          items: [
            { name: 'Budgeting & Planning', href: '/finance/advanced/budgeting', icon: PieChart },
            { name: 'Financial Reports', href: '/finance/advanced/reports', icon: FolderOpen },
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
            { name: 'Asset Management', href: '/hr/advanced/assets', icon: Monitor },
            { name: 'Documents Manager', href: '/hr/advanced/documents', icon: FileText },
            { name: 'Trainings & Certs', href: '/hr/advanced/trainings', icon: GraduationCap },
            { name: 'HR Helpdesk', href: '/hr/advanced/tickets', icon: HelpCircle },
            { name: 'Engagement Surveys', href: '/hr/advanced/surveys', icon: CheckSquare },
            { name: 'Public Holidays', href: '/hr/advanced/holidays', icon: CalendarDays },
            { name: 'Labor Compliance', href: '/hr/advanced/compliance', icon: ShieldCheck },
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
            { name: 'Sales Orders', href: '/crm/sales-orders', icon: ClipboardList },
          ]
        },
        {
          name: 'Marketing & Outreach',
          isHeader: true,
          items: [
            { name: 'Campaigns', href: '/crm/campaigns', icon: Target },
            { name: 'Web Forms', href: '/crm/forms', icon: Globe },
            { name: 'Email Sequences', href: '/crm/sequences', icon: Send },
            { name: 'Email Templates', href: '/crm/email-templates', icon: Mail },
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
          name: 'Sales Enablement',
          isHeader: true,
          items: [
            { name: 'Playbooks', href: '/crm/playbooks', icon: BookOpen },
            { name: 'Battlecards', href: '/crm/battlecards', icon: Target },
          ]
        },
        {
          name: 'Teams & Territories',
          isHeader: true,
          items: [
            { name: 'Territories', href: '/crm/territories', icon: MapPin },
            { name: 'Commissions', href: '/crm/commissions', icon: DollarSign },
          ]
        },
        {
          name: 'Analytics & Reports',
          isHeader: true,
          items: [
            { name: 'Forecasting', href: '/crm/forecasting', icon: TrendingUp },
            { name: 'Reports', href: '/crm/reports', icon: PieChart },
            { name: 'Dashboards', href: '/crm/dashboards', icon: Layers },
            { name: 'Advanced', href: '/crm/advanced', icon: Settings },
          ]
        },
        {
          name: 'Settings',
          isHeader: true,
          items: [
            { name: 'Custom Fields', href: '/crm/settings/custom-fields', icon: Database },
            { name: 'Record Types', href: '/crm/settings/record-types', icon: Layers },
            { name: 'Approval Processes', href: '/crm/settings/approvals', icon: ShieldCheck },
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
        { name: 'Supplier Directory', href: '/procurement/vendors', icon: Building2 }
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
        { name: 'Supply Chain Operations', href: '/supply-chain', icon: Truck }
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
  if (pathname.startsWith('/healthcare')) {
    return {
      title: 'Healthcare',
      icon: Activity,
      items: [
        { name: 'Patient EHR & Vitals', href: '/healthcare', icon: Activity }
      ]
    };
  }
  if (pathname.startsWith('/education')) {
    return {
      title: 'Education',
      icon: GraduationCap,
      items: [
        { name: 'Student Registry', href: '/education', icon: GraduationCap }
      ]
    };
  }
  if (pathname.startsWith('/real-estate')) {
    return {
      title: 'Real Estate',
      icon: Building2,
      items: [
        { name: 'Property Registry', href: '/real-estate', icon: Building2 }
      ]
    };
  }
  if (pathname.startsWith('/field-service')) {
    return {
      title: 'Field Service',
      icon: Wrench,
      items: [
        { name: 'Dispatch Board', href: '/field-service', icon: Wrench }
      ]
    };
  }
  if (pathname.startsWith('/admin')) {
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
      { name: 'Dashboard', href: '/admin', icon: Home },
      {
        name: 'Identity & Access',
        isHeader: true,
        items: [
          { name: 'Users Directory', href: '/admin/users', icon: Users },
          { name: 'User Groups & Teams', href: '/admin/groups', icon: Users },
          { name: 'User Roles', href: '/admin/access-control/roles', icon: ShieldCheck },
          { name: 'Access Packages', href: '/admin/access-control/packages', icon: Package },
          { name: 'Permissions Matrix', href: '/admin/access-control/matrix', icon: LayoutGrid },
          { name: 'SSO Configuration', href: '/admin/sso', icon: Key },
          { name: 'MFA / 2FA Settings', href: '/admin/mfa', icon: Smartphone },
          { name: 'Password Policies', href: '/admin/password-policy', icon: Key },
          { name: 'Session Management', href: '/admin/sessions', icon: Clock },
          { name: 'Login impersonation', href: '/admin/impersonate', icon: UserIcon },
          { name: 'Delegations & OOO', href: '/admin/delegations', icon: Users },
        ]
      },
      {
        name: 'Security & Compliance',
        isHeader: true,
        items: [
          { name: 'Security Control Hub', href: '/admin/security', icon: ShieldAlert },
          { name: 'IP Whitelist & Geo Rules', href: '/admin/ip-restrictions', icon: Globe },
          { name: 'Audit Trail Viewer', href: '/admin/audit-trail', icon: History },
          { name: 'Login History', href: '/admin/login-history', icon: Clock },
          { name: 'Data Retention Policies', href: '/admin/data-retention', icon: Database },
          { name: 'Compliance Reports', href: '/admin/compliance', icon: ShieldCheck },
          { name: 'GDPR Erasure Requests', href: '/admin/gdpr/erasure', icon: ShieldCheck },
          { name: 'GDPR Retention Rules', href: '/admin/gdpr/retention', icon: Database },
        ]
      },
      {
        name: 'Automation & Workflows',
        isHeader: true,
        items: [
          { name: 'Workflow Templates', href: '/admin/workflows/templates', icon: GitFork },
          { name: 'Active Approvals', href: '/admin/workflows/approvals', icon: CheckSquare },
          { name: 'Bulk Approvals', href: '/admin/workflows/bulk', icon: CheckSquare },
          { name: 'Approval Analytics', href: '/admin/workflows/analytics', icon: BarChart3 },
          { name: 'Dynamic Routing', href: '/admin/workflows/routing', icon: Zap },
          { name: 'Email Approvals', href: '/admin/workflows/email', icon: Mail },
          { name: 'Escalation Logs', href: '/admin/workflows/escalations', icon: ShieldAlert },
          { name: 'Workflow Simulator', href: '/admin/workflows/simulation', icon: Play },
          { name: 'Automation Rules', href: '/admin/automation-rules', icon: Zap },
        ]
      },
      {
        name: 'Branding & Communication',
        isHeader: true,
        items: [
          { name: 'Custom Login Page', href: '/admin/login-customizer', icon: Image },
          { name: 'Email Server (SMTP)', href: '/admin/email-config', icon: Mail },
          { name: 'Email Templates', href: '/admin/email-templates', icon: FileText },
          { name: 'Announcements', href: '/admin/announcements', icon: Bell },
          { name: 'Maintenance Mode', href: '/admin/maintenance', icon: ShieldAlert },
        ]
      },
      {
        name: 'System Operations',
        isHeader: true,
        items: [
          { name: 'System Health', href: '/admin/system-health', icon: Activity },
          { name: 'Background Jobs', href: '/admin/jobs', icon: Layers },
          { name: 'Scheduled Tasks', href: '/admin/scheduled-tasks', icon: CalendarDays },
          { name: 'Error Logs', href: '/admin/error-logs', icon: ShieldAlert },
          { name: 'Backup & Restore', href: '/admin/backups', icon: Database },
          { name: 'DB Schema Manager', href: '/admin/db-schema', icon: Database },
          { name: 'Recycle Bin', href: '/admin/recycle-bin', icon: Layers },
          { name: 'Admin Alerts', href: '/admin/alerts', icon: Bell },
          { name: 'Bulk Operations', href: '/admin/bulk-operations', icon: Layers },
        ]
      },
      {
        name: 'Platform Configuration',
        isHeader: true,
        items: [
          { name: 'General Settings', href: '/admin/settings/general', icon: Settings },
          { name: 'Branding Settings', href: '/admin/settings/branding', icon: Image },
          { name: 'Integrations Settings', href: '/admin/settings/integrations', icon: Plug },
          { name: 'Module Manager', href: '/admin/modules', icon: Settings },
          { name: 'Feature Flags', href: '/admin/feature-flags', icon: Zap },
          { name: 'Custom Domains', href: '/admin/domains', icon: Globe },
          { name: 'Environment Manager', href: '/admin/environments', icon: Server },
          { name: 'System Updates', href: '/admin/updates', icon: Cpu },
          { name: 'White-Label & PWA', href: '/admin/settings/white-label', icon: Image },
          { name: 'Custom Fields', href: '/admin/custom-fields', icon: Settings },
          { name: 'Marketplace', href: '/admin/marketplace', icon: Box },
          { name: 'Subscription & Billing', href: '/admin/subscription', icon: CreditCard },
          { name: 'Organization Hierarchy', href: '/admin/org-hierarchy', icon: Building },
        ]
      },
      {
        name: 'Data & Integration',
        isHeader: true,
        items: [
          { name: 'API Keys', href: '/admin/api-keys', icon: Key },
          { name: 'Webhooks Configuration', href: '/admin/webhooks', icon: Webhook },
          { name: 'Webhook Logs', href: '/admin/webhook-logs', icon: ExternalLink },
          { name: 'SSO & OAuth Clients', href: '/admin/api-platform/oauth', icon: Shield },
          { name: 'Developer Sandboxes', href: '/admin/api-platform/sandbox', icon: Box },
          { name: 'API Metrics & Analytics', href: '/admin/api-platform/analytics', icon: BarChart3 },
          { name: 'Import Data', href: '/admin/import', icon: Upload },
          { name: 'Export Data', href: '/admin/export', icon: Download },
          { name: 'i18n Localization', href: '/admin/localization', icon: Globe },
          { name: 'Sync Monitor', href: '/admin/sync', icon: Smartphone },
          { name: 'DevOps & Telemetry', href: '/admin/devops', icon: Server },
          { name: 'Data Quality', href: '/admin/data-quality', icon: ShieldCheck },
        ]
      },
      {
        name: 'Reports',
        isHeader: true,
        items: [
          { name: 'Scheduled Reports', href: '/admin/scheduled-reports', icon: FileText },
          { name: 'Activity Feed', href: '/admin/activity-feed', icon: Activity },
          { name: 'Notification Prefs', href: '/admin/notifications', icon: Bell },
          { name: 'Tenant Usage Analytics', href: '/admin/tenant-analytics', icon: BarChart3 },
        ]
      }
    ];

    if (isSuperAdmin) {
      items.push({
        name: 'Super Admin Tools',
        isHeader: true,
        items: [
          { name: 'Super Admin Dashboard', href: '/admin/super-admin', icon: Home },
          { name: 'Tenants', href: '/admin/super-admin/tenants', icon: Building },
          { name: 'Admin Users', href: '/admin/super-admin/admins', icon: Users },
          { name: 'System Health', href: '/admin/super-admin/health', icon: Activity },
        ]
      });
    }

    return {
      title: 'Admin Control Center',
      icon: ShieldAlert,
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
  if (pathname.startsWith('/saas')) {
    return {
      title: 'SaaS Portal',
      icon: Cloud,
      items: [
        { name: 'Subscription Plans', href: '/saas/portal', icon: Cloud }
      ]
    };
  }
  if (pathname.startsWith('/builder')) {
    return {
      title: 'Studio',
      icon: Cpu,
      items: [
        { name: 'Builder Overview', href: '/builder', icon: Layers },
        {
          name: 'App Studio',
          isHeader: true,
          items: [
            { name: 'App Studio Overview', href: '/builder/erp', icon: Cpu },
            { name: 'Form Builder', href: '/builder/erp/forms', icon: FileCode2 },
            { name: 'Workflow Builder', href: '/builder/erp/workflows', icon: Workflow },
            { name: 'Dashboard Builder', href: '/builder/erp/dashboards', icon: BarChart3 },
            { name: 'Custom Modules', href: '/builder/erp/modules', icon: Database },
            { name: 'Business Logic', href: '/builder/erp/logic', icon: Play },
            { name: 'Data Import', href: '/builder/erp/data', icon: Layers },
          ]
        },
        {
          name: 'Web Studio',
          isHeader: true,
          items: [
            { name: 'CMS Collections', href: '/builder/web/collections', icon: Database },
            { name: 'Pages', href: '/builder/web/pages', icon: Globe },
            { name: 'Blog Posts', href: '/builder/web/blog', icon: FileText },
            { name: 'Asset Manager', href: '/builder/web/assets', icon: Image },
            { name: 'Templates', href: '/builder/web/templates', icon: Code2 },
            { name: 'Navigation Menus', href: '/builder/web/menus', icon: Layers },
            { name: 'SEO Manager', href: '/builder/web/seo', icon: BarChart3 },
            { name: 'Orders', href: '/builder/web/orders', icon: ShoppingCart },
            { name: 'Form Submissions', href: '/builder/web/submissions', icon: Inbox },
          ]
        },
      ] as SidebarItem[]
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

const GLOBAL_SEARCH_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, type: 'App' },
  { name: 'Finance & Accounting', href: '/finance', icon: CreditCard, type: 'App' },
  { name: 'Human Resources', href: '/hr', icon: Users, type: 'App' },
  { name: 'CRM & Sales', href: '/crm', icon: BarChart3, type: 'App' },
  { name: 'Inventory & Stock', href: '/inventory', icon: Package, type: 'App' },
  { name: 'Procurement', href: '/procurement', icon: ShoppingCart, type: 'App' },
  { name: 'Sales & Orders', href: '/sales', icon: ClipboardList, type: 'App' },
  { name: 'Supply Chain', href: '/supply-chain', icon: Truck, type: 'App' },
  { name: 'Project Management', href: '/projects', icon: Briefcase, type: 'App' },
  { name: 'Manufacturing', href: '/manufacturing', icon: Hammer, type: 'App' },
  { name: 'Business Intelligence', href: '/analytics', icon: PieChart, type: 'App' },
  { name: 'Drive', href: '/drive', icon: FolderOpen, type: 'App' },
  { name: 'Connect', href: '/connect', icon: MessageSquare, type: 'App' },
  { name: 'POS & Retail', href: '/pos', icon: Store, type: 'App' },
  { name: 'Admin', href: '/admin', icon: ShieldAlert, type: 'App' },
  { name: 'Studio', href: '/builder', icon: Cpu, type: 'App' },
  // Actions — General
  { name: 'Create New User', href: '/admin/users/new', icon: UserIcon, type: 'Action' },
  { name: 'Create Invoice', href: '/finance', icon: CreditCard, type: 'Action' },
  { name: 'Add Product', href: '/inventory/products/new', icon: Package, type: 'Action' },
  // Finance — Core Accounting
  { name: 'Chart of Accounts', href: '/finance/advanced/chart-of-accounts', icon: CreditCard, type: 'Action' },
  { name: 'Journal Entries', href: '/finance/advanced/journal-entries', icon: FileSliders, type: 'Action' },
  { name: 'Financial Periods', href: '/finance/advanced/financial-periods', icon: Activity, type: 'Action' },
  { name: 'Fixed Assets', href: '/finance/advanced/fixed-assets', icon: Building2, type: 'Action' },
  // Finance — Payables & Treasury
  { name: 'Bank Accounts', href: '/finance/advanced/bank-accounts', icon: Wallet, type: 'Action' },
  { name: 'AP Automation', href: '/finance/advanced/ap-automation', icon: ShoppingCart, type: 'Action' },
  { name: 'AR Automation', href: '/finance/advanced/ar-automation', icon: ClipboardList, type: 'Action' },
  { name: 'Treasury & Investments', href: '/finance/advanced/treasury', icon: BarChart3, type: 'Action' },
  // Finance — Tax & Compliance
  { name: 'Tax Engine', href: '/finance/advanced/tax-engine', icon: GitFork, type: 'Action' },
  { name: 'Tax Filing', href: '/finance/advanced/tax-filing', icon: ShieldAlert, type: 'Action' },
  // Finance — Planning & Reporting
  { name: 'Budgeting & Planning', href: '/finance/advanced/budgeting', icon: PieChart, type: 'Action' },
  { name: 'Financial Reports', href: '/finance/advanced/reports', icon: FolderOpen, type: 'Action' },
  // Admin — Actions & Pages
  { name: 'User Groups & Teams', href: '/admin/groups', icon: Users, type: 'Action' },
  { name: 'User Roles Configuration', href: '/admin/access-control/roles', icon: ShieldCheck, type: 'Action' },
  { name: 'Access Packages Configuration', href: '/admin/access-control/packages', icon: Package, type: 'Action' },
  { name: 'Permissions Matrix Checkbox Grid', href: '/admin/access-control/matrix', icon: LayoutGrid, type: 'Action' },
  { name: 'SSO Configuration', href: '/admin/sso', icon: Key, type: 'Action' },
  { name: 'MFA / 2FA Settings', href: '/admin/mfa', icon: Smartphone, type: 'Action' },
  { name: 'Password Policies', href: '/admin/password-policy', icon: Key, type: 'Action' },
  { name: 'Session Management', href: '/admin/sessions', icon: Clock, type: 'Action' },
  { name: 'Login Impersonation', href: '/admin/impersonate', icon: UserIcon, type: 'Action' },
  { name: 'IP Whitelist & Geo Rules', href: '/admin/ip-restrictions', icon: Globe, type: 'Action' },
  { name: 'Audit Trail Viewer', href: '/admin/audit-trail', icon: History, type: 'Action' },
  { name: 'Login History', href: '/admin/login-history', icon: Clock, type: 'Action' },
  { name: 'Data Retention Policies', href: '/admin/data-retention', icon: Database, type: 'Action' },
  { name: 'Compliance Reports', href: '/admin/compliance', icon: ShieldCheck, type: 'Action' },
  { name: 'GDPR Erasure Requests Registry', href: '/admin/gdpr/erasure', icon: ShieldCheck, type: 'Action' },
  { name: 'GDPR Retention Rules Configurator', href: '/admin/gdpr/retention', icon: Database, type: 'Action' },
  { name: 'Workflow Configuration Templates', href: '/admin/workflows/templates', icon: GitFork, type: 'Action' },
  { name: 'Active Workflow Approvals Log', href: '/admin/workflows/approvals', icon: CheckSquare, type: 'Action' },
  { name: 'Bulk Workflow Approvals', href: '/admin/workflows/bulk', icon: CheckSquare, type: 'Action' },
  { name: 'Workflow Approvals Cycle Analytics', href: '/admin/workflows/analytics', icon: BarChart3, type: 'Action' },
  { name: 'Workflow Dynamic Routing Rules', href: '/admin/workflows/routing', icon: Zap, type: 'Action' },
  { name: 'Email Approvals & Expiry Settings', href: '/admin/workflows/email', icon: Mail, type: 'Action' },
  { name: 'General Settings Profile & Prefix', href: '/admin/settings/general', icon: Settings, type: 'Action' },
  { name: 'Branding Settings Color & Logo', href: '/admin/settings/branding', icon: Image, type: 'Action' },
  { name: 'Integrations Settings SMTP & Stripe', href: '/admin/settings/integrations', icon: Plug, type: 'Action' },
  { name: 'API Keys Registry & Scopes', href: '/admin/api-keys', icon: Key, type: 'Action' },
  { name: 'Webhooks Configuration Registry', href: '/admin/webhooks', icon: Webhook, type: 'Action' },
  { name: 'Webhook Deliveries Logs History', href: '/admin/webhook-logs', icon: ExternalLink, type: 'Action' },
  { name: 'SSO & OAuth 2.0 Clients Registry', href: '/admin/api-platform/oauth', icon: Shield, type: 'Action' },
  { name: 'Developer Sandboxes Isolation Hub', href: '/admin/api-platform/sandbox', icon: Box, type: 'Action' },
  { name: 'API Latency Metrics & Analytics', href: '/admin/api-platform/analytics', icon: BarChart3, type: 'Action' },
  { name: 'Import Data CSV & JSON Tool', href: '/admin/import', icon: Upload, type: 'Action' },
  { name: 'Export Data CSV & JSON Tool', href: '/admin/export', icon: Download, type: 'Action' },
  { name: 'Custom Login Page Designer', href: '/admin/login-customizer', icon: Image, type: 'Action' },
  { name: 'Email Server (SMTP) Configuration', href: '/admin/email-config', icon: Mail, type: 'Action' },
  { name: 'Email Templates Manager', href: '/admin/email-templates', icon: FileText, type: 'Action' },
  { name: 'Announcements', href: '/admin/announcements', icon: Bell, type: 'Action' },
  { name: 'Maintenance Mode Control', href: '/admin/maintenance', icon: ShieldAlert, type: 'Action' },
  { name: 'System Health Dashboard', href: '/admin/system-health', icon: Activity, type: 'Action' },
  { name: 'Background Jobs Monitor', href: '/admin/jobs', icon: Layers, type: 'Action' },
  { name: 'Scheduled Tasks Cron Manager', href: '/admin/scheduled-tasks', icon: CalendarDays, type: 'Action' },
  { name: 'Error Logs Viewer', href: '/admin/error-logs', icon: ShieldAlert, type: 'Action' },
  { name: 'Backup & Restore Manager', href: '/admin/backups', icon: Database, type: 'Action' },
  { name: 'DB Schema Manager', href: '/admin/db-schema', icon: Database, type: 'Action' },
  { name: 'Module Manager', href: '/admin/modules', icon: Settings, type: 'Action' },
  { name: 'Feature Flags Toggles', href: '/admin/feature-flags', icon: Zap, type: 'Action' },
  { name: 'Custom Domains Configuration', href: '/admin/domains', icon: Globe, type: 'Action' },
  { name: 'Environment Sync Sandbox', href: '/admin/environments', icon: Server, type: 'Action' },
  { name: 'System Updates Checker', href: '/admin/updates', icon: Cpu, type: 'Action' },
  { name: 'Tenant Usage & Storage Analytics', href: '/admin/tenant-analytics', icon: BarChart3, type: 'Action' },
];

function SidebarNavigation({ appNav, pathname, collapsed }: { appNav: { title: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; items: SidebarItem[] }; pathname: string; collapsed: boolean }) {
  const searchParams = useSearchParams();
  const [customPages, setCustomPages] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/v1/builder/page-registries', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const pages = await res.json();
          if (isMounted) setCustomPages(Array.isArray(pages) ? pages : (pages?.data || []));
        } else {
          // fallback
          const reg = localStorage.getItem('unerp_page_registry');
          if (reg && isMounted) setCustomPages(JSON.parse(reg));
        }
      } catch {
        const reg = localStorage.getItem('unerp_page_registry');
        if (reg && isMounted) setCustomPages(JSON.parse(reg));
      }
    };
    load();
    window.addEventListener('unerp_page_registry_updated', load);
    return () => {
      isMounted = false;
      window.removeEventListener('unerp_page_registry_updated', load);
    };
  }, []);

  const enhancedItems = React.useMemo(() => {
    const activeModulePrefix = pathname.split('/')[1];
    const moduleCustomPages = customPages.filter(p => p.module.toLowerCase() === activeModulePrefix?.toLowerCase() && !p.isOverride && p.status === 'PUBLISHED');

    if (moduleCustomPages.length === 0) return appNav.items;

    const newItems = [...appNav.items];
    const customLinks = moduleCustomPages.map(p => ({
      name: p.title || p.pageName || 'Custom Page',
      href: `/app/${p.module}/${p.slug}`,
      icon: FileText
    }));

    newItems.push({
      name: 'Custom Extensions',
      isHeader: true,
      items: customLinks
    });

    return newItems;
  }, [appNav.items, customPages, pathname]);

  const renderItem = (item: SidebarItem, isSub = false) => {
    if (item.isHeader) {
      if (collapsed) {
        return (
          <React.Fragment key={item.name}>
            <div style={{ height: '1px', background: 'var(--color-border)', margin: 'var(--space-2) 0' }} />
            {item.items?.map(sub => renderItem(sub, true))}
          </React.Fragment>
        );
      }
      return (
        <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-3)' }}>
          <div style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-tertiary)',
            letterSpacing: '0.05em',
            padding: 'var(--space-1) var(--space-3)',
          }}>
            {item.name}
          </div>
          {item.items?.map(sub => renderItem(sub, true))}
        </div>
      );
    }

    const href = item.href || '#';
    const isActive = (() => {
      const parts = href.split('?');
      const itemPath = parts[0] || '';
      const itemQuery = parts[1] || '';

      const isPathMatch = (itemPath === '/inventory' || itemPath === '/builder' || itemPath === '/dashboard' || itemPath === '/drive' || itemPath === '/storage')
        ? pathname === itemPath
        : (pathname === itemPath || pathname.startsWith(itemPath + '/'));

      if (!isPathMatch) return false;

      if (itemPath === '/drive') {
        const activeView = searchParams.get('view') || 'personal';
        const itemParams = new URLSearchParams(itemQuery);
        const itemView = itemParams.get('view') || 'personal';
        return activeView === itemView;
      }

      if ((itemPath.includes('/hr/advanced') || itemPath.includes('/inventory/advanced')) && itemQuery) {
        const activeTab = searchParams.get('tab') || (itemPath.includes('/hr/advanced') ? 'payroll' : 'entries');
        const itemParams = new URLSearchParams(itemQuery);
        const itemTab = itemParams.get('tab');
        return pathname === itemPath && activeTab === itemTab;
      }

      return true;
    })();
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-2.5) var(--space-3)',
          paddingLeft: isSub && !collapsed ? 'var(--space-5)' : 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          color: isActive ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)',
          background: isActive ? 'var(--color-sidebar-active)' : 'transparent',
          textDecoration: 'none',
          fontSize: 'var(--text-sm)',
          fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-normal)',
          transition: 'all var(--duration-fast) var(--ease-default)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'var(--color-sidebar-hover)';
            e.currentTarget.style.color = 'var(--color-sidebar-text-active)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-sidebar-text)';
          }
        }}
      >
        {Icon && <Icon size={18} style={{ flexShrink: 0, color: isActive ? 'var(--color-primary)' : 'inherit' }} />}
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <>
      {enhancedItems.map(item => renderItem(item))}
    </>
  );
}

const SEGMENT_NAMES: Record<string, string> = {
  apps: 'Apps',
  crm: 'CRM',
  finance: 'Finance',
  hr: 'HR',
  inventory: 'Inventory',
  procurement: 'Procurement',
  projects: 'Projects',
  manufacturing: 'Manufacturing',
  pos: 'POS',
  communication: 'Connect',
  connect: 'Connect',
  drive: 'Drive',
  analytics: 'Analytics',
  admin: 'Admin',
  settings: 'Settings',
  profile: 'Profile',
  builder: 'Studio',
  collections: 'CMS Collections',
  submissions: 'Form Submissions',
  store: 'App Store',
  'real-estate': 'Real Estate',
  healthcare: 'Healthcare',
  education: 'Education',
  'field-service': 'Field Service',
  saas: 'SaaS',
  security: 'Security',
  marketplace: 'Marketplace',
  'api-platform': 'API Platform',
  'api-key-whitelists': 'API Key Whitelists',
  'api-integration-hub': 'API Integration Hub',
  'i18n-localization': 'i18n Localization',
  'sync-monitor': 'Sync Monitor',
  'devops-telemetry': 'DevOps & Telemetry',
  customers: 'Customers',
  vendors: 'Vendors',
  contacts: 'Contacts',
  leads: 'Leads',
  opportunities: 'Opportunities',
  quotations: 'Quotations',
  reports: 'Reports',
  'sales-orders': 'Sales Orders',
  activities: 'Activities',
  'email-templates': 'Email Templates',
  advanced: 'Advanced',
  'purchase-orders': 'Purchase Orders',
  'purchase-receipts': 'Purchase Receipts',
  returns: 'Returns',
  rfqs: 'RFQs',
  'supplier-quotations': 'Supplier Quotations',
  'delivery-notes': 'Delivery Notes',
  orders: 'Orders',
  'client-portal': 'Client Portal',
  health: 'Strategic Health',
  portfolios: 'Portfolios',
  workloads: 'Workloads',
  boms: 'BOMs',
  configurator: 'Configurator',
  diagnostics: 'Diagnostics',
  mrp: 'MRP',
  quality: 'Quality',
  'shop-floor': 'Shop Floor',
  designer: 'Receipt Designer',
  'ap-automation': 'AP Automation',
  'ar-automation': 'AR Automation',
  'bank-accounts': 'Bank Accounts',
  budgeting: 'Budgeting',
  'chart-of-accounts': 'Chart of Accounts',
  'financial-periods': 'Financial Periods',
  'fixed-assets': 'Fixed Assets',
  'journal-entries': 'Journal Entries',
  'tax-engine': 'Tax Engine',
  'tax-filing': 'Tax Filing',
  treasury: 'Treasury',
  appraisals: 'Appraisals',
  assets: 'Assets',
  attendance: 'Attendance',
  benefits: 'Benefits',
  compliance: 'Compliance',
  feedback: 'Feedback',
  goals: 'Goals',
  holidays: 'Holidays',
  leaves: 'Leaves',
  offboarding: 'Offboarding',
  onboarding: 'Onboarding',
  payroll: 'Payroll',
  positions: 'Positions',
  recruitment: 'Recruitment',
  'self-service': 'Self-Service',
  shifts: 'Shifts',
  skills: 'Skills',
  succession: 'Succession',
  surveys: 'Surveys',
  tickets: 'Tickets',
  trainings: 'Trainings',
  batches: 'Batches',
  'bin-locations': 'Bin Locations',
  'cycle-counts': 'Cycle Counts',
  'qa-inspections': 'QA Inspections',
  'serial-numbers': 'Serial Numbers',
  'stock-entries': 'Stock Entries',
  'stock-ledger': 'Stock Ledger',
  'stock-levels': 'Stock Levels',
  valuations: 'Valuations',
  warehouses: 'Warehouses',
  escalations: 'Escalations',
  simulation: 'Simulation',
  requisitions: 'Requisitions',
  'blanket-agreements': 'Blanket Agreements',
  portal: 'Portal',
  'super-admin': 'Super Admin',
  'access-control': 'Access Control',
  tenants: 'Tenants',
  admins: 'Admin Users',
  'activity-feed': 'Activity Feed',
  announcements: 'Announcements',
  'scheduled-reports': 'Scheduled Reports',
  notifications: 'Notifications',
  'import-export': 'Import / Export',
  gdpr: 'GDPR',
  workflows: 'Workflows',
  templates: 'Templates',
  quotas: 'Storage Quotas',
  media: 'Media Conversion',
  groups: 'User Groups',
  mfa: 'MFA Settings',
  'password-policy': 'Password Policies',
  sessions: 'Sessions',
  impersonate: 'Impersonate User',
  'ip-restrictions': 'IP Restrictions',
  'audit-trail': 'Audit Trail',
  'login-history': 'Login History',
  'data-retention': 'Data Retention',
  'login-customizer': 'Login Customizer',
  'email-config': 'SMTP Server',
  maintenance: 'Maintenance Mode',
  'system-health': 'System Health',
  jobs: 'Background Jobs',
  'scheduled-tasks': 'Scheduled Tasks',
  'error-logs': 'Error Logs',
  backups: 'Database Backups',
  'db-schema': 'Database Schema',
  modules: 'Module Manager',
  'feature-flags': 'Feature Flags',
  domains: 'Custom Domains',
  environments: 'Environments',
  updates: 'System Updates',
  'tenant-analytics': 'Tenant Analytics',
  bulk: 'Bulk Approvals',
  routing: 'Dynamic Routing',
  email: 'Email Approvals',
  general: 'General Settings',
  branding: 'Branding & Appearance',
  integrations: 'Integrations',
  import: 'Import Data',
  export: 'Export Data',
  erasure: 'GDPR Erasure',
  retention: 'GDPR Retention',
  webhooks: 'Webhooks Configuration',
  'webhook-logs': 'Webhook Logs',
  oauth: 'SSO & OAuth',
  sandbox: 'Developer Sandbox',
  roles: 'User Roles',
  packages: 'Access Packages',
  matrix: 'Permissions Matrix',
};

const formatSegment = (segment: string): string => {
  const name = SEGMENT_NAMES[segment.toLowerCase()];
  if (name) {
    return name;
  }
  return segment
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);

  const userDropdownRef = React.useRef<HTMLDivElement>(null);
  const tenantDropdownRef = React.useRef<HTMLDivElement>(null);
  const appsDropdownRef = React.useRef<HTMLDivElement>(null);
  const searchDropdownRef = React.useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; avatar?: string } | null>(null);
  const [currentTenant, setCurrentTenant] = useState({ name: 'Acme Corp', slug: 'acme' });
  const tenants = [
    { name: 'Acme Corp', slug: 'acme' },
    { name: 'Stark Industries', slug: 'stark' },
    { name: 'Wayne Enterprises', slug: 'wayne' },
  ];

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (tenantDropdownRef.current && !tenantDropdownRef.current.contains(event.target as Node)) {
        setTenantDropdownOpen(false);
      }
      if (appsDropdownRef.current && !appsDropdownRef.current.contains(event.target as Node)) {
        setAppsDropdownOpen(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      // Verify token with backend
      if (storedToken !== 'mock-token-xyz') {
        fetch('/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        }).then(res => {
          if (res.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            router.push('/login');
          }
        }).catch(() => { });
      }

      // Fetch installed apps for the switcher
      const fetchInstalledApps = async () => {
        try {
          const res = await fetch('/api/v1/saas/installed-apps', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const installedList: string[] = await res.json();
            setInstalledApps(installedList);

            // Check client-side app installation guard for industry/premium paths
            const segments = pathname.split('/');
            const activeSegment = segments[1];
            const industryApps = ['healthcare', 'education', 'real-estate', 'field-service'];

            if (activeSegment && industryApps.includes(activeSegment)) {
              if (!installedList.includes(activeSegment)) {
                // Not installed! Redirect back to Apps landing
                router.push('/apps');
              }
            }
          }
        } catch {
          // failed to verify app installation state
        }
      };
      fetchInstalledApps();

      // Fetch demo data status
      fetch('/api/v1/admin/demo/status', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      }).then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.loaded) setDemoDataLoaded(true); })
        .catch(() => { });
    } else {
      router.push('/login');
    }

    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') as 'light' | 'dark' || 'light';
    setTheme(currentTheme);
  }, [router, pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleTenantSwitch = (t: typeof currentTenant) => {
    setCurrentTenant(t);
    setTenantDropdownOpen(false);
  };

  const isAppsLanding = pathname === '/apps' || pathname === '/apps/store';
  const hideSidebar = isAppsLanding || pathname === '/profile' || pathname.startsWith('/profile/');
  const appNav = getAppSpecificNavigation(pathname);

  // Dynamic Breadcrumb Computation
  const pathSegments = pathname.split('/').filter(Boolean);
  const showBreadcrumbs = !isAppsLanding && !pathname.startsWith('/builder') && pathSegments.length > 0;

  const breadcrumbsList = [];
  if (showBreadcrumbs) {
    // Always start with the Desk/Apps root link
    breadcrumbsList.push({
      name: 'Apps',
      href: '/apps',
    });

    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      if (segment === 'apps') return; // Skip duplicate apps segment

      breadcrumbsList.push({
        name: formatSegment(segment),
        href: currentPath,
      });
    });
  }

  // Define all apps like in apps/page.tsx for the switcher hierarchy
  const allApplications = [
    { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: Home, installed: true },
    { id: 'finance', name: 'Finance & Accounting', href: '/finance', icon: CreditCard, installed: true },
    { id: 'hr', name: 'Human Resources', href: '/hr', icon: Users, installed: true },
    { id: 'crm', name: 'CRM & Sales', href: '/crm', icon: BarChart3, installed: true },
    { id: 'inventory', name: 'Inventory & Stock', href: '/inventory', icon: Package, installed: true },
    { id: 'procurement', name: 'Procurement', href: '/procurement', icon: ShoppingCart, installed: true },
    { id: 'sales', name: 'Sales & Orders', href: '/sales', icon: ClipboardList, installed: true },
    { id: 'supply-chain', name: 'Supply Chain', href: '/supply-chain', icon: Truck, installed: true },
    { id: 'projects', name: 'Project Management', href: '/projects', icon: Briefcase, installed: true },
    { id: 'manufacturing', name: 'Manufacturing', href: '/manufacturing', icon: Hammer, installed: true },
    { id: 'analytics', name: 'Business Intelligence', href: '/analytics', icon: PieChart, installed: true },
    { id: 'drive', name: 'Drive', href: '/drive', icon: FolderOpen, installed: true },
    { id: 'communication', name: 'Connect', href: '/connect', icon: MessageSquare, installed: true },
    { id: 'pos', name: 'POS & Retail', href: '/pos', icon: Store, installed: true },
    { id: 'healthcare', name: 'Healthcare Module', href: '/healthcare', icon: Activity, installed: false },
    { id: 'education', name: 'Education Module', href: '/education', icon: GraduationCap, installed: false },
    { id: 'real-estate', name: 'Real Estate Module', href: '/real-estate', icon: Building2, installed: false },
    { id: 'field-service', name: 'Field Service Module', href: '/field-service', icon: Wrench, installed: false },
    { id: 'api-keys', name: 'API Platform', href: '/admin/api-keys', icon: Key, installed: true },
    { id: 'saas', name: 'SaaS Portal', href: '/saas/portal', icon: Cloud, installed: true },
    { id: 'admin', name: 'Admin', href: '/admin', icon: ShieldAlert, installed: true },
    { id: 'app-store', name: 'App Store', href: '/apps/store', icon: ShoppingBag, installed: true },
    { id: 'builder', name: 'Studio', href: '/builder', icon: Cpu, installed: true },
  ];

  const switcherFolders = [
    {
      id: 'developer',
      name: 'Developer',
      color: '#334155',
      appIds: ['api-keys', 'app-store', 'builder', 'saas'],
    },
  ];

  const activeApps = allApplications.filter(app => app.installed || installedApps.includes(app.id));
  const folderAppIds = switcherFolders.flatMap(f => f.appIds);
  const rootApps = activeApps.filter(app => !folderAppIds.includes(app.id));
  const visibleFolders = switcherFolders.filter(f => activeApps.filter(a => f.appIds.includes(a.id)).length > 0);

  const switcherItems = [
    ...visibleFolders.map(folder => ({
      type: 'folder' as const,
      id: folder.id,
      name: folder.name,
      color: folder.color,
      apps: activeApps.filter(a => folder.appIds.includes(a.id)).sort((a, b) => a.name.localeCompare(b.name))
    })),
    ...rootApps.map(app => ({
      type: 'app' as const,
      id: app.id,
      name: app.name,
      href: app.href,
      icon: app.icon
    }))
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Sidebar Section */}
      {!hideSidebar && (
        <aside
          style={{
            width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
            background: 'var(--color-sidebar-bg)',
            borderRight: '1px solid var(--color-sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width var(--duration-normal) var(--ease-default)',
            zIndex: 100,
            position: 'sticky',
            top: 0,
            height: '100vh',
          }}
        >
          {/* Sidebar Header / Brand Logo */}
          <div
            style={{
              height: 'var(--header-height)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              padding: '0 var(--space-4)',
              borderBottom: '1px solid var(--color-sidebar-border)',
            }}
          >
            {!collapsed && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontWeight: 'var(--weight-bold)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-sidebar-text-active)',
                }}
              >
                <appNav.icon size={18} style={{ color: 'var(--color-primary)' }} />
                <span>{appNav.title}</span>
              </div>
            )}
            {collapsed ? (
              <button
                onClick={() => setCollapsed(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-sidebar-text)',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-sidebar-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <Menu size={18} />
              </button>
            ) : (
              <button
                onClick={() => setCollapsed(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-sidebar-text)',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-sidebar-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav
            style={{
              flex: 1,
              padding: 'var(--space-4) var(--space-2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
              overflowY: 'auto',
            }}
          >
            <Suspense fallback={<div className="flex-1" />}>
              <SidebarNavigation appNav={appNav} pathname={pathname} collapsed={collapsed} />
            </Suspense>
          </nav>

          {/* Sidebar Footer */}
          <div
            style={{
              padding: 'var(--space-4)',
              borderTop: '1px solid var(--color-sidebar-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: 'var(--space-3)',
            }}
          >
            {collapsed ? (
              <button
                onClick={() => setCollapsed(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-sidebar-text)',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Menu size={18} />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2.5)', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-xs)',
                    flexShrink: 0,
                  }}
                >
                  {user ? `${user.firstName[0]}${user.lastName[0]}` : 'SU'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-sidebar-text-active)',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                  </p>
                  <p
                    style={{
                      fontSize: '10px',
                      color: 'var(--color-sidebar-text)',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user ? user.email : 'admin@uni-erp.com'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Workspace Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Panel */}
        <header
          style={{
            height: 'var(--header-height)',
            background: 'var(--color-bg-elevated)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-6)',
            zIndex: 90,
          }}
        >
          {/* Top Left: Apps Switcher & Tenant Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {!isAppsLanding && (
                <div style={{ position: 'relative' }} ref={appsDropdownRef}>
                  <button
                    onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
                    className="frappe-btn frappe-btn-secondary"
                    style={{ padding: 'var(--space-1.5) var(--space-3)', gap: 'var(--space-1)' }}
                  >
                    <span>Switch App</span>
                    <ChevronDown
                      size={14}
                      style={{
                        color: 'var(--color-text-secondary)',
                        transform: appsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform var(--duration-fast) var(--ease-default)',
                      }}
                    />
                  </button>
                  {appsDropdownOpen && (
                    <div className="frappe-dropdown frappe-dropdown-left frappe-dropdown-apps">
                      <p className="frappe-dropdown-header">Applications</p>
                      {switcherItems.map((item) => {
                        if (item.type === 'folder') {
                          const isExpanded = !!expandedFolders[item.id];
                          return (
                            <React.Fragment key={item.id}>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setExpandedFolders(prev => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
                                  }));
                                }}
                                className="frappe-dropdown-item frappe-dropdown-folder"
                              >
                                <FolderOpen size={14} style={{ color: item.color }} />
                                <span>{item.name}</span>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                                  <ChevronRight
                                    size={12}
                                    style={{
                                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                      transition: 'transform var(--duration-fast) var(--ease-default)',
                                    }}
                                  />
                                </div>
                              </button>
                              {isExpanded && (
                                <div className="frappe-dropdown-item-nested-container">
                                  {item.apps.map((app) => {
                                    const isSubActive = pathname.startsWith(app.href);
                                    return (
                                      <button
                                        key={app.name}
                                        onClick={() => { router.push(app.href); setAppsDropdownOpen(false); }}
                                        className={`frappe-dropdown-item-nested ${isSubActive ? 'active' : ''}`}
                                      >
                                        <app.icon size={13} style={{ opacity: 0.6 }} />
                                        <span>{app.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </React.Fragment>
                          );
                        } else {
                          const app = item;
                          const isPathActive = pathname.startsWith(app.href);
                          return (
                            <button
                              key={app.name}
                              onClick={() => { router.push(app.href); setAppsDropdownOpen(false); }}
                              className={`frappe-dropdown-item ${isPathActive ? 'active' : ''}`}
                            >
                              <app.icon size={14} style={{ color: isPathActive ? 'var(--color-primary)' : 'var(--color-text-secondary)', opacity: 0.8 }} />
                              <span>{app.name}</span>
                            </button>
                          );
                        }
                      })}
                      <div className="frappe-dropdown-divider" />
                      <button
                        onClick={() => { router.push('/apps'); setAppsDropdownOpen(false); }}
                        className="frappe-dropdown-item"
                      >
                        <LayoutGrid size={14} style={{ color: 'var(--color-text-secondary)' }} />
                        <span>Desk</span>
                      </button>
                      <button
                        onClick={() => { router.push('/apps/store'); setAppsDropdownOpen(false); }}
                        className="frappe-dropdown-item"
                      >
                        <ShoppingBag size={14} style={{ color: 'var(--color-text-secondary)' }} />
                        <span>App store</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tenant Selector Dropdown */}
              <div style={{ position: 'relative' }} ref={tenantDropdownRef}>
                <button
                  onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
                  className="frappe-btn frappe-btn-secondary"
                  style={{ padding: 'var(--space-1.5) var(--space-3)', gap: 'var(--space-1)' }}
                >
                  <span>{currentTenant.name}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--color-text-secondary)',
                      transform: tenantDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform var(--duration-fast) var(--ease-default)',
                    }}
                  />
                </button>
                {tenantDropdownOpen && (
                  <div className="frappe-dropdown frappe-dropdown-left frappe-dropdown-tenant">
                    <p className="frappe-dropdown-header">Switch Tenant</p>
                    {tenants.map((t) => {
                      const isTenantActive = currentTenant.slug === t.slug;
                      return (
                        <button
                          key={t.slug}
                          onClick={() => handleTenantSwitch(t)}
                          className={`frappe-dropdown-item ${isTenantActive ? 'active' : ''}`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Right: Search, Dark mode, Notification, Profiler */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {!isAppsLanding && (
              <div
                ref={searchDropdownRef}
                style={{
                  position: 'relative',
                  width: '16rem',
                  display: 'block',
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-3)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-tertiary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search apps, actions..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(e.target.value.length > 0);
                  }}
                  className="frappe-input"
                  style={{
                    paddingLeft: 'var(--space-8)',
                  }}
                  onFocus={(e) => {
                    if (searchQuery.length > 0) setSearchOpen(true);
                  }}
                />

                {/* Dynamic Search Dropdown Results */}
                {searchOpen && searchQuery.length > 0 && (
                  <div className="frappe-dropdown frappe-dropdown-right frappe-dropdown-search">
                    <p className="frappe-dropdown-header">Search Results</p>
                    {GLOBAL_SEARCH_ITEMS.filter(item =>
                      item.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).slice(0, 10).map((result) => (
                      <button
                        key={result.name}
                        onClick={() => { router.push(result.href); setSearchOpen(false); setSearchQuery(''); }}
                        className="frappe-dropdown-item"
                      >
                        <result.icon size={14} style={{ color: result.type === 'App' ? 'var(--color-primary)' : 'var(--color-text-secondary)', opacity: 0.8 }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'var(--weight-medium)' }}>{result.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{result.type}</span>
                        </div>
                      </button>
                    ))}
                    {GLOBAL_SEARCH_ITEMS.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div style={{ padding: 'var(--space-3) var(--space-2)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="frappe-btn frappe-btn-secondary"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell */}
            <button
              className="frappe-btn frappe-btn-secondary"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Bell size={18} />
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-danger)',
                }}
              />
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 var(--space-1)' }} />

            {/* User Dropdown */}
            <div style={{ position: 'relative' }} ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  {user ? `${user.firstName[0]}${user.lastName[0]}` : 'SU'}
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--color-text-secondary)',
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform var(--duration-fast) var(--ease-default)',
                  }}
                />
              </button>

              {userDropdownOpen && (
                <div className="frappe-dropdown frappe-dropdown-right frappe-dropdown-user">
                  <div style={{ padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-0.5)' }}>
                    <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                      {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                    </p>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user ? user.email : 'admin@uni-erp.com'}
                    </p>
                  </div>
                  <button
                    onClick={() => { router.push('/profile'); setUserDropdownOpen(false); }}
                    className="frappe-dropdown-item"
                  >
                    <UserIcon size={14} style={{ color: 'var(--color-text-secondary)' }} /> Profile
                  </button>
                  <button
                    onClick={() => { router.push('/admin/settings'); setUserDropdownOpen(false); }}
                    className="frappe-dropdown-item"
                  >
                    <Settings size={14} style={{ color: 'var(--color-text-secondary)' }} /> Settings
                  </button>
                  <div className="frappe-dropdown-divider" />
                  <button
                    onClick={handleLogout}
                    className="frappe-dropdown-item frappe-dropdown-item-danger"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View Workspace */}
        <main
          style={{
            flex: 1,
            padding: pathname.startsWith('/builder') ? '0' : 'var(--space-6) var(--space-8)',
            overflowY: 'auto',
            background: 'var(--color-bg)',
          }}
        >
          <div style={{ maxWidth: pathname.startsWith('/builder') ? '100%' : 'var(--content-max-width)', margin: '0 auto' }}>
            {showBreadcrumbs && breadcrumbsList.length > 0 && (
              <nav className="frappe-breadcrumb" aria-label="breadcrumb">
                {breadcrumbsList.map((crumb, idx) => {
                  const isLast = idx === breadcrumbsList.length - 1;
                  return (
                    <React.Fragment key={crumb.href}>
                      {idx > 0 && <span className="frappe-breadcrumb-separator">/</span>}
                      {isLast ? (
                        <span className="frappe-breadcrumb-active">
                          {crumb.name}
                        </span>
                      ) : (
                        <Link href={crumb.href} className="frappe-breadcrumb-link">
                          {crumb.name}
                        </Link>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            )}
            {demoDataLoaded && (
              <DemoBanner
                currentModule={pathname.split('/')[1]}
                onRemoved={() => setDemoDataLoaded(false)}
              />
            )}
            {children}
          </div>
        </main>
      </div>

      {/* SVG Gradient declaration for Brand Logo */}
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
