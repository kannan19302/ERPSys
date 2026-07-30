// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Spinner,
  DataTable,
  type Column,
  StatusBadge,
} from "@unerp/ui";
import { apiGet } from "@/lib/api";

export default function SharedFilesPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/storage/share")
      .then((d) => setLinks(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "token", header: "Link Token" },
    { key: "permission", header: "Permission" },
    { key: "downloadCount", header: "Downloads" },
    { key: "expiresAt", header: "Expires" },
    { key: "createdAt", header: "Created" },
  ];

  return (
    <div>
      <PageHeader title="Shared Files" description="Manage file share links" />
      <div className="ui-card">
        <DataTable columns={columns} data={links} />
      </div>
    </div>
  );
}
