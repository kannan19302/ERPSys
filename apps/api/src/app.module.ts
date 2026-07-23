import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR, APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule, ThrottlerStorage } from "@nestjs/throttler";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { TenantInterceptor } from "./common/guards/tenant.interceptor";
import { TenantThrottlerGuard } from "./common/guards/tenant-throttler.guard";
import { TenantWriteGuard } from "./common/guards/tenant-write.guard";
import {
  RedisThrottlerStorage,
  InMemoryThrottlerStorage,
} from "./common/guards/tenant-throttler-storage";
import { HealthController } from "./health.controller";
import { MetricsController } from "./metrics.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { SearchModule } from "./modules/search/search.module";
// ═══════════════════════════════════════════════════════════════════════════
// DEPRECATED — Phase 4/6 of the settings→SaaS-Portal migration is complete.
// All frontend routes for administration/settings have been migrated to
// `/saas/portal/*`, `/ai/settings`, and per-app `/apps/*/settings` pages.
// SaasModule/AdminModule are kept only because some backend API consumers
// (legacy installs, direct API key callers) may still reference old
// `/api/v1/saas/*` or `/api/v1/admin/*` endpoints. Will be removed in a
// future cleanup pass once all API callers are migrated to SaaS Portal
// endpoints. New development: use `SaasPortalModule` instead.
// ═══════════════════════════════════════════════════════════════════════════
import { AdminModule } from "./modules/admin/admin.module";
// ═══════════════════════════════════════════════════════════════════════════
// DEPRECATED — same as AdminModule above. Frontend fully migrated to
// SaasPortalModule. Kept for legacy API backward compatibility only.
// ═══════════════════════════════════════════════════════════════════════════
import { SaasModule } from "./modules/saas/saas.module";
import { PlatformCredentialsModule } from "./common/platform-credentials/platform-credentials.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { HrModule } from "./modules/hr/hr.module";
import { CrmModule } from "./modules/crm/crm.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { ProcurementModule } from "./modules/procurement/procurement.module";
import { SalesModule } from "./modules/sales/sales.module";
import { SupplyChainModule } from "./modules/supply-chain/supply-chain.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { ManufacturingModule } from "./modules/manufacturing/manufacturing.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { CommunicationModule } from "./modules/communication/communication.module";
import { PosModule } from "./modules/pos/pos.module";
import { AdvancedFinanceModule } from "./modules/advanced-finance/advanced-finance.module";
import { AdvancedHrModule } from "./modules/advanced-hr/advanced-hr.module";
import { WorkflowModule } from "./modules/workflow/workflow.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { StorageModule } from "./modules/storage/storage.module";
import { ReportingModule } from "./modules/reporting/reporting.module";
import { ApiPlatformModule } from "./modules/api-platform/api-platform.module";
import { ExtGatewayModule } from "./modules/ext-gateway/ext-gateway.module";
import { LocalizationModule } from "./modules/localization/localization.module";
import { PwaModule } from "./modules/pwa/pwa.module";
import { DevopsModule } from "./modules/devops/devops.module";
import { SaasPortalModule } from "./modules/saas-portal/saas-portal.module";
import { BuilderModule } from "./modules/builder/builder.module";
import { CommonModule } from "./common/common.module";
import { QueueModule } from "./common/queues/queue.module";
import { AiModule } from "./modules/ai/ai.module";
import { DriveModule } from "./modules/drive/drive.module";
import { EcommerceModule } from "./modules/ecommerce/ecommerce.module";
import { MarketplaceModule } from "./modules/marketplace/marketplace.module";
import { PeopleModule } from "./modules/people/people.module";
import { FixedAssetsModule } from "./modules/fixed-assets/fixed-assets.module";
import { InventoryLogisticsModule } from "./modules/inventory/inventory-logistics.module";
import { QualityComplianceModule } from "./modules/inventory/quality-compliance.module";
import { WarehouseOpsModule } from "./modules/inventory/warehouse-ops.module";
import { LotSerialTrackingModule } from "./modules/inventory/lot-serial-tracking.module";
import { DemandForecastingModule } from "./modules/inventory/demand-forecasting.module";
import { LandedCostModule } from "./modules/inventory/landed-cost.module";
import { StockValuationModule } from "./modules/inventory/stock-valuation.module";
import { TransferOrdersModule } from "./modules/inventory/transfer-orders.module";
import { YardManagementModule } from "./modules/inventory/yard-management.module";
import { StockTakeModule } from "./modules/inventory/stock-take.module";
import { HazmatModule } from "./modules/inventory/hazmat.module";
import { AslModule } from "./modules/inventory/asl.module";
import { ContainerPalletModule } from "./modules/inventory/container-pallet.module";
import { CatchWeightRecallModule } from "./modules/inventory/catch-weight-recall.module";
import { PackagingGs1Module } from "./modules/inventory/packaging-gs1.module";
import { ColdChainWriteoffModule } from "./modules/inventory/cold-chain-writeoff.module";
import { VelocityAbcXyzModule } from "./modules/inventory/velocity-abc-xyz.module";
import { CustomerReturnsModule } from "./modules/inventory/customer-returns.module";
import { MinMaxReplenModule } from "./modules/inventory/minmax-replen.module";
import { FreightClaimsModule } from "./modules/inventory/freight-claims.module";
import { VmiModule } from "./modules/inventory/vmi.module";
import { CostingMethodsModule } from "./modules/inventory/costing-methods.module";
import { LotExpiryModule } from "./modules/inventory/lot-expiry.module";
import { CrossDockModule } from "./modules/inventory/cross-dock.module";
import { PickWavesModule } from "./modules/inventory/pick-waves.module";
import { AsnModule } from "./modules/inventory/asn.module";
import { ShipmentTrackingModule } from "./modules/inventory/shipment-tracking.module";
import { SavedViewsModule } from "./modules/saved-views/saved-views.module";
import { EducationModule } from "./modules/education/education.module";
import { HealthcareModule } from "./modules/healthcare/healthcare.module";
import { RealEstateModule } from "./modules/real-estate/real-estate.module";
import { FieldServiceModule } from "./modules/field-service/field-service.module";
import { BlockchainModule } from "./modules/blockchain/blockchain.module";
import { OutboxModule } from "./modules/outbox/outbox.module";
import { IdempotencyInterceptor } from "./common/idempotency/idempotency.interceptor";
import {
  InMemoryIdempotencyStore,
  RedisIdempotencyStore,
} from "./common/idempotency/idempotency.store";

@Module({
  imports: [
    // Global shared services (change history, etc.)
    CommonModule,

    // Async job processing (email, export, payroll, data-import)
    QueueModule,

    // Event-driven communication between modules
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: ".",
      maxListeners: 20,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: "medium",
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Register ERP Foundation & Core Modules (Phase 0-1)
    AuthModule,
    SearchModule,
    AdminModule,
    FinanceModule,
    HrModule,
    CrmModule,
    InventoryModule,
    InventoryLogisticsModule,
    QualityComplianceModule,
    WarehouseOpsModule,
    LotSerialTrackingModule,
    DemandForecastingModule,
    LandedCostModule,
    StockValuationModule,
    TransferOrdersModule,
    YardManagementModule,
    StockTakeModule,
    HazmatModule,
    AslModule,
    ContainerPalletModule,
    CatchWeightRecallModule,
    PackagingGs1Module,
    ColdChainWriteoffModule,
    VelocityAbcXyzModule,
    CustomerReturnsModule,
    MinMaxReplenModule,
    FreightClaimsModule,
    VmiModule,
    CostingMethodsModule,
    LotExpiryModule,
    CrossDockModule,
    PickWavesModule,
    AsnModule,
    ShipmentTrackingModule,

    // Phase 2 — Procurement, Sales & Supply Chain
    ProcurementModule,
    SalesModule,
    SupplyChainModule,

    // Phase 3 — Projects & Manufacturing (MRP)
    ProjectsModule,
    ManufacturingModule,

    // Phase 4 — BI, Documents & Communication
    AnalyticsModule,
    DocumentsModule,
    CommunicationModule,

    // Phase 5 — POS & Retail
    PosModule,

    // Phase 6 — Advanced Finance
    AdvancedFinanceModule,

    // Phase 7 — Advanced HR
    AdvancedHrModule,

    // Phase 8 — Workflow Engine
    WorkflowModule,

    // Phase 9 — Notifications
    NotificationsModule,

    // Phase 10 — Storage
    StorageModule,

    // Phase 11 — Advanced Reporting
    ReportingModule,
    SavedViewsModule,

    // Phase 12 — Healthcare (first-party NestJS module)
    HealthcareModule,

    // Phase 13 — Education (first-party NestJS module)
    EducationModule,

    // Phase 14 — Real Estate (first-party NestJS module)
    RealEstateModule,

    // Phase 15 — Field Service (first-party NestJS module)
    FieldServiceModule,

    // Phase 16 — API Platform & Integrations
    ApiPlatformModule,

    // Extension gateway — proxies /ext/<appSlug>/* to out-of-process industry app services
    ExtGatewayModule,

    // Phase 17 — Localization (i18n)
    LocalizationModule,

    // Phase 18 — PWA & Offline Sync
    PwaModule,

    // Phase 19 — DevOps & Monitoring
    DevopsModule,

    // Phase 20 — SaaS Platform & Billing
    SaasModule,
    PlatformCredentialsModule,
    SaasPortalModule,

    // Builder Studio
    BuilderModule,

    // AI Layer
    AiModule,

    // Drive — File Storage & Management
    DriveModule,

    // Module #33 — E-Commerce Storefront (depends on Sales for checkout order creation)
    EcommerceModule,

    // Marketplace catalog, vendor publishing, and extension lifecycle
    MarketplaceModule,
    PeopleModule,

    // Module #35 — Fixed Asset Management
    FixedAssetsModule,

    // Track B (#17) — Transactional Outbox (reliable cross-module event delivery)
    OutboxModule,

    // Track E — Blockchain anchored via transactional outbox
    BlockchainModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    // Outermost: binds the authenticated user's tenantId to an AsyncLocalStorage
    // session for the lifetime of the request, so the Prisma client extension
    // (packages/database/src/index.ts) can auto-scope every query by tenant even
    // if a service forgets to filter manually. Opt out via @SkipTenantScope().
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    // Always-on compliance audit log for every mutating request.
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    // Track G.3: opt-in exactly-once writes via the Idempotency-Key header.
    // Runs after TenantInterceptor so request.user.tenantId is available.
    {
      provide: IdempotencyInterceptor,
      useFactory: () =>
        new IdempotencyInterceptor(
          process.env.REDIS_URL
            ? new RedisIdempotencyStore(process.env.REDIS_URL)
            : new InMemoryIdempotencyStore(),
        ),
    },
    { provide: APP_INTERCEPTOR, useExisting: IdempotencyInterceptor },
    // Track G.7: Per-tenant rate limiting with plan-based tiers and Redis backing.
    // Replaces the stock ThrottlerGuard — uses tenantId as the tracker key for
    // authenticated requests, falls back to IP for unauthenticated. Limits vary
    // by subscription plan (free/starter/business/enterprise).
    { provide: APP_GUARD, useClass: TenantThrottlerGuard },
    // NOTE: installed-app gating is already enforced by entitlementMiddleware
    // (apps/api/src/common/middleware/entitlement.middleware.ts, registered as
    // plain Express middleware in main.ts) — real, working, and uses the same
    // module-tiers.ts slug map. AppInstalledGuard was a dead-code duplicate of
    // this (confirmed zero references anywhere) and was removed; do not
    // re-add it as a second, differently-behaved enforcement layer.
    // Trial/subscription write-lock. Must be an APP_INTERCEPTOR, not an
    // APP_GUARD: all guards (global + per-route) run before any interceptor,
    // so a guard here would run before JwtAuthGuard populates request.user
    // and would never see an authenticated tenant. See tenant-write.guard.ts.
    { provide: APP_INTERCEPTOR, useClass: TenantWriteGuard },
    // Redis-backed throttler storage (in-memory fallback when REDIS_URL is unset).
    {
      provide: ThrottlerStorage,
      useFactory: () =>
        process.env.REDIS_URL
          ? new RedisThrottlerStorage(process.env.REDIS_URL)
          : new InMemoryThrottlerStorage(),
    },
  ],
})
export class AppModule {}
