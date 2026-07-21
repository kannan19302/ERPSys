# IMPLEMENTATION_PLAN.md — Cycle 30 (Phase M)

**Date**: 2026-07-21 | **Agent**: Antigravity | **Cycle**: 30 | **Phase**: M

## Scope

**P1 Security fixes** (#39 CRM raw SQL, #41 leases `any` type) + **Supply Chain deepening** (46→120+ features, Functional tier).

## Priority Ladder

- P1: #39 (crm-intelligence.service.ts `$queryRawUnsafe`), #40 (finance-operations verify), #41 (leases @Query() q:any)
- P3: Supply Chain deepening — 40+ new features across 5 batches

## Feature Batches

### Batch 1: Demand Planning & Forecasting (10 endpoints)

GET/POST/PATCH/DELETE demand-plans, run forecast, get results, approve, accuracy KPI, consensus demand

### Batch 2: Freight & Transportation Management (10 endpoints)

CRUD freight-orders, assign-carrier, freight-rates, freight-analytics, tracking events/timeline

### Batch 3: Supplier Collaboration Portal (10 endpoints)

Supplier PO acknowledge/ship, invoice submit, scorecards, evaluate, collaboration threads/messages

### Batch 4: Supply Network & Risk Management (10 endpoints)

Risk events CRUD + impact calc, network map nodes, disruption alerts + ack, supply resilience, alternative sources

### Batch 5: SCM Control Tower + Frontend (5+ features)

Dashboard KPI endpoint, KPIs endpoint, alerts endpoint, 2 frontend pages (Control Tower + Demand Planning)

## Gate: FAST (scoped typecheck + vitest on touched modules)

## Cycle End

- DEV cycles: 29 → 30 → set Next run: HARDEN (mandatory)
- CHANGELOG + REGISTRY update in same commit
