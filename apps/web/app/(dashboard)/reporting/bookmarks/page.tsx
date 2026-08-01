"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Button, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Trash2 } from "lucide-react";

export default function ReportingBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/reporting/bookmarks")
      .then((d) => setBookmarks(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name" },
    { key: "report.title", header: "Report" },
    { key: "filters", header: "Filters" },
    { key: "createdAt", header: "Created" },
    {
      key: "actions",
      header: "Actions",
      render: (row: Record<string, unknown>) => (
        <div
          className="ui-flex"
          style={{ gap: "var(--space-2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="ghost">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Report Bookmarks"
        description={`${bookmarks.length} bookmarks`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={bookmarks} />
      </div>
    </div>
  );
}
