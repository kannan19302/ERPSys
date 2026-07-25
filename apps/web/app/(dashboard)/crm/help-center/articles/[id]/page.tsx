"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { Eye, ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, apiSend } from "../../../_components/api";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  category?: { id: string; name: string; slug: string };
  publishedAt?: string;
  createdAt: string;
  tags?: string[];
}

export default function ArticleDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/crm/support/help-center/articles?limit=1`);
      const arts = res?.data || [];
      setArticle(arts.find((a: any) => a.id === id) || null);
    } finally {
      setLoading(false);
    }
  };

  const recordFeedback = async (helpful: boolean) => {
    await apiSend(
      `/api/crm/support/help-center/articles/${id}/feedback`,
      "POST",
      { helpful },
    );
    load();
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <Spinner />;
  if (!article)
    return (
      <div className="ui-page">
        <p className="text-muted">Article not found</p>
      </div>
    );

  return (
    <div className="ui-page" style={{ maxWidth: 800 }}>
      <PageHeader
        title={article.title}
        subtitle={article.excerpt || ""}
        breadcrumbs={[
          { label: "Help Center", href: "/crm/help-center" },
          { label: "Articles", href: "/crm/help-center/articles" },
          { label: article.title },
        ]}
      />
      <Card>
        <div className="ui-card-body">
          <div className="ui-flex ui-gap-2 ui-mb-3 ui-flex-wrap">
            <Badge
              variant={article.status === "PUBLISHED" ? "success" : "secondary"}
            >
              {article.status}
            </Badge>
            {article.category && <Badge>{article.category.name}</Badge>}
            <span className="ui-text-xs text-muted">
              <Eye size={12} /> {article.viewCount} views
            </span>
            <span className="ui-text-xs text-muted">
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="ui-prose" style={{ whiteSpace: "pre-wrap" }}>
            {article.content}
          </div>
          <hr className="ui-mt-4 ui-mb-3" />
          <div className="ui-flex ui-items-center ui-gap-3">
            <span className="ui-text-sm text-muted">
              Was this article helpful?
            </span>
            <button
              className="ui-btn-icon"
              onClick={() => recordFeedback(true)}
              title="Yes"
            >
              <ThumbsUp size={16} />
            </button>
            <span className="ui-text-xs text-muted">
              {article.helpfulCount}
            </span>
            <button
              className="ui-btn-icon"
              onClick={() => recordFeedback(false)}
              title="No"
            >
              <ThumbsDown size={16} />
            </button>
            <span className="ui-text-xs text-muted">
              {article.notHelpfulCount}
            </span>
          </div>
        </div>
      </Card>
      <div className="ui-mt-3">
        <Link href="/crm/help-center" className="ui-link">
          <ArrowLeft size={14} /> Back to Help Center
        </Link>
      </div>
    </div>
  );
}
