"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, DataTable, type Column, Spinner, useToast } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { HardDrive, FileText, Image, Video, Archive, Trash2 } from "lucide-react";

interface StorageUsage {
  totalSize: number;
  fileCount: number;
  quota: { used: number; limit: number };
  trashedSize: number;
  typeBreakdown: Record<string, number>;
  topUsers: { userId: string; size: number }[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function UsagePage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<StorageUsage>("/drive/usage")
      .then((res) => setUsage(res as any))
      .catch((e) => notifyError("Failed to load usage data", e.message))
      .finally(() => setLoading(false));
  }, [client, notifyError]);

  if (loading) return <Spinner />;
  if (!usage) return <div className="ui-text-muted">No usage data available</div>;

  const usagePercent = usage.quota.limit > 0 ? Math.round((usage.quota.used / usage.quota.limit) * 100) : 0;

  const breakdownItems = Object.entries(usage.typeBreakdown).map(([type, size]) => ({
    type,
    size: size as number,
    formatted: formatBytes(size as number),
  }));

  const breakdownColumns: Column<{ type: string; size: number; formatted: string }>[] = [
    { id: "type", header: "Type", render: (r) => (
      <span className="ui-hstack-2">
        {r.type === "images" ? <Image size={16} /> : r.type === "videos" ? <Video size={16} /> : r.type === "pdfs" ? <FileText size={16} /> : <Archive size={16} />}
        {r.type}
      </span>
    )},
    { id: "formatted", header: "Size", render: (r) => r.formatted },
  ];

  const userColumns: Column<{ userId: string; size: number }>[] = [
    { id: "userId", header: "User" },
    { id: "size", header: "Storage Used", render: (r) => formatBytes(r.size) },
  ];

  return (
    <>
      <PageHeader title="Storage Usage" description="Drive storage consumption and quota overview" />
      <div className="ui-grid-3">
        <Card>
          <div className="ui-hstack-2"><HardDrive size={20} /><strong>Total Used</strong></div>
          <div className="ui-text-xl">{formatBytes(usage.totalSize)}</div>
          <div className="ui-text-sm ui-text-muted">{usage.fileCount} files</div>
        </Card>
        <Card>
          <div className="ui-hstack-2"><HardDrive size={20} /><strong>Quota</strong></div>
          <div className="ui-text-xl">{usagePercent}%</div>
          <div className="ui-text-sm ui-text-muted">{formatBytes(usage.quota.used)} / {formatBytes(usage.quota.limit)}</div>
        </Card>
        <Card>
          <div className="ui-hstack-2"><Trash2 size={20} /><strong>Trashed</strong></div>
          <div className="ui-text-xl">{formatBytes(usage.trashedSize)}</div>
        </Card>
      </div>
      <Card title="By File Type">
        <DataTable columns={breakdownColumns} data={breakdownItems} />
      </Card>
      <Card title="Top Users">
        <DataTable columns={userColumns} data={usage.topUsers} />
      </Card>
    </>
  );
}
