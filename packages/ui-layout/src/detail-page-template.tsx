"use client";

import React, { useState, type ReactNode } from "react";
import { Tabs, type TabItem } from "@unerp/ui-components";
import { PageHeader } from "./page-header";

export interface DetailTab {
  key: string;
  label: string;
  content: ReactNode;
  /** Badge count shown on the tab label */
  count?: number;
}

export interface DetailPageTemplateProps {
  title: string;
  subtitle?: string;
  /** Back navigation — typically a router.back() call or href */
  onBack?: () => void;
  backLabel?: string;
  /** Action buttons for the page header */
  actions?: ReactNode;
  /** Status badge or meta pills shown next to the title */
  meta?: ReactNode;
  tabs: DetailTab[];
  defaultTab?: string;
  /** Content shown above the tabs (e.g. a summary card row) */
  above?: ReactNode;
  loading?: boolean;
}

export const DetailPageTemplate: React.FC<DetailPageTemplateProps> = ({
  title,
  subtitle,
  onBack,
  backLabel = "Back",
  actions,
  meta,
  tabs,
  defaultTab,
  above,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.key ?? "");

  const currentTab = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  const tabItems: TabItem[] = tabs.map((t) => ({
    key: t.key,
    label: t.label,
    badge: t.count !== undefined ? t.count : undefined,
  }));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            background: "none",
            border: "none",
            color: "var(--color-text-secondary)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            padding: 0,
            alignSelf: "flex-start",
          }}
        >
          ← {backLabel}
        </button>
      )}

      <div>
        <PageHeader title={title} description={subtitle} actions={actions} />
        {meta && (
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              flexWrap: "wrap",
              marginTop: "var(--space-2)",
            }}
          >
            {meta}
          </div>
        )}
      </div>

      {above}

      <div>
        <Tabs tabs={tabItems} value={activeTab} onChange={setActiveTab} />

        <div
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          style={{ paddingTop: "var(--space-6)" }}
        >
          {loading ? (
            <div
              style={{
                height: 200,
                background:
                  "linear-gradient(90deg, var(--color-bg-sunken) 25%, var(--color-border) 37%, var(--color-bg-sunken) 63%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s ease-in-out infinite",
                borderRadius: "var(--radius-lg)",
              }}
            />
          ) : (
            currentTab?.content
          )}
        </div>
      </div>
    </div>
  );
};
