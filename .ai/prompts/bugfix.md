# Prompt Template: Debugging Workflow

> Use this template when asking an AI agent to investigate and fix a bug.

---

## Pre-Flight Checklist

1. ☐ Read `.ai/ARCHITECTURE.md` to understand system context
2. ☐ Read `.ai/CONVENTIONS.md` for error handling patterns
3. ☐ Check `.ai/CHANGELOG.md` for recent changes that might be related

---

## Prompt Template

```
Debug and fix the following issue:

## Problem Description
[Describe the bug clearly. What is happening vs. what should happen?]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What is actually happening]

## Error Messages / Logs
```
[Paste error messages, stack traces, or relevant logs]
```

## Environment
- Module: [which ERP module is affected]
- Layer: [frontend/backend/database]
- Browser: [if frontend issue]

## Debugging Instructions
1. First, identify the root cause — don't just fix the symptom
2. Check if this is a multi-tenancy issue (tenant_id filtering)
3. Check if this is a permissions issue (RBAC)
4. Check if recent changes in `.ai/CHANGELOG.md` could be related
5. Write a regression test that reproduces the bug BEFORE fixing it
6. Fix the issue
7. Verify the regression test passes
8. Check if similar bugs could exist in other modules
9. Update `.ai/CHANGELOG.md` with the fix
```

---

## Common Debugging Patterns

### Multi-Tenancy Issues
```
Check: Is tenant_id being correctly injected by Prisma middleware?
Check: Is the JWT token containing the correct tenant_id?
Check: Are RLS policies active on the affected table?
```

### Permission Issues
```
Check: Does the user's role have the required permission?
Check: Is the @RequirePermissions decorator applied?
Check: Is the RbacGuard in the guard chain?
```

### Data Integrity Issues
```
Check: Are foreign key constraints satisfied?
Check: Are unique constraints being violated?
Check: Is soft-delete filtering working correctly?
```

### Event-Related Issues
```
Check: Is the event being emitted with the correct name?
Check: Is the event listener registered and decorated with @OnEvent?
Check: Is the event payload complete?
```
