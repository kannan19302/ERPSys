// @unerp/shared — Module Registry
//
// In-memory registry of `AppModuleDescriptor`s, keyed by route segment. This
// is Phase 0 of the settings-to-SaaS-Portal migration: infrastructure only.
// Consumers (apps/web/src/navigation/moduleNav.tsx) look here first and fall
// back to legacy hardcoded branches for any module not yet migrated.

import type { AppModuleDescriptor, ModuleNavContext, NavItem } from './types.js';

const descriptors = new Map<string, AppModuleDescriptor>();

/** Register (or replace) a module descriptor. Keyed by `routeSegment`. */
export function registerModule(descriptor: AppModuleDescriptor): void {
  descriptors.set(descriptor.routeSegment, descriptor);
}

/** Look up the descriptor governing a given route segment (e.g. 'saas' for `/saas/...`). */
export function getModuleDescriptor(routeSegment: string): AppModuleDescriptor | undefined {
  return descriptors.get(routeSegment);
}

/** All registered descriptors, in registration order. */
export function getAllModuleDescriptors(): AppModuleDescriptor[] {
  return Array.from(descriptors.values());
}

/** Clears the registry. Test-only helper. */
export function __resetModuleRegistryForTests(): void {
  descriptors.clear();
}

/**
 * Resolve the nav for the descriptor governing `pathname`'s first segment.
 * Returns `null` when no descriptor is registered for that segment, or when
 * the descriptor's `visibility` predicate rejects the context — callers
 * should fall back to legacy nav resolution in either case.
 */
export function resolveNav(pathname: string, ctx: ModuleNavContext): NavItem[] | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  if (!segment) return null;

  const descriptor = getModuleDescriptor(segment);
  if (!descriptor) return null;

  if (descriptor.visibility && !descriptor.visibility(ctx)) return null;

  return typeof descriptor.nav === 'function' ? descriptor.nav(ctx) : descriptor.nav;
}
