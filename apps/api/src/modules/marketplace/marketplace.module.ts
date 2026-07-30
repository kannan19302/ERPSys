// @ts-nocheck
import { Module } from '@nestjs/common';
import { ExtensionGatewayClientModule } from '../../common/integrations/extension-gateway-client.module';
import { AppProvisioningService } from './app-provisioning.service';
import { BundleStoreService } from './bundle-store.service';
import { DeveloperController } from './developer.controller';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceDeepController } from './marketplace-deep.controller';
import { MarketplaceDeepService } from './marketplace-deep.service';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceEnterpriseModule } from './marketplace-enterprise.module';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
import { VendorService } from './vendor.service';

@Module({
  imports: [ExtensionGatewayClientModule, MarketplaceEnterpriseModule],
  controllers: [MarketplaceController, DeveloperController, MarketplaceDeepController, StorefrontController],
  providers: [BundleStoreService, AppProvisioningService, VendorService, StorefrontService, MarketplaceService, MarketplaceDeepService],
  exports: [MarketplaceService, BundleStoreService, AppProvisioningService, VendorService, StorefrontService, MarketplaceDeepService],
})
export class MarketplaceModule {}
