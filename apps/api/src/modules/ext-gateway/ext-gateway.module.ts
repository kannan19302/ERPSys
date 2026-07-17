import { Module } from '@nestjs/common';
import { ExtGatewayController } from './ext-gateway.controller';
import { ExtCallbackController } from './ext-callback.controller';
import { ServiceRegistryService } from './service-registry.service';
import { TenantTokenService } from './tenant-token.service';
import { ExtProxyService } from './ext-proxy.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { ExtEventDispatcherService } from './ext-event-dispatcher.service';
import { ExtCallbackService } from './ext-callback.service';

@Module({
  controllers: [ExtGatewayController, ExtCallbackController],
  providers: [
    ServiceRegistryService,
    TenantTokenService,
    ExtProxyService,
    CircuitBreakerService,
    ExtEventDispatcherService,
    ExtCallbackService,
  ],
  exports: [ServiceRegistryService, ExtProxyService, ExtEventDispatcherService],
})
export class ExtGatewayModule {}
