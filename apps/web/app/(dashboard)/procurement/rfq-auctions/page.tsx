"use client";
import { useState, useEffect } from "react";
import { PageHeader, Badge, Spinner, Card } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { ShoppingCart } from "lucide-react";

export default function RfqAuctionsPage() {
  const client = useApiClient();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/procurement/intelligence/auctions"),
      client.get("/procurement/intelligence/auctions/stats/summary"),
    ])
      .then(([res, statsRes]: any[]) => {
        setData(res.data || []);
        setStats(statsRes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusVariant = (
    s: string,
  ): "default" | "success" | "warning" | "danger" | "info" | "primary" =>
    (
      ({
        ACTIVE: "success",
        CLOSED: "default",
        AWARDED: "primary",
        CANCELLED: "danger",
      }) as Record<
        string,
        "default" | "success" | "warning" | "danger" | "info" | "primary"
      >
    )[s] || "default";

  return (
    <RouteGuard permission="procurement.rfq-auction.read">
      <PageHeader
        title="RFQ Auctions"
        description="Reverse auction management for competitive supplier bidding"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Procurement", href: "/procurement" },
          { label: "RFQ Auctions" },
        ]}
      />

      {stats && (
        <div className="ui-grid-4" style={{ marginBottom: 16 }}>
          <Card>
            <div className="ui-card">
              <h3>Active</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-green)",
                }}
              >
                {stats.active || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Closed</h3>
              <p style={{ fontSize: 24, fontWeight: 700 }}>
                {stats.closed || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Awarded</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-blue)",
                }}
              >
                {stats.awarded || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Cancelled</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-red)",
                }}
              >
                {stats.cancelled || 0}
              </p>
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <table className="ui-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Auction #</th>
                <th>Title</th>
                <th>Vendor</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Awarded To</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((a: any) => (
                <tr key={a.id}>
                  <td>{a.auctionNumber || a.id}</td>
                  <td>{a.title || "—"}</td>
                  <td>{a.vendor?.name || "—"}</td>
                  <td>
                    {a.startDate
                      ? new Date(a.startDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    {a.endDate ? new Date(a.endDate).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                  </td>
                  <td>{a.awardedTo?.name || a.awardedVendor || "—"}</td>
                </tr>
              ))}
              {(!data || data.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                    No auctions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </RouteGuard>
  );
}
