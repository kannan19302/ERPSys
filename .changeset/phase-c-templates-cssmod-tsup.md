---
"@unerp/ui-layout": minor
"@unerp/ui-components": minor
"@unerp/ui-tokens": patch
"@unerp/ui-charts": patch
"@unerp/ui-dashboard": patch
"@unerp/ui-data-grid": patch
"@unerp/ui-form-engine": patch
"@unerp/ui-hooks": patch
"@unerp/ui-icons": patch
"@unerp/ui-notifications": patch
"@unerp/ui-theme": patch
"@unerp/ui-utils": patch
"@unerp/ui-workflow": patch
---

Phase C: page templates, CSS Modules migration, tsup build pipeline

- **ui-layout**: add `ListPageTemplate`, `DetailPageTemplate`, `StatCardRow` composites
- **ui-components**: migrate Card, Badge, Spinner, Skeleton, EmptyState to CSS Modules (token-driven, zero hardcoded values)
- **All ui-* packages**: add tsup build configuration (dual ESM/CJS output, `.d.ts` types)
