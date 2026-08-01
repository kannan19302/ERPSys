import { defineModule, defineResource } from "@unerp/framework";
import { apiPost } from "@/lib/api";

// ─────────────────────────────────────────────────
// Finance module definition — Phase 2 framework
// migration (see .ai/UI_FRAMEWORK_PLAN.md).
// Pages under app/(dashboard)/finance consume these
// schemas instead of hand-rolled fetch/table/form code.
// ─────────────────────────────────────────────────

export const invoiceResource = defineResource({
  name: "invoices",
  labelSingular: "Invoice",
  labelPlural: "Invoices",
  endpoint: "/finance/invoices",
  titleField: "invoiceNumber",
  permissions: {
    read: "finance.invoice.read",
    create: "finance.invoice.create",
    update: "finance.invoice.update",
    delete: "finance.invoice.delete",
  },
  status: {
    field: "status",
    tones: {
      DRAFT: "neutral",
      SENT: "info",
      PAID: "success",
      PARTIALLY_PAID: "warning",
      OVERDUE: "danger",
      VOID: "neutral",
    },
  },
  fields: [
    {
      name: "invoiceNumber",
      label: "Invoice Number",
      type: "text",
      readOnly: true,
      placeholder: "Auto-generated on save",
    },
    {
      name: "customerId",
      label: "Customer",
      type: "link",
      link: { resource: "customers", labelField: "name" },
      required: true,
      placeholder: "Select customer...",
    },
    // The list endpoint returns a flattened `customerName` string, not the raw
    // `customerId` FK, so the list column reads from this instead. Hidden from
    // forms — `customerId` is the real editable field there.
    {
      name: "customerName",
      label: "Customer",
      type: "text",
      readOnly: true,
      visibleIf: () => false,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      defaultValue: "DRAFT",
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "SENT", label: "Sent" },
        { value: "PAID", label: "Paid" },
        { value: "PARTIALLY_PAID", label: "Partially Paid" },
        { value: "OVERDUE", label: "Overdue" },
        { value: "VOID", label: "Void" },
      ],
    },
    { name: "issueDate", label: "Issue Date", type: "date", required: true },
    { name: "dueDate", label: "Due Date", type: "date", required: true },
    {
      name: "totalAmount",
      label: "Total Amount",
      type: "currency",
      min: 0,
      defaultValue: 0,
    },
    {
      name: "paidAmount",
      label: "Paid Amount",
      type: "currency",
      min: 0,
      defaultValue: 0,
    },
  ],
  list: {
    columns: [
      "invoiceNumber",
      "customerName",
      "status",
      "issueDate",
      "dueDate",
      "totalAmount",
      "paidAmount",
    ],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: "invoiceNumber", direction: "asc" },
    filters: ["status"],
    selectable: true,
    savedViews: true,
  },
});

export const paymentResource = defineResource({
  name: "payments",
  labelSingular: "Payment",
  labelPlural: "Payments",
  endpoint: "/finance/payments",
  titleField: "id",
  permissions: {
    read: "finance.payment.read",
    create: "finance.payment.create",
    update: "finance.payment.update",
    delete: "finance.payment.delete",
  },
  fields: [
    {
      name: "invoiceId",
      label: "Invoice",
      type: "link",
      link: { resource: "invoices", labelField: "invoiceNumber" },
      required: true,
      placeholder: "Select invoice...",
    },
    // Read-only, list-display-only projections from the API response — the
    // backend derives these from the invoice relation; they aren't part of
    // the create payload (see createPaymentSchema in @unerp/shared).
    {
      name: "invoiceNumber",
      label: "Invoice",
      type: "text",
      readOnly: true,
      visibleIf: () => false,
    },
    {
      name: "customerName",
      label: "Customer",
      type: "text",
      readOnly: true,
      visibleIf: () => false,
    },
    {
      name: "amount",
      label: "Amount Paid",
      type: "currency",
      required: true,
      min: 0,
    },
    {
      name: "method",
      label: "Payment Method",
      type: "select",
      defaultValue: "BANK_TRANSFER",
      options: [
        { value: "BANK_TRANSFER", label: "Bank Transfer" },
        { value: "CARD", label: "Card" },
        { value: "CASH", label: "Cash" },
        { value: "CHEQUE", label: "Cheque" },
      ],
    },
    {
      name: "reference",
      label: "Reference",
      type: "text",
      placeholder: "Optional reference / receipt number",
    },
    // paidAt is server-set (defaults to now()) — not client-editable.
    { name: "paidAt", label: "Payment Date", type: "datetime", readOnly: true },
  ],
  list: {
    columns: ["invoiceNumber", "customerName", "amount", "method", "paidAt"],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: "paidAt", direction: "desc" },
    filters: ["method"],
  },
});

export const creditNoteResource = defineResource({
  name: "credit-notes",
  labelSingular: "Credit Note",
  labelPlural: "Credit Notes",
  endpoint: "/finance/credit-notes",
  titleField: "creditNoteNumber",
  permissions: {
    read: "finance.credit.read",
    create: "finance.credit.create",
    update: "finance.credit.update",
    delete: "finance.credit.delete",
  },
  status: {
    field: "status",
    tones: {
      DRAFT: "neutral",
      APPLIED: "success",
      VOID: "danger",
    },
  },
  fields: [
    // Server-generated (see createCreditNoteSchema default) — shown disabled,
    // never user-entered.
    {
      name: "creditNoteNumber",
      label: "Credit Note Number",
      type: "text",
      readOnly: true,
      placeholder: "Auto-generated on save",
    },
    {
      name: "customerId",
      label: "Customer",
      type: "link",
      link: { resource: "customers", labelField: "name" },
      required: true,
      placeholder: "Select customer...",
    },
    {
      name: "customerName",
      label: "Customer",
      type: "text",
      readOnly: true,
      visibleIf: () => false,
    },
    {
      name: "invoiceId",
      label: "Related Invoice",
      type: "link",
      link: { resource: "invoices", labelField: "invoiceNumber" },
      placeholder: "Optional — select invoice...",
    },
    {
      name: "reason",
      label: "Reason",
      type: "text",
      required: true,
      placeholder: "e.g. Return, billing error, goodwill credit",
    },
    { name: "issueDate", label: "Issue Date", type: "date", required: true },
    {
      name: "amount",
      label: "Amount",
      type: "currency",
      required: true,
      min: 0,
    },
    {
      name: "totalAmount",
      label: "Total Amount",
      type: "currency",
      readOnly: true,
      visibleIf: () => false,
    },
  ],
  list: {
    columns: [
      "creditNoteNumber",
      "customerName",
      "status",
      "issueDate",
      "totalAmount",
    ],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: "issueDate", direction: "desc" },
    filters: ["status"],
    rowActions: [
      {
        label: "Apply",
        tone: "default",
        permission: "finance.credit.update",
        onClick: async (row) => {
          if (row.status !== "DRAFT") return;
          await apiPost(`/finance/credit-notes/${row.id}/apply`, {});
          window.location.reload();
        },
      },
      {
        label: "Void",
        tone: "danger",
        permission: "finance.credit.update",
        onClick: async (row) => {
          if (row.status === "VOID") return;
          if (!window.confirm("Void this credit note? This cannot be undone."))
            return;
          await apiPost(`/finance/credit-notes/${row.id}/void`, {});
          window.location.reload();
        },
      },
    ],
  },
});

export const vendorBillResource = defineResource({
  name: "vendor-bills",
  labelSingular: "Vendor Bill",
  labelPlural: "Vendor Bills",
  endpoint: "/finance/vendor-bills",
  titleField: "billNumber",
  permissions: {
    read: "finance.payables.read",
    create: "finance.payables.create",
    update: "finance.payables.update",
    delete: "finance.payables.delete",
  },
  status: {
    field: "status",
    tones: {
      DRAFT: "neutral",
      APPROVED: "info",
      PAID: "success",
      VOID: "danger",
    },
  },
  fields: [
    // Server-generated (see createVendorBillSchema default) — shown disabled.
    {
      name: "billNumber",
      label: "Bill Number",
      type: "text",
      readOnly: true,
      placeholder: "Auto-generated on save",
    },
    {
      name: "vendorId",
      label: "Vendor",
      type: "link",
      link: { resource: "vendors", labelField: "name" },
      required: true,
      placeholder: "Select vendor...",
    },
    {
      name: "vendorName",
      label: "Vendor",
      type: "text",
      readOnly: true,
      visibleIf: () => false,
    },
    { name: "dueDate", label: "Due Date", type: "date", required: true },
    {
      name: "totalAmount",
      label: "Total Amount",
      type: "currency",
      required: true,
      min: 0,
    },
    {
      name: "paidAmount",
      label: "Paid Amount",
      type: "currency",
      readOnly: true,
    },
    {
      name: "notes",
      label: "Notes",
      type: "text",
      placeholder: "Optional notes",
    },
  ],
  list: {
    columns: [
      "billNumber",
      "vendorName",
      "status",
      "dueDate",
      "totalAmount",
      "paidAmount",
    ],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: "dueDate", direction: "desc" },
    filters: ["status"],
    rowActions: [
      {
        label: "Approve",
        tone: "default",
        permission: "finance.payables.update",
        onClick: async (row) => {
          if (row.status !== "DRAFT") return;
          await apiPost(`/finance/vendor-bills/${row.id}/approve`, {});
          window.location.reload();
        },
      },
      {
        label: "Void",
        tone: "danger",
        permission: "finance.payables.update",
        onClick: async (row) => {
          if (row.status === "VOID" || row.status === "PAID") return;
          if (!window.confirm("Void this vendor bill? This cannot be undone."))
            return;
          await apiPost(`/finance/vendor-bills/${row.id}/void`, {});
          window.location.reload();
        },
      },
    ],
  },
});

export const vendorBillPaymentResource = defineResource({
  name: "vendor-bill-payments",
  labelSingular: "Payment",
  labelPlural: "Payments",
  endpoint: "/finance/vendor-bill-payments",
  titleField: "id",
  permissions: {
    read: "finance.payables.read",
  },
  fields: [
    { name: "billNumber", label: "Bill", type: "text", readOnly: true },
    { name: "vendorName", label: "Vendor", type: "text", readOnly: true },
    { name: "amount", label: "Amount Paid", type: "currency", readOnly: true },
    { name: "method", label: "Payment Method", type: "text", readOnly: true },
    { name: "reference", label: "Reference", type: "text", readOnly: true },
    { name: "paidAt", label: "Payment Date", type: "datetime", readOnly: true },
  ],
  list: {
    columns: ["billNumber", "vendorName", "amount", "method", "paidAt"],
    searchable: false,
    pageSize: 10,
    defaultSort: { field: "paidAt", direction: "desc" },
  },
});

export const debitNoteResource = defineResource({
  name: "debit-notes",
  labelSingular: "Debit Note",
  labelPlural: "Debit Notes",
  endpoint: "/finance/debit-notes",
  titleField: "debitNoteNumber",
  permissions: {
    read: "finance.debit.read",
    create: "finance.debit.create",
    update: "finance.debit.update",
    delete: "finance.debit.delete",
  },
  status: {
    field: "status",
    tones: {
      DRAFT: "neutral",
      APPLIED: "success",
      VOID: "danger",
    },
  },
  fields: [
    {
      name: "debitNoteNumber",
      label: "Debit Note Number",
      type: "text",
      readOnly: true,
      placeholder: "Auto-generated on save",
    },
    {
      name: "vendorId",
      label: "Vendor",
      type: "link",
      link: { resource: "vendors", labelField: "name" },
      required: true,
      placeholder: "Select vendor...",
    },
    {
      name: "vendorName",
      label: "Vendor",
      type: "text",
      readOnly: true,
      visibleIf: () => false,
    },
    {
      name: "reason",
      label: "Reason",
      type: "text",
      required: true,
      placeholder: "e.g. Return, overbilling, price adjustment",
    },
    { name: "issueDate", label: "Issue Date", type: "date", required: true },
    {
      name: "amount",
      label: "Amount",
      type: "currency",
      required: true,
      min: 0,
    },
    {
      name: "totalAmount",
      label: "Total Amount",
      type: "currency",
      readOnly: true,
      visibleIf: () => false,
    },
  ],
  list: {
    columns: [
      "debitNoteNumber",
      "vendorName",
      "status",
      "issueDate",
      "totalAmount",
    ],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: "issueDate", direction: "desc" },
    filters: ["status"],
    rowActions: [
      {
        label: "Apply",
        tone: "default",
        permission: "finance.debit.update",
        onClick: async (row) => {
          if (row.status !== "DRAFT") return;
          await apiPost(`/finance/debit-notes/${row.id}/apply`, {});
          window.location.reload();
        },
      },
      {
        label: "Void",
        tone: "danger",
        permission: "finance.debit.update",
        onClick: async (row) => {
          if (row.status === "VOID") return;
          if (!window.confirm("Void this debit note? This cannot be undone."))
            return;
          await apiPost(`/finance/debit-notes/${row.id}/void`, {});
          window.location.reload();
        },
      },
    ],
  },
});

export const journalResource = defineResource({
  name: "journals",
  labelSingular: "Journal Entry",
  labelPlural: "Journal Entries",
  endpoint: "/advanced-finance/journals",
  titleField: "entryNumber",
  permissions: {
    read: "finance.journal.read",
    create: "finance.journal.create",
    update: "finance.journal.update",
    delete: "finance.journal.delete",
  },
  status: {
    field: "status",
    tones: {
      DRAFT: "neutral",
      SUBMITTED: "warning",
      APPROVED: "info",
      POSTED: "success",
      REJECTED: "danger",
      REVERSED: "danger",
    },
  },
  fields: [
    {
      name: "entryNumber",
      label: "Entry Number",
      type: "text",
      readOnly: true,
      placeholder: "Auto-generated on save",
    },
    { name: "date", label: "Posting Date", type: "date", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      defaultValue: "DRAFT",
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "SUBMITTED", label: "Submitted" },
        { value: "APPROVED", label: "Approved" },
        { value: "POSTED", label: "Posted" },
        { value: "REJECTED", label: "Rejected" },
        { value: "REVERSED", label: "Reversed" },
      ],
    },
    { name: "notes", label: "Notes/Memo", type: "textarea" },
  ],
  list: {
    columns: ["entryNumber", "date", "status", "notes"],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: "entryNumber", direction: "asc" },
    filters: ["status"],
    selectable: true,
    savedViews: true,
  },
});

export const accountResource = defineResource({
  name: "accounts",
  labelSingular: "Account",
  labelPlural: "Chart of Accounts",
  endpoint: "/advanced-finance/accounts",
  titleField: "name",
  permissions: {
    read: "finance.account.read",
    create: "finance.account.create",
    update: "finance.account.update",
    delete: "finance.account.delete",
  },
  fields: [
    {
      name: "code",
      label: "Account Code",
      type: "text",
      required: true,
      placeholder: "e.g. 1100",
    },
    {
      name: "name",
      label: "Account Name",
      type: "text",
      required: true,
      placeholder: "e.g. Accounts Receivable",
    },
    {
      name: "type",
      label: "Account Type",
      type: "select",
      required: true,
      options: [
        { value: "ASSET", label: "Asset" },
        { value: "LIABILITY", label: "Liability" },
        { value: "EQUITY", label: "Equity" },
        { value: "INCOME", label: "Income" },
        { value: "EXPENSE", label: "Expense" },
      ],
    },
    {
      name: "parentAccountId",
      label: "Parent Account",
      type: "link",
      link: { resource: "accounts", labelField: "name" },
      placeholder: "Select parent account...",
    },
  ],
  list: {
    columns: ["code", "name", "type", "parentAccountId"],
    searchable: true,
    pageSize: 25,
    defaultSort: { field: "code", direction: "asc" },
    filters: ["type"],
  },
});

export const bankAccountResource = defineResource({
  name: "bank-accounts",
  labelSingular: "Bank Account",
  labelPlural: "Bank Accounts",
  endpoint: "/advanced-finance/bank-accounts",
  titleField: "accountName",
  permissions: {
    read: "finance.bankaccount.read",
    create: "finance.bankaccount.create",
    update: "finance.bankaccount.update",
    delete: "finance.bankaccount.delete",
  },
  fields: [
    {
      name: "accountName",
      label: "Account Name",
      type: "text",
      required: true,
      placeholder: "e.g. Operating Account",
    },
    {
      name: "accountNumber",
      label: "Account Number",
      type: "text",
      required: true,
    },
    { name: "bankName", label: "Bank Name", type: "text", required: true },
    { name: "currency", label: "Currency", type: "text", defaultValue: "USD" },
    {
      name: "balance",
      label: "Current Balance",
      type: "currency",
      defaultValue: 0,
    },
  ],
  list: {
    columns: [
      "accountName",
      "accountNumber",
      "bankName",
      "currency",
      "balance",
    ],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: "accountName", direction: "asc" },
  },
});

export const paymentTermResource = defineResource({
  name: "payment-terms",
  labelSingular: "Payment Term",
  labelPlural: "Payment Terms",
  endpoint: "/advanced-finance/payment-terms",
  titleField: "name",
  permissions: {
    read: "finance.paymentterm.read",
    create: "finance.paymentterm.create",
    update: "finance.paymentterm.update",
    delete: "finance.paymentterm.delete",
  },
  fields: [
    {
      name: "name",
      label: "Term Name",
      type: "text",
      required: true,
      placeholder: "e.g. Net 30",
    },
    { name: "description", label: "Description", type: "text" },
    {
      name: "dueDays",
      label: "Due Days",
      type: "number",
      required: true,
      defaultValue: 30,
    },
    {
      name: "discountDays",
      label: "Discount Days",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "discountPct",
      label: "Discount Percentage",
      type: "number",
      defaultValue: 0,
    },
    { name: "isActive", label: "Active", type: "boolean", defaultValue: true },
  ],
  list: {
    columns: [
      "name",
      "description",
      "dueDays",
      "discountDays",
      "discountPct",
      "isActive",
    ],
    searchable: true,
    pageSize: 10,
    defaultSort: { field: "name", direction: "asc" },
  },
});

export const financeModule = defineModule({
  id: "finance",
  title: "Finance",
  basePath: "/finance",
  permission: "finance.invoice.read",
  resources: [
    invoiceResource,
    paymentResource,
    journalResource,
    accountResource,
    bankAccountResource,
    paymentTermResource,
  ],
});
