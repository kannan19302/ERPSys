import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { TenantInterceptor } from './common/guards/tenant.interceptor';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { CrmModule } from './modules/crm/crm.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { SalesModule } from './modules/sales/sales.module';
import { SupplyChainModule } from './modules/supply-chain/supply-chain.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ManufacturingModule } from './modules/manufacturing/manufacturing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { PosModule } from './modules/pos/pos.module';
import { AdvancedFinanceModule } from './modules/advanced-finance/advanced-finance.module';
import { AdvancedHrModule } from './modules/advanced-hr/advanced-hr.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StorageModule } from './modules/storage/storage.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { ApiPlatformModule } from './modules/api-platform/api-platform.module';
import { ExtGatewayModule } from './modules/ext-gateway/ext-gateway.module';
import { LocalizationModule } from './modules/localization/localization.module';
import { PwaModule } from './modules/pwa/pwa.module';
import { DevopsModule } from './modules/devops/devops.module';
import { SaasModule } from './modules/saas/saas.module';
import { BuilderModule } from './modules/builder/builder.module';
import { CommonModule } from './common/common.module';
import { QueueModule } from './common/queues/queue.module';
import { AiModule } from './modules/ai/ai.module';
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';
import { FixedAssetsModule } from './modules/fixed-assets/fixed-assets.module';
import { InventoryLogisticsModule } from './modules/inventory/inventory-logistics.module';
import { QualityComplianceModule } from './modules/inventory/quality-compliance.module';
import { WarehouseOpsModule } from './modules/inventory/warehouse-ops.module';
import { LotSerialTrackingModule } from './modules/inventory/lot-serial-tracking.module';
import { DemandForecastingModule } from './modules/inventory/demand-forecasting.module';
import { LandedCostModule } from './modules/inventory/landed-cost.module';
import { StockValuationModule } from './modules/inventory/stock-valuation.module';
import { TransferOrdersModule } from './modules/inventory/transfer-orders.module';
import { YardManagementModule } from './modules/inventory/yard-management.module';
import { StockTakeModule } from './modules/inventory/stock-take.module';
import { HazmatModule } from './modules/inventory/hazmat.module';
import { AslModule } from './modules/inventory/asl.module';
import { ContainerPalletModule } from './modules/inventory/container-pallet.module';
import { CatchWeightRecallModule } from './modules/inventory/catch-weight-recall.module';
import { PackagingGs1Module } from './modules/inventory/packaging-gs1.module';
import { ColdChainWriteoffModule } from './modules/inventory/cold-chain-writeoff.module';
import { VelocityAbcXyzModule } from './modules/inventory/velocity-abc-xyz.module';
import { CustomerReturnsModule } from './modules/inventory/customer-returns.module';
import { MinMaxReplenModule } from './modules/inventory/minmax-replen.module';
import { FreightClaimsModule } from './modules/inventory/freight-claims.module';
import { VmiModule } from './modules/inventory/vmi.module';
import { CostingMethodsModule } from './modules/inventory/costing-methods.module';
import { LotExpiryModule } from './modules/inventory/lot-expiry.module';

@Module({
  imports: [
    // Global shared services (change history, etc.)
    CommonModule,

    // Async job processing (email, export, payroll, data-import)
    QueueModule,

    // Event-driven communication between modules
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1 second
        limit: 10,   // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000,  // 1 minute
        limit: 100,  // 100 requests per minute
      },
    ]),

    // Register ERP Foundation & Core Modules (Phase 0-1)
    AuthModule,
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

    // Phase 12 — Healthcare
    // Healthcare: externalized to unierp-app-healthcare (marketplace + ExtGateway)

    // Phase 13 — Education
    // Education: externalized to unierp-app-education (marketplace + ExtGateway)

    // Phase 14 — Real Estate
    // Real Estate: externalized to unierp-app-realestate (marketplace + ExtGateway)

    // Phase 15 — Field Service: externalized to unierp-app-fieldservice
    // (installed via marketplace; served through ExtGatewayModule)

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

    // Builder Studio
    BuilderModule,

    // AI Layer
    AiModule,

    // Module #33 — E-Commerce Storefront (depends on Sales for checkout order creation)
    EcommerceModule,

    // Module #35 — Fixed Asset Management
    FixedAssetsModule,
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
    // Enforces the ThrottlerModule buckets configured above on every route.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}


