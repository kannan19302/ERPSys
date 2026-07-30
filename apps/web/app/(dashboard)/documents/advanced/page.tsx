// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Spinner,
  DataTable,
  type Column,
  StatCardRow,
  Button,
} from "@unerp/ui";
import { apiGet } from "@/lib/api";
import {
  FileText,
  MessageSquare,
  Tags,
  Lock,
  Eye,
  Download,
  Star,
  Clock,
} from "lucide-react";

export default function DocumentsAdvancedPage() {
  const [stats, setStats] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet("/documents/analytics"),
      apiGet("/documents/search?q=").catch(() => []),
    ])
      .then(([s]) => {
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Documents Advanced"
        description="Annotations, comments, tags, locks, workflows"
      />
      {stats && (
        <StatCardRow
          stats={[
            { label: "Total Documents", value: stats.totalDocuments },
            { label: "Annotations", value: stats.totalAnnotations },
            { label: "Comments", value: stats.totalComments },
            { label: "Favorites", value: stats.totalFavorites },
          ]}
        />
      )}
      <div className="ui-grid-3" style={{ marginTop: "var(--space-6)" }}>
        <a
          href="/documents/tags"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <Tags size={24} /> <span>Tag Manager</span>
        </a>
        <a
          href="/documents/smart-collections"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <Star size={24} /> <span>Smart Collections</span>
        </a>
        <a
          href="/documents/favorites"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <Star size={24} /> <span>Favorites</span>
        </a>
      </div>
    </div>
  );
}
