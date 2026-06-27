# UniERP Development Sprints

> **Strategy**: Complete each module FULLY (features + fixes + UI + nav) before moving to next.  
> **Tracking**: This file is the single source of truth. Updated after each sprint.  
> **Last updated**: 2026-06-27  

---

## COMPLETED SPRINTS

### Sprint 1: Admin Module — DONE
18 pages overhauled with design system. Commit `2989079`.

### Sprint 2: Finance Module — DONE
14→25 pages. 11 Coming Soon features built. Backend CRUD added for recurring invoices. Commits `2989079`, `eaeac95`, `0d6d264`.

### Sprint 3: HR Module — DONE (pre-existing)
25 pages, 90+ endpoints, 27 models. Verified complete.

### Sprint 4: CRM Module — DONE
33 pages, 4 stubs enhanced (Quotations, Sales Orders, Vendors, Email Templates). Commit `ebc9afc`.

### Sprint 5-10: Inventory, Sales, Procurement, Manufacturing, Projects, POS — DONE (pre-existing)
All verified complete with full pages, sidebars, and API integration.

---

## PENDING SPRINTS

---

### Sprint 11: Supply Chain Module
**Status**: PENDING  
**Current state**: 1 page | 1 controller | 7 services | Shipment model  
**Backend ready**: Shipment CRUD, demand forecast, logistics tracking, route optimization  

#### Pages to Build
| Page | Route | Description | Backend Endpoint |
|------|-------|-------------|-----------------|
| Dashboard | `/supply-chain` | KPI cards (shipments, on-time rate, costs), charts, quick actions | GET /supply-chain/shipments |
| Shipment List | `/supply-chain/shipments` | DataTable with status filters, search, tracking links | GET /supply-chain/shipments |
| Shipment Detail | `/supply-chain/shipments/[id]` | Timeline tracker, status updates, carrier info, documents | GET /supply-chain/shipments/:id |
| Create Shipment | Modal on list page | Origin/destination, carrier, items, weight, dates | POST /supply-chain/shipments |
| Carrier Management | `/supply-chain/carriers` | Carrier directory, rate cards, performance metrics | New endpoint needed |
| Demand Forecast | `/supply-chain/demand-forecast` | Charts showing projected demand by product/period | GET /supply-chain/demand-forecast |
| Route Optimization | `/supply-chain/routes` | Route map visualization, cost comparison | Uses route-optimization.service |
| Shipment Tracking | `/supply-chain/tracking` | Real-time tracking with map, ETA, status history | Uses logistics-tracking.service |
| Analytics | `/supply-chain/analytics` | On-time delivery %, cost per shipment, carrier performance | Aggregate from shipments |

#### Sidebar Navigation to Add
```
Supply Chain Operations
├── Dashboard
├── Shipments (list + create)
├── Shipment Tracking
├── Carrier Management
├── Route Optimization
├── Demand Forecast
└── Analytics
```

---

### Sprint 12: Education Module
**Status**: PENDING  
**Current state**: 1 page | 2 controllers | 5 services | Student, Course, Fee, Book models  
**Backend ready**: Students CRUD, Courses CRUD, Timetables, Fee Structures, Fee Payments, Book Register, Book Checkout/Return  

#### Pages to Build
| Page | Route | Description | Backend Endpoint |
|------|-------|-------------|-----------------|
| Dashboard | `/education` | KPI cards (students, courses, fees collected), enrollment charts | Aggregate |
| Student Registry | `/education/students` | DataTable with search, enrollment status filters, detail drawer | GET /education/students |
| Student Detail | `/education/students/[id]` | Profile, enrolled courses, fee history, attendance | GET /education/students/:id |
| Course Catalog | `/education/courses` | Course cards/list, credits, status, enrollment count | GET /education/courses |
| Course Detail | `/education/courses/[id]` | Syllabus, enrolled students, schedule, materials | GET /education/courses/:id |
| Timetable | `/education/timetable` | Weekly grid view, drag-to-schedule, room allocation | GET /education/timetables |
| Fee Management | `/education/fees` | Fee structures, student fee ledger, payment processing | GET /education/fee-structures |
| Fee Payment | `/education/fees/pay` | Payment form, receipt generation, outstanding balance | POST /education/student-fees/:id/pay |
| Library | `/education/library` | Book register, checkout/return, availability tracking | GET /education/books |
| Attendance | `/education/attendance` | Daily attendance marking, reports by class/student | New endpoint needed |
| Grade Book | `/education/grades` | Spreadsheet-style grade entry per course/student | New endpoint needed |
| Reports | `/education/reports` | Enrollment trends, fee collection, academic performance | Aggregate |

#### Sidebar Navigation to Add
```
Education
├── Dashboard
├── Academic
│   ├── Student Registry
│   ├── Course Catalog
│   ├── Timetable
│   ├── Grade Book
│   └── Attendance
├── Administration
│   ├── Fee Management
│   ├── Fee Payments
│   └── Library
└── Reports & Analytics
```

---

### Sprint 13: Healthcare Module
**Status**: PENDING  
**Current state**: 0 pages (NO FRONTEND) | 3 controllers | 7 services | Patient, Appointment, Prescription models  
**Backend ready**: Patients CRUD, Practitioners, Appointments, Prescriptions, Clinical workflows, SMART-on-FHIR  

#### Pages to Build (FULL MODULE FROM SCRATCH)
| Page | Route | Description | Backend Endpoint |
|------|-------|-------------|-----------------|
| Dashboard | `/healthcare` | KPI cards (patients, appointments today, prescriptions), charts | Aggregate |
| Patient Registry | `/healthcare/patients` | DataTable with search, status filters, age demographics | GET /healthcare/patients |
| Patient Detail | `/healthcare/patients/[id]` | Medical timeline, vitals, allergies, encounters, prescriptions | GET /healthcare/patients/:id |
| New Patient | Modal on registry | Demographics, contact, insurance, medical history | POST /healthcare/patients |
| Appointments | `/healthcare/appointments` | Calendar view + list view, scheduling, status tracking | GET /healthcare/appointments |
| Book Appointment | Modal on appointments | Patient select, practitioner, date/time, reason | POST /healthcare/appointments |
| Practitioners | `/healthcare/practitioners` | Doctor/nurse directory, specializations, availability | GET /healthcare/practitioners |
| Prescriptions | `/healthcare/prescriptions` | DataTable, create new Rx, medication lookup | GET/POST /healthcare/prescriptions |
| Clinical Notes | `/healthcare/clinical` | Encounter documentation, SOAP notes, diagnosis codes | Uses clinical.controller |
| Lab Results | `/healthcare/lab-results` | Test results viewer, trends, reference ranges | New endpoint needed |
| Vitals Dashboard | `/healthcare/vitals` | Patient vitals charts (BP, HR, temp, SpO2 trends) | From patient.vitalsHistory |
| FHIR Integration | `/healthcare/fhir` | SMART app launcher, FHIR resource browser | Uses healthcare-smart.controller |
| Reports | `/healthcare/reports` | Patient demographics, appointment utilization, Rx analytics | Aggregate |

#### Sidebar Navigation to Create
```
Healthcare
├── Dashboard
├── Patient Care
│   ├── Patient Registry
│   ├── Appointments
│   ├── Clinical Notes
│   ├── Prescriptions
│   └── Lab Results
├── Staff
│   ├── Practitioners
│   └── Schedules
├── Integration
│   ├── FHIR / SMART
│   └── Vitals Dashboard
└── Reports
```

#### Directory to Create
- `apps/web/app/(dashboard)/healthcare/` (new directory)
- Add healthcare section to layout.tsx sidebar

---

### Sprint 14: Real Estate Module
**Status**: PENDING  
**Current state**: 1 page | 2 controllers | 5 services | Property, Lease, Maintenance, Commission models  
**Backend ready**: Properties CRUD, Leases CRUD, Maintenance CRUD, Agent Commissions, Lease Accounting  

#### Pages to Build
| Page | Route | Description | Backend Endpoint |
|------|-------|-------------|-----------------|
| Dashboard | `/real-estate` | KPI cards (properties, active leases, occupancy rate), portfolio value | Aggregate |
| Properties | `/real-estate/properties` | Property cards/list with gallery, type filters, status | GET /real-estate/properties |
| Property Detail | `/real-estate/properties/[id]` | Photos, floor plans, lease history, maintenance log | GET /real-estate/properties/:id |
| Leases | `/real-estate/leases` | Active leases DataTable, rent schedule, renewal tracking | GET /real-estate/leases |
| Lease Detail | `/real-estate/leases/[id]` | Terms, payment history, documents, renewal dates | GET /real-estate/leases/:id |
| Maintenance | `/real-estate/maintenance` | Work orders, vendor assignment, cost tracking | GET /real-estate/maintenances |
| Agent Commissions | `/real-estate/commissions` | Commission rules, calculations, payout history | GET /real-estate/agent-commissions |
| Tenant Portal | `/real-estate/tenants` | Tenant directory, contact info, lease status | Derived from leases |
| Reports | `/real-estate/reports` | Occupancy rates, rent collection, maintenance costs | Aggregate |

#### Sidebar Navigation to Add
```
Real Estate
├── Dashboard
├── Portfolio
│   ├── Properties
│   ├── Leases
│   └── Tenant Directory
├── Operations
│   ├── Maintenance
│   └── Agent Commissions
└── Reports
```

---

### Sprint 15: Field Service Module
**Status**: PENDING  
**Current state**: 1 page | 2 controllers | 7 services | ServiceTicket, Dispatch models  
**Backend ready**: Tickets CRUD, Dispatches CRUD, Checklists, Preventative Maintenance scheduling  

#### Pages to Build
| Page | Route | Description | Backend Endpoint |
|------|-------|-------------|-----------------|
| Dashboard | `/field-service` | KPI cards (open tickets, dispatches today, completion rate), map | Aggregate |
| Service Tickets | `/field-service/tickets` | DataTable with priority/status filters, SLA tracking | GET /field-service/tickets |
| Ticket Detail | `/field-service/tickets/[id]` | Timeline, assignment, parts used, customer signoff | GET /field-service/tickets/:id |
| Dispatch Board | `/field-service/dispatch` | Map + list view, technician assignment, drag-to-schedule | GET /field-service/dispatches |
| Technicians | `/field-service/technicians` | Technician directory, skills, availability, workload | Derived from dispatches |
| Checklists | `/field-service/checklists` | Template checklists for job types, completion tracking | GET /field-service/checklists |
| Preventive Maintenance | `/field-service/preventive` | Scheduled maintenance calendar, auto-create tickets | GET /field-service/preventive-maintenances |
| Customer Portal | `/field-service/customers` | Service history per customer, SLA compliance | Derived from tickets |
| Reports | `/field-service/reports` | First-time fix rate, avg response time, technician utilization | Aggregate |

#### Sidebar Navigation to Add
```
Field Service
├── Dashboard
├── Service Management
│   ├── Service Tickets
│   ├── Dispatch Board
│   ├── Checklists
│   └── Preventive Maintenance
├── Team
│   ├── Technicians
│   └── Customer Directory
└── Reports
```

---

### Sprint 16: Communication (Connect) Module
**Status**: PENDING  
**Current state**: 2 pages (1 stub, 1 advanced) | 1 controller | 3 services | 30+ endpoints  
**Backend ready**: Workspaces, Channels, DMs, Groups, Messages, Reactions, Pins, Bookmarks, Presence, Meetings, Events, Notifications  

#### Pages to Build
| Page | Route | Description | Backend Endpoint |
|------|-------|-------------|-----------------|
| Dashboard | `/communication` | Unread counts, recent conversations, meeting schedule | GET /communication/workspace |
| Spaces & Channels | `/communication/spaces` | Channel directory, create space/channel, join/leave | GET /communication/directory |
| Chat View | `/communication/chat/[id]` | Message thread, reactions, pins, file attachments | GET /communication/messages |
| Direct Messages | `/communication/dm` | DM list, create new DM, message composer | POST /communication/dm |
| Meetings | `/communication/meetings` | Meeting scheduler, active meetings, join/end | GET/POST /communication/meetings |
| Calendar | `/communication/calendar` | Event calendar view, create events, RSVP | GET/POST /communication/events |
| Notifications | `/communication/notifications` | Notification preferences, digest settings | GET /communication/notifications |
| Presence | Widget on all pages | Online/away/DND status indicator | GET/SET /communication/presence |

#### Sidebar Navigation to Add
```
Connect
├── Dashboard
├── Messaging
│   ├── Spaces & Channels
│   ├── Direct Messages
│   └── Chat
├── Collaboration
│   ├── Meetings
│   └── Calendar
└── Settings
    └── Notifications
```

---

### Sprint 17: Analytics Module (Enhancement)
**Status**: PENDING (minor)  
**Current state**: 7 pages, 7-item sidebar, comprehensive — mostly done  
**Needs**: Polish existing pages, verify no runtime errors, add any missing data connectors  

#### Tasks
- [ ] Verify all 7 pages render without errors
- [ ] Check data loading from API
- [ ] Fix any type errors or runtime issues
- [ ] Add saved report management if missing
- [ ] Enhance dashboard builder with more widget types

---

## EXECUTION ORDER

| Priority | Sprint | Module | Effort | Reason |
|----------|--------|--------|--------|--------|
| 1 | 11 | Supply Chain | Medium | 1 page → 9 pages, backend ready |
| 2 | 12 | Education | Large | 1 page → 12 pages, backend ready |
| 3 | 13 | Healthcare | XL | 0 pages → 13 pages, backend ready, new directory |
| 4 | 14 | Real Estate | Medium | 1 page → 9 pages, backend ready |
| 5 | 15 | Field Service | Medium | 1 page → 9 pages, backend ready |
| 6 | 16 | Communication | Large | 2 pages → 8 pages, 30+ endpoints to wire |
| 7 | 17 | Analytics | Small | Polish only, 7 pages already built |

**Total remaining**: ~69 new pages across 7 modules

---

## ARCHITECTURE REFERENCE

### Design System Components
`DataTable`, `Modal`, `ConfirmDialog`, `Drawer`, `TextField`, `FormField`, `Input`, `Textarea`, `Select`, `Tabs`, `Pagination`, `Stepper`, `ViewSwitcher`, `KPICard`, `DashboardKPICard`, `DashboardChart`, `Sparkline`, `MiniBarChart`, `MiniDonutChart`, `Badge`, `StatusBadge`, `EmptyState`, `Card`, `PageHeader`, `Spinner`, `Skeleton`, `KanbanBoard`, `DrillDownModal`, `ChartTypePicker`

### UI Pattern Checklist (per module)
1. **Dashboard** — KPI cards with drill-down, charts, quick action links
2. **List views** — DataTable, search, status filters, bulk actions
3. **Detail views** — Tabbed layout, timeline, related records
4. **Create/Edit** — Modal with FormField/TextField/Select, validation
5. **Empty states** — Illustrated with CTA button
6. **Sidebar** — Organized by category with headers and icons

### Services
- **Infra**: Postgres :5432, Redis :6379, MinIO :9000 (Docker)
- **API**: NestJS :3001
- **Web**: Next.js 15 :3000
- **Launch**: `.claude/launch.json`
