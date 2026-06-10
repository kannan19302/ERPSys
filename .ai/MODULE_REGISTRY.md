# Module Registry — Universal ERP System

> This file tracks every ERP module, its status, dependencies, and responsible team/agent.
> AI agents MUST update this file when creating or modifying modules.

---

## Module Status Legend

| Status | Meaning |
|:---|:---|
| 🟢 `ACTIVE` | Fully implemented, tested, and deployed |
| 🟡 `IN_PROGRESS` | Currently being developed |
| 🔵 `PLANNED` | Designed but not yet started |
| ⚪ `BACKLOG` | Identified but not yet designed |
| 🔴 `DEPRECATED` | Scheduled for removal |

---

## Core Modules

| # | Module | Package Path | Status | Phase | Dependencies | Key Entities |
|:--|:---|:---|:---|:---|:---|:---|
| 1 | **Administration** | `apps/api/src/modules/admin` | 🟢 ACTIVE | 0 | auth, database | Tenant, User, Role, Permission, Setting |
| 2 | **Finance & Accounting** | `apps/api/src/modules/finance` | 🟢 ACTIVE | 1 | admin, database | Account, Journal, Invoice, Payment, TaxRate |
| 3 | **Human Resources** | `apps/api/src/modules/hr` | 🟢 ACTIVE | 1 | admin, finance | Employee, Department, Payroll, Leave, Attendance |
| 4 | **CRM** | `apps/api/src/modules/crm` | 🟢 ACTIVE | 1 | admin | Contact, Lead, Opportunity, Activity, Pipeline |
| 5 | **Inventory & Warehouse** | `apps/api/src/modules/inventory` | 🟢 ACTIVE | 1 | admin | Product, Warehouse, StockEntry, Transfer, Adjustment |
| 6 | **Procurement** | `apps/api/src/modules/procurement` | 🔵 PLANNED | 2 | admin, finance, inventory | Vendor, PurchaseOrder, PurchaseReceipt, RFQ |
| 7 | **Sales & Orders** | `apps/api/src/modules/sales` | 🔵 PLANNED | 2 | admin, finance, inventory, crm | Quotation, SalesOrder, DeliveryNote, Return |
| 8 | **Supply Chain** | `apps/api/src/modules/supply-chain` | 🔵 PLANNED | 2 | inventory, procurement, sales | Shipment, Route, DemandForecast, Supplier |
| 9 | **Project Management** | `apps/api/src/modules/projects` | 🔵 PLANNED | 2 | admin, hr, finance | Project, Task, Timesheet, Milestone, Budget |
| 10 | **Business Intelligence** | `apps/api/src/modules/analytics` | 🔵 PLANNED | 3 | all core modules | Dashboard, Report, KPI, Widget |
| 11 | **Document Management** | `apps/api/src/modules/documents` | 🔵 PLANNED | 3 | admin | Document, Folder, Version, Template, Signature |
| 12 | **Communication** | `apps/api/src/modules/communication` | 🔵 PLANNED | 3 | admin | Message, Channel, Notification, EmailTemplate |

---

## Industry Extension Modules

| # | Module | Package Path | Status | Phase | Dependencies | Target Industries |
|:--|:---|:---|:---|:---|:---|:---|
| 13 | **Manufacturing (MRP)** | `apps/api/src/modules/manufacturing` | ⚪ BACKLOG | 2 | inventory, procurement, sales | Manufacturing, Industrial |
| 14 | **POS & Retail** | `apps/api/src/modules/pos` | ⚪ BACKLOG | 3 | inventory, sales, finance | Retail, F&B, Hospitality |
| 15 | **Healthcare** | `apps/api/src/modules/healthcare` | ⚪ BACKLOG | 4 | hr, inventory, finance | Hospitals, Clinics, Pharma |
| 16 | **Education** | `apps/api/src/modules/education` | ⚪ BACKLOG | 4 | hr, finance, communication | Schools, Universities |
| 17 | **Real Estate** | `apps/api/src/modules/real-estate` | ⚪ BACKLOG | 4 | finance, crm, projects | Property, Construction |
| 18 | **Field Service** | `apps/api/src/modules/field-service` | ⚪ BACKLOG | 4 | hr, inventory, projects | Maintenance, Utilities |

---

## Shared Packages

| Package | Path | Status | Description |
|:---|:---|:---|:---|
| **@unerp/database** | `packages/database` | 🟢 ACTIVE | Prisma schema, client, migrations |
| **@unerp/shared** | `packages/shared` | 🟢 ACTIVE | Types, validators, constants, utilities |
| **@unerp/ui** | `packages/ui` | 🟢 ACTIVE | Design system, components, tokens |
| **@unerp/auth** | `packages/auth` | 🟢 ACTIVE | Authentication providers, RBAC, guards |
| **@unerp/config** | `packages/config` | 🟢 ACTIVE | ESLint, TypeScript, Prettier configs |

---

## Module Interaction Map

```
Administration ◄─── (all modules depend on admin for auth/tenant context)
       │
       ├──► Finance ◄──────────── HR (payroll)
       │       │                    │
       │       │                    ├──► Projects (timesheets)
       │       │                    │
       │       ├──► Sales ◄────── CRM (lead conversion)
       │       │       │
       │       │       ├──► Inventory ◄── Procurement
       │       │       │       │
       │       │       │       ├──► Supply Chain
       │       │       │       │
       │       │       │       └──► Manufacturing
       │       │       │
       │       │       └──► POS & Retail
       │       │
       │       └──► Healthcare / Education / Real Estate
       │
       ├──► Documents (used by all modules)
       ├──► Communication (used by all modules)
       └──► Analytics (reads from all modules)
```

---

## Adding a New Module

When adding a new module:

1. Add an entry to the appropriate table above
2. Set status to `🟡 IN_PROGRESS`
3. List all dependencies
4. List key entities
5. Follow the module development workflow in [AGENTS.md](../AGENTS.md)
6. Update status to `🟢 ACTIVE` when complete
