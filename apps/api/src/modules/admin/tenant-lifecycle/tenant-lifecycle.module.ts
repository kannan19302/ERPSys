import { Module } from '@nestjs/common';
import { TenantLifecycleController } from './tenant-lifecycle.controller';
import { TenantLifecycleService } from './tenant-lifecycle.service';

@Module({
  controllers: [TenantLifecycleController],
  providers: [TenantLifecycleService],
  exports: [TenantLifecycleService],
})
export class TenantLifecycleModule {}
