import { Module } from '@nestjs/common';
import { ExtGatewayController } from './ext-gateway.controller';
import { ExtCallbackController } from './ext-callback.controller';
import { LegacyHealthcareRedirectController } from './legacy-redirects.controller';
import { ServiceRegistryService } from './service-registry.service';
import { TenantTokenService } from './tenant-token.service';
import { ExtProxyService } from './ext-proxy.service';

@Module({
  controllers: [ExtGatewayController, ExtCallbackController, LegacyHealthcareRedirectController],
  providers: [ServiceRegistryService, TenantTokenService, ExtProxyService],
  exports: [ServiceRegistryService, ExtProxyService],
})
export class ExtGatewayModule {}
