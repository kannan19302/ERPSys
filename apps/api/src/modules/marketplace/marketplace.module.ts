import { Module } from '@nestjs/common';
import { ExtensionGatewayClientModule } from '../../common/integrations/extension-gateway-client.module';
import { AppProvisioningService } from './app-provisioning.service';
import { BundleStoreService } from './bundle-store.service';
import { DeveloperController } from './developer.controller';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
import { VendorService } from './vendor.service';

@Module({
  imports: [ExtensionGatewayClientModule],
  controllers: [MarketplaceController, DeveloperController, StorefrontController],
  providers: [BundleStoreService, AppProvisioningService, VendorService, StorefrontService, MarketplaceService],
  exports: [MarketplaceService, BundleStoreService, AppProvisioningService, VendorService, StorefrontService],
})
export class MarketplaceModule {}
