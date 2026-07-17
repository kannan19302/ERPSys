import { Injectable, Module } from '@nestjs/common';
import { ExtGatewayModule } from '../../modules/ext-gateway/ext-gateway.module';
import { ExtProxyService } from '../../modules/ext-gateway/ext-proxy.service';
import { ServiceRegistryService } from '../../modules/ext-gateway/service-registry.service';
import { ExtensionGatewayClient, ExtensionServiceEndpoint } from './extension-gateway-client';

@Injectable()
class ExtensionGatewayClientAdapter extends ExtensionGatewayClient {
  constructor(
    private readonly proxy: ExtProxyService,
    private readonly registry: ServiceRegistryService,
  ) {
    super();
  }

  healthCheck(service: ExtensionServiceEndpoint): Promise<boolean> {
    return this.proxy.healthCheck(service);
  }

  invalidate(tenantId: string, appSlug: string): void {
    this.registry.invalidate(tenantId, appSlug);
  }
}

/** Composition-layer adapter for extension service health and cache invalidation. */
@Module({
  imports: [ExtGatewayModule],
  providers: [ExtensionGatewayClientAdapter, { provide: ExtensionGatewayClient, useExisting: ExtensionGatewayClientAdapter }],
  exports: [ExtensionGatewayClient],
})
export class ExtensionGatewayClientModule {}
