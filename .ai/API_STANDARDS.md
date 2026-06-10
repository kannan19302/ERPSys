# API Standards — Universal ERP System

> All REST API endpoints MUST follow these standards.
> AI agents MUST read this before creating any new endpoint.

---

## 1. URL Structure

### 1.1 Base URL

```
/api/v1/<module>/<resource>
```

### 1.2 Rules

- Use **plural nouns** for resources: `/invoices`, `/employees`, `/products`
- Use **kebab-case** for multi-word resources: `/purchase-orders`, `/sales-reports`
- Use **path parameters** for specific resources: `/invoices/:id`
- Use **query parameters** for filtering, sorting, pagination
- **Never use verbs** in URLs: ❌ `/api/v1/getInvoices` ✅ `/api/v1/finance/invoices`
- **Nest sub-resources** max 2 levels deep: `/invoices/:id/line-items`

### 1.3 Examples

```
GET     /api/v1/finance/invoices                  # List invoices
POST    /api/v1/finance/invoices                  # Create invoice
GET     /api/v1/finance/invoices/:id              # Get invoice by ID
PATCH   /api/v1/finance/invoices/:id              # Update invoice
DELETE  /api/v1/finance/invoices/:id              # Delete invoice (soft)
GET     /api/v1/finance/invoices/:id/line-items   # List invoice line items
POST    /api/v1/finance/invoices/:id/send         # Action: Send invoice (verb ok for actions)
POST    /api/v1/finance/invoices/:id/void         # Action: Void invoice
```

---

## 2. HTTP Methods

| Method | Use | Idempotent | Request Body |
|:---|:---|:---|:---|
| `GET` | Retrieve resource(s) | Yes | No |
| `POST` | Create resource / trigger action | No | Yes |
| `PATCH` | Partial update | Yes | Yes (partial) |
| `DELETE` | Remove resource (soft delete) | Yes | No |
| `PUT` | Full replace (rare, avoid) | Yes | Yes (full) |

---

## 3. Request Format

### 3.1 Create / Update Payloads

```json
// POST /api/v1/finance/invoices
{
  "customerId": "clx1abc123",
  "dueDate": "2026-07-10T00:00:00Z",
  "currency": "USD",
  "lineItems": [
    {
      "productId": "clx1def456",
      "quantity": 5,
      "unitPrice": 99.99,
      "description": "Widget Pro"
    }
  ],
  "notes": "Net 30 terms"
}
```

### 3.2 Query Parameters

```
GET /api/v1/finance/invoices?status=PAID&customerId=clx1abc123&sort=-createdAt&page=1&limit=25
```

| Parameter | Type | Description |
|:---|:---|:---|
| `page` | number | Page number (1-indexed, default: 1) |
| `limit` | number | Items per page (default: 25, max: 100) |
| `sort` | string | Sort field. Prefix with `-` for descending |
| `search` | string | Full-text search across searchable fields |
| `status` | string | Filter by status |
| `from` / `to` | ISO date | Date range filter |

---

## 4. Response Format

### 4.1 Single Resource

```json
{
  "data": {
    "id": "clx1abc123",
    "type": "invoice",
    "attributes": {
      "invoiceNumber": "INV-2026-0042",
      "status": "DRAFT",
      "subtotal": 499.95,
      "taxAmount": 49.99,
      "totalAmount": 549.94,
      "currency": "USD",
      "dueDate": "2026-07-10T00:00:00Z",
      "createdAt": "2026-06-10T10:30:00Z",
      "updatedAt": "2026-06-10T10:30:00Z"
    },
    "relationships": {
      "customer": { "id": "clx1def456", "name": "Acme Corp" },
      "lineItems": [
        { "id": "clx1ghi789", "productId": "clx1jkl012", "quantity": 5, "unitPrice": 99.99 }
      ]
    }
  }
}
```

### 4.2 List Response (Paginated)

```json
{
  "data": [
    { "id": "clx1abc123", "type": "invoice", "attributes": { ... } },
    { "id": "clx1abc124", "type": "invoice", "attributes": { ... } }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 142,
    "totalPages": 6
  }
}
```

### 4.3 Error Response

```json
{
  "error": {
    "statusCode": 422,
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "customerId", "message": "Customer not found" },
      { "field": "lineItems", "message": "At least one line item is required" }
    ],
    "timestamp": "2026-06-10T10:30:00Z",
    "path": "/api/v1/finance/invoices"
  }
}
```

### 4.4 HTTP Status Codes

| Code | Usage |
|:---|:---|
| `200` | Successful GET, PATCH |
| `201` | Successful POST (resource created) |
| `204` | Successful DELETE (no content) |
| `400` | Bad request (malformed JSON, invalid params) |
| `401` | Not authenticated |
| `403` | Not authorized (missing permissions) |
| `404` | Resource not found |
| `409` | Conflict (duplicate, version mismatch) |
| `422` | Validation error (valid JSON, invalid data) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## 5. Versioning

- API version in URL path: `/api/v1/...`
- Breaking changes require a new version (`v2`)
- Non-breaking changes (new fields, new endpoints) are added to the current version
- Old versions are supported for minimum 6 months after deprecation notice

---

## 6. Rate Limiting

| Tier | Limit | Window |
|:---|:---|:---|
| Free | 100 requests | Per minute |
| Starter | 500 requests | Per minute |
| Professional | 2000 requests | Per minute |
| Enterprise | Custom | Custom |

Response headers:
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 423
X-RateLimit-Reset: 1686400000
```

---

## 7. Authentication

All API requests (except auth endpoints) require:

```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_slug>
```

- JWT tokens are short-lived (15 minutes)
- Refresh tokens are long-lived (7 days)
- Token refresh: `POST /api/v1/auth/refresh`

---

## 8. Bulk Operations

For operations on multiple resources:

```json
// POST /api/v1/finance/invoices/bulk
{
  "action": "send", // or "delete", "update-status"
  "ids": ["clx1abc123", "clx1abc124", "clx1abc125"],
  "data": { "status": "SENT" } // optional, depends on action
}
```

Response:
```json
{
  "data": {
    "total": 3,
    "succeeded": 2,
    "failed": 1,
    "results": [
      { "id": "clx1abc123", "status": "success" },
      { "id": "clx1abc124", "status": "success" },
      { "id": "clx1abc125", "status": "error", "error": "Invoice already sent" }
    ]
  }
}
```
