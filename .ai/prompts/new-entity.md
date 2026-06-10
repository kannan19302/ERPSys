# Prompt Template: Adding a New Database Entity

> Use this template before asking any AI agent to add a new database entity/model.

---

## Pre-Flight Checklist

1. ☐ Read `.ai/DATA_MODEL.md` for entity design rules
2. ☐ Read `.ai/CONVENTIONS.md` Section 1.2 for naming rules
3. ☐ Check existing models in `packages/database/prisma/schema.prisma` for conflicts

---

## Prompt Template

```
Add a new database entity: [ENTITY_NAME]

## Module
This entity belongs to: [module name, e.g., finance, hr, inventory]

## Description
[What does this entity represent? What business concept does it model?]

## Fields
| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| [fieldName] | [String/Int/Decimal/DateTime/Boolean/Json] | [Yes/No] | [value] | [description] |

## Relationships
- Belongs to: [parent entity] (many-to-one)
- Has many: [child entity] (one-to-many)
- Many-to-many with: [other entity]

## Indexes
- Unique: [field1, field2] — reason
- Index: [field] — for frequent query patterns

## Business Rules
- [Rule 1, e.g., "Status can only transition DRAFT → SENT → PAID"]
- [Rule 2]

## Mandatory Requirements
Remember to include:
- `id` (CUID2 primary key)
- `tenant_id` (multi-tenancy)
- `created_at`, `updated_at` (timestamps)
- `created_by`, `updated_by` (audit trail)
- Soft delete fields if applicable (`deleted_at`, `deleted_by`)
- Use Decimal(15,2) for money fields
- Use snake_case for column names via @map()
- Use plural table name via @@map()
```

---

## Example

```
Add a new database entity: Invoice

## Module
finance

## Fields
| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| invoiceNumber | String | Yes | Auto-generated | e.g., INV-2026-0042 |
| customerId | String | Yes | — | FK to customers |
| status | String | Yes | DRAFT | DRAFT/SENT/PAID/OVERDUE/CANCELLED/VOID |
| issueDate | DateTime | Yes | now() | Date invoice was issued |
| dueDate | DateTime | Yes | — | Payment due date |
| subtotal | Decimal(15,2) | Yes | 0 | Sum of line items |
| taxAmount | Decimal(15,2) | Yes | 0 | Total tax |
| totalAmount | Decimal(15,2) | Yes | 0 | subtotal + tax |
| currency | String | Yes | USD | ISO 4217 currency code |
| notes | String | No | — | Internal/external notes |
| paidAt | DateTime | No | — | When fully paid |

## Relationships
- Belongs to: Customer (many-to-one)
- Has many: InvoiceLineItem (one-to-many)
- Has many: Payment (one-to-many)
```
