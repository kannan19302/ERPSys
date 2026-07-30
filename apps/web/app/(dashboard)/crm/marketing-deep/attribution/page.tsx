// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader, Card, Spinner, Badge, DataTable } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import type { Column } from "@unerp/ui";

function AttributionPage() {
  const client = useApiClient();
  const [campaignId, setCampaignId] = useState("");
  const [attributions, setAttributions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      setAttributions([]);
      setSummary(null);
      return;
    }
    setLoading(true);
    Promise.all([
      client
        .get(`/crm/marketing-deep/campaigns/${campaignId}/attribution`)
        .catch(() => []),
      client
        .get(`/crm/marketing-deep/campaigns/${campaignId}/attribution/summary`)
        .catch(() => null),
    ]).then(([a, s]) => {
      setAttributions(Array.isArray(a) ? a : []);
      setSummary(s);
      setLoading(false);
    });
  }, [campaignId]);

  const columns: Column<any>[] = [
    { key: "opportunityId", header: "Opportunity" },
    {
      key: "attributionType",
      header: "Type",
      render: (v: string) => <Badge>{v}</Badge>,
    },
    { key: "weight", header: "Weight" },
    {
      key: "revenue",
      header: "Revenue",
      render: (v: any) => `$${Number(v).toLocaleString()}`,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Campaign Attribution"
        description="Track and analyze revenue attribution across campaigns"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Marketing Deep", href: "/crm/marketing-deep" },
          { label: "Attribution" },
        ]}
      />
      <Card>
        <div className="ui-form-group ui-mb-4">
          <label className="ui-label">Campaign ID</label>
          <input
            className="ui-input"
            value={campaignId}
            onChange={(e: any) => setCampaignId(e.target.value)}
            placeholder="Enter campaign ID"
          />
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <div className="ui-stack-4">
            {summary && (
              <div className="ui-grid-3">
                <Card>
                  <div className="ui-text-center">
                    <div className="ui-text-2xl ui-font-bold">
                      ${summary.totalRevenue.toLocaleString()}
                    </div>
                    <div className="ui-text-muted">
                      Total Attributed Revenue
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="ui-text-center">
                    <div className="ui-text-2xl ui-font-bold">
                      {summary.totalWeight}
                    </div>
                    <div className="ui-text-muted">Total Weight</div>
                  </div>
                </Card>
                <Card>
                  <div className="ui-text-center">
                    <div className="ui-text-2xl ui-font-bold">
                      {Object.keys(summary.byType).length}
                    </div>
                    <div className="ui-text-muted">Attribution Types</div>
                  </div>
                </Card>
              </div>
            )}
            <DataTable columns={columns} data={attributions} />
          </div>
        )}
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <RouteGuard permission="crm.marketing-deep.attribution.read">
      <AttributionPage />
    </RouteGuard>
  );
}
