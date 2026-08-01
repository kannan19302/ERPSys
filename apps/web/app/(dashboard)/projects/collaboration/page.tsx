"use client";
import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  FileText,
  Rss,
  BookOpen,
  Plus,
  CheckCircle2,
  Pin,
  Reply,
} from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  StatCardRow,
  useToast,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "discussions",
    label: "Discussions",
    href: "/projects/collaboration?tab=discussions",
  },
  {
    id: "reviews",
    label: "Reviews",
    href: "/projects/collaboration?tab=reviews",
  },
  {
    id: "feed",
    label: "Activity Feed",
    href: "/projects/collaboration?tab=feed",
  },
  { id: "wiki", label: "Wiki", href: "/projects/collaboration?tab=wiki" },
];

interface Discussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  isPinned: boolean;
  tags?: string;
  createdAt: string;
  replies?: {
    id: string;
    content: string;
    authorId: string;
    isSolution: boolean;
    createdAt: string;
  }[];
}
interface Review {
  id: string;
  title: string;
  status: string;
  description?: string;
  reviewerId?: string;
  dueDate?: string;
}
interface FeedEvent {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  userId: string;
  createdAt: string;
}

export default function CollaborationPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "discussions";
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [client]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const prjData = await client.get<
        { id: string }[] | { data?: { id: string }[] }
      >("/projects");
      const projects = Array.isArray(prjData) ? prjData : prjData.data || [];
      if (projects.length > 0 && projects[0]) {
        const pid = projects[0].id;
        const [discData, revData, feedData] = await Promise.all([
          client.get<Discussion[] | { data?: Discussion[] }>(
            `/projects/${pid}/discussions`,
          ),
          client.get<Review[] | { data?: Review[] }>(
            `/projects/${pid}/document-reviews`,
          ),
          client.get<FeedEvent[] | { data?: FeedEvent[] }>(
            `/projects/${pid}/feed`,
          ),
        ]);
        setDiscussions(
          Array.isArray(discData) ? discData : discData.data || [],
        );
        setReviews(Array.isArray(revData) ? revData : revData.data || []);
        setFeed(Array.isArray(feedData) ? feedData : feedData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      notifyError("Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="ui-alert ui-alert-danger">{error}</div>;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Collaboration"
        description="Team discussions, document reviews, activity feed, and wiki"
      />
      <div className="ui-flex-between">
        <SubTabBar tabs={SUB_TABS} />
        <div className="ui-hstack-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("New Discussion (API ready)")}
          >
            <Plus size={14} /> Discuss
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("New Wiki Page (API ready)")}
          >
            <BookOpen size={14} /> New Wiki
          </Button>
        </div>
      </div>
      {activeTab === "discussions" && (
        <>
          <StatCardRow
            stats={[
              {
                label: "Discussions",
                value: discussions.length,
                icon: <MessageSquare size={16} />,
                color: "var(--chart-1)",
              },
              {
                label: "Pinned",
                value: discussions.filter((d) => d.isPinned).length,
                icon: <Pin size={16} />,
                color: "var(--chart-2)",
              },
              {
                label: "Replies",
                value: discussions.reduce(
                  (s, d) => s + (d.replies?.length || 0),
                  0,
                ),
                icon: <Reply size={16} />,
                color: "var(--chart-3)",
              },
            ]}
          />
          <div className="ui-stack-3">
            {discussions.map((d) => (
              <Card key={d.id} className="ui-stack-2">
                <div className="ui-flex-between">
                  <div className="ui-hstack-2">
                    {d.isPinned && (
                      <Pin size={14} className="ui-text-primary" />
                    )}
                    <h4 className="ui-text-label">{d.title}</h4>
                  </div>
                  <span className="ui-text-micro">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="ui-text-small">{d.content.substring(0, 200)}</p>
                <div className="ui-hstack-3">
                  <span className="ui-text-micro">
                    {d.replies?.length || 0} replies
                  </span>
                  {d.tags && <span className="ui-text-micro">{d.tags}</span>}
                </div>
                {(d.replies || []).length > 0 && (
                  <div className="ui-stack-2 ml-4">
                    {d.replies?.slice(0, 3).map((r) => (
                      <div key={r.id} className="ui-flex-between ui-card p-2">
                        <p className="ui-text-micro">
                          {r.content.substring(0, 100)}
                        </p>
                        {r.isSolution && (
                          <CheckCircle2 size={14} className="ui-text-success" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
      {activeTab === "reviews" && (
        <div className="ui-stack-3">
          {reviews.map((r) => (
            <Card key={r.id} className="ui-flex-between">
              <div>
                <strong>{r.title}</strong>
                <p className="ui-text-micro">{r.description || ""}</p>
                {r.dueDate && (
                  <p className="ui-text-micro">
                    Due: {new Date(r.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span
                className={`ui-badge ${r.status === "APPROVED" ? "ui-badge-success" : r.status === "CHANGES_REQUESTED" || r.status === "REJECTED" ? "ui-badge-danger" : r.status === "IN_REVIEW" ? "ui-badge-info" : "ui-badge-warning"}`}
              >
                {r.status}
              </span>
            </Card>
          ))}
        </div>
      )}
      {activeTab === "feed" && (
        <div className="ui-stack-3">
          {feed.map((f) => (
            <Card key={f.id} className="ui-flex-between">
              <div>
                <div className="ui-hstack-2">
                  <span
                    className={`ui-badge ${f.eventType === "DISCUSSION" ? "ui-badge-info" : f.eventType === "WIKI_UPDATE" ? "ui-badge-success" : "ui-badge-muted"}`}
                  >
                    {f.eventType}
                  </span>
                  <strong>{f.title}</strong>
                </div>
                {f.description && (
                  <p className="ui-text-micro">{f.description}</p>
                )}
              </div>
              <span className="ui-text-micro">
                {new Date(f.createdAt).toLocaleDateString()}
              </span>
            </Card>
          ))}
        </div>
      )}
      {activeTab === "wiki" && (
        <Card className="ui-stack-3">
          <h3 className="ui-text-label">Project Wiki</h3>
          <p className="ui-text-muted">
            Wiki pages are available via the API. Use the wiki endpoints to
            create, read, and update documentation.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Create Wiki Page (API ready)")}
          >
            <Plus size={14} /> Create Wiki Page
          </Button>
        </Card>
      )}
    </div>
  );
}
