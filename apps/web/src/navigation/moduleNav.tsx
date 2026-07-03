import React from 'react';
import {
  Activity, Award, BarChart3, Bell, BookOpen, Box, Briefcase, Building, Building2,
  Calendar, CalendarDays, CheckSquare, ClipboardCheck, ClipboardList, Clock, Cloud,
  Code2, Coffee, Cpu, CreditCard, Database, DollarSign, Download, ExternalLink, Eye,
  FileCode2, FileSliders, FileText, FolderOpen, GitFork, Globe, GraduationCap, Hammer,
  HardDrive, HelpCircle, History, Home, Image, Inbox, Key, Layers, LayoutDashboard,
  LayoutGrid, Mail, MapPin, MessageSquare, Monitor, Package, Percent, PieChart, Play,
  Plug, QrCode, Receipt, RefreshCw, Scale, Send, Server, Settings, Shield, ShieldAlert,
  ShieldCheck, ShoppingCart, Smartphone, Star, Store, Target, Trash2, TrendingUp, Truck,
  Upload, User as UserIcon, UserMinus, UserPlus, Users, Video, Wallet, Warehouse, Webhook,
  Workflow, Wrench, Zap, Link, GitBranch,
} from 'lucide-react';
import type { SidebarItem } from './types';

/**
 * Returns the sidebar navigation for the module owning the given pathname.
 * Lifted verbatim from the former monolithic dashboard layout so behaviour is
 * unchanged. The return type is `ModuleNav`.
 */
export const getAppSpecificNavigation = (pathname: string): { title: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; items: SidebarItem[] } => {
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
            { name: 'Recurring Invoices', href: '/finance/advanced/recurring', icon: RefreshCw },
            { name: 'Revenue Recognition', href: '/finance/advanced/revenue-schedules', icon: TrendingUp },
          ]
        },
        {
          name: 'Payables & Treasury',
          isHeader: true,
          items: [
            { name: 'Bank Accounts', href: '/finance/advanced/bank-accounts', icon: Wallet },
            { name: 'Bank Reconciliation', href: '/finance/advanced/reconciliations', icon: GitFork },
            { name: 'AP Automation', href: '/finance/advanced/ap-automation', icon: ShoppingCart },
            { name: 'AR Automation', href: '/finance/advanced/ar-automation', icon: ClipboardList },
            { name: 'Treasury & Investments', href: '/finance/advanced/treasury', icon: BarChart3 },
            { name: 'Expense Management', href: '/finance/advanced/expense-reports', icon: Receipt },
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
            { name: 'Finance Audit Trail', href: '/finance/advanced/audit-logs', icon: Eye },
            { name: 'Account Reconciliation', href: '/finance/advanced/account-reconciliation', icon: GitFork },
          ]
        },
        {
          name: 'Planning & Reporting',
          isHeader: true,
          items: [
            { name: 'Budgeting & Planning', href: '/finance/advanced/budgeting', icon: PieChart },
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
          name: 'Customer Service',
          isHeader: true,
          items: [
            { name: 'Cases & SLA', href: '/crm/cases', icon: HelpCircle },
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
            { name: 'Shipments', href: '/supply-chain/shipments', icon: Package },
            { name: 'Shipment Tracking', href: '/supply-chain/tracking', icon: MapPin },
            { name: 'Carrier Management', href: '/supply-chain/carriers', icon: Truck },
            { name: 'Route Optimization', href: '/supply-chain/routes', icon: MapPin },
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
