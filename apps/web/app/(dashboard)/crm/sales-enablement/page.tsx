"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import {
  FileText,
  FolderOpen,
  BarChart3,
  Eye,
  Download,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { apiGet } from "../_components/api";

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

export default function SalesEnablementPage() {
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
        title="Sales Enablement"
        description="Content management, analytics, and recommendations for your sales team"
        actions={
          <div className="flex gap-2">
            <Link href="/crm/sales-enablement/content">
              <Button variant="primary" size="sm">
                <FileText className="w-4 h-4 mr-1" />
                Content Library
              </Button>
            </Link>
            <Link href="/crm/sales-enablement/categories">
              <Button variant="secondary" size="sm">
                <FolderOpen className="w-4 h-4 mr-1" />
                Categories
              </Button>
            </Link>
            <Link href="/crm/sales-enablement/analytics">
              <Button variant="secondary" size="sm">
                <BarChart3 className="w-4 h-4 mr-1" />
                Analytics
              </Button>
            </Link>
          </div>
        }
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Sales Enablement" },
        ]}
      />

      {data && (
        <div className="ui-grid-5">
          <Card>
            <div className="text-2xl font-bold">{data.totalItems}</div>
            <div className="text-sm text-gray-500">Total Content</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{data.publishedItems}</div>
            <div className="text-sm text-gray-500">Published</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{data.totalViews}</div>
            <div className="text-sm text-gray-500">
              <Eye className="w-3 h-3 inline mr-1" />
              Views
            </div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{data.totalDownloads}</div>
            <div className="text-sm text-gray-500">
              <Download className="w-3 h-3 inline mr-1" />
              Downloads
            </div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{data.totalShares}</div>
            <div className="text-sm text-gray-500">
              <Share2 className="w-3 h-3 inline mr-1" />
              Shares
            </div>
          </Card>
        </div>
      )}

      <Card title="Recent Content">
        {!data?.topContent?.length ? (
          <p className="text-sm text-gray-400">
            No content yet. Create your first content item.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.topContent.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <Link
                  href={`/crm/sales-enablement/content/${item.id}`}
                  className="font-medium hover:underline"
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  {item.title}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{item.type}</span>
                  <Badge
                    variant={
                      item.status === "PUBLISHED" ? "success" : "warning"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
