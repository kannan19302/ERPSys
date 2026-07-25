"use client";

import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Spinner,
  Badge,
  Button,
  DataTable,
  Modal,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { Plus, Globe } from "lucide-react";
import type { Column } from "@unerp/ui";

function LandingPagesPage() {
  const client = useApiClient();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "<h1>Welcome</h1>",
    submitAction: "CREATE_LEAD",
  });

  const load = async () => {
    try {
      const res = await client.get("/crm/marketing-deep/landing-pages");
      setPages(Array.isArray(res) ? res : []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    await client.post("/crm/marketing-deep/landing-pages", form);
    setShowCreate(false);
    setForm({
      title: "",
      slug: "",
      content: "<h1>Welcome</h1>",
      submitAction: "CREATE_LEAD",
    });
    load();
  };

  const handlePublish = async (id: string) => {
    await client.post(`/crm/marketing-deep/landing-pages/${id}/publish`, {});
    load();
  };

  const handleViewStats = async (slug: string) => {
    const stats: any = await client.get(
      `/crm/marketing-deep/landing-pages/${slug}/stats`,
    );
    alert(
      `Views: ${stats?.viewCount || 0}\nSubmissions: ${stats?.submissionCount || 0}\nLeads Generated: ${stats?.leadsGenerated || 0}`,
    );
  };

  const columns: Column<any>[] = [
    { key: "title", header: "Title" },
    { key: "slug", header: "Slug", render: (v: string) => <code>/{v}</code> },
    {
      key: "isPublished",
      header: "Published",
      render: (v: boolean) => (
        <Badge variant={v ? "success" : "default"}>{v ? "Yes" : "No"}</Badge>
      ),
    },
    { key: "viewCount", header: "Views" },
    { key: "submissionCount", header: "Submissions" },
    {
      key: "createdAt",
      header: "Created",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: "id",
      header: "Actions",
      render: (v: string, row: any) => (
        <div className="ui-flex-h-2">
          <Button size="sm" variant="outline" onClick={() => handlePublish(v)}>
            <Globe size={14} /> {row.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewStats(row.slug)}
          >
            Stats
          </Button>
        </div>
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
    <div className="ui-stack-6">
      <PageHeader
        title="Landing Pages"
        description="Create and manage landing pages for campaigns"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Marketing Deep", href: "/crm/marketing-deep" },
          { label: "Landing Pages" },
        ]}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Landing Page
          </Button>
        }
      />
      <Card>
        <DataTable columns={columns} data={pages} />
      </Card>

      {showCreate && (
        <Modal
          open={showCreate}
          title="Create Landing Page"
          onClose={() => setShowCreate(false)}
        >
          <div className="ui-stack-4">
            <div className="ui-form-group">
              <label className="ui-label">Title</label>
              <input
                className="ui-input"
                value={form.title}
                onChange={(e: any) =>
                  setForm({ ...form, title: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Slug</label>
              <input
                className="ui-input"
                value={form.slug}
                onChange={(e: any) =>
                  setForm({ ...form, slug: e.target.value })
                }
                placeholder="my-landing-page"
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Content (HTML)</label>
              <textarea
                className="ui-input"
                rows={6}
                value={form.content}
                onChange={(e: any) =>
                  setForm({ ...form, content: e.target.value })
                }
              />
            </div>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RouteGuard permission="crm.marketing-deep.landing-pages.read">
      <LandingPagesPage />
    </RouteGuard>
  );
}
