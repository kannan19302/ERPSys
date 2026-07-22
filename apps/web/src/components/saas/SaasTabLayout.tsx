"use client";

/**
 * Thin re-export. The canonical implementation lives in @unerp/ui-layout as
 * ModuleTabLayout — follows the same convention as
 * @/components/finance/FinanceTabLayout and CrmTabLayout.
 */

export {
  ModuleTabLayout as SaasTabLayout,
  type ModuleTab as SaasTab,
  type ModuleTabLayoutProps as SaasTabLayoutProps,
} from "@unerp/ui-layout";
