"use client";

import { type FC, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./sub-tab-bar.module.css";

export interface SubTab {
  id: string;
  label: string;
  href: string;
  icon?: ComponentType<{ size?: number }>;
}

export interface SubTabBarProps {
  tabs: SubTab[];
}

export const SubTabBar: FC<SubTabBarProps> = ({ tabs }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className={styles.bar}>
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
        }

        const isActive = pathMatches && queryMatches;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tab.href}
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
