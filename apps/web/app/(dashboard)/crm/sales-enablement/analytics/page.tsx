// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner } from "@unerp/ui";
import { Eye, Download, Share2, BarChart3 } from "lucide-react";
import { apiGet } from "../../_components/api";

interface DashboardData {
  totalItems: number;
  publishedItems: number;
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  topContent: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    category?: { id: string; name: string } | null;
  }>;
}

export default function ContentAnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DashboardData>("/crm/content/dashboard")
      .then((d) => {
        setData(d as DashboardData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Content Analytics"
        description="Track engagement and performance of your sales enablement content"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Sales Enablement", href: "/crm/sales-enablement" },
          { label: "Analytics" },
        ]}
      />

      {data && (
        <>
          <div className="ui-grid-4">
            <Card>
              <BarChart3 className="w-5 h-5 text-blue-500 mb-1" />
              <div className="text-2xl font-bold">{data.totalItems}</div>
              <div className="text-sm text-gray-500">Total Content</div>
            </Card>
            <Card>
              <Eye className="w-5 h-5 text-green-500 mb-1" />
              <div className="text-2xl font-bold">{data.totalViews}</div>
              <div className="text-sm text-gray-500">Total Views</div>
            </Card>
            <Card>
              <Download className="w-5 h-5 text-purple-500 mb-1" />
              <div className="text-2xl font-bold">{data.totalDownloads}</div>
              <div className="text-sm text-gray-500">Total Downloads</div>
            </Card>
            <Card>
              <Share2 className="w-5 h-5 text-orange-500 mb-1" />
              <div className="text-2xl font-bold">{data.totalShares}</div>
              <div className="text-sm text-gray-500">Total Shares</div>
            </Card>
          </div>

          {data.totalItems > 0 && (
            <Card title="Engagement Rate">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Views per Item</span>
                  <span className="font-medium">
                    {(data.totalViews / data.totalItems).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Downloads per Item</span>
                  <span className="font-medium">
                    {(data.totalDownloads / data.totalItems).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shares per Item</span>
                  <span className="font-medium">
                    {(data.totalShares / data.totalItems).toFixed(1)}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
