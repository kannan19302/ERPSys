# @unerp/ui-components

## 0.2.0

### Minor Changes

- 5c46345: Phase C: page templates, CSS Modules migration, tsup build pipeline

  - **ui-layout**: add `ListPageTemplate`, `DetailPageTemplate`, `StatCardRow` composites
  - **ui-components**: migrate Card, Badge, Spinner, Skeleton, EmptyState to CSS Modules (token-driven, zero hardcoded values)
  - **All ui-\* packages**: add tsup build configuration (dual ESM/CJS output, `.d.ts` types)
