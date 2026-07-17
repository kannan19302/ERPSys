import { describe, expect, it } from 'vitest';
import { createRegistry } from '@unerp/framework';
import type { ModuleDefinition } from '@unerp/framework';
import { registeredModules } from '../index';
import { inventoryModule } from '../inventory';
import { crmModule } from '../crm';
import { financeModule } from '../finance';
import { advancedFinanceModule } from '../advanced-finance';
import { financeAuditModule } from '../finance-audit';
import { hrModule } from '../hr';
import { ecommerceModule } from '../ecommerce';
import { adminModule } from '../admin';
import { superAdminModule } from '../super-admin';

/**
 * Every module the app defines, listed independently of `registeredModules` on
 * purpose: deriving these from the registry would make the assertions below
 * vacuous, since dropping a module would silently drop its checks too.
 */
const allModules: ModuleDefinition[] = [
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

const registry = createRegistry(registeredModules);

const linkFields = allModules.flatMap((module) =>
  module.resources.flatMap((resource) =>
    (resource.fields ?? [])
      .filter((field) => field.type === 'link')
      .map((field) => ({
        module: module.id,
        resource: resource.name,
        field: field.name,
        target: field.link?.resource,
      })),
  ),
);

describe('registered modules', () => {
  it('registers every module the app defines', () => {
    const registeredIds = registeredModules.map((m) => m.id).sort();
    expect(registeredIds).toEqual(allModules.map((m) => m.id).sort());
  });

  it('exposes link fields to check', () => {
    expect(linkFields.length).toBeGreaterThan(0);
  });

  // A link field whose target module is not registered resolves to undefined and
  // crashes the page that renders it — the FormView data hooks read
  // resource.name/endpoint while building their query keys.
  for (const { module, resource, field, target } of linkFields) {
    it(`${module}.${resource}.${field} links to a registered resource (${target})`, () => {
      expect(target).toBeDefined();
      expect(registry.getResource(target as string)).toBeDefined();
    });
  }

  // inventoryModule and crmModule both define a resource named 'products'.
  // getResource is first-match-wins, so registration order decides which one
  // every link field targeting 'products' resolves to.
  it('resolves the ambiguous "products" name to the inventory resource', () => {
    expect(registry.getResource('products')?.endpoint).toBe('/inventory/products');
  });
});
