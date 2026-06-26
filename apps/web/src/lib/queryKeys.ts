export const queryKeys = {
  // Finance
  finance: {
    all: ['finance'] as const,
    invoices: () => [...queryKeys.finance.all, 'invoices'] as const,
    invoice: (id: string) => [...queryKeys.finance.invoices(), id] as const,
    payments: () => [...queryKeys.finance.all, 'payments'] as const,
    accounts: () => [...queryKeys.finance.all, 'accounts'] as const,
    journals: () => [...queryKeys.finance.all, 'journals'] as const,
    budgets: () => [...queryKeys.finance.all, 'budgets'] as const,
    fixedAssets: () => [...queryKeys.finance.all, 'fixed-assets'] as const,
    bankAccounts: () => [...queryKeys.finance.all, 'bank-accounts'] as const,
    taxRules: () => [...queryKeys.finance.all, 'tax-rules'] as const,
    reports: () => [...queryKeys.finance.all, 'reports'] as const,
  },

  // CRM
  crm: {
    all: ['crm'] as const,
    customers: () => [...queryKeys.crm.all, 'customers'] as const,
    customer: (id: string) => [...queryKeys.crm.customers(), id] as const,
    vendors: () => [...queryKeys.crm.all, 'vendors'] as const,
    contacts: () => [...queryKeys.crm.all, 'contacts'] as const,
    contact: (id: string) => [...queryKeys.crm.contacts(), id] as const,
    leads: () => [...queryKeys.crm.all, 'leads'] as const,
    lead: (id: string) => [...queryKeys.crm.leads(), id] as const,
    opportunities: () => [...queryKeys.crm.all, 'opportunities'] as const,
    opportunity: (id: string) => [...queryKeys.crm.opportunities(), id] as const,
    pipelines: () => [...queryKeys.crm.all, 'pipelines'] as const,
    activities: () => [...queryKeys.crm.all, 'activities'] as const,
    campaigns: () => [...queryKeys.crm.all, 'campaigns'] as const,
    territories: () => [...queryKeys.crm.all, 'territories'] as const,
    commissions: () => [...queryKeys.crm.all, 'commissions'] as const,
    dashboards: () => [...queryKeys.crm.all, 'dashboards'] as const,
  },

  // HR
  hr: {
    all: ['hr'] as const,
    employees: () => [...queryKeys.hr.all, 'employees'] as const,
    employee: (id: string) => [...queryKeys.hr.employees(), id] as const,
    departments: () => [...queryKeys.hr.all, 'departments'] as const,
    payroll: () => [...queryKeys.hr.all, 'payroll'] as const,
    attendance: () => [...queryKeys.hr.all, 'attendance'] as const,
    leaves: () => [...queryKeys.hr.all, 'leaves'] as const,
    appraisals: () => [...queryKeys.hr.all, 'appraisals'] as const,
    recruitment: () => [...queryKeys.hr.all, 'recruitment'] as const,
    trainings: () => [...queryKeys.hr.all, 'trainings'] as const,
  },

  // Inventory
  inventory: {
    all: ['inventory'] as const,
    products: () => [...queryKeys.inventory.all, 'products'] as const,
    product: (id: string) => [...queryKeys.inventory.products(), id] as const,
    warehouses: () => [...queryKeys.inventory.all, 'warehouses'] as const,
    stockLevels: () => [...queryKeys.inventory.all, 'stock-levels'] as const,
    stockEntries: () => [...queryKeys.inventory.all, 'stock-entries'] as const,
    stockLedger: () => [...queryKeys.inventory.all, 'stock-ledger'] as const,
    serialNumbers: () => [...queryKeys.inventory.all, 'serial-numbers'] as const,
    batches: () => [...queryKeys.inventory.all, 'batches'] as const,
    binLocations: () => [...queryKeys.inventory.all, 'bin-locations'] as const,
    cycleCounts: () => [...queryKeys.inventory.all, 'cycle-counts'] as const,
    valuations: () => [...queryKeys.inventory.all, 'valuations'] as const,
  },

  // Procurement
  procurement: {
    all: ['procurement'] as const,
    purchaseOrders: () => [...queryKeys.procurement.all, 'purchase-orders'] as const,
    rfqs: () => [...queryKeys.procurement.all, 'rfqs'] as const,
    vendors: () => [...queryKeys.procurement.all, 'vendors'] as const,
    receipts: () => [...queryKeys.procurement.all, 'receipts'] as const,
    contracts: () => [...queryKeys.procurement.all, 'contracts'] as const,
  },

  // Sales
  sales: {
    all: ['sales'] as const,
    quotations: () => [...queryKeys.sales.all, 'quotations'] as const,
    orders: () => [...queryKeys.sales.all, 'orders'] as const,
    deliveryNotes: () => [...queryKeys.sales.all, 'delivery-notes'] as const,
    returns: () => [...queryKeys.sales.all, 'returns'] as const,
  },

  // Manufacturing
  manufacturing: {
    all: ['manufacturing'] as const,
    workOrders: () => [...queryKeys.manufacturing.all, 'work-orders'] as const,
    boms: () => [...queryKeys.manufacturing.all, 'boms'] as const,
    mrp: () => [...queryKeys.manufacturing.all, 'mrp'] as const,
    quality: () => [...queryKeys.manufacturing.all, 'quality'] as const,
  },

  // POS
  pos: {
    all: ['pos'] as const,
    terminal: () => [...queryKeys.pos.all, 'terminal'] as const,
    orders: () => [...queryKeys.pos.all, 'orders'] as const,
  },

  // Admin
  admin: {
    all: ['admin'] as const,
    users: () => [...queryKeys.admin.all, 'users'] as const,
    roles: () => [...queryKeys.admin.all, 'roles'] as const,
    settings: () => [...queryKeys.admin.all, 'settings'] as const,
    auditTrail: () => [...queryKeys.admin.all, 'audit-trail'] as const,
    activityFeed: () => [...queryKeys.admin.all, 'activity-feed'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    project: (id: string) => [...queryKeys.projects.list(), id] as const,
  },

  // Builder
  builder: {
    all: ['builder'] as const,
    forms: () => [...queryKeys.builder.all, 'forms'] as const,
    workflows: () => [...queryKeys.builder.all, 'workflows'] as const,
    dashboards: () => [...queryKeys.builder.all, 'dashboards'] as const,
    modules: () => [...queryKeys.builder.all, 'modules'] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },

  // AI
  ai: {
    all: ['ai'] as const,
    status: () => [...queryKeys.ai.all, 'status'] as const,
  },

  // Billing
  billing: {
    all: ['billing'] as const,
    subscription: () => [...queryKeys.billing.all, 'subscription'] as const,
    usage: () => [...queryKeys.billing.all, 'usage'] as const,
  },

  // Reporting
  reporting: {
    all: ['reporting'] as const,
    semanticLayer: () => [...queryKeys.reporting.all, 'semantic-layer'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
} as const;
