# Prompt Template: Adding a New UI Page

> Use this template before asking any AI agent to create new frontend pages.

---

## Pre-Flight Checklist

1. ☐ Read `.ai/CONVENTIONS.md` Section 3 (React/Next.js conventions)
2. ☐ Check `packages/ui/` for available design system components
3. ☐ Check existing pages in `apps/web/app/(dashboard)/` for consistency

---

## Prompt Template

```
Create a new UI page for the [MODULE_NAME] module:

## Page Details
- Route: `/[module]/[resource]` (e.g., `/finance/invoices`)
- Type: [List/Detail/Create/Edit/Dashboard]
- Title: [Page title, e.g., "Invoices"]
- Description: [Brief description shown in page header]

## Page Type: LIST
### Features
- [ ] Data table with columns: [col1, col2, col3, ...]
- [ ] Sortable columns: [which ones]
- [ ] Filterable by: [status, date range, search, ...]
- [ ] Pagination (server-side)
- [ ] Bulk actions: [select all, bulk delete, bulk export]
- [ ] Row click navigates to detail page
- [ ] "Create New" button in header
- [ ] Empty state when no data
- [ ] Loading skeleton

## Page Type: DETAIL
### Features
- [ ] Header with entity title and status badge
- [ ] Action buttons: [Edit, Delete, Send, Print, ...]
- [ ] Information sections: [section1, section2, ...]
- [ ] Related data tabs: [tab1, tab2, ...]
- [ ] Activity/audit trail sidebar
- [ ] Breadcrumb navigation

## Page Type: CREATE/EDIT
### Features
- [ ] Form fields: [field1, field2, ...]
- [ ] Validation (Zod schema from packages/shared)
- [ ] Auto-save draft
- [ ] Cancel confirmation if unsaved changes
- [ ] Success toast notification
- [ ] Redirect to detail page after save

## Design Requirements
- Use components from `@unerp/ui` — DO NOT create ad-hoc components
- Follow the dashboard layout (sidebar, header, breadcrumbs)
- Use Server Components for data fetching, Client Components for interactivity
- Keep the 'use client' boundary as deep as possible
- Include proper <title> metadata for SEO
- Add loading.tsx for Suspense fallback
- Add error.tsx for error boundary
```
