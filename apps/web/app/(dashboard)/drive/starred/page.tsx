"use client";
import { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  DataTable,
  type Column,
  Button,
  Spinner,
} from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { FileText, Folder, Download, Star } from "lucide-react";

interface StarredItem {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
  isStarred: boolean;
}

export default function StarredPage() {
  const client = useApiClient();
  const [items, setItems] = useState<StarredItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get<{ data: any[] }>("/drive/files?view=starred"),
      client.get<{ data: any[] }>("/drive/folders?view=starred"),
    ])
      .then(([filesRes, foldersRes]) => {
        const files = (filesRes.data || []).map((f: any) => ({
          ...f,
          type: "file",
        }));
        const folders = (foldersRes.data || []).map((f: any) => ({
          ...f,
          type: "folder",
        }));
        setItems([...folders, ...files]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [client]);

  const columns: Column<StarredItem>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r) => (
        <div className="ui-hstack-3">
          {r.type === "folder" ? (
            <Folder size={16} className="ui-text-primary" />
          ) : (
            <FileText size={16} />
          )}
          <span>{r.name}</span>
          <Star size={12} className="ui-text-warning" />
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Modified",
      sortable: true,
      render: (r) => new Date(r.updatedAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="ui-hstack-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Download size={14} />}
            title="Download"
          />
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Star size={14} />}
            title="Unstar"
            className="ui-text-warning"
          />
        </div>
      ),
    },
  ];

  if (loading)
    return (
      <div className="ui-flex-center ui-min-h-64">
        <Spinner />
      </div>
    );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Starred"
        description="Your starred files and folders"
        breadcrumbs={[
          { label: "Apps", href: "/apps" },
          { label: "Drive", href: "/drive" },
          { label: "Starred" },
        ]}
      />
      <Card padding="none">
        <DataTable
          columns={columns}
          data={items}
          rowKey={(r) => r.id}
          emptyTitle="No starred items"
          emptyMessage="Star files and folders to quickly find them here."
          emptyIcon={<Star size={48} />}
        />
      </Card>
    </div>
  );
}
