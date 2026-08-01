import { searchModule } from "./search";
import { driveModule } from "./drive";
import { reportingModule } from "./reporting";
import { localizationModule } from "./localization";
import { subscriptionsModule } from "./subscriptions";
import { fixedAssetsModule } from "./fixed-assets";
import { blockchainModule } from "./blockchain";
import { serviceManagementModule } from "./service-management";
import { peopleModule } from "./people";
import { savedViewsModule } from "./saved-views";
import { pwaModule } from "./pwa";
import { outboxModule } from "./outbox";
import { notificationsModule } from "./notifications";
import { devopsModule } from "./devops";
import { extGatewayModule } from "./ext-gateway";
import { apiPlatformModule } from "./api-platform";
import { inventoryModule } from "./inventory";
import { crmModule } from "./crm";
import { financeModule } from "./finance";
import { advancedFinanceModule } from "./advanced-finance";
import { financeAuditModule } from "./finance-audit";
import { hrModule } from "./hr";
import { ecommerceModule } from "./ecommerce";
import { adminModule } from "./admin";
import { superAdminModule } from "./super-admin";

/**
 * Every module the app registers with the framework registry. A module that is
 * defined but missing from this list resolves to `undefined` in
 * ModuleRegistry.getResource(), which crashes any `link` field pointing at one
 * of its resources.
 *
 * Order is significant: getResource() is first-match-wins across modules, and
 * both inventoryModule and crmModule expose a resource named 'products'
 * (/inventory/products vs /crm/products). Every link field targeting 'products'
 * means the inventory one, so inventoryModule must stay ahead of crmModule.
 */
export const registeredModules = [
  searchModule,
  driveModule,
  reportingModule,
  localizationModule,
  subscriptionsModule,
  fixedAssetsModule,
  blockchainModule,
  serviceManagementModule,
  peopleModule,
  savedViewsModule,
  pwaModule,
  outboxModule,
  notificationsModule,
  searchModule,
  driveModule,
  reportingModule,
  localizationModule,
  subscriptionsModule,
  fixedAssetsModule,
  devopsModule,
  extGatewayModule,
  apiPlatformModule,
  inventoryModule,
  crmModule,
  financeModule,
  advancedFinanceModule,
  financeAuditModule,
  hrModule,
  ecommerceModule,
  adminModule,
  superAdminModule,
];
