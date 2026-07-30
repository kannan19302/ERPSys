// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { Eye, Download, Share2, BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, apiSend } from "../../../_components/api";

interface ContentItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  tags?: string[];
  isPublic: boolean;
  status: string;
  version: number;
  createdBy?: string | null;
  createdAt: string;
  category?: { id: string; name: string } | null;
}

interface ContentAnalytics {
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  lastAccessedAt?: string | null;
}

export default function ContentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<ContentItem | null>(null);
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<ContentItem>(`/crm/content/items/${id}`),
      apiGet<ContentAnalytics>(`/crm/content/items/${id}/analytics`),
    ])
      .then(([itemData, analyticsData]) => {
        setItem(itemData as ContentItem);
        setAnalytics(analyticsData as ContentAnalytics);
        apiSend(`/crm/content/items/${id}/view`, "POST").catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const recordDownload = () =>
    apiSend(`/crm/content/items/${id}/download`, "POST").catch(() => {});
  const recordShare = () =>
    apiSend(`/crm/content/items/${id}/share`, "POST").catch(() => {});

  if (loading) return <Spinner />;
  if (!item) return <p className="text-red-500">Content not found.</p>;

  return (
    <div className="ui-stack-6 max-w-3xl">
      <PageHeader
        title={item.title}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Sales Enablement", href: "/crm/sales-enablement" },
          { label: "Content Library", href: "/crm/sales-enablement/content" },
          { label: item.title },
        ]}
      />

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="default">{item.type}</Badge>
            <Badge
              variant={item.status === "PUBLISHED" ? "success" : "warning"}
            >
              {item.status}
            </Badge>
            {item.category && (
              <span className="text-sm text-gray-500">
                {item.category.name}
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-gray-600">{item.description}</p>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-400">
            Version {item.version} | Created{" "}
            {new Date(item.createdAt).toLocaleDateString()}
          </div>

          {item.fileUrl && (
            <a
              href={item.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={recordDownload}
            >
              <Button variant="primary" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </a>
          )}
          <Button variant="secondary" size="sm" onClick={recordShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </Card>

      {analytics && (
        <Card title="Engagement Analytics">
          <div className="ui-grid-3">
            <div>
              <div className="flex items-center gap-1 text-2xl font-bold">
                <Eye className="w-5 h-5" />
                {analytics.viewCount}
              </div>
              <div className="text-sm text-gray-500">Views</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-2xl font-bold">
                <Download className="w-5 h-5" />
                {analytics.downloadCount}
              </div>
              <div className="text-sm text-gray-500">Downloads</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-2xl font-bold">
                <Share2 className="w-5 h-5" />
                {analytics.shareCount}
              </div>
              <div className="text-sm text-gray-500">Shares</div>
            </div>
          </div>
          {analytics.lastAccessedAt && (
            <div className="text-xs text-gray-400 mt-2">
              Last accessed:{" "}
              {new Date(analytics.lastAccessedAt).toLocaleString()}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
