"use client";
import { useState, useEffect } from "react";
import { PageHeader, Badge, Spinner, Card } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { ProcurementTabLayout, PROCUREMENT_TABS } from "@/components/procurement/ProcurementTabLayout";
import { ShoppingCart } from "lucide-react";

export default function PaymentSchedulesPage() {
  const client = useApiClient();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/procurement/scheduling/payment-schedules"),
      client.get("/procurement/scheduling/payment-schedules/stats/summary"),
    ]).then(([res, statsRes]: any[]) => {
      setData(res.data || []);
      setStats(statsRes);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusVariant = (s: string): "default" | "success" | "warning" | "danger" | "info" | "primary" =>
    ({ UPCOMING: "primary", OVERDUE: "danger", PAID: "success", PARTIAL: "warning", CANCELLED: "default" } as Record<string, "default" | "success" | "warning" | "danger" | "info" | "primary">)[s] || "default";

  return (
    <RouteGuard permission="procurement.payment-schedule.read">
      <ProcurementTabLayout tabs={PROCUREMENT_TABS} moduleId="procurement" moduleLabel="Procurement" moduleIcon={ShoppingCart} moduleDescription="Manage procurement operations including purchase orders, vendors, and supplier quality.">
        <PageHeader title="Payment Schedules" description="Track scheduled payments, due dates, and payment status across purchase orders" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Procurement", href: "/procurement" }, { label: "Payment Schedules" }]} />

        {stats && (
          <div className="ui-grid-4" style={{ marginBottom: 16 }}>
            <Card><div className="ui-card"><h3>Upcoming</h3><p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-blue)" }}>{stats.upcoming || 0}</p></div></Card>
            <Card><div className="ui-card"><h3>Overdue</h3><p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-red)" }}>{stats.overdue || 0}</p></div></Card>
            <Card><div className="ui-card"><h3>Paid</h3><p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-green)" }}>{stats.paid || 0}</p></div></Card>
            <Card><div className="ui-card"><h3>Total Amount</h3><p style={{ fontSize: 24, fontWeight: 700 }}>${Number(stats.totalAmount || 0).toLocaleString()}</p></div></Card>
          </div>
        )}

        {loading ? <Spinner /> : (
          <Card>
            <table className="ui-table" style={{ width: "100%" }}>
              <thead><tr><th>Schedule #</th><th>PO Reference</th><th>Vendor</th><th>Amount Due</th><th>Due Date</th><th>Paid Date</th><th>Status</th></tr></thead>
              <tbody>
                {(data || []).map((s: any) => (
                  <tr key={s.id}>
                    <td>{s.scheduleNumber || s.id}</td>
                    <td>{s.poReference || s.purchaseOrder?.orderNumber || "—"}</td>
                    <td>{s.vendor?.name || "—"}</td>
                    <td>${Number(s.amountDue || 0).toLocaleString()}</td>
                    <td>{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "—"}</td>
                    <td>{s.paidDate ? new Date(s.paidDate).toLocaleDateString() : "—"}</td>
                    <td><Badge variant={statusVariant(s.status)}>{s.status}</Badge></td>
                  </tr>
                ))}
                {(!data || data.length === 0) && <tr><td colSpan={7} style={{ textAlign: "center", padding: 24 }}>No payment schedules found</td></tr>}
              </tbody>
            </table>
          </Card>
        )}
      </ProcurementTabLayout>
    </RouteGuard>
  );
}
