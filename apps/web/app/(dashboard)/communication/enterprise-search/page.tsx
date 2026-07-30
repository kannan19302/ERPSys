// @ts-nocheck
"use client";
import React, { useEffect, useState, useCallback } from "react";
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
  Input,
} from "@unerp/ui";
import {
  Search,
  Bookmark,
  Clock,
  BarChart3,
  MessageSquare,
  BookOpen,
  FileText,
} from "lucide-react";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  channel?: string;
  category?: string;
  status?: string;
  createdAt: string;
  url: string;
}
interface SavedSearch {
  id: string;
  name: string;
  query: string;
  scope: string;
  createdAt: string;
}
interface Analytics {
  totalSearches: number;
  searchesToday: number;
  topQueries: { query: string; _count: number }[];
}

export default function EnterpriseSearchPage() {
  const client = useApiClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  useEffect(() => {
    if (activeTab === "saved") {
      client
        .get<SavedSearch[]>("/communication/enterprise-search/saved")
        .then(setSavedSearches)
        .catch(() => {});
    }
    if (activeTab === "analytics") {
      client
        .get<Analytics>("/communication/enterprise-search/analytics")
        .then(setAnalytics)
        .catch(() => {});
    }
  }, [client, activeTab]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await client.get<any>(
        `/communication/enterprise-search/search?query=${encodeURIComponent(query)}`,
      );
      setResults(res.data || []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [client, query]);

  const typeIcon = (type: string) => {
    const m: Record<string, any> = {
      message: <MessageSquare size={14} />,
      article: <BookOpen size={14} />,
      ticket: <FileText size={14} />,
      channel: <MessageSquare size={14} />,
      file: <FileText size={14} />,
    };
    return m[type] || <Search size={14} />;
  };

  const columns: Column<SearchResult>[] = [
    {
      key: "title",
      header: "Result",
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-muted">{typeIcon(r.type)}</span>
          <span className="font-medium">{r.title}</span>
          <Badge variant="default" className="text-xs">
            {r.type}
          </Badge>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <RouteGuard permission="communication.search.read">
      <div className="ui-page">
        <PageHeader
          title="Enterprise Search"
          description="Full-text search across all communication entities"
          breadcrumbs={[
            { label: "Communication", href: "/communication" },
            { label: "Search" },
          ]}
        />
        <Tabs
          tabs={[
            { key: "search", label: "Search" },
            { key: "saved", label: "Saved" },
            { key: "history", label: "History" },
            { key: "analytics", label: "Analytics" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "search" && (
          <div className="mt-4 ui-stack-4">
            <Card className="p-5">
              <div className="flex gap-3 items-center">
                <div className="ui-input-group flex-1">
                  <Search size={16} />
                  <input
                    className="ui-input"
                    placeholder="Search messages, articles, tickets, files..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch}>
                  <Search size={14} /> Search
                </Button>
              </div>
            </Card>
            {loading ? (
              <div className="ui-center-pad">
                <Spinner />
              </div>
            ) : (
              results.length > 0 && (
                <Card>
                  <DataTable
                    columns={columns}
                    data={results}
                    rowKey={(r) => `${r.type}-${r.id}`}
                    emptyTitle="No results"
                  />
                </Card>
              )
            )}
          </div>
        )}
        {activeTab === "saved" && (
          <Card className="mt-4">
            <DataTable
              columns={
                [
                  { key: "name", header: "Name" },
                  { key: "query", header: "Query" },
                  {
                    key: "scope",
                    header: "Scope",
                    render: (r) => <Badge>{r.scope}</Badge>,
                  },
                  {
                    key: "createdAt",
                    header: "Saved",
                    render: (r) => new Date(r.createdAt).toLocaleDateString(),
                  },
                ] as Column<SavedSearch>[]
              }
              data={savedSearches}
              rowKey={(r) => r.id}
              emptyTitle="No saved searches"
              emptyIcon={<Bookmark size={48} />}
            />
          </Card>
        )}
        {activeTab === "history" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Search history timeline</p>
          </Card>
        )}
        {activeTab === "analytics" && analytics && (
          <div className="mt-4 ui-stack-4">
            <div className="ui-grid-auto">
              <KPICard
                title="Total Searches"
                value={analytics.totalSearches}
                icon={<Search size={18} />}
              />
              <KPICard
                title="Searches Today"
                value={analytics.searchesToday}
                icon={<Clock size={18} />}
                color="var(--color-info)"
              />
            </div>
            <Card className="p-5">
              <h3 className="ui-heading-base mb-3">Top Queries</h3>
              {analytics.topQueries?.map((q, i) => (
                <div
                  key={i}
                  className="flex justify-between py-2 border-b last:border-0"
                >
                  <span>{q.query}</span>
                  <Badge>{q._count} searches</Badge>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
