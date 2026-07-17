import { defineModule, defineResource } from '@unerp/framework';

// ─────────────────────────────────────────────────
// Finance module definition — Phase 2 framework
// migration (see .ai/UI_FRAMEWORK_PLAN.md).
// Pages under app/(dashboard)/finance consume these
// schemas instead of hand-rolled fetch/table/form code.
// ─────────────────────────────────────────────────

export const invoiceResource = defineResource({
  name: 'invoices',
  labelSingular: 'Invoice',
  labelPlural: 'Invoices',
  endpoint: '/finance/invoices',
  titleField: 'invoiceNumber',
  permissions: {
    read: 'finance.invoice.read',
    create: 'finance.invoice.create',
    update: 'finance.invoice.update',
    delete: 'finance.invoice.delete',
  },
  status: {
    field: 'status',
    tones: {
      DRAFT: 'neutral',
      SENT: 'info',
      PAID: 'success',
      PARTIALLY_PAID: 'warning',
      OVERDUE: 'danger',
      VOID: 'neutral',
    },
  },
  fields: [
    { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true, placeholder: 'INV-2026-001' },
    { name: 'customerId', label: 'Customer', type: 'link', link: { resource: 'customers', labelField: 'name' }, required: true, placeholder: 'Select customer...' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'DRAFT',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'SENT', label: 'Sent' },
        { value: 'PAID', label: 'Paid' },
        { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
        { value: 'OVERDUE', label: 'Overdue' },
        { value: 'VOID', label: 'Void' },
      ],
    },
    { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
    { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
    { name: 'totalAmount', label: 'Total Amount', type: 'currency', min: 0, defaultValue: 0 },
    { name: 'paidAmount', label: 'Paid Amount', type: 'currency', min: 0, defaultValue: 0 },
  ],
  list: {
    columns: ['invoiceNumber', 'customerId', 'status', 'issueDate', 'dueDate', 'totalAmount', 'paidAmount'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'invoiceNumber', direction: 'asc' },
    filters: ['status'],
    selectable: true,
    savedViews: true,
  },
});

export const paymentResource = defineResource({
  name: 'payments',
  labelSingular: 'Payment',
  labelPlural: 'Payments',
  endpoint: '/finance/payments',
  titleField: 'id',
  permissions: {
    read: 'finance.payment.read',
    create: 'finance.payment.create',
    update: 'finance.payment.update',
    delete: 'finance.payment.delete',
  },
  fields: [
    { name: 'invoiceId', label: 'Invoice', type: 'link', link: { resource: 'invoices', labelField: 'invoiceNumber' }, placeholder: 'Select invoice...' },
    { name: 'customerId', label: 'Customer', type: 'link', link: { resource: 'customers', labelField: 'name' }, placeholder: 'Select customer...' },
    { name: 'amount', label: 'Amount Paid', type: 'currency', required: true, min: 0 },
    {
      name: 'paymentMethod',
      label: 'Payment Method',
      type: 'select',
      defaultValue: 'BANK_TRANSFER',
      options: [
        { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
        { value: 'CREDIT_CARD', label: 'Credit Card' },
        { value: 'CASH', label: 'Cash' },
        { value: 'CHECK', label: 'Check' },
        { value: 'OTHER', label: 'Other' },
      ],
    },
    { name: 'paymentDate', label: 'Payment Date', type: 'date', required: true },
  ],
  list: {
    columns: ['invoiceId', 'customerId', 'amount', 'paymentMethod', 'paymentDate'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'paymentDate', direction: 'desc' },
    filters: ['paymentMethod'],
  },
});

export const journalResource = defineResource({
  name: 'journals',
  labelSingular: 'Journal Entry',
  labelPlural: 'Journal Entries',
  endpoint: '/advanced-finance/journals',
  titleField: 'entryNumber',
  permissions: {
    read: 'finance.journal.read',
    create: 'finance.journal.create',
    update: 'finance.journal.update',
    delete: 'finance.journal.delete',
  },
  status: {
    field: 'status',
    tones: {
      DRAFT: 'neutral',
      SUBMITTED: 'warning',
      APPROVED: 'info',
      POSTED: 'success',
      REJECTED: 'danger',
      REVERSED: 'danger',
    },
  },
  fields: [
    { name: 'entryNumber', label: 'Entry Number', type: 'text', required: true, placeholder: 'JV-2026-001' },
    { name: 'date', label: 'Posting Date', type: 'date', required: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'DRAFT',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'SUBMITTED', label: 'Submitted' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'POSTED', label: 'Posted' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'REVERSED', label: 'Reversed' },
      ],
    },
    { name: 'notes', label: 'Notes/Memo', type: 'textarea' },
  ],
  list: {
    columns: ['entryNumber', 'date', 'status', 'notes'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'entryNumber', direction: 'asc' },
    filters: ['status'],
    selectable: true,
    savedViews: true,
  },
});

export const accountResource = defineResource({
  name: 'accounts',
  labelSingular: 'Account',
  labelPlural: 'Chart of Accounts',
  endpoint: '/advanced-finance/accounts',
  titleField: 'name',
  permissions: {
    read: 'finance.account.read',
    create: 'finance.account.create',
    update: 'finance.account.update',
    delete: 'finance.account.delete',
  },
  fields: [
    { name: 'code', label: 'Account Code', type: 'text', required: true, placeholder: 'e.g. 1100' },
    { name: 'name', label: 'Account Name', type: 'text', required: true, placeholder: 'e.g. Accounts Receivable' },
    {
      name: 'type',
      label: 'Account Type',
      type: 'select',
      required: true,
      options: [
        { value: 'ASSET', label: 'Asset' },
        { value: 'LIABILITY', label: 'Liability' },
        { value: 'EQUITY', label: 'Equity' },
        { value: 'INCOME', label: 'Income' },
        { value: 'EXPENSE', label: 'Expense' },
      ],
    },
    { name: 'parentAccountId', label: 'Parent Account', type: 'link', link: { resource: 'accounts', labelField: 'name' }, placeholder: 'Select parent account...' },
  ],
  list: {
    columns: ['code', 'name', 'type', 'parentAccountId'],
    searchable: true,
    pageSize: 25,
    defaultSort: { field: 'code', direction: 'asc' },
    filters: ['type'],
  },
});

export const bankAccountResource = defineResource({
  name: 'bank-accounts',
  labelSingular: 'Bank Account',
  labelPlural: 'Bank Accounts',
  endpoint: '/advanced-finance/bank-accounts',
  titleField: 'accountName',
  permissions: {
    read: 'finance.bankaccount.read',
    create: 'finance.bankaccount.create',
    update: 'finance.bankaccount.update',
    delete: 'finance.bankaccount.delete',
  },
  fields: [
    { name: 'accountName', label: 'Account Name', type: 'text', required: true, placeholder: 'e.g. Operating Account' },
    { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
    { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
    { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
    { name: 'balance', label: 'Current Balance', type: 'currency', defaultValue: 0 },
  ],
  list: {
    columns: ['accountName', 'accountNumber', 'bankName', 'currency', 'balance'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'accountName', direction: 'asc' },
  },
});

export const paymentTermResource = defineResource({
  name: 'payment-terms',
  labelSingular: 'Payment Term',
  labelPlural: 'Payment Terms',
  endpoint: '/advanced-finance/payment-terms',
  titleField: 'name',
  permissions: {
    read: 'finance.paymentterm.read',
    create: 'finance.paymentterm.create',
    update: 'finance.paymentterm.update',
    delete: 'finance.paymentterm.delete',
  },
  fields: [
    { name: 'name', label: 'Term Name', type: 'text', required: true, placeholder: 'e.g. Net 30' },
    { name: 'description', label: 'Description', type: 'text' },
    { name: 'dueDays', label: 'Due Days', type: 'number', required: true, defaultValue: 30 },
    { name: 'discountDays', label: 'Discount Days', type: 'number', defaultValue: 0 },
    { name: 'discountPct', label: 'Discount Percentage', type: 'number', defaultValue: 0 },
    { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
  ],
  list: {
    columns: ['name', 'description', 'dueDays', 'discountDays', 'discountPct', 'isActive'],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: 'name', direction: 'asc' },
  },
});

export const financeModule = defineModule({
  id: 'finance',
  title: 'Finance',
  basePath: '/finance',
  permission: 'finance.invoice.read',
  resources: [
    invoiceResource,
    paymentResource,
    journalResource,
    accountResource,
    bankAccountResource,
    paymentTermResource,
  ],
});
