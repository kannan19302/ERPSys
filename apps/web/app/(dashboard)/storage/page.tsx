"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  DataTable,
  type ListColumn,
  StatusBadge,
  StatCardRow,
} from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { FolderOpen, File, Upload, Plus } from "lucide-react";

export default function StoragePage() {
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiGet("/storage/files"), apiGet("/storage/folders")])
      .then(([f, d]) => {
        setFiles(Array.isArray(f) ? f : []);
        setFolders(Array.isArray(d) ? d : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const fileColumns: ListColumn[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "mimeType", label: "Type" },
    { key: "size", label: "Size", sortable: true },
    { key: "createdAt", label: "Uploaded", sortable: true },
  ];

  return (
    <div>
      <PageHeader
        title="File Browser"
        subtitle={`${files.length} files, ${folders.length} folders`}
      />
      <StatCardRow
        cards={[
          { label: "Total Files", value: files.length },
          { label: "Folders", value: folders.length },
        ]}
      />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <div
          className="ui-flex"
          style={{
            justifyContent: "space-between",
            marginBottom: "var(--space-4)",
          }}
        >
          <h3 className="ui-heading-sm">Files</h3>
          <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
            <Button variant="secondary" icon={Plus}>
              New Folder
            </Button>
            <Button icon={Upload}>Upload</Button>
          </div>
        </div>
        <DataTable columns={fileColumns} data={files} />
      </div>
    </div>
  );
}
