import { defineModule, defineResource } from '@unerp/framework';

// ─────────────────────────────────────────────────
// CRM module definition — Phase 2 framework
// migration (see .ai/UI_FRAMEWORK_PLAN.md).
// Pages under app/(dashboard)/crm consume these
// schemas instead of hand-rolled fetch/table/form code.
// ─────────────────────────────────────────────────

export const customerResource = defineResource({
  name: 'customers',
  labelSingular: 'Customer',
  labelPlural: 'Customers',
  endpoint: '/crm/customers',
  titleField: 'name',
  permissions: {
    read: 'crm.customer.read',
    create: 'crm.customer.create',
    update: 'crm.customer.update',
    delete: 'crm.customer.delete',
  },
  status: {
    field: 'status',
    tones: {
      ACTIVE: 'success',
      INACTIVE: 'neutral',
      BLOCKED: 'danger',
    },
  },
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Stark Industries' },
    {
      name: 'type',
      label: 'Customer Type',
      type: 'select',
      required: true,
      defaultValue: 'COMPANY',
      options: [
        { value: 'COMPANY', label: 'Company' },
        { value: 'INDIVIDUAL', label: 'Individual' },
      ],
    },
    {
      name: 'customerType',
      label: 'Engagement Category',
      type: 'select',
      defaultValue: 'RECURRING',
      options: [
        { value: 'RECURRING', label: 'Recurring Customer' },
        { value: 'ONE_TIME', label: 'One-Time / Guest' },
        { value: 'PARTNER', label: 'Partner / Channel' },
      ],
    },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'phone', placeholder: '+1-555-0000' },
    { name: 'taxId', label: 'Tax ID', type: 'text' },
    { name: 'creditLimit', label: 'Credit Limit', type: 'currency', min: 0, defaultValue: 5000 },
    // Number (days) on the API — kept numeric so create/update payloads match
    { name: 'paymentTerms', label: 'Payment Terms (days)', type: 'number', min: 0, defaultValue: 30, hint: 'e.g. 30 for Net 30' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'ACTIVE',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
      ],
    },
  ],
  list: {
    columns: ['name', 'type', 'email', 'phone', 'creditLimit', 'paymentTerms', 'status'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'name', direction: 'asc' },
    filters: ['type', 'status'],
    selectable: true,
    savedViews: true,
    inlineEdit: ['creditLimit'],
    render: {
      paymentTerms: (row) => `Net ${row.paymentTerms}`,
    },
  },
  form: {
    sections: [
      { title: 'Identity', fields: ['name', 'type', 'customerType', 'email', 'phone', 'taxId'] },
      { title: 'Commercial Terms', fields: ['creditLimit', 'paymentTerms', 'status'] },
    ],
  },
});

export const contactResource = defineResource({
  name: 'contacts',
  labelSingular: 'Contact',
  labelPlural: 'Contacts',
  endpoint: '/crm/contacts',
  titleField: 'firstName',
  permissions: {
    read: 'crm.contact.read',
    create: 'crm.contact.create',
    update: 'crm.contact.update',
    delete: 'crm.contact.delete',
  },
  fields: [
    { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'First Name' },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Last Name' },
    { name: 'customerId', label: 'Customer', type: 'link', link: { resource: 'customers', labelField: 'name' }, placeholder: 'Select customer...' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'phone', placeholder: 'Phone number' },
    { name: 'mobile', label: 'Mobile', type: 'phone', placeholder: 'Mobile number' },
    { name: 'title', label: 'Title', type: 'text', placeholder: 'e.g. Sales Manager' },
    { name: 'department', label: 'Department', type: 'text', placeholder: 'e.g. Sales' },
    { name: 'isPrimary', label: 'Primary Contact', type: 'boolean', defaultValue: false },
    {
      name: 'buyingRole',
      label: 'Buying Role',
      type: 'select',
      defaultValue: 'INFLUENCER',
      options: [
        { value: 'INFLUENCER', label: 'Influencer' },
        { value: 'DECISION_MAKER', label: 'Decision Maker' },
        { value: 'CHAMPION', label: 'Champion' },
        { value: 'GATEKEEPER', label: 'Gatekeeper' },
        { value: 'USER', label: 'End User' },
        { value: 'SPONSOR', label: 'Executive Sponsor' },
        { value: 'BUYER', label: 'Economic Buyer' },
      ],
    },
    {
      name: 'lifecycleStatus',
      label: 'Lifecycle Status',
      type: 'select',
      defaultValue: 'ACTIVE',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'PROSPECT', label: 'Prospect' },
        { value: 'LEAD', label: 'Lead' },
      ],
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  list: {
    columns: ['firstName', 'lastName', 'customerId', 'email', 'phone', 'title', 'buyingRole'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'firstName', direction: 'asc' },
    filters: ['buyingRole', 'lifecycleStatus'],
    selectable: true,
    savedViews: true,
  },
});

export const leadResource = defineResource({
  name: 'leads',
  labelSingular: 'Lead',
  labelPlural: 'Leads',
  endpoint: '/crm/leads',
  titleField: 'firstName',
  permissions: {
    read: 'crm.lead.read',
    create: 'crm.lead.create',
    update: 'crm.lead.update',
    delete: 'crm.lead.delete',
  },
  status: {
    field: 'status',
    tones: {
      NEW: 'info',
      CONTACTED: 'warning',
      QUALIFIED: 'success',
      DISQUALIFIED: 'danger',
      CONVERTED: 'neutral',
    },
  },
  fields: [
    { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'First Name' },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Last Name' },
    { name: 'company', label: 'Company', type: 'text', placeholder: 'Company name' },
    { name: 'title', label: 'Title', type: 'text', placeholder: 'Job title' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'phone', placeholder: 'Phone number' },
    { name: 'website', label: 'Website', type: 'text', placeholder: 'https://example.com' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'NEW',
      options: [
        { value: 'NEW', label: 'New' },
        { value: 'CONTACTED', label: 'Contacted' },
        { value: 'QUALIFIED', label: 'Qualified' },
        { value: 'DISQUALIFIED', label: 'Disqualified' },
        { value: 'CONVERTED', label: 'Converted' },
      ],
    },
    { name: 'industry', label: 'Industry', type: 'text' },
    { name: 'employeeCount', label: 'Employee Count', type: 'number', min: 0 },
    { name: 'annualRevenue', label: 'Annual Revenue', type: 'currency', min: 0 },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  list: {
    columns: ['firstName', 'lastName', 'company', 'email', 'phone', 'status', 'score'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'firstName', direction: 'asc' },
    filters: ['status'],
    selectable: true,
    savedViews: true,
  },
});

export const contractResource = defineResource({
  name: 'contracts',
  labelSingular: 'Contract',
  labelPlural: 'Contracts',
  endpoint: '/crm/contracts',
  titleField: 'title',
  permissions: {
    read: 'crm.contracts.read',
    create: 'crm.contracts.create',
    update: 'crm.contracts.update',
    delete: 'crm.contracts.delete',
  },
  status: {
    field: 'status',
    tones: {
      DRAFT: 'neutral',
      ACTIVE: 'success',
      EXPIRING_SOON: 'warning',
      EXPIRED: 'danger',
      TERMINATED: 'danger',
      RENEWED: 'info',
    },
  },
  fields: [
    { name: 'contractNumber', label: 'Contract Number', type: 'text', required: true, placeholder: 'e.g. CON-2026-001' },
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Contract Title' },
    { name: 'customerId', label: 'Customer', type: 'link', link: { resource: 'customers', labelField: 'name' }, placeholder: 'Select customer...' },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      defaultValue: 'SALES',
      options: [
        { value: 'SALES', label: 'Sales' },
        { value: 'PURCHASE', label: 'Purchase' },
        { value: 'SERVICE', label: 'Service' },
        { value: 'NDA', label: 'NDA' },
        { value: 'OTHER', label: 'Other' },
      ],
    },
    { name: 'value', label: 'Value', type: 'currency', required: true, min: 0 },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', required: true },
    { name: 'renewalDate', label: 'Renewal Date', type: 'date' },
    { name: 'autoRenew', label: 'Auto Renew', type: 'boolean', defaultValue: false },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'DRAFT',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
        { value: 'EXPIRED', label: 'Expired' },
        { value: 'TERMINATED', label: 'Terminated' },
        { value: 'RENEWED', label: 'Renewed' },
      ],
    },
    { name: 'terms', label: 'Terms & Conditions', type: 'textarea' },
  ],
  list: {
    columns: ['contractNumber', 'title', 'customerId', 'type', 'value', 'startDate', 'endDate', 'status'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'contractNumber', direction: 'asc' },
    filters: ['type', 'status'],
    selectable: true,
    savedViews: true,
  },
});

export const opportunityResource = defineResource({
  name: 'opportunities',
  labelSingular: 'Opportunity',
  labelPlural: 'Opportunities',
  endpoint: '/crm/opportunities',
  titleField: 'name',
  permissions: {
    read: 'crm.opportunity.read',
    create: 'crm.opportunity.create',
    update: 'crm.opportunity.update',
    delete: 'crm.opportunity.delete',
  },
  status: {
    field: 'stage',
    tones: {
      PROSPECTING: 'neutral',
      QUALIFICATION: 'info',
      PROPOSAL: 'warning',
      NEGOTIATION: 'warning',
      CLOSED_WON: 'success',
      CLOSED_LOST: 'danger',
    },
  },
  fields: [
    { name: 'name', label: 'Deal Name', type: 'text', required: true, placeholder: 'e.g. Arc Reactor Supply Deal' },
    { name: 'customerId', label: 'Customer', type: 'link', link: { resource: 'customers', labelField: 'name' }, required: true, placeholder: 'Select customer...' },
    {
      name: 'stage',
      label: 'Stage',
      type: 'select',
      defaultValue: 'PROSPECTING',
      options: [
        { value: 'PROSPECTING', label: 'Prospecting' },
        { value: 'QUALIFICATION', label: 'Qualification' },
        { value: 'PROPOSAL', label: 'Proposal' },
        { value: 'NEGOTIATION', label: 'Negotiation' },
        { value: 'CLOSED_WON', label: 'Closed Won' },
        { value: 'CLOSED_LOST', label: 'Closed Lost' },
      ],
    },
    { name: 'amount', label: 'Amount', type: 'currency', min: 0, defaultValue: 0 },
    { name: 'probability', label: 'Probability (%)', type: 'number', min: 0, max: 100, defaultValue: 10 },
    { name: 'expectedCloseDate', label: 'Expected Close Date', type: 'date' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  list: {
    columns: ['name', 'customerId', 'stage', 'amount', 'probability', 'expectedCloseDate'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'name', direction: 'asc' },
    filters: ['stage'],
    selectable: true,
    savedViews: true,
  },
});

export const caseResource = defineResource({
  name: 'cases',
  labelSingular: 'Case',
  labelPlural: 'Cases',
  endpoint: '/crm/cases',
  titleField: 'subject',
  permissions: {
    read: 'crm.cases.read',
    create: 'crm.cases.create',
    update: 'crm.cases.update',
    delete: 'crm.cases.delete',
  },
  status: {
    field: 'status',
    tones: {
      OPEN: 'info',
      WORKING: 'warning',
      RESOLVED: 'success',
      CLOSED: 'neutral',
    },
  },
  fields: [
    { name: 'caseNumber', label: 'Case Number', type: 'text', readOnly: true },
    { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'e.g. Cannot log in to portal' },
    { name: 'customerId', label: 'Customer', type: 'link', link: { resource: 'customers', labelField: 'name' }, placeholder: 'Select customer...' },
    { name: 'contactId', label: 'Contact', type: 'link', link: { resource: 'contacts', labelField: 'firstName' }, placeholder: 'Select contact...' },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      defaultValue: 'MEDIUM',
      options: [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'URGENT', label: 'Urgent' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'OPEN',
      options: [
        { value: 'OPEN', label: 'Open' },
        { value: 'WORKING', label: 'Working' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'CLOSED', label: 'Closed' },
      ],
    },
    {
      name: 'channel',
      label: 'Channel',
      type: 'select',
      defaultValue: 'WEB',
      options: [
        { value: 'EMAIL', label: 'Email' },
        { value: 'PHONE', label: 'Phone' },
        { value: 'WEB', label: 'Web' },
        { value: 'CHAT', label: 'Chat' },
        { value: 'OTHER', label: 'Other' },
      ],
    },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  list: {
    columns: ['caseNumber', 'subject', 'customerId', 'priority', 'status', 'channel'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'caseNumber', direction: 'asc' },
    filters: ['status', 'priority'],
    selectable: true,
    savedViews: true,
  },
});

export const priceBookResource = defineResource({
  name: 'price-books',
  labelSingular: 'Price Book',
  labelPlural: 'Price Books',
  endpoint: '/crm/price-books',
  titleField: 'name',
  permissions: {
    read: 'crm.pricebook.read',
    create: 'crm.pricebook.create',
    update: 'crm.pricebook.update',
    delete: 'crm.pricebook.delete',
  },
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Enterprise Tier Price Book' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
  ],
  list: {
    columns: ['name', 'description', 'isActive'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'name', direction: 'asc' },
  },
});

export const crmProductResource = defineResource({
  name: 'products',
  labelSingular: 'Product',
  labelPlural: 'Products',
  endpoint: '/crm/products',
  titleField: 'name',
  permissions: {
    read: 'crm.product.read',
    create: 'crm.product.create',
    update: 'crm.product.update',
    delete: 'crm.product.delete',
  },
  status: {
    field: 'status',
    tones: {
      ACTIVE: 'success',
      DRAFT: 'warning',
      DISCONTINUED: 'danger',
    },
  },
  fields: [
    { name: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'e.g. LIC-ENT-001' },
    { name: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g. Enterprise License' },
    { name: 'sellPrice', label: 'Sell Price', type: 'currency', required: true, min: 0, defaultValue: 0 },
    { name: 'costPrice', label: 'Cost Price', type: 'currency', min: 0, defaultValue: 0 },
    { name: 'category', label: 'Category', type: 'text' },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      defaultValue: 'GOODS',
      options: [
        { value: 'GOODS', label: 'Goods' },
        { value: 'SERVICE', label: 'Service' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'ACTIVE',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'DISCONTINUED', label: 'Discontinued' },
      ],
    },
    { name: 'requiresApproval', label: 'Requires Approval', type: 'boolean', defaultValue: false },
  ],
  list: {
    columns: ['sku', 'name', 'sellPrice', 'costPrice', 'category', 'type', 'status'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'name', direction: 'asc' },
    filters: ['type', 'status'],
    selectable: true,
    savedViews: true,
  },
});

export const vendorResource = defineResource({
  name: 'vendors',
  labelSingular: 'Vendor',
  labelPlural: 'Vendors',
  endpoint: '/crm/vendors',
  titleField: 'name',
  permissions: {
    read: 'crm.vendor.read',
    create: 'crm.vendor.create',
    update: 'crm.vendor.update',
    delete: 'crm.vendor.delete',
  },
  status: {
    field: 'status',
    tones: {
      ACTIVE: 'success',
      INACTIVE: 'neutral',
      BLOCKED: 'danger',
    },
  },
  fields: [
    { name: 'name', label: 'Vendor Name', type: 'text', required: true, placeholder: 'e.g. Acme Supplier Corp' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'phone', placeholder: 'Phone number' },
    { name: 'taxId', label: 'Tax ID', type: 'text' },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      defaultValue: 'COMPANY',
      options: [
        { value: 'COMPANY', label: 'Company' },
        { value: 'INDIVIDUAL', label: 'Individual' },
      ],
    },
    { name: 'paymentTerms', label: 'Payment Terms (days)', type: 'number', min: 0, defaultValue: 30 },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'ACTIVE',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'BLOCKED', label: 'Blocked' },
      ],
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  list: {
    columns: ['name', 'email', 'phone', 'taxId', 'type', 'paymentTerms', 'status'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'name', direction: 'asc' },
    filters: ['status', 'type'],
    selectable: true,
    savedViews: true,
  },
});

export const activityResource = defineResource({
  name: 'activities',
  labelSingular: 'Activity',
  labelPlural: 'Activities',
  endpoint: '/crm/activities',
  titleField: 'subject',
  permissions: {
    read: 'crm.activity.read',
    create: 'crm.activity.create',
    update: 'crm.activity.update',
    delete: 'crm.activity.delete',
  },
  status: {
    field: 'type',
    tones: {
      CALL: 'info',
      EMAIL: 'info',
      MEETING: 'warning',
      NOTE: 'neutral',
      TASK: 'success',
    },
  },
  fields: [
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      defaultValue: 'NOTE',
      options: [
        { value: 'CALL', label: 'Call' },
        { value: 'EMAIL', label: 'Email' },
        { value: 'MEETING', label: 'Meeting' },
        { value: 'NOTE', label: 'Note' },
        { value: 'TASK', label: 'Task' },
      ],
    },
    { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'e.g. Discussed pricing' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  list: {
    columns: ['type', 'subject', 'description', 'createdAt'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'createdAt', direction: 'desc' },
    filters: ['type'],
  },
});

export const crmModule = defineModule({
  id: 'crm',
  title: 'CRM',
  basePath: '/crm',
  permission: 'crm.customer.read',
  resources: [
    customerResource,
    contactResource,
    leadResource,
    contractResource,
    opportunityResource,
    caseResource,
    priceBookResource,
    crmProductResource,
    vendorResource,
    activityResource,
  ],
});
