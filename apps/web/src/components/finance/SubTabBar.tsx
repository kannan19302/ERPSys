"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type LucideIcon } from "lucide-react";

interface SubTab {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface SubTabBarProps {
  tabs: SubTab[];
  baseHref?: string;
}

export function SubTabBar({ tabs, baseHref }: SubTabBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-1)",
        padding: "var(--space-1)",
        background: "var(--color-surface-2)",
        borderRadius: "var(--radius-md)",
        overflowX: "auto",
        flexWrap: "nowrap",
      }}
    >
      {tabs.map((tab) => {
        const [path, query] = tab.href.split("?");
        const pathMatches =
          pathname === path || pathname.startsWith(path + "/");
        let queryMatches = true;

        if (query) {
          const params = new URLSearchParams(query);
          for (const [key, val] of params.entries()) {
            if (searchParams.get(key) !== val) {
              queryMatches = false;
              break;
            }
          }
        } else if (searchParams.toString() !== "") {
          // If tab.href has no query params but current page has them, they might still be matching base page
          // so we don't strictly reject it if this is the default/overview tab
        }

        const isActive = pathMatches && queryMatches;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1)",
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--font-sm)",
              fontWeight: isActive ? 600 : 400,
              color: isActive
                ? "var(--color-primary)"
                : "var(--color-text-secondary)",
              background: isActive ? "var(--color-surface)" : "transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
              border: isActive
                ? "1px solid var(--color-border)"
                : "1px solid transparent",
              transition: "all 0.15s ease",
            }}
          >
            {tab.icon && <tab.icon size={14} />}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
