"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, DataTable, type Column, Button, Spinner, useToast } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Approval {
  id: string;
  document: { id: string; name: string };
  approverId: string;
  status: string;
  comment: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export default function ApprovalsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<Approval[]>("/documents/approvals")
      .then((res) => setApprovals(res as any || []))
      .catch((e) => notifyError("Failed to load approvals", e.message))
      .finally(() => setLoading(false));
  }, [client, notifyError]);

  const statusIcon = (status: string) => {
    if (status === "APPROVED") return <CheckCircle size={16} className="ui-text-success" />;
    if (status === "REJECTED") return <XCircle size={16} className="ui-text-danger" />;
    return <Clock size={16} className="ui-text-warning" />;
  };

  const columns: Column<Approval>[] = [
    { id: "document", header: "Document", render: (r) => r.document?.name || "—" },
    { id: "approverId", header: "Approver" },
    { id: "status", header: "Status", render: (r) => <span className="ui-hstack-2">{statusIcon(r.status)} {r.status}</span> },
    { id: "comment", header: "Comment", render: (r) => r.comment || <span className="ui-text-muted">—</span> },
    { id: "createdAt", header: "Requested", sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="Document Approvals" description="Track and manage document approval requests" />
      <Card>
        <DataTable columns={columns} data={approvals} />
      </Card>
    </>
  );
}
