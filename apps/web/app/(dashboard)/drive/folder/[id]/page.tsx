"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  DataTable,
  type Column,
  Button,
  Spinner,
  Badge,
} from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  Folder,
  FileText,
  ArrowLeft,
  Star,
  Trash2,
  Download,
  Share2,
} from "lucide-react";

interface FolderItem {
  id: string;
  name: string;
  isStarred: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  isStarred: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
}

export default function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const client = useApiClient();
  const [folder, setFolder] = useState<FolderItem | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [subFolders, setSubFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get<FolderItem>(`/drive/folders/${id}`),
      client.get<{ data: FileItem[] }>(`/drive/files?folderId=${id}`),
      client.get<{ data: FolderItem[] }>(`/drive/folders?parentId=${id}`),
    ])
      .then(([folderData, filesRes, foldersRes]) => {
        setFolder(folderData);
        setFiles(filesRes.data || []);
        setSubFolders(foldersRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, client]);

  const columns: Column<FolderItem | FileItem>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r) => (
        <div className="ui-hstack-3">
          {"mimeType" in r ? (
            <FileText size={16} />
          ) : (
            <Folder size={16} className="ui-text-primary" />
          )}
          <span>{r.name}</span>
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
      key: "size",
      header: "Size",
      render: (r) =>
        "size" in r ? `${(Number(r.size) / 1024).toFixed(1)} KB` : "—",
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="ui-hstack-2">
          {"mimeType" in r && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Download size={14} />}
              title="Download"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Star size={14} />}
            title={r.isStarred ? "Unstar" : "Star"}
          />
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            title="Delete"
            className="ui-text-danger"
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
  if (!folder)
    return (
      <div className="ui-flex-center ui-min-h-64">
        <p className="ui-text-tertiary">Folder not found</p>
      </div>
    );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title={folder.name}
        description="Drive folder contents"
        breadcrumbs={[
          { label: "Apps", href: "/apps" },
          { label: "Drive", href: "/drive" },
          { label: folder.name },
        ]}
        actions={
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft size={14} />}
            onClick={() => router.push("/drive")}
          >
            Back to Drive
          </Button>
        }
      />
      <Card padding="none">
        <DataTable
          columns={columns}
          data={[...subFolders, ...files]}
          rowKey={(r) => r.id}
        />
      </Card>
    </div>
  );
}
