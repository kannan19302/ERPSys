# Prompt Template: Creating a New ERP Module

> Use this template before asking any AI agent to create a new ERP module.
> Copy the instructions below and fill in the blanks.

---

## Pre-Flight Checklist

Before creating the module, the AI agent MUST:

1. ☐ Read `AGENTS.md` (if not already loaded)
2. ☐ Read `.ai/ARCHITECTURE.md` Section 3 (Module Structure)
3. ☐ Read `.ai/CONVENTIONS.md` (naming rules)
4. ☐ Read `.ai/DATA_MODEL.md` (entity design patterns)
5. ☐ Read `.ai/API_STANDARDS.md` (endpoint conventions)
6. ☐ Check `.ai/MODULE_REGISTRY.md` for existing modules and potential conflicts

---

## Prompt Template

```
Create a new ERP module: [MODULE_NAME]

## Module Description
[Describe what this module does, its business purpose, and key features]

## Key Entities
- [Entity1]: [Brief description]
- [Entity2]: [Brief description]
- [Entity3]: [Brief description]

## Key Features
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

## Dependencies
This module depends on: [list other modules, e.g., admin, finance]
This module is depended on by: [list modules that will consume events from this module]

## Domain Events to Emit
- `[module].[entity].created` — when [description]
- `[module].[entity].updated` — when [description]

## Domain Events to Listen To
- `[source_module].[entity].[action]` — react by [description]

## Instructions
Follow the module structure defined in .ai/ARCHITECTURE.md Section 3:

1. Create the NestJS module in `apps/api/src/modules/[module-name]/`
2. Create Prisma models in `packages/database/prisma/schema.prisma`
3. Create shared Zod validators in `packages/shared/src/validators/`
4. Create shared types in `packages/shared/src/types/`
5. Create frontend pages in `apps/web/app/(dashboard)/[module-name]/`
6. Write unit tests for all service methods
7. Update `.ai/MODULE_REGISTRY.md` with the new module
8. Update `.ai/CHANGELOG.md`
```

---

## Example: Creating the HR Module

```
Create a new ERP module: Human Resources (HR)

## Module Description
Manages employee lifecycle from recruitment to offboarding, including
employee records, departments, payroll processing, leave management,
and attendance tracking.

## Key Entities
- Employee: Core employee record with personal, job, and compensation details
- Department: Organizational unit (supports hierarchy)
- LeaveRequest: Employee time-off requests with approval workflow
- Attendance: Daily attendance records (check-in/check-out)
- PayrollRun: Monthly/bi-weekly payroll calculation batch

## Key Features
1. Employee CRUD with profile management
2. Department hierarchy management
3. Leave request and approval workflow
4. Attendance tracking
5. Payroll calculation and processing

## Dependencies
This module depends on: admin (users, roles), finance (payroll posting)
This module is depended on by: projects (timesheets), finance (payroll costs)

## Domain Events to Emit
- `hr.employee.onboarded` — when a new employee is fully set up
- `hr.employee.offboarded` — when an employee leaves
- `hr.payroll.processed` — when payroll run is completed
- `hr.leave.approved` — when a leave request is approved

## Domain Events to Listen To
- `admin.user.created` — create linked employee record if applicable

## Instructions
Follow the module structure defined in .ai/ARCHITECTURE.md Section 3.
```
