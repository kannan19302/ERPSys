import type { ReactNode } from 'react';

// ─────────────────────────────────────────────────
// @unerp/framework — Core metadata types
// The schema layer that replaces Frappe DocTypes:
// every module describes its resources declaratively
// and the framework renders list/detail/form views.
// ─────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'percent'
  | 'boolean'
  | 'select'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'link';

export interface SelectOption {
  value: string;
  label: string;
}

export type FieldValues = Record<string, unknown>;

export interface FieldDef {
  /** Property name on the API payload, e.g. "customerName" */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readOnly?: boolean;
  /** Options for `select` fields */
  options?: SelectOption[];
  /** Target for `link` fields — another registered resource */
  link?: { resource: string; labelField?: string };
  defaultValue?: unknown;
  hint?: string;
  placeholder?: string;
  /** Conditional visibility, evaluated live against the current form values */
  visibleIf?: (values: FieldValues) => boolean;
  /** Extra validation beyond the generated Zod schema; return an error message or null */
  validate?: (value: unknown, values: FieldValues) => string | null;
  /** Field-level RBAC code; hidden when the user lacks it */
  permission?: string;
  min?: number;
  max?: number;
  maxLength?: number;
}

export type SortDirection = 'asc' | 'desc';

export interface ListConfig {
  /** Field names shown as columns (defaults to the first 5 fields) */
  columns?: string[];
  defaultSort?: { field: string; direction: SortDirection };
  pageSize?: number;
  /** Enables the search box; the value is sent as the `search` query param */
  searchable?: boolean;
  /** Custom cell renderers keyed by field name */
  render?: Record<string, (row: FieldValues) => ReactNode>;
}

export interface FormSectionDef {
  title?: string;
  description?: string;
  fields: string[];
}

export interface FormConfig {
  /** Group fields into sections; defaults to a single section with all fields */
  sections?: FormSectionDef[];
}

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface ResourcePermissions {
  read?: string;
  create?: string;
  update?: string;
  delete?: string;
}

export interface ResourceSchema {
  /** Unique resource name within the registry, e.g. "customer" */
  name: string;
  labelSingular: string;
  labelPlural: string;
  /** API path relative to the client base URL, e.g. "/crm/customers" */
  endpoint: string;
  /** Defaults to "id" */
  primaryKey?: string;
  /** Field used as the record title in detail views; defaults to "name" */
  titleField?: string;
  fields: FieldDef[];
  list?: ListConfig;
  form?: FormConfig;
  permissions?: ResourcePermissions;
  /** Maps a status field's values to badge tones for list/detail rendering */
  status?: { field: string; tones: Record<string, StatusTone> };
}

export interface NavItemDef {
  name: string;
  href: string;
  permission?: string;
}

export interface ModuleDefinition {
  /** Unique module id, e.g. "crm" */
  id: string;
  title: string;
  /** Route prefix inside the host app, e.g. "/crm" */
  basePath: string;
  resources: ResourceSchema[];
  /** Extra nav entries beyond the auto-generated per-resource ones */
  nav?: NavItemDef[];
  /** Module-level RBAC code; the whole module is hidden without it */
  permission?: string;
}

// ── Data-layer contracts ─────────────────────────

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDirection?: SortDirection;
  /** Extra query params (server-side filters) */
  filters?: Record<string, string | number | boolean | undefined>;
}

export interface ListResult<T = FieldValues> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
