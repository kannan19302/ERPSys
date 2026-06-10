# Glossary — Universal ERP System

> Domain-specific terminology used throughout the codebase.
> AI agents should reference this when the meaning of a term is unclear.

---

## General ERP Terms

| Term | Definition |
|:---|:---|
| **ERP** | Enterprise Resource Planning — integrated software managing core business processes |
| **Module** | A self-contained functional area (e.g., Finance, HR, Inventory) |
| **Tenant** | An organization/company using the system (in multi-tenant SaaS context) |
| **Multi-tenancy** | Architecture where a single instance serves multiple organizations with data isolation |
| **RLS** | Row-Level Security — PostgreSQL feature enforcing data isolation at the database level |
| **RBAC** | Role-Based Access Control — authorization based on user roles and permissions |

---

## Finance Terms

| Term | Definition |
|:---|:---|
| **General Ledger (GL)** | The master accounting record; all financial transactions flow here |
| **Chart of Accounts (CoA)** | Structured list of all accounts used by an organization |
| **Accounts Payable (AP)** | Money the company owes to vendors/suppliers |
| **Accounts Receivable (AR)** | Money owed to the company by customers |
| **Journal Entry** | A record of a financial transaction in double-entry bookkeeping |
| **Invoice** | A document requesting payment from a customer for goods/services |
| **Bill** | An invoice received from a vendor (the AP equivalent of an invoice) |
| **Credit Note** | A document reducing the amount owed by a customer |
| **Debit Note** | A document increasing the amount owed by a customer |
| **Fiscal Year** | The 12-month period used for financial reporting (may differ from calendar year) |
| **Tax Rate** | Percentage applied to taxable transactions |
| **Payment Terms** | Agreement on when payment is due (e.g., Net 30 = due in 30 days) |
| **Reconciliation** | Process of matching bank transactions with accounting records |

---

## HR Terms

| Term | Definition |
|:---|:---|
| **Employee** | A person employed by the organization |
| **Payroll** | The process of calculating and distributing employee wages |
| **Leave** | Time off from work (vacation, sick, personal, etc.) |
| **Attendance** | Record of employee work hours and presence |
| **Department** | An organizational unit within a company |
| **Designation** | An employee's job title or role |
| **Onboarding** | Process of integrating a new employee into the organization |
| **Offboarding** | Process of managing an employee's departure |

---

## Inventory & Supply Chain Terms

| Term | Definition |
|:---|:---|
| **SKU** | Stock Keeping Unit — unique identifier for a product variant |
| **Warehouse** | A physical location where inventory is stored |
| **Bin** | A specific storage location within a warehouse |
| **Stock Entry** | A record of stock movement (receipt, issue, transfer) |
| **Reorder Point** | Inventory level that triggers a new purchase order |
| **Lead Time** | Time between placing and receiving an order |
| **FIFO** | First In, First Out — inventory valuation method |
| **LIFO** | Last In, First Out — inventory valuation method |
| **BOM** | Bill of Materials — list of raw materials needed to manufacture a product |
| **MRP** | Material Requirements Planning — planning production based on demand |

---

## Sales & CRM Terms

| Term | Definition |
|:---|:---|
| **Lead** | A potential customer who has shown interest |
| **Opportunity** | A qualified lead with a potential deal |
| **Pipeline** | Visual representation of sales opportunities by stage |
| **Quotation** | A formal price proposal sent to a potential customer |
| **Sales Order** | A confirmed order from a customer |
| **Delivery Note** | A document accompanying goods being delivered |
| **Return** | Goods sent back by a customer |
| **RFQ** | Request for Quotation — asking vendors for pricing |
| **Purchase Order (PO)** | A formal order sent to a vendor |

---

## Technical Terms

| Term | Definition |
|:---|:---|
| **DTO** | Data Transfer Object — object used to transfer data between layers |
| **Domain Event** | A notification that something significant happened in a module |
| **Middleware** | Code that runs between request and handler (auth, logging, tenant injection) |
| **Guard** | NestJS construct that determines if a request should be handled |
| **Pipe** | NestJS construct that transforms/validates input data |
| **Interceptor** | NestJS construct that adds logic before/after handler execution |
| **BFF** | Backend For Frontend — an API layer tailored to a specific frontend |
| **RSC** | React Server Components — React components that render on the server |
| **tRPC** | TypeScript RPC — type-safe API calls without schema definition |
| **ORM** | Object-Relational Mapping — maps database tables to code objects |
| **Migration** | A versioned change to the database schema |
| **Seed** | Initial data loaded into the database for development/testing |
