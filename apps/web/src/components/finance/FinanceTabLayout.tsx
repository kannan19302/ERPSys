"use client";

/**
 * Backward-compatible re-export. The canonical implementation now lives in
 * @unerp/ui-layout as ModuleTabLayout.
 *
 * On first load this wrapper migrates old localStorage keys so existing
 * users' pinned tabs and custom orders carry over.
 */

import { useEffect, useRef } from "react";

export {
  ModuleTabLayout as FinanceTabLayout,
  type ModuleTab as FinanceTab,
  type ModuleTabLayoutProps as FinanceTabLayoutProps,
} from "@unerp/ui-layout";

const OLD_PREFIXES = [
  ["unerp:finance:pins", "unerp:tabs:pins"],
  ["unerp:finance:recent", "unerp:tabs:recent"],
  ["unerp:tab_order", "unerp:tabs:order"],
] as const;

let migrated = false;

export function useFinanceKeyMigration() {
  const ran = useRef(false);
  useEffect(() => {
    if (migrated || ran.current || typeof window === "undefined") return;
    ran.current = true;
    migrated = true;
    for (const [oldPrefix, newPrefix] of OLD_PREFIXES) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(oldPrefix)) {
          const suffix = key.slice(oldPrefix.length);
          const newKey = `${newPrefix}${suffix}`;
          if (!localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, localStorage.getItem(key)!);
          }
        }
      }
    }
  }, []);
}
