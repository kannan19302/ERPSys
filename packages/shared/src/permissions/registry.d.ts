import type { PermissionDefinition } from '../types';
export declare const PERMISSION_REGISTRY: PermissionDefinition[];
/** Every permission definition registered for a given module. */
export declare function getPermissionsByModule(module: string): PermissionDefinition[];
/** Distinct `category` labels present for a module, in first-seen order. Modules
 * without categorized permissions (i.e. all `category: undefined`) return []. */
export declare function getCategoriesForModule(module: string): string[];
/** Permission definitions for a module scoped to one category. */
export declare function getPermissionsByCategory(module: string, category: string): PermissionDefinition[];
//# sourceMappingURL=registry.d.ts.map