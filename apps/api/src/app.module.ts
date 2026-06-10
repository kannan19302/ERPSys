import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { CrmModule } from './modules/crm/crm.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
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

    // Register ERP Foundation & Core Modules
    AuthModule,
    AdminModule,
    FinanceModule,
    HrModule,
    CrmModule,
    InventoryModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
