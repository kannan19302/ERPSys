"use client";

import { useEffect, useCallback, type FC, type ReactNode } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./multi-page-dashboard.module.css";

export interface DashboardPage {
  id: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
  actions?: ReactNode;
}

export interface MultiPageDashboardProps {
  pages: DashboardPage[];
  navActions?: ReactNode;
  defaultPageId?: string;
}

export const MultiPageDashboard: FC<MultiPageDashboardProps> = ({
  pages,
  navActions,
  defaultPageId,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentId =
    searchParams.get("dashPage") || defaultPageId || pages[0]?.id;
  const currentIndex = pages.findIndex((p) => p.id === currentId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentPage = pages[safeIndex];

  const goToPage = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("dashPage", id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const goPrev = useCallback(() => {
    if (safeIndex > 0) goToPage(pages[safeIndex - 1]!.id);
  }, [safeIndex, pages, goToPage]);

  const goNext = useCallback(() => {
    if (safeIndex < pages.length - 1) goToPage(pages[safeIndex + 1]!.id);
  }, [safeIndex, pages, goToPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  if (!currentPage) return null;

  return (
    <div className={styles["mpd-root"]}>
      <button
        className={`${styles["mpd-side-arrow"]} ${styles["mpd-side-arrow-left"]}`}
        onClick={goPrev}
        disabled={safeIndex === 0}
        aria-label="Previous Page"
        title="Previous Page (← key)"
      >
        <ChevronLeft size={24} strokeWidth={2.8} />
      </button>

      <button
        className={`${styles["mpd-side-arrow"]} ${styles["mpd-side-arrow-right"]}`}
        onClick={goNext}
        disabled={safeIndex === pages.length - 1}
        aria-label="Next Page"
        title="Next Page (→ key)"
      >
        <ChevronRight size={24} strokeWidth={2.8} />
      </button>

      <div className={styles["mpd-top-bar"]}>
        <div className={styles["mpd-top-tabs"]}>
          {pages.map((page, i) => (
            <button
              key={page.id}
              className={`${styles["mpd-tab-btn"]} ${i === safeIndex ? styles.active : ""}`}
              onClick={() => goToPage(page.id)}
            >
              <span className={styles["mpd-tab-num"]}>{i + 1}</span>
              <span>{page.title}</span>
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          {navActions}
          <span className={styles["mpd-counter-badge"]}>
            Page {safeIndex + 1} of {pages.length}
          </span>
        </div>
      </div>

      <div className={styles["mpd-content"]} key={currentPage.id}>
        {(currentPage.subtitle || currentPage.actions) && (
          <div className={styles["mpd-page-header"]}>
            {currentPage.subtitle && (
              <p className={styles["mpd-page-subtitle"]}>
                {currentPage.subtitle}
              </p>
            )}
            {currentPage.actions && <div>{currentPage.actions}</div>}
          </div>
        )}
        {currentPage.content}
      </div>
    </div>
  );
};
