"use client";
import { useState, useEffect } from "react";
import { PageHeader, Badge, Spinner, Card } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { ShoppingCart } from "lucide-react";

export default function DebitNotesPage() {
  const client = useApiClient();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/procurement/expansion/debit-notes"),
      client.get("/procurement/expansion/debit-notes/stats/summary"),
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
        APPROVED: "success",
        DISPUTED: "danger",
        PENDING: "warning",
        CANCELLED: "default",
      }) as Record<
        string,
        "default" | "success" | "warning" | "danger" | "info" | "primary"
      >
    )[s] || "default";

  return (
    <RouteGuard permission="procurement.debit-note.read">
      <PageHeader
        title="Debit Notes"
        description="Debit note lifecycle management for purchase returns and adjustments"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Procurement", href: "/procurement" },
          { label: "Debit Notes" },
        ]}
      />

      {stats && (
        <div className="ui-grid-4" style={{ marginBottom: 16 }}>
          <Card>
            <div className="ui-card">
              <h3>Total</h3>
              <p style={{ fontSize: 24, fontWeight: 700 }}>
                {stats.total || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Approved</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-green)",
                }}
              >
                {stats.approved || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Disputed</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-red)",
                }}
              >
                {stats.disputed || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Pending</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-amber)",
                }}
              >
                {stats.pending || 0}
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
                <th>DN #</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((dn: any) => (
                <tr key={dn.id}>
                  <td>{dn.dnNumber || dn.id}</td>
                  <td>{dn.vendor?.name || "—"}</td>
                  <td>${Number(dn.amount || 0).toLocaleString()}</td>
                  <td>{dn.reason || "—"}</td>
                  <td>
                    <Badge variant={statusVariant(dn.status)}>
                      {dn.status}
                    </Badge>
                  </td>
                  <td>
                    {dn.createdAt
                      ? new Date(dn.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
              {(!data || data.length === 0) && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                    No debit notes found
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
