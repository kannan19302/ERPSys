"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Spinner,
  DataTable,
  type ListColumn,
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

  const columns: ListColumn[] = [
    { key: "token", label: "Link Token" },
    { key: "permission", label: "Permission" },
    { key: "downloadCount", label: "Downloads" },
    { key: "expiresAt", label: "Expires" },
    { key: "createdAt", label: "Created" },
  ];

  return (
    <div>
      <PageHeader title="Shared Files" subtitle="Manage file share links" />
      <div className="ui-card">
        <DataTable columns={columns} data={links} />
      </div>
    </div>
  );
}
