'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Award, Coffee, CalendarDays, DollarSign, Clock, Monitor, FileText, UserPlus, UserMinus, Target, Star, TrendingUp, HelpCircle, CheckSquare } from 'lucide-react';
import {
  Home,
  CreditCard,
  Users,
  BarChart3,
  Package,
  ShieldAlert,
  Menu,
  ChevronLeft,
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
  Image,
  Code2,
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
            { name: 'Quotations', href: '/crm/quotations', icon: FileText },
            { name: 'Sales Orders', href: '/crm/sales-orders', icon: ClipboardList },
          ]
        },
        {
          name: 'Activities & Analytics',
          isHeader: true,
          items: [
            { name: 'Marketing Campaigns', href: '/crm/campaigns', icon: Target },
            { name: 'Activities', href: '/crm/activities', icon: Activity },
            { name: 'Email Templates', href: '/crm/email-templates', icon: Mail },
            { name: 'CRM Reports', href: '/crm/reports', icon: PieChart },
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
        { name: 'Products Catalog', href: '/inventory', icon: Package },
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
  if (pathname.startsWith('/documents') || pathname.startsWith('/storage')) {
    return {
      title: 'Document Management',
      icon: FolderOpen,
      items: [
        { name: 'Documents & Folders', href: '/documents', icon: FolderOpen },
        { name: 'Advanced Document Mgmt', href: '/documents/advanced', icon: FileText },
        {
          name: 'Cloud Storage',
          isHeader: true,
          items: [
            { name: 'Files Explorer', href: '/storage', icon: HardDrive },
            { name: 'Presigned Urls', href: '/storage', icon: Key },
            { name: 'Storage & Templates Pro', href: '/storage/advanced', icon: Database },
          ]
        }
      ]
    };
  }
  if (pathname.startsWith('/communication')) {
    return {
      title: 'Communication',
      icon: MessageSquare,
      items: [
        { name: 'Internal Chats', href: '/communication', icon: MessageSquare },
        { name: 'Advanced Messaging & Threading', href: '/communication/advanced', icon: Mail }
      ]
    };
  }
  if (pathname.startsWith('/pos')) {
    return {
      title: 'POS & Retail',
      icon: Store,
      items: [
        { name: 'POS Terminals', href: '/pos', icon: Store },
        { name: 'Advanced POS Features', href: '/pos/advanced', icon: Activity },
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
    return {
      title: 'Administration',
      icon: ShieldAlert,
      items: [
        { name: 'Users List', href: '/admin/users', icon: ShieldAlert },
        { name: 'Security Control Hub', href: '/admin/security', icon: ShieldCheck },
        { name: 'App Marketplace', href: '/admin/marketplace', icon: Package },
        {
          name: 'System Platform',
          isHeader: true,
          items: [
            { name: 'API Key Whitelists', href: '/admin/api-keys', icon: Key },
            { name: 'API Integration Hub', href: '/admin/api-platform', icon: Server },
            { name: 'i18n Localization', href: '/admin/localization', icon: Globe },
            { name: 'Sync Monitor', href: '/admin/sync', icon: Smartphone },
            { name: 'DevOps & Telemetry', href: '/admin/devops', icon: Server },
          ]
        }
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
      title: 'Builder Studio',
      icon: Cpu,
      items: [
        { name: 'Builder Overview', href: '/builder', icon: Layers },
        {
          name: 'ERP App Builder',
          isHeader: true,
          items: [
            { name: 'App Builder Overview', href: '/builder/erp', icon: Cpu },
            { name: 'Form Builder', href: '/builder/erp/forms', icon: FileCode2 },
            { name: 'Workflow Builder', href: '/builder/erp/workflows', icon: Workflow },
            { name: 'Dashboard Builder', href: '/builder/erp/dashboards', icon: BarChart3 },
            { name: 'Custom Modules', href: '/builder/erp/modules', icon: Database },
            { name: 'Business Logic', href: '/builder/erp/logic', icon: Play },
            { name: 'Data Import', href: '/builder/erp/data', icon: Layers },
          ]
        },
        {
          name: 'Website Builder',
          isHeader: true,
          items: [
            { name: 'Pages', href: '/builder/web/pages', icon: Globe },
            { name: 'Blog Posts', href: '/builder/web/blog', icon: FileText },
            { name: 'Asset Manager', href: '/builder/web/assets', icon: Image },
            { name: 'Templates', href: '/builder/web/templates', icon: Code2 },
            { name: 'Navigation Menus', href: '/builder/web/menus', icon: Layers },
            { name: 'SEO Manager', href: '/builder/web/seo', icon: BarChart3 },
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
  { name: 'Document Management', href: '/documents', icon: FolderOpen, type: 'App' },
  { name: 'Communication', href: '/communication', icon: MessageSquare, type: 'App' },
  { name: 'POS & Retail', href: '/pos', icon: Store, type: 'App' },
  { name: 'Workflows', href: '/workflows', icon: GitFork, type: 'App' },
  { name: 'Files & Storage', href: '/storage', icon: HardDrive, type: 'App' },
  { name: 'API Platform', href: '/admin/api-keys', icon: Key, type: 'App' },
  { name: 'Administration', href: '/admin/users', icon: ShieldAlert, type: 'App' },
  { name: 'Builder Studio', href: '/builder', icon: Cpu, type: 'App' },
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
        return <div key={item.name} style={{ height: '1px', background: 'var(--color-border)', margin: 'var(--space-4) 0' }} />;
      }
      return (
        <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-4)' }}>
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
      
      const isPathMatch = (itemPath === '/inventory' || itemPath === '/builder' || itemPath === '/dashboard')
        ? pathname === itemPath 
        : (pathname === itemPath || pathname.startsWith(itemPath + '/'));
        
      if (!isPathMatch) return false;

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [installedApps, setInstalledApps] = useState<string[]>([]);

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

  // Compute active & sorted switcher apps
  const coreApps = GLOBAL_SEARCH_ITEMS.filter(item => item.type === 'App');
  const optionalAppsMetadata = [
    { name: 'Healthcare Module', href: '/healthcare', icon: Activity, type: 'App', id: 'healthcare' },
    { name: 'Education Module', href: '/education', icon: GraduationCap, type: 'App', id: 'education' },
    { name: 'Real Estate Module', href: '/real-estate', icon: Building2, type: 'App', id: 'real-estate' },
    { name: 'Field Service Module', href: '/field-service', icon: Wrench, type: 'App', id: 'field-service' }
  ];
  const installedOptionalApps = optionalAppsMetadata.filter(app => installedApps.includes(app.id));
  const switcherApps = [...coreApps, ...installedOptionalApps].sort((a, b) => a.name.localeCompare(b.name));

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
          {/* Top Left: Search & Mobile Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1 }}>

            {!isAppsLanding && (
              <div
                ref={searchDropdownRef}
                style={{
                  position: 'relative',
                  maxWidth: '20rem',
                  width: '100%',
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
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-8)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    fontSize: 'var(--text-sm)',
                    outline: 'none',
                    color: 'var(--color-text)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = 'var(--color-bg-elevated)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary-light)';
                    if (searchQuery.length > 0) setSearchOpen(true);
                  }}
                />

                {/* Dynamic Search Dropdown Results */}
                {searchOpen && searchQuery.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: 'var(--space-1.5)',
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 150,
                      padding: 'var(--space-1.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)',
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}
                  >
                    <p
                      style={{
                        margin: 'var(--space-1) var(--space-2) var(--space-2) var(--space-2)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--color-text-tertiary)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Search Results
                    </p>
                    {GLOBAL_SEARCH_ITEMS.filter(item =>
                      item.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).slice(0, 10).map((result) => (
                      <button
                        key={result.name}
                        onClick={() => { router.push(result.href); setSearchOpen(false); setSearchQuery(''); }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: 'var(--space-2) var(--space-2.5)',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--color-text)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <result.icon size={15} style={{ color: result.type === 'App' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {!isAppsLanding && (
                <>
                  {/* Apps Home Button */}
                  <button
                    onClick={() => router.push('/apps')}
                    className="frappe-btn frappe-btn-secondary"
                    style={{ padding: 'var(--space-1.5) var(--space-3)' }}
                  >
                    <LayoutGrid size={15} style={{ color: 'var(--color-text-secondary)' }} />
                    <span>Apps Home</span>
                  </button>

                  {/* Apps Switcher Dropdown */}
                  <div style={{ position: 'relative' }} ref={appsDropdownRef}>
                    <button
                      onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
                      className="frappe-btn frappe-btn-secondary"
                      style={{ padding: 'var(--space-1.5) var(--space-3)' }}
                    >
                      <LayoutGrid size={15} style={{ color: 'var(--color-primary)' }} />
                      <span>Switch App</span>
                      <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                    {appsDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: 'var(--space-1.5)',
                          background: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-lg)',
                          boxShadow: 'var(--shadow-lg)',
                          width: '16rem',
                          maxHeight: '70vh',
                          overflowY: 'auto',
                          zIndex: 110,
                          padding: 'var(--space-1.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-1)',
                        }}
                      >
                        <p
                          style={{
                            margin: 'var(--space-1) var(--space-2) var(--space-2) var(--space-2)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--weight-semibold)',
                            color: 'var(--color-text-tertiary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Applications
                        </p>
                        {switcherApps.map((app) => (
                          <button
                            key={app.name}
                            onClick={() => { router.push(app.href); setAppsDropdownOpen(false); }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: 'var(--space-2) var(--space-2.5)',
                              border: 'none',
                              background: pathname.startsWith(app.href) ? 'var(--color-primary-light)' : 'transparent',
                              color: pathname.startsWith(app.href) ? 'var(--color-primary)' : 'var(--color-text)',
                              borderRadius: 'var(--radius-md)',
                              fontSize: 'var(--text-sm)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-2)',
                            }}
                            onMouseEnter={(e) => {
                              if (!pathname.startsWith(app.href)) e.currentTarget.style.background = 'var(--color-bg-hover)';
                            }}
                            onMouseLeave={(e) => {
                              if (!pathname.startsWith(app.href)) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <app.icon size={15} />
                            {app.name}
                          </button>
                        ))}
                        <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-1) 0' }} />
                        <button
                          onClick={() => { router.push('/apps/store'); setAppsDropdownOpen(false); }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: 'var(--space-2) var(--space-2.5)',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-text)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <LayoutGrid size={15} /> All Applications...
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Tenant Selector Dropdown */}
              <div style={{ position: 'relative' }} ref={tenantDropdownRef}>
                <button
                  onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
                  className="frappe-btn frappe-btn-secondary"
                  style={{ padding: 'var(--space-1.5) var(--space-3)' }}
                >
                  <Building size={15} style={{ color: 'var(--color-primary)' }} />
                  <span>{currentTenant.name}</span>
                  <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
                {tenantDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 'var(--space-1.5)',
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                      width: '12rem',
                      zIndex: 110,
                      padding: 'var(--space-1.5)',
                    }}
                  >
                    <p
                      style={{
                        margin: 'var(--space-1) var(--space-2) var(--space-2) var(--space-2)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--color-text-tertiary)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Switch Tenant
                    </p>
                    {tenants.map((t) => (
                      <button
                        key={t.slug}
                        onClick={() => handleTenantSwitch(t)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: 'var(--space-2) var(--space-2.5)',
                          border: 'none',
                          background: currentTenant.slug === t.slug ? 'var(--color-primary-light)' : 'transparent',
                          color: currentTenant.slug === t.slug ? 'var(--color-primary)' : 'var(--color-text)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (currentTenant.slug !== t.slug) {
                            e.currentTarget.style.background = 'var(--color-bg-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentTenant.slug !== t.slug) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Right: System settings, Notification, Dark mode, Profiler */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell */}
            <button
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
                <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
              </button>

              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 'var(--space-1.5)',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    width: '200px',
                    zIndex: 110,
                    padding: 'var(--space-1.5)',
                  }}
                >
                  <div style={{ padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
                    <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                      {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                    </p>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user ? user.email : 'admin@uni-erp.com'}
                    </p>
                  </div>
                  <div style={{ padding: 'var(--space-1.5) 0' }}>
                    <button
                      onClick={() => { router.push('/profile'); setUserDropdownOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 'var(--space-2) var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        fontSize: 'var(--text-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <UserIcon size={14} /> Profile
                    </button>
                    <button
                      onClick={() => { router.push('/admin/settings'); setUserDropdownOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 'var(--space-2) var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        fontSize: 'var(--text-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Settings size={14} /> Settings
                    </button>
                  </div>
                  <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-1.5) 0 0 0' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 'var(--space-2) var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-danger)',
                        fontSize: 'var(--text-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-light)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
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
