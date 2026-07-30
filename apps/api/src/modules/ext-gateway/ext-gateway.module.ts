import { ExtGatewayGeneratedController } from "./ext-gateway-generated.controller";
import { ExtGatewayGeneratedService } from "./ext-gateway-generated.service";
import { Module } from "@nestjs/common";
import { ExtGatewayController } from "./ext-gateway.controller";
import { ExtCallbackController } from "./ext-callback.controller";
import { ServiceRegistryService } from "./service-registry.service";
import { TenantTokenService } from "./tenant-token.service";
import { ExtProxyService } from "./ext-proxy.service";
import { CircuitBreakerService } from "./circuit-breaker.service";
import { ExtEventDispatcherService } from "./ext-event-dispatcher.service";
import { ExtCallbackService } from "./ext-callback.service";

@Module({
  controllers: [
    ExtGatewayGeneratedController,
    ExtGatewayController,
    ExtCallbackController,
  ],
  providers: [
    ExtGatewayGeneratedService,
    ServiceRegistryService,
    TenantTokenService,
    ExtProxyService,
    CircuitBreakerService,
    ExtEventDispatcherService,
    ExtCallbackService,
  ],
  exports: [
    ExtGatewayGeneratedService,
    ServiceRegistryService,
    ExtProxyService,
    ExtEventDispatcherService,
  ],
})
export class ExtGatewayModule {}
