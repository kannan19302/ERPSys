// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { useApiClient, RouteGuard } from "@unerp/framework";
import {
  PageHeader,
  Card,
  DataTable,
  Button,
  Badge,
  Spinner,
  KPICard,
  Tabs,
  type Column,
} from "@unerp/ui";
import { FileText, Grid, Plus, Edit3, Lock, Users, Layers } from "lucide-react";

interface Document {
  id: string;
  title: string;
  ownerId: string;
  isLocked: boolean;
  version: number;
  collaborators: string[];
  updatedAt: string;
}
interface Whiteboard {
  id: string;
  title: string;
  ownerId: string;
  collaborators: string[];
  updatedAt: string;
}
interface Dashboard {
  myDocuments: number;
  myWhiteboards: number;
  totalVersions: number;
}

export default function RealTimeCollabPage() {
  const client = useApiClient();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("documents");

  useEffect(() => {
    (async () => {
      try {
        const [docs, wbs, dash] = await Promise.all([
          client.get<any>("/communication/collab/documents"),
          client.get<Whiteboard[]>("/communication/collab/whiteboards"),
          client.get<Dashboard>("/communication/collab/dashboard"),
        ]);
        setDocuments(docs.data || []);
        setWhiteboards(wbs || []);
        setDashboard(dash);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  const docColumns: Column<Document>[] = [
    {
      key: "title",
      header: "Document",
      render: (r) => (
        <div className="flex items-center gap-2">
          <FileText size={16} />
          <span className="font-medium">{r.title}</span>
          {r.isLocked && <Lock size={14} className="text-muted" />}
        </div>
      ),
    },
    {
      key: "version",
      header: "Version",
      render: (r) => <Badge>v{r.version}</Badge>,
    },
    {
      key: "collaborators",
      header: "Collaborators",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Users size={14} />
          {r.collaborators?.length || 0}
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (r) => new Date(r.updatedAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="ui-flex ui-gap-1">
          <Button variant="ghost" size="sm">
            <Edit3 size={14} />
          </Button>
          <Button variant="ghost" size="sm">
            <Lock size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const wbColumns: Column<Whiteboard>[] = [
    {
      key: "title",
      header: "Whiteboard",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Grid size={16} />
          <span className="font-medium">{r.title}</span>
        </div>
      ),
    },
    {
      key: "collaborators",
      header: "Collaborators",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Users size={14} />
          {r.collaborators?.length || 0}
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (r) => new Date(r.updatedAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <Button variant="ghost" size="sm">
          <Edit3 size={14} />
        </Button>
      ),
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="communication.collab.read">
      <div className="ui-page">
        <PageHeader
          title="Real-Time Collaboration"
          description="Collaborative documents and whiteboards"
          breadcrumbs={[
            { label: "Communication", href: "/communication" },
            { label: "Real-Time Collab" },
          ]}
          actions={
            <div className="flex gap-2">
              <Button>
                <FileText size={14} /> New Document
              </Button>
              <Button variant="secondary">
                <Grid size={14} /> New Whiteboard
              </Button>
            </div>
          }
        />
        {dashboard && (
          <div className="ui-grid-auto mb-6">
            <KPICard
              title="My Documents"
              value={dashboard.myDocuments}
              icon={<FileText size={18} />}
              color="var(--color-primary)"
            />
            <KPICard
              title="My Whiteboards"
              value={dashboard.myWhiteboards}
              icon={<Grid size={18} />}
              color="var(--color-info)"
            />
            <KPICard
              title="Total Versions"
              value={dashboard.totalVersions}
              icon={<Layers size={18} />}
              color="var(--color-warning)"
            />
          </div>
        )}
        <Tabs
          tabs={[
            { key: "documents", label: "Documents" },
            { key: "whiteboards", label: "Whiteboards" },
            { key: "sessions", label: "Sessions" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "documents" && (
          <Card className="mt-4">
            <DataTable
              columns={docColumns}
              data={documents}
              rowKey={(r) => r.id}
              emptyTitle="No documents"
              emptyIcon={<FileText size={48} />}
            />
          </Card>
        )}
        {activeTab === "whiteboards" && (
          <Card className="mt-4">
            <DataTable
              columns={wbColumns}
              data={whiteboards}
              rowKey={(r) => r.id}
              emptyTitle="No whiteboards"
              emptyIcon={<Grid size={48} />}
            />
          </Card>
        )}
        {activeTab === "sessions" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Active collaboration sessions</p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
