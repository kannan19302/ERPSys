# Implementation Plan — Cycle 44: HR Module Deepening to 2,000+ Features

**Phase**: M — Module strengthening
**Focus**: HR (user-directed override of focus order)
**Start SHA**: bc6156e7
**Throughput floor**: 5,000 net LOC OR 40 features per cycle

## Scope

Deepen the aggregate HR module (`hr` + `advanced-hr` + `hr-advanced`) from ~1,011 to 2,000+ features by building 5 new sub-domains via parallel agents.

## Current Feature Count

| Sub-module  | Features   |
| ----------- | ---------- |
| hr          | 144        |
| advanced-hr | 710        |
| hr-advanced | 157        |
| **Total**   | **1,011**  |
| **Target**  | **2,000+** |
| **Gap**     | **~989**   |

## Parallel Work Breakdown

5 parallel agents, each building an independent sub-domain with its own service + controller + Prisma models + shared schemas + permissions. No shared-file conflicts.

### Agent 1: Talent Management & Development

- **Prisma models**: LearningCourse, LearningModule, LearningEnrollment, Certification, SkillMatrix, SkillGapAnalysis, CareerPath, MentoringProgram, MentoringSession
- **Service**: `hr-talent.service.ts`
- **Endpoints**: ~40 (courses CRUD, modules CRUD, enrollments, certifications, skills matrix, gap analysis, career paths, mentoring programs/sessions, analytics)
- **Permissions**: 9 resources × 4 actions = 36
- **Feature contribution**: ~40

### Agent 2: Advanced Compensation & Benefits

- **Prisma models**: BonusPlan, BonusPayout, EquityGrant, EquityVestingSchedule, BenefitsEligibilityRule, FlexibleBenefitCredit, CompensationReview, CompensationBenchmark, TotalRewardsStatement
- **Service**: `hr-compensation.service.ts`
- **Endpoints**: ~40 (bonus plans/payouts, equity grants/vesting, eligibility rules, flexible credits, comp reviews, benchmarks, total rewards)
- **Permissions**: 9 resources × 4 actions = 36
- **Feature contribution**: ~40

### Agent 3: HR Operations, Helpdesk & Employee Relations

- **Prisma models**: HrTicket, HrTicketAssignment, HrTicketCategory, EmployeeGrievance, DisputeResolution, BackgroundCheckRequest, VisaRecord, ImmigrationDocument, EmployeeWellnessProgram, WellnessActivity
- **Service**: `hr-operations.service.ts`
- **Endpoints**: ~40 (tickets CRUD/assignment/dashboard, grievances, disputes, background checks, visa/immigration, wellness programs)
- **Permissions**: 10 resources × 4 actions = 40
- **Feature contribution**: ~40

### Agent 4: Workforce Planning & DEI Analytics

- **Prisma models**: HeadcountPlan, HeadcountPlanLine, SuccessionPlan, SuccessionCandidate, DEIMetric, DEIReport, TurnoverPrediction, ComplianceReportTemplate, HRComplianceReport, ComplianceRequirement
- **Service**: `hr-analytics.service.ts`
- **Endpoints**: ~40 (headcount plans, succession pipeline, DEI metrics/reports, turnover prediction, compliance reports/requirements)
- **Permissions**: 10 resources × 4 actions = 40
- **Feature contribution**: ~40

### Agent 5: Employee Experience & Engagement

- **Prisma models**: EmployeeRecognition, EmployeeRecognitionAward, WellnessChallenge, WellnessLeaderboard, eNPSurvey, PulseSurvey, SurveyResponse, EmployeeJourneyMilestone, AlumniRecord, AlumniEvent
- **Service**: `hr-experience.service.ts`
- **Endpoints**: ~40 (recognition CRUD/awards, wellness challenges/leaderboards, eNPS/pulse surveys CRUD/responses, journey milestones, alumni records/events)
- **Permissions**: 10 resources × 4 actions = 40
- **Feature contribution**: ~40

## Total New: ~200 features + ~8,000 LOC

## Duplicate Check

Grep the working tree for each proposed Prisma model name — none exist.

## Gate Tier

MILESTONE (new schema + API surface). Each agent verifies its own typecheck before completing.

## Rollback

All new code is additive (new service/controller files, additive schema changes). To rollback: remove the new imports from `hr-advanced.module.ts` and revert the schema additions.

## Execution

1. Write all Prisma models to `schema.prisma` (coordinated by orchestrator)
2. Write all shared Zod schemas to `shared/src/hr/index.ts` (coordinated by orchestrator)
3. Write all permissions to `registry.ts` (coordinated by orchestrator)
4. Launch 5 parallel agents to build service + controller + module wiring
5. Merge all outputs
6. Typecheck + arch check
7. Test
8. Record + Ship
