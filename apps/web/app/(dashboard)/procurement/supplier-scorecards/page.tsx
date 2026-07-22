"use client";
import { useState, useEffect } from "react";
import { PageHeader, Button, Badge, Spinner, Modal, DataTable, StatCardRow } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { ProcurementTabLayout, PROCUREMENT_TABS } from "@/components/procurement/ProcurementTabLayout";
import { ShoppingCart, Plus, Star, Award, TrendingUp, BarChart3 } from "lucide-react";

export default function SupplierScorecardsPage() {
  const client = useApiClient();
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompute, setShowCompute] = useState(false);
  const [form, setForm] = useState({ vendorId: "", periodStart: "", periodEnd: "", notes: "" });

  const load = () => {
    setLoading(true);
    Promise.all([
      client.get("/procurement/intelligence/scorecards"),
      client.get("/procurement/intelligence/scorecards/stats/summary"),
    ]).then(([scRes, statsRes]: any[]) => {
      setScorecards(scRes.data || []);
      setStats(statsRes);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCompute = async () => {
    await client.post("/procurement/intelligence/scorecards/compute", form);
    setShowCompute(false);
    setForm({ vendorId: "", periodStart: "", periodEnd: "", notes: "" });
    load();
  };

  const columns = [
    { key: "vendor", header: "Vendor", render: (row: any) => row.vendor?.name },
    { key: "periodStart", header: "Period Start", render: (row: any) => row.periodStart ? new Date(row.periodStart).toLocaleDateString() : "—" },
    { key: "qualityScore", header: "Quality", render: (row: any) => row.qualityScore ? `${Number(row.qualityScore).toFixed(1)}` : "—" },
    { key: "deliveryScore", header: "Delivery", render: (row: any) => row.deliveryScore ? `${Number(row.deliveryScore).toFixed(1)}` : "—" },
    { key: "fillRateScore", header: "Fill Rate", render: (row: any) => row.fillRateScore ? `${Number(row.fillRateScore).toFixed(1)}` : "—" },
    { key: "overallScore", header: "Overall", render: (row: any) => row.overallScore ? <strong>{Number(row.overallScore).toFixed(1)}</strong> : "—" },
    { key: "onTimeDeliveries", header: "On-Time" },
    { key: "defectiveUnits", header: "Defects" },
  ];

  return (
    <RouteGuard permission="procurement.purchase-order.read">
      <ProcurementTabLayout tabs={PROCUREMENT_TABS} moduleId="procurement" moduleLabel="Procurement" moduleIcon={ShoppingCart} moduleDescription="Manage procurement operations including purchase orders, vendors, and supplier quality.">
        <PageHeader title="Supplier Scorecards" description="Track and evaluate supplier performance with automated scorecards" actions={<Button onClick={() => setShowCompute(true)}><Plus size={16} /> Compute Scorecard</Button>} />

        {stats && (
          <StatCardRow stats={[
            { label: "Total Scorecards", value: stats.totalScorecards, icon: <Award size={20} />, color: "var(--color-blue)" },
            { label: "Vendors Scored", value: stats.vendorsScored, icon: <BarChart3 size={20} />, color: "var(--color-green)" },
            { label: "Avg Quality", value: stats.qualityAvg ? `${stats.qualityAvg}/100` : "—", icon: <TrendingUp size={20} />, color: "var(--color-indigo)" },
            { label: "Avg Overall", value: stats.averageOverallScore ? `${stats.averageOverallScore}/100` : "—", icon: <Star size={20} />, color: "var(--color-amber)" },
          ]} />
        )}

        {loading ? <Spinner /> : <DataTable columns={columns} data={scorecards} />}

        <Modal open={showCompute} onClose={() => setShowCompute(false)} title="Compute Supplier Scorecard">
          <div className="ui-form-group"><label className="ui-label">Vendor ID</label><input className="ui-input" value={form.vendorId} onChange={e => setForm({ ...form, vendorId: e.target.value })} /></div>
          <div className="ui-grid-2">
            <div className="ui-form-group"><label className="ui-label">Period Start</label><input className="ui-input" type="date" value={form.periodStart} onChange={e => setForm({ ...form, periodStart: e.target.value })} /></div>
            <div className="ui-form-group"><label className="ui-label">Period End</label><input className="ui-input" type="date" value={form.periodEnd} onChange={e => setForm({ ...form, periodEnd: e.target.value })} /></div>
          </div>
          <div className="ui-form-group"><label className="ui-label">Notes</label><textarea className="ui-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowCompute(false)}>Cancel</Button>
            <Button onClick={handleCompute}>Compute</Button>
          </div>
        </Modal>
      </ProcurementTabLayout>
    </RouteGuard>
  );
}
