"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Card } from "@unerp/ui";

interface FeatureLinkCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  group?: string;
}

export function FeatureLinkCard({
  icon: Icon,
  title,
  description,
  href,
  group,
}: FeatureLinkCardProps) {
  return (
    <Link href={href} className="no-underline">
      <Card
        padding="md"
        className="hover:shadow-md transition-all hover:border-primary/30"
        style={{ cursor: "pointer" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--space-3)",
          }}
        >
          <div
            style={{
              padding: "var(--space-1)",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface-2)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "var(--font-sm)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                {title}
              </h4>
              {group && (
                <span
                  style={{
                    fontSize: "var(--font-xs)",
                    color: "var(--color-muted)",
                    padding: "1px 6px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface-2)",
                  }}
                >
                  {group}
                </span>
              )}
            </div>
            <p
              style={{
                margin: "var(--space-1) 0 0",
                fontSize: "var(--font-xs)",
                color: "var(--color-muted)",
                lineHeight: 1.4,
              }}
            >
              {description}
            </p>
          </div>
          <ChevronRight
            size={14}
            style={{
              color: "var(--color-muted)",
              flexShrink: 0,
              marginTop: "var(--space-1)",
            }}
          />
        </div>
      </Card>
    </Link>
  );
}
