# IMPLEMENTATION_PLAN.md — DEV Cycle 66 (Phase M)

- **Cycle**: 66
- **Phase**: M (Module strengthening)
- **Selected Scope**: Deepening 6 target modules across Industry and Functional tiers (**Healthcare**, **Education**, **Field Service**, **Real Estate**, **People**, **Fixed Assets**).
- **Rationale**: Elevate weakest modules toward MVM/Functional/Competitive parity per program ladder focus order.
- **Velocity Target**: Ship ≥ 5,000 net LOC OR ≥ 40 distinct features.

## Planned Slices
1. **DB Layer**: Land 18 new Prisma models (`HealthcareClinicalNote`, `HealthcareTelemedicineSession`, `HealthcareMedicalBill`, `EducationReportCard`, `EducationScholarship`, `EducationAssignmentSubmission`, `FieldServiceWarranty`, `FieldServiceWorkOrderExpense`, `FieldServiceChecklist`, `RealEstatePropertyInspection`, `RealEstateRentCollectionLog`, `RealEstateListingSyndicate`, `PeopleOnboardingTask`, `PeopleTimeOffRequest`, `PeoplePeerRecognition`, `FixedAssetInsurancePolicy`, `FixedAssetRevaluation`, `FixedAssetPhysicalAudit`).
2. **Shared Layer**: Add 40+ permission codes to `registry.ts` and Zod validation schemas.
3. **API Layer**: 6 NestJS services + controllers adding 40+ REST endpoints.
4. **Test Layer**: 6 Vitest spec files covering all service methods.
5. **UI Layer**: 12 interactive Next.js dashboard pages wired with module tab layouts.

## Verification & Rollback
- `pnpm typecheck`
- `pnpm architecture:check`
- `pnpm --filter @unerp/api test`
- Rollback: Revert `schema.prisma` and module code; additive schema is non-breaking.
