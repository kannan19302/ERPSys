"use client";

import React, { useState, useEffect } from "react";
import { PageHeader, Card, Spinner, Badge, Button, DataTable } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import type { Column } from "@unerp/ui";

function AssetsPage() {
  const client = useApiClient();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState("");

  const load = async () => {
    if (!campaignId) {
      setAssets([]);
      setLoading(false);
      return;
    }
    try {
      const res = await client.get(
        `/crm/marketing-deep/campaigns/${campaignId}/assets`,
      );
      setAssets(Array.isArray(res) ? res : []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [campaignId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this asset?")) return;
    await client.delete(`/crm/marketing-deep/assets/${id}`);
    load();
  };

  const columns: Column<any>[] = [
    { key: "name", header: "Name" },
    { key: "type", header: "Type", render: (v: string) => <Badge>{v}</Badge> },
    {
      key: "fileUrl",
      header: "File URL",
      render: (v: string | null) =>
        v ? (
          <a href={v} target="_blank" className="ui-link">
            Open
          </a>
        ) : (
          "-"
        ),
    },
    { key: "sortOrder", header: "Order" },
    {
      key: "createdAt",
      header: "Created",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: "id",
      header: "Actions",
      render: (v: string) => (
        <Button size="sm" variant="outline" onClick={() => handleDelete(v)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Campaign Assets"
        description="Manage images, videos, documents, and templates for campaigns"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Marketing Deep", href: "/crm/marketing-deep" },
          { label: "Assets" },
        ]}
      />
      <Card>
        <div className="ui-form-group ui-mb-4">
          <label className="ui-label">Campaign ID</label>
          <input
            className="ui-input"
            value={campaignId}
            onChange={(e: any) => {
              setCampaignId(e.target.value);
              setLoading(true);
            }}
            placeholder="Enter campaign ID to load assets"
          />
        </div>
        {loading ? <Spinner /> : <DataTable columns={columns} data={assets} />}
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <RouteGuard permission="crm.marketing-deep.assets.read">
      <AssetsPage />
    </RouteGuard>
  );
}
