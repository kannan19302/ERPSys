"use client";

import { type FC, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./sub-tab-bar.module.css";

export interface SubTab {
  id: string;
  label: string;
  href: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
}

export interface SubTabBarProps {
  tabs: SubTab[];
  ariaLabel?: string;
}

export const SubTabBar: FC<SubTabBarProps> = ({ tabs, ariaLabel }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolve the single "best" active tab rather than testing each tab in
  // isolation: when tabs point at real nested routes (e.g. a hub root
  // "/builder/erp" alongside a child route "/builder/erp/forms"), a plain
  // prefix check would match on "/builder/erp/forms" for BOTH tabs and
  // highlight two at once. Prefer an exact query match, then the longest
  // matching path (most specific route wins).
  let activeId: string | null = null;
  let bestScore = -1;
  for (const tab of tabs) {
    const [path = "", query] = tab.href.split("?");
    const pathMatches = pathname === path || pathname.startsWith(`${path}/`);
    if (!pathMatches) continue;

    let queryMatches = true;
    if (query) {
      const params = new URLSearchParams(query);
      for (const [key, val] of params.entries()) {
        if (searchParams.get(key) !== val) {
          queryMatches = false;
          break;
        }
      }
    }
    if (!queryMatches) continue;

    const score = path.length + (query ? 100000 : 0);
    if (score > bestScore) {
      bestScore = score;
      activeId = tab.id;
    }
  }

  return (
    <div
      className={styles.bar}
      role="tablist"
      aria-label={ariaLabel || "Sub-sections"}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
          >
            {Icon && <Icon size={14} />}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};
