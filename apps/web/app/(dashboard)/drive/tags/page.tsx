"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, DataTable, type Column, Button, Spinner, useToast } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { Tag, Plus, Edit2, Trash2, FileText } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color: string;
  files: { fileId: string }[];
}

export default function TagsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<Tag[]>("/drive/tags")
      .then((res) => setTags(res as any || []))
      .catch((e) => notifyError("Failed to load tags", e.message))
      .finally(() => setLoading(false));
  }, [client, notifyError]);

  const columns: Column<Tag>[] = [
    { id: "name", header: "Tag", render: (r) => (
      <span className="ui-hstack-2">
        <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: r.color, display: "inline-block" }} />
        {r.name}
      </span>
    )},
    { id: "files", header: "Files", render: (r) => <span>{r.files?.length || 0}</span> },
  ];

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="File Tags" description="Manage tags for organizing and filtering files" />
      <Card>
        <div className="ui-flex-end">
          <Button leftIcon={Plus}>New Tag</Button>
        </div>
        <DataTable columns={columns} data={tags} />
      </Card>
    </>
  );
}
