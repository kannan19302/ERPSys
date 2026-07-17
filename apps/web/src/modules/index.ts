import { inventoryModule } from './inventory';
import { crmModule } from './crm';
import { financeModule } from './finance';
import { advancedFinanceModule } from './advanced-finance';
import { financeAuditModule } from './finance-audit';
import { hrModule } from './hr';
import { ecommerceModule } from './ecommerce';
import { adminModule } from './admin';
import { superAdminModule } from './super-admin';

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
