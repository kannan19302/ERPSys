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
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Star,
  TrendingUp,
  FileText,
  Trash2,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  viewCount: number;
  category?: { name: string };
  authorId: string;
  publishedAt: string | null;
  createdAt: string;
  ratings: any[];
}
interface Dashboard {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  totalViews: number;
  totalRatings: number;
  avgRating: number;
  categoryCount: number;
}

export default function KnowledgeBasePage() {
  const client = useApiClient();
  const [articles, setArticles] = useState<Article[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("articles");

  useEffect(() => {
    (async () => {
      try {
        const [arts, dash] = await Promise.all([
          client.get<any>("/communication/knowledge/articles"),
          client.get<Dashboard>("/communication/knowledge/dashboard"),
        ]);
        setArticles(arts.data || []);
        setDashboard(dash);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  const columns: Column<Article>[] = [
    {
      key: "title",
      header: "Title",
      render: (r) => (
        <div>
          <span className="font-medium">{r.title}</span>
          {r.category && (
            <Badge variant="default" className="ml-2">
              {r.category.name}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "PUBLISHED" ? "success" : "warning"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "viewCount",
      header: "Views",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Eye size={14} />
          {r.viewCount}
        </div>
      ),
    },
    {
      key: "ratings",
      header: "Rating",
      render: (r) => {
        const avg = r.ratings?.length
          ? (
              r.ratings.reduce((s: number, rt: any) => s + rt.rating, 0) /
              r.ratings.length
            ).toFixed(1)
          : "-";
        return (
          <div className="flex items-center gap-1">
            <Star size={14} />
            {avg}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="ui-flex ui-gap-1">
          <Button variant="ghost" size="sm">
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm">
            <FileText size={14} />
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
    <RouteGuard permission="communication.knowledge.read">
      <div className="ui-page">
        <PageHeader
          title="Knowledge Base"
          description={
            dashboard ? `${dashboard.publishedCount} published articles` : ""
          }
          breadcrumbs={[
            { label: "Communication", href: "/communication" },
            { label: "Knowledge Base" },
          ]}
          actions={
            <Button>
              <Plus size={14} /> New Article
            </Button>
          }
        />
        {dashboard && (
          <div className="ui-grid-auto mb-6">
            <KPICard
              title="Total Articles"
              value={dashboard.totalArticles}
              icon={<BookOpen size={18} />}
            />
            <KPICard
              title="Published"
              value={dashboard.publishedCount}
              icon={<TrendingUp size={18} />}
              color="var(--color-success)"
            />
            <KPICard
              title="Total Views"
              value={dashboard.totalViews}
              icon={<Eye size={18} />}
              color="var(--color-info)"
            />
            <KPICard
              title="Avg Rating"
              value={dashboard.avgRating.toFixed(1)}
              icon={<Star size={18} />}
              color="var(--color-warning)"
            />
          </div>
        )}
        <Tabs
          tabs={[
            { key: "articles", label: "Articles" },
            { key: "categories", label: "Categories" },
            { key: "search", label: "Search" },
            { key: "analytics", label: "Analytics" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "articles" && (
          <Card className="mt-4">
            <DataTable
              columns={columns}
              data={articles}
              rowKey={(r) => r.id}
              emptyTitle="No articles yet"
              emptyIcon={<BookOpen size={48} />}
            />
          </Card>
        )}
        {activeTab === "search" && (
          <Card className="mt-4 p-5">
            <div className="ui-stack-4">
              <h3 className="ui-heading-base">Search Articles</h3>
              <div className="ui-input-group">
                <Search size={16} />
                <input className="ui-input" placeholder="Search articles..." />
              </div>
            </div>
          </Card>
        )}
        {activeTab === "categories" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Categories management interface</p>
          </Card>
        )}
        {activeTab === "analytics" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Knowledge base analytics and insights</p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
