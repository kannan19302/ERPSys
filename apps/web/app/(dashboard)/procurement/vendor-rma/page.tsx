"use client";
import { useState, useEffect } from "react";
import { PageHeader, Badge, Spinner, Card } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { ProcurementTabLayout, PROCUREMENT_TABS } from "@/components/procurement/ProcurementTabLayout";
import { ShoppingCart } from "lucide-react";

export default function VendorRMAPage() {
  const client = useApiClient();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/procurement/expansion/vendor-rma"),
      client.get("/procurement/expansion/vendor-rma/stats/summary"),
    ]).then(([res, statsRes]: any[]) => {
      setData(res.data || []);
      setStats(statsRes);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusVariant = (s: string): "default" | "success" | "warning" | "danger" | "info" | "primary" =>
    ({ OPEN: "warning", APPROVED: "info", COMPLETED: "success", REJECTED: "danger", CANCELLED: "default" } as Record<string, "default" | "success" | "warning" | "danger" | "info" | "primary">)[s] || "default";

  return (
    <RouteGuard permission="procurement.vendor-rma.read">
      <ProcurementTabLayout tabs={PROCUREMENT_TABS} moduleId="procurement" moduleLabel="Procurement" moduleIcon={ShoppingCart} moduleDescription="Manage procurement operations including purchase orders, vendors, and supplier quality.">
        <PageHeader title="Vendor RMA" description="Return merchandise authorization requests to suppliers" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Procurement", href: "/procurement" }, { label: "Vendor RMA" }]} />

        {stats && (
          <div className="ui-grid-5" style={{ marginBottom: 16 }}>
            <Card><div className="ui-card"><h3>Total</h3><p style={{ fontSize: 24, fontWeight: 700 }}>{stats.total || 0}</p></div></Card>
            <Card><div className="ui-card"><h3>Open</h3><p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-amber)" }}>{stats.open || 0}</p></div></Card>
            <Card><div className="ui-card"><h3>Approved</h3><p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-blue)" }}>{stats.approved || 0}</p></div></Card>
            <Card><div className="ui-card"><h3>Completed</h3><p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-green)" }}>{stats.completed || 0}</p></div></Card>
            <Card><div className="ui-card"><h3>Rejected</h3><p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-red)" }}>{stats.rejected || 0}</p></div></Card>
          </div>
        )}

        {loading ? <Spinner /> : (
          <Card>
            <table className="ui-table" style={{ width: "100%" }}>
              <thead><tr><th>RMA #</th><th>Vendor</th><th>Product</th><th>Quantity</th><th>Reason</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {(data || []).map((rma: any) => (
                  <tr key={rma.id}>
                    <td>{rma.rmaNumber || rma.id}</td>
                    <td>{rma.vendor?.name || "—"}</td>
                    <td>{rma.product?.name || "—"}</td>
                    <td>{rma.quantity ?? "—"}</td>
                    <td>{rma.reason || "—"}</td>
                    <td><Badge variant={statusVariant(rma.status)}>{rma.status}</Badge></td>
                    <td>{rma.createdAt ? new Date(rma.createdAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
                {(!data || data.length === 0) && <tr><td colSpan={7} style={{ textAlign: "center", padding: 24 }}>No RMA requests found</td></tr>}
              </tbody>
            </table>
          </Card>
        )}
      </ProcurementTabLayout>
    </RouteGuard>
  );
}
