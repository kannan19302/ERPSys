# Prompt Template: Adding a New API Endpoint

> Use this template before asking any AI agent to create new API endpoints.

---

## Pre-Flight Checklist

1. ☐ Read `.ai/API_STANDARDS.md` for endpoint conventions
2. ☐ Read `.ai/CONVENTIONS.md` for naming rules
3. ☐ Read `.ai/SECURITY.md` Section 2 for RBAC requirements
4. ☐ Check existing endpoints in the module's controller for conflicts

---

## Prompt Template

```
Add a new API endpoint to the [MODULE_NAME] module:

## Endpoint
- Method: [GET/POST/PATCH/DELETE]
- Path: `/api/v1/[module]/[resource]`
- Description: [What does this endpoint do?]

## Authentication
- Required: Yes
- Permissions: `[module].[resource].[action]`

## Request
### Path Parameters
| Param | Type | Description |
|:---|:---|:---|
| [param] | string | [description] |

### Query Parameters (for GET endpoints)
| Param | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| page | number | No | 1 | Page number |
| limit | number | No | 25 | Items per page |
| sort | string | No | -createdAt | Sort field |
| [filter] | [type] | [req?] | [default] | [description] |

### Request Body (for POST/PATCH endpoints)
```json
{
  "field1": "value",
  "field2": 123
}
```

## Response
### Success Response
- Status: [200/201/204]
```json
{
  "data": { ... }
}
```

### Error Responses
- 400: [when]
- 401: Not authenticated
- 403: Missing permission `[permission]`
- 404: [resource] not found
- 422: Validation error

## Implementation Steps
1. Create/update DTO in `dto/[action]-[entity].dto.ts`
2. Create Zod validator in `packages/shared/src/validators/`
3. Add service method in `[module].service.ts`
4. Add controller method in `[module].controller.ts`
5. Add `@RequirePermissions('[permission]')` decorator
6. Write unit test for service method
7. Write integration test for controller
```
