"use client";

import { useEffect, useRef } from "react";

export {
  ModuleTabLayout as CrmTabLayout,
  type ModuleTab as CrmTab,
  type ModuleTabLayoutProps as CrmTabLayoutProps,
} from "@unerp/ui-layout";

const OLD_PREFIXES = [
  ["unerp:crm:pins", "unerp:tabs:pins"],
  ["unerp:crm:recent", "unerp:tabs:recent"],
  ["unerp:tab_order_crm", "unerp:tabs:order"],
] as const;

let migrated = false;

export function useCrmKeyMigration() {
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
