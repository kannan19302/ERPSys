export type { AppModuleDescriptor, ModuleNavContext, NavItem } from './types.js';
export {
  registerModule,
  getModuleDescriptor,
  getAllModuleDescriptors,
  resolveNav,
  __resetModuleRegistryForTests,
} from './registry.js';
