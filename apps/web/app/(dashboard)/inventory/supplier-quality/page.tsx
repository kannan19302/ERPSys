"use client";
import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { Card, Badge, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { AlertTriangle, CheckCircle, ClipboardList, Star } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
interface QualityDashboard {
  totalNcrs: number;
  openNcrs: number;
  criticalNcrs: number;
  pendingCars: number;
  recentScorecards: Scorecard[];
}

interface Scorecard {
  id: string;
  vendorId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number | null;
  qualityScore: number | null;
  deliveryScore: number | null;
  fillRateScore: number | null;
  vendor: { id: string; name: string };
}

interface Ncr {
  id: string;
  ncrNumber: string;
  defectType: string;
  severity: string;
  status: string;
  description: string;
  defectQty: number;
  totalQty: number;
  vendor: { id: string; name: string };
  _count: { carRequests: number };
}

const SEVERITY_VARIANT: Record<string, "default" | "warning" | "danger"> = {
  MINOR: "default",
  MAJOR: "warning",
  CRITICAL: "danger",
};

export default function SupplierQualityPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<"dashboard" | "ncrs" | "cars" | "scorecards">(
    "dashboard",
  );
  const [dashboard, setDashboard] = useState<QualityDashboard | null>(null);
  const [ncrs, setNcrs] = useState<Ncr[]>([]);
  const [showNcrForm, setShowNcrForm] = useState(false);
  const [showCarForm, setShowCarForm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchNcrs();
  }, []);

  async function fetchDashboard() {
    setDashboard(
      await client.get<QualityDashboard>(
        "/inventory/supplier-quality/dashboard",
      ),
    );
  }

  async function fetchNcrs() {
    setNcrs(await client.get<Ncr[]>("/inventory/supplier-quality/ncrs"));
  }

  async function createNcr(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await client.post("/inventory/supplier-quality/ncrs", {
      vendorId: fd.get("vendorId"),
      defectType: fd.get("defectType"),
      severity: fd.get("severity"),
      defectQty: parseInt(fd.get("defectQty") as string) || 0,
      totalQty: parseInt(fd.get("totalQty") as string) || 0,
      description: fd.get("description"),
    });
    setLoading(false);
    setShowNcrForm(false);
    fetchNcrs();
    fetchDashboard();
  }

  async function raiseCar(ncrId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await client.post("/inventory/supplier-quality/cars", {
      ncrId,
      rootCause: fd.get("rootCause") || undefined,
      correctiveAction: fd.get("correctiveAction") || undefined,
    });
    setLoading(false);
    setShowCarForm(null);
    fetchNcrs();
  }

  async function closeNcr(id: string) {
    const resolution = prompt("Enter resolution notes:");
    if (!resolution) return;
    await client.post(`/inventory/supplier-quality/ncrs/${id}/close`, {
      resolution,
    });
    fetchNcrs();
    fetchDashboard();
  }

  return (
    <RouteGuard permission="inventory.supplier-quality.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Manage inventory operations for this workspace."
      >
        <div className="ui-page-shell">
          <div>
            <h1 className="text-2xl font-bold">Supplier Quality Management</h1>
            <p className="text-sm text-muted-foreground">
              NCRs, corrective actions, and vendor scorecards
            </p>
          </div>

          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total NCRs",
                  value: dashboard.totalNcrs,
                  icon: ClipboardList,
                  color: "text-blue-600",
                },
                {
                  label: "Open NCRs",
                  value: dashboard.openNcrs,
                  icon: AlertTriangle,
                  color: "text-orange-600",
                },
                {
                  label: "Critical NCRs",
                  value: dashboard.criticalNcrs,
                  icon: AlertTriangle,
                  color: "text-red-600",
                },
                {
                  label: "Pending CARs",
                  value: dashboard.pendingCars,
                  icon: CheckCircle,
                  color: "text-purple-600",
                },
              ].map((s) => (
                <Card key={s.label} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold">{s.value}</p>
                    </div>
                    <s.icon className={`w-8 h-8 ${s.color}`} />
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-1 border-b">
            {(["dashboard", "ncrs", "cars", "scorecards"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "cars" ? "CARs" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "dashboard" &&
            dashboard &&
            dashboard.recentScorecards.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Recent Scorecards</h3>
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "vendor",
                        header: "Vendor",
                        render: (v) => String((v as any)?.name ?? ""),
                      },
                      {
                        key: "periodStart",
                        header: "Period",
                        render: (v) => new Date(String(v)).toLocaleDateString(),
                      },
                      {
                        key: "qualityScore",
                        header: "Quality",
                        render: (v) => (v != null ? Number(v).toFixed(0) : "—"),
                      },
                      {
                        key: "deliveryScore",
                        header: "Delivery",
                        render: (v) => (v != null ? Number(v).toFixed(0) : "—"),
                      },
                      {
                        key: "overallScore",
                        header: "Overall",
                        render: (v) => (
                          <strong>
                            {v != null ? Number(v).toFixed(1) : "—"}
                          </strong>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={
                    dashboard.recentScorecards as unknown as Record<
                      string,
                      unknown
                    >[]
                  }
                  loading={false}
                  emptyTitle="No scorecards"
                  emptyDescription="No recent scorecards."
                />
              </Card>
            )}

          {tab === "ncrs" && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Non-Conformance Reports</h3>
                <button
                  onClick={() => setShowNcrForm(true)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                >
                  + Raise NCR
                </button>
              </div>
              <ListPageTemplate
                columns={
                  [
                    {
                      key: "ncrNumber",
                      header: "NCR#",
                      render: (v) => (
                        <span className="font-mono text-xs">{String(v)}</span>
                      ),
                    },
                    {
                      key: "vendor",
                      header: "Vendor",
                      render: (v) => String((v as any)?.name ?? ""),
                    },
                    { key: "defectType", header: "Defect" },
                    {
                      key: "severity",
                      header: "Severity",
                      render: (v) => (
                        <Badge
                          variant={SEVERITY_VARIANT[String(v)] ?? "default"}
                        >
                          {String(v)}
                        </Badge>
                      ),
                    },
                    { key: "status", header: "Status" },
                    {
                      key: "_count",
                      header: "CARs",
                      render: (v) => String((v as any)?.carRequests ?? 0),
                    },
                    {
                      key: "id",
                      header: "Actions",
                      render: (v, row) =>
                        row.status !== "CLOSED" ? (
                          <div className={styles.s1}>
                            <button
                              onClick={() => setShowCarForm(String(v))}
                              className="text-primary hover:underline text-xs"
                            >
                              Raise CAR
                            </button>
                            <button
                              onClick={() => closeNcr(String(v))}
                              className="text-muted-foreground hover:underline text-xs"
                            >
                              Close
                            </button>
                          </div>
                        ) : null,
                    },
                  ] as ListColumn[]
                }
                data={ncrs as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No NCRs found"
                emptyDescription="No non-conformance reports found."
              />
            </Card>
          )}

          {/* Create NCR Modal */}
          {showNcrForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-full max-w-md">
                <h3 className="font-semibold mb-4">Raise NCR</h3>
                <form onSubmit={createNcr} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Vendor ID</label>
                    <input
                      name="vendorId"
                      required
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Defect Type</label>
                    <select
                      name="defectType"
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    >
                      {[
                        "DIMENSIONAL",
                        "COSMETIC",
                        "FUNCTIONAL",
                        "DOCUMENTATION",
                        "LABELING",
                        "QUANTITY",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <select
                      name="severity"
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    >
                      {["MINOR", "MAJOR", "CRITICAL"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Defect Qty</label>
                      <input
                        name="defectQty"
                        type="number"
                        min="0"
                        defaultValue="0"
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total Qty</label>
                      <input
                        name="totalQty"
                        type="number"
                        min="0"
                        defaultValue="0"
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNcrForm(false)}
                      className="px-3 py-1.5 border rounded text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                    >
                      Raise NCR
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* CAR Modal */}
          {showCarForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-full max-w-md">
                <h3 className="font-semibold mb-4">
                  Raise Corrective Action Request
                </h3>
                <form
                  onSubmit={(e) => raiseCar(showCarForm, e)}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-sm font-medium">
                      Root Cause (optional)
                    </label>
                    <textarea
                      name="rootCause"
                      rows={2}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Required Corrective Action
                    </label>
                    <textarea
                      name="correctiveAction"
                      rows={3}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCarForm(null)}
                      className="px-3 py-1.5 border rounded text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                    >
                      Raise CAR
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
