"use client";
import { useState, useEffect } from "react";
import {
  Card,
  Badge,
  ListPageTemplate,
  type ListColumn,
  StatCardRow,
} from "@unerp/ui";
import { Zap, CheckCircle, Play, Lock } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
interface AutomationDashboard {
  totalRules: number;
  activeRules: number;
  activeHolds: number;
  pendingReplenishments: number;
  holdsByType: Record<string, number>;
}

interface ReplenishmentRule {
  id: string;
  warehouseId: string;
  productId: string;
  activeBinCode: string;
  reserveBinCode: string;
  triggerQty: number;
  replenishQty: number;
  isActive: boolean;
  lastTriggeredAt: string | null;
}

interface Hold {
  id: string;
  holdNumber: string;
  warehouseId: string;
  productId: string | null;
  holdType: string;
  reason: string;
  heldQty: number;
  status: string;
  raisedBy: string | null;
}

const HOLD_TYPE_VARIANT: Record<string, "default" | "warning" | "danger"> = {
  QUALITY: "warning",
  CUSTOMS: "default",
  DAMAGE: "danger",
  RECALL: "danger",
  FINANCIAL: "warning",
};

export default function AutomationRulesPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<"dashboard" | "rules" | "holds">("dashboard");
  const [dashboard, setDashboard] = useState<AutomationDashboard | null>(null);
  const [rules, setRules] = useState<ReplenishmentRule[]>([]);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showHoldForm, setShowHoldForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    evaluated: number;
    triggered: number;
  } | null>(null);

  useEffect(() => {
    fetchAll();
  }, [client]);

  async function fetchAll() {
    const [d, r, h] = await Promise.all([
      client.get<AutomationDashboard | null>("/inventory/automation/dashboard"),
      client.get<ReplenishmentRule[]>(
        "/inventory/automation/replenishment-rules",
      ),
      client.get<Hold[]>("/inventory/automation/holds"),
    ]);
    if (d) setDashboard(d);
    setRules(r);
    setHolds(h);
  }

  async function createRule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await client.post("/inventory/automation/replenishment-rules", {
      warehouseId: fd.get("warehouseId"),
      productId: fd.get("productId"),
      activeBinCode: fd.get("activeBinCode"),
      reserveBinCode: fd.get("reserveBinCode"),
      triggerQty: parseFloat(fd.get("triggerQty") as string),
      replenishQty: parseFloat(fd.get("replenishQty") as string),
    });
    setLoading(false);
    setShowRuleForm(false);
    fetchAll();
  }

  async function createHold(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await client.post("/inventory/automation/holds", {
      warehouseId: fd.get("warehouseId"),
      productId: fd.get("productId") || undefined,
      holdType: fd.get("holdType"),
      reason: fd.get("reason"),
      heldQty: parseFloat(fd.get("heldQty") as string),
      raisedBy: fd.get("raisedBy") || undefined,
    });
    setLoading(false);
    setShowHoldForm(false);
    fetchAll();
  }

  async function releaseHold(id: string) {
    const releasedBy = prompt("Released by:");
    if (!releasedBy) return;
    await client.post(`/inventory/automation/holds/${id}/release`, {
      releasedBy,
    });
    fetchAll();
  }

  async function evaluateRules() {
    const warehouseId = prompt("Warehouse ID to evaluate:");
    if (!warehouseId) return;
    setEvalResult(
      await client.post<{ evaluated: number; triggered: number }>(
        `/inventory/automation/replenishment-rules/evaluate?warehouseId=${warehouseId}`,
        {},
      ),
    );
  }

  return (
    <RouteGuard permission="inventory.automation-rules.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Manage inventory operations for this workspace."
      >
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Automation Rules</h1>
            <p className="text-sm text-muted-foreground">
              Bin replenishment triggers and inventory holds
            </p>
          </div>

          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Rules",
                  value: dashboard.totalRules,
                  icon: Zap,
                  color: "text-blue-600",
                },
                {
                  label: "Active Rules",
                  value: dashboard.activeRules,
                  icon: CheckCircle,
                  color: "text-green-600",
                },
                {
                  label: "Active Holds",
                  value: dashboard.activeHolds,
                  icon: Lock,
                  color: "text-orange-600",
                },
                {
                  label: "Triggered (recent)",
                  value: dashboard.pendingReplenishments,
                  icon: Play,
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

          {evalResult && (
            <Card className="p-4 border-green-500">
              <p className="text-sm">
                Evaluated <strong>{evalResult.evaluated}</strong> rules —{" "}
                <strong>{evalResult.triggered}</strong> triggered replenishment
                alerts.
              </p>
            </Card>
          )}

          <div className="flex gap-1 border-b">
            {(["dashboard", "rules", "holds"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "rules"
                  ? "Replenishment Rules"
                  : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "dashboard" && dashboard && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Active Holds by Type</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(dashboard.holdsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <Badge variant={HOLD_TYPE_VARIANT[type] ?? "default"}>
                      {type}
                    </Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
                {Object.keys(dashboard.holdsByType).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No active holds
                  </p>
                )}
              </div>
            </Card>
          )}

          {tab === "rules" && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Replenishment Rules</h3>
                <div className="flex gap-2">
                  <button
                    onClick={evaluateRules}
                    className="px-3 py-1.5 border rounded text-sm"
                  >
                    Evaluate Rules
                  </button>
                  <button
                    onClick={() => setShowRuleForm(true)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                  >
                    + Add Rule
                  </button>
                </div>
              </div>
              <ListPageTemplate
                columns={
                  [
                    {
                      key: "productId",
                      header: "Product",
                      render: (v) => (
                        <span className="font-mono text-xs">{String(v)}</span>
                      ),
                    },
                    { key: "activeBinCode", header: "Active Bin" },
                    { key: "reserveBinCode", header: "Reserve Bin" },
                    {
                      key: "triggerQty",
                      header: "Trigger Qty",
                      render: (v) => (
                        <span className="text-right block">
                          {Number(v).toFixed(0)}
                        </span>
                      ),
                    },
                    {
                      key: "replenishQty",
                      header: "Replenish Qty",
                      render: (v) => (
                        <span className="text-right block">
                          {Number(v).toFixed(0)}
                        </span>
                      ),
                    },
                    {
                      key: "lastTriggeredAt",
                      header: "Last Triggered",
                      render: (v) => (
                        <span className="text-xs">
                          {v ? new Date(String(v)).toLocaleDateString() : "—"}
                        </span>
                      ),
                    },
                  ] as ListColumn[]
                }
                data={rules as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No rules defined"
                emptyDescription="Add a replenishment rule to get started."
              />
            </Card>
          )}

          {tab === "holds" && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Inventory Holds</h3>
                <button
                  onClick={() => setShowHoldForm(true)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                >
                  + Place Hold
                </button>
              </div>
              <ListPageTemplate
                columns={
                  [
                    {
                      key: "holdNumber",
                      header: "Hold#",
                      render: (v) => (
                        <span className="font-mono text-xs">{String(v)}</span>
                      ),
                    },
                    {
                      key: "holdType",
                      header: "Type",
                      render: (v) => (
                        <Badge
                          variant={HOLD_TYPE_VARIANT[String(v)] ?? "default"}
                        >
                          {String(v)}
                        </Badge>
                      ),
                    },
                    {
                      key: "reason",
                      header: "Reason",
                      render: (v) => (
                        <span className="text-muted-foreground truncate max-w-xs block">
                          {String(v)}
                        </span>
                      ),
                    },
                    {
                      key: "heldQty",
                      header: "Qty",
                      render: (v) => (
                        <span className="text-right block">
                          {Number(v).toFixed(0)}
                        </span>
                      ),
                    },
                    { key: "status", header: "Status" },
                    {
                      key: "id",
                      header: "Actions",
                      render: (_, row) =>
                        row.status === "ACTIVE" ? (
                          <button
                            onClick={() => releaseHold(String(row.id))}
                            className="text-primary hover:underline text-xs"
                          >
                            Release
                          </button>
                        ) : null,
                    },
                  ] as ListColumn[]
                }
                data={holds as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No holds found"
                emptyDescription="No inventory holds are currently active."
              />
            </Card>
          )}

          {showRuleForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-full max-w-md">
                <h3 className="font-semibold mb-4">Add Replenishment Rule</h3>
                <form onSubmit={createRule} className="space-y-3">
                  {[
                    ["warehouseId", "Warehouse ID"],
                    ["productId", "Product ID"],
                    ["activeBinCode", "Active Bin Code"],
                    ["reserveBinCode", "Reserve Bin Code"],
                  ].map(([name, label]) => (
                    <div key={name}>
                      <label className="text-sm font-medium">{label}</label>
                      <input
                        name={name}
                        required
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Trigger Qty</label>
                      <input
                        name="triggerQty"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Replenish Qty
                      </label>
                      <input
                        name="replenishQty"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRuleForm(false)}
                      className="px-3 py-1.5 border rounded text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {showHoldForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-full max-w-md">
                <h3 className="font-semibold mb-4">Place Inventory Hold</h3>
                <form onSubmit={createHold} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Warehouse ID</label>
                    <input
                      name="warehouseId"
                      required
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Hold Type</label>
                    <select
                      name="holdType"
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    >
                      {[
                        "QUALITY",
                        "CUSTOMS",
                        "DAMAGE",
                        "RECALL",
                        "FINANCIAL",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Held Quantity</label>
                    <input
                      name="heldQty"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reason</label>
                    <textarea
                      name="reason"
                      required
                      rows={2}
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Product ID (optional)
                    </label>
                    <input
                      name="productId"
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowHoldForm(false)}
                      className="px-3 py-1.5 border rounded text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                    >
                      Place Hold
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
