import { Module } from '@nestjs/common';
import { ExtGatewayController } from './ext-gateway.controller';
import { ServiceRegistryService } from './service-registry.service';
import { TenantTokenService } from './tenant-token.service';
import { ExtProxyService } from './ext-proxy.service';

@Module({
  controllers: [ExtGatewayController],
  providers: [ServiceRegistryService, TenantTokenService, ExtProxyService],
  exports: [ServiceRegistryService, ExtProxyService],
})
export class ExtGatewayModule {}
