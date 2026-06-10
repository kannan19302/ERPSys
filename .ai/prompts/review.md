# Prompt Template: Code Review Checklist

> Use this template when asking an AI agent to review code changes.

---

## Prompt Template

```
Review the following code changes:

## Files Changed
- [file1.ts]
- [file2.ts]

## Review Against These Criteria:

### Architecture
- [ ] Module boundaries respected (no cross-module imports)
- [ ] Domain events used for cross-module communication
- [ ] Follows module structure template (.ai/ARCHITECTURE.md Section 3)
- [ ] No circular dependencies

### Type Safety
- [ ] No `any` types
- [ ] Proper TypeScript strict mode compliance
- [ ] Shared types used from `@unerp/shared`
- [ ] DTOs validated with Zod

### Security
- [ ] tenant_id included on all new database tables
- [ ] Guards applied on all controller methods (@UseGuards)
- [ ] Permissions specified (@RequirePermissions)
- [ ] No secrets in code
- [ ] Input validated and sanitized
- [ ] SQL injection prevention (Prisma parameterization)

### API Standards
- [ ] RESTful URL design (plural nouns, kebab-case)
- [ ] Correct HTTP methods and status codes
- [ ] Consistent response format (data/meta/error)
- [ ] Pagination on list endpoints

### Code Quality
- [ ] Follows naming conventions (.ai/CONVENTIONS.md)
- [ ] Proper import ordering
- [ ] No console.log (use structured logger)
- [ ] Error handling with appropriate NestJS exceptions
- [ ] JSDoc on complex business logic

### Testing
- [ ] Unit tests for all service methods
- [ ] Edge cases covered (empty arrays, null values, boundaries)
- [ ] Test fixtures use factory pattern
- [ ] Descriptive test names

### Documentation
- [ ] MODULE_REGISTRY.md updated (if new/changed module)
- [ ] CHANGELOG.md updated
- [ ] Complex logic commented with "why" not "what"

### Performance
- [ ] Database queries use proper indexes
- [ ] No N+1 query patterns
- [ ] Large lists use pagination
- [ ] Heavy operations use BullMQ job queues
```
