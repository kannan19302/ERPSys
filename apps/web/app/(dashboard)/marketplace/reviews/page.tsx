"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, DataTable, Modal, Pagination, toast } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { Star, MessageSquare } from "lucide-react";
import type { Column } from "@unerp/ui";

interface Review {
  id: string; userId: string; userName: string; rating: number; title: string | null;
  body: string | null; createdAt: string; appId: string;
}

export default function MarketplaceReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [appId, setAppId] = useState("");

  const fetchReviews = useCallback(async () => {
    if (!appId) { setLoading(false); return; }
    setLoading(true);
    const res = await fetch(`/api/v1/marketplace/apps/${appId}/reviews?page=${page}&limit=20`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.items);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [appId, page]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const columns: Column<Review>[] = [
    { id: "userName", header: "User", render: (r) => r.userName },
    { id: "rating", header: "Rating", render: (r) => <span className="ui-flex-row ui-gap-1">{Array.from({ length: r.rating }, (_, i) => <Star key={i} size={14} className="u-text-warning" fill="currentColor" />)}</span> },
    { id: "title", header: "Title", render: (r) => r.title ?? "-" },
    { id: "body", header: "Review", render: (r) => <span className="u-text-muted u-line-clamp-2">{r.body ?? "-"}</span> },
    { id: "createdAt", header: "Date", render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <RouteGuard permission="marketplace.review.read">
      <div className="ui-stack-6">
        <PageHeader title="App Reviews" description="Browse and moderate marketplace app reviews." icon={MessageSquare} breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: "Marketplace", href: "/marketplace" }, { label: "Reviews" }]} />
        <div className="ui-form-group">
          <label className="ui-label">App ID</label>
          <input className="ui-input u-w-96" placeholder="Enter app ID to view reviews" value={appId} onChange={(e) => { setAppId(e.target.value); setPage(1); }} />
        </div>
        <DataTable columns={columns} data={reviews} loading={loading} sortable />
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </RouteGuard>
  );
}
