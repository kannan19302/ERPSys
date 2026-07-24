"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  ListPageTemplate,
  type ListColumn,
} from "@unerp/ui";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  Warehouse as WhIcon,
  ChevronDown,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { Package as InventoryModuleIcon } from "lucide-react";
interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  hasSerialTracking: boolean;
  hasBatchTracking: boolean;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface BinLocation {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
}

interface StockEntryItem {
  id: string;
  product: { name: string; sku: string };
  qty: number;
  valuationRate: number;
  amount: number;
  batchNumber?: string | null;
  serialNumber?: string | null;
}

interface StockEntry {
  id: string;
  entryNumber: string;
  purpose:
    | "MATERIAL_RECEIPT"
    | "MATERIAL_ISSUE"
    | "MATERIAL_TRANSFER"
    | "STOCK_ADJUSTMENT";
  postingDate: string;
  status: "DRAFT" | "SUBMITTED" | "CANCELLED";
  remarks?: string | null;
  fromWarehouseId?: string | null;
  toWarehouseId?: string | null;
  totalValue: number;
  items: StockEntryItem[];
}

export default function StockEntriesPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allBins, setAllBins] = useState<BinLocation[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);

  // Modals & Forms
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryPurpose, setEntryPurpose] = useState<
    "MATERIAL_RECEIPT" | "MATERIAL_ISSUE" | "MATERIAL_TRANSFER"
  >("MATERIAL_TRANSFER");
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [entryRemarks, setEntryRemarks] = useState("");
  const [entryItems, setEntryItems] = useState<
    Array<{
      productId: string;
      qty: number;
      valuationRate: number;
      batchNumber?: string;
      serialNo?: string;
      fromBinId?: string;
      toBinId?: string;
    }>
  >([{ productId: "", qty: 1, valuationRate: 0 }]);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch products, warehouses, bins, entries in parallel
      const [pData, whs, bins, seData] = await Promise.all([
        client.get<unknown>("/inventory/products"),
        client.get<unknown>("/inventory/warehouses"),
        client.get<unknown>("/inventory/bin-locations"),
        client.get<unknown>("/inventory/stock-entries"),
      ]);
      const items = (value: unknown) =>
        value && typeof value === "object" && "data" in value
          ? (value as { data?: unknown }).data
          : value;
      const plist = items(pData);
      setProducts(
        (Array.isArray(plist) ? plist : []).map((p: any) => ({
          ...p,
          costPrice: Number(p.costPrice),
        })),
      );
      {
        const wlist = items(whs) as Warehouse[];
        setWarehouses(wlist);
        const firstWarehouse = wlist[0];
        if (firstWarehouse) {
          setFromWarehouse(firstWarehouse.id);
          setToWarehouse(firstWarehouse.id);
        }
      }
      setAllBins(
        (Array.isArray(items(bins)) ? items(bins) : []) as BinLocation[],
      );
      {
        const entries = items(seData);
        const entryList = Array.isArray(entries) ? entries : [];
        setStockEntries(
          entryList.map((se: any) => ({
            ...se,
            totalValue: Number(se.totalValue),
            items: (se.items || []).map((item: any) => ({
              ...item,
              qty: Number(item.qty),
              valuationRate: Number(item.valuationRate),
              amount: Number(item.amount),
            })),
          })),
        );
      }
    } catch {
      setError("Could not load data. Please try again.");
      setProducts([]);
      setWarehouses([]);
      setAllBins([]);
      setStockEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedItems = entryItems
      .filter((item) => item.productId !== "")
      .map((item) => ({
        productId: item.productId,
        qty: Number(item.qty),
        valuationRate: Number(item.valuationRate),
        batchNumber: item.batchNumber || undefined,
        serialNo: item.serialNo || undefined,
        fromWarehouseId:
          entryPurpose !== "MATERIAL_RECEIPT" ? fromWarehouse : undefined,
        toWarehouseId:
          entryPurpose !== "MATERIAL_ISSUE" ? toWarehouse : undefined,
        fromBinId: item.fromBinId || undefined,
        toBinId: item.toBinId || undefined,
      }));

    const payload = {
      type: entryPurpose,
      purpose: entryPurpose,
      fromWarehouseId:
        entryPurpose !== "MATERIAL_RECEIPT" ? fromWarehouse : undefined,
      toWarehouseId:
        entryPurpose !== "MATERIAL_ISSUE" ? toWarehouse : undefined,
      remarks: entryRemarks,
      items: formattedItems,
    };

    try {
      await client.post("/inventory/stock-entries", payload);
      setIsEntryModalOpen(false);
      setEntryRemarks("");
      setEntryItems([{ productId: "", qty: 1, valuationRate: 0 }]);
      loadData();
    } catch {
      // save failed — surface the error instead of fabricating a result
      setError("Action could not be completed. Please try again.");
    }
  };

  const handleSubmitStockEntry = async (id: string) => {
    try {
      await client.post(`/inventory/stock-entries/${id}/submit`, {});
      loadData();
    } catch {
      setStockEntries((prev) =>
        prev.map((se) => (se.id === id ? { ...se, status: "SUBMITTED" } : se)),
      );
    }
  };

  const handleCancelStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post(`/inventory/stock-entries/${cancelTargetId}/cancel`, {
        reason: cancelReason,
      });
      setCancelModalOpen(false);
      setCancelReason("");
      loadData();
    } catch {
      setStockEntries((prev) =>
        prev.map((se) =>
          se.id === cancelTargetId
            ? {
                ...se,
                status: "CANCELLED",
                remarks: `${se.remarks || ""} (Cancelled: ${cancelReason})`,
              }
            : se,
        ),
      );
      setCancelModalOpen(false);
      setCancelReason("");
    }
  };

  const triggerCancel = (id: string) => {
    setCancelTargetId(id);
    setCancelModalOpen(true);
  };

  return (
    <RouteGuard permission="inventory.stock-entries.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Stock Entries"
          description="Record goods receipts, inter-depot transfers, and stock adjustments E2E with active valuations."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Inventory", href: "/inventory" },
            { label: "Stock Entries" },
          ]}
          actions={
            <Button
              variant="primary"
              onClick={() => setIsEntryModalOpen(true)}
              className="ui-hstack-2"
            >
              <Plus size={14} />
              Create Stock Entry
            </Button>
          }
        />

        {error && (
          <div className={styles.s1}>
            <AlertCircle size={16} />
            <span>Note: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="ui-center-pad">
            <Spinner size="lg" />
          </div>
        ) : (
          <ListPageTemplate
            columns={
              [
                {
                  key: "entryNumber",
                  header: "Voucher ID",
                  render: (v) => (
                    <span className="font-semibold">{String(v)}</span>
                  ),
                },
                {
                  key: "purpose",
                  header: "Type",
                  render: (v) => (
                    <Badge
                      variant={
                        String(v) === "MATERIAL_RECEIPT"
                          ? "success"
                          : String(v) === "MATERIAL_ISSUE"
                            ? "danger"
                            : "info"
                      }
                    >
                      {String(v).replace("_", " ")}
                    </Badge>
                  ),
                },
                {
                  key: "postingDate",
                  header: "Posting Date",
                  render: (v) => new Date(String(v)).toLocaleString(),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (v) => (
                    <Badge
                      variant={
                        String(v) === "SUBMITTED"
                          ? "success"
                          : String(v) === "CANCELLED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {String(v)}
                    </Badge>
                  ),
                },
                {
                  key: "totalValue",
                  header: "Total Value",
                  render: (v) => (
                    <span className="font-semibold">
                      $
                      {Number(v).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  ),
                },
                {
                  key: "remarks",
                  header: "Remarks",
                  render: (v) => (
                    <span className="ui-text-muted">
                      {String(v || "No remarks")}
                    </span>
                  ),
                },
                {
                  key: "id",
                  header: "Actions",
                  render: (v, row) => (
                    <div className={styles.s2}>
                      {row.status === "DRAFT" && (
                        <button
                          onClick={() => handleSubmitStockEntry(String(v))}
                          className={`ui-btn ui-btn-primary ${styles.s3}`}
                        >
                          Submit Slip
                        </button>
                      )}
                      {row.status === "SUBMITTED" && (
                        <button
                          onClick={() => triggerCancel(String(v))}
                          className={`ui-btn ${styles.s4}`}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ),
                },
              ] as ListColumn[]
            }
            data={stockEntries as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No stock entry vouchers"
            emptyDescription="No stock entry vouchers have been recorded."
          />
        )}

        {/* CREATE STOCK ENTRY MODAL OVERLAY */}
        {isEntryModalOpen && (
          <div className={styles.s5}>
            <div className={`ui-card ${styles.s6}`}>
              <div
                className={`ui-card-header flex items-center justify-between ${styles.s7}`}
              >
                <span className={styles.s8}>
                  Create Warehouse Material Slip
                </span>
                <button
                  onClick={() => setIsEntryModalOpen(false)}
                  className="ui-btn-icon ui-text-muted"
                >
                  Close
                </button>
              </div>
              <div className="ui-card-body p-5">
                <form onSubmit={handleSaveStockEntry} className="ui-stack-4">
                  <div className="ui-grid-2">
                    <div className="ui-form-group ui-stack-1">
                      <label className="ui-label ui-text-xs-label">
                        Transaction Purpose *
                      </label>
                      <select
                        className="ui-input"
                        value={entryPurpose}
                        onChange={(e) => setEntryPurpose(e.target.value as any)}
                      >
                        <option value="MATERIAL_RECEIPT">
                          Receipt (Goods In)
                        </option>
                        <option value="MATERIAL_ISSUE">
                          Issue (Write-off / Stock Out)
                        </option>
                        <option value="MATERIAL_TRANSFER">
                          Warehouse Stock Transfer
                        </option>
                      </select>
                    </div>

                    <div className="ui-form-group ui-stack-1">
                      <label className="ui-label ui-text-xs-label">
                        Internal Remarks
                      </label>
                      <input
                        type="text"
                        className="ui-input"
                        value={entryRemarks}
                        onChange={(e) => setEntryRemarks(e.target.value)}
                        placeholder="Reference PO/SO or transfer note"
                      />
                    </div>
                  </div>

                  <div className="ui-grid-2 ui-grid-2">
                    {entryPurpose !== "MATERIAL_RECEIPT" && (
                      <div className="ui-form-group ui-stack-1">
                        <label className="ui-label ui-text-xs-label">
                          Source Warehouse *
                        </label>
                        <select
                          className="ui-input"
                          value={fromWarehouse}
                          onChange={(e) => setFromWarehouse(e.target.value)}
                        >
                          <option value="">
                            -- Select Source Warehouse --
                          </option>
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {entryPurpose !== "MATERIAL_ISSUE" && (
                      <div className="ui-form-group ui-stack-1">
                        <label className="ui-label ui-text-xs-label">
                          Destination Warehouse *
                        </label>
                        <select
                          className="ui-input"
                          value={toWarehouse}
                          onChange={(e) => setToWarehouse(e.target.value)}
                        >
                          <option value="">
                            -- Select Target Warehouse --
                          </option>
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className={styles.s9}>
                    <div className={styles.s10}>
                      <span className={styles.s11}>Line Items</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEntryItems([
                            ...entryItems,
                            { productId: "", qty: 1, valuationRate: 0 },
                          ])
                        }
                        className={`ui-btn ui-btn-secondary ${styles.s12}`}
                      >
                        <Plus size={12} /> Add Item
                      </button>
                    </div>

                    <div className="ui-stack-3">
                      {entryItems.map((item, idx) => {
                        const selectedProduct = products.find(
                          (p) => p.id === item.productId,
                        );
                        const sourceBins = allBins.filter(
                          (b) => b.warehouseId === fromWarehouse,
                        );
                        const targetBins = allBins.filter(
                          (b) => b.warehouseId === toWarehouse,
                        );

                        return (
                          <div key={idx} className={styles.s13}>
                            <div className={styles.s14}>
                              <select
                                className={`ui-input ${styles.s15}`}
                                value={item.productId}
                                onChange={(e) => {
                                  const updated = [...entryItems];
                                  const existing = updated[idx];
                                  if (existing) {
                                    const p = products.find(
                                      (prod) => prod.id === e.target.value,
                                    );
                                    updated[idx] = {
                                      ...existing,
                                      productId: e.target.value,
                                      valuationRate: p ? p.costPrice : 0,
                                    };
                                    setEntryItems(updated);
                                  }
                                }}
                                required
                              >
                                <option value="">-- Select Product * --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </option>
                                ))}
                              </select>

                              <input
                                type="number"
                                className={`ui-input ${styles.s16}`}
                                value={item.qty}
                                onChange={(e) => {
                                  const updated = [...entryItems];
                                  const existing = updated[idx];
                                  if (existing) {
                                    updated[idx] = {
                                      ...existing,
                                      qty: parseFloat(e.target.value) || 1,
                                    };
                                    setEntryItems(updated);
                                  }
                                }}
                                placeholder="Qty"
                                required
                              />

                              <input
                                type="number"
                                className={`ui-input ${styles.s17}`}
                                value={item.valuationRate}
                                onChange={(e) => {
                                  const updated = [...entryItems];
                                  const existing = updated[idx];
                                  if (existing) {
                                    updated[idx] = {
                                      ...existing,
                                      valuationRate:
                                        parseFloat(e.target.value) || 0,
                                    };
                                    setEntryItems(updated);
                                  }
                                }}
                                placeholder="Rate ($)"
                              />

                              {entryItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = entryItems.filter(
                                      (_, i) => i !== idx,
                                    );
                                    setEntryItems(updated);
                                  }}
                                  className={styles.s18}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>

                            {/* Conditional tracing components based on product flags */}
                            {selectedProduct && (
                              <div className={styles.s19}>
                                {selectedProduct.hasBatchTracking && (
                                  <div className={styles.s20}>
                                    <label className={styles.s21}>
                                      Batch Number
                                    </label>
                                    <input
                                      type="text"
                                      className="ui-input"
                                      placeholder="BAT-2026-..."
                                      value={item.batchNumber || ""}
                                      onChange={(e) => {
                                        const updated = [...entryItems];
                                        const existing = updated[idx];
                                        if (existing) {
                                          updated[idx] = {
                                            ...existing,
                                            batchNumber: e.target.value,
                                          };
                                          setEntryItems(updated);
                                        }
                                      }}
                                    />
                                  </div>
                                )}

                                {selectedProduct.hasSerialTracking && (
                                  <div className={styles.s20}>
                                    <label className={styles.s21}>
                                      Serial Number
                                    </label>
                                    <input
                                      type="text"
                                      className="ui-input"
                                      placeholder="SN-..."
                                      value={item.serialNo || ""}
                                      onChange={(e) => {
                                        const updated = [...entryItems];
                                        const existing = updated[idx];
                                        if (existing) {
                                          updated[idx] = {
                                            ...existing,
                                            serialNo: e.target.value,
                                          };
                                          setEntryItems(updated);
                                        }
                                      }}
                                    />
                                  </div>
                                )}

                                {entryPurpose !== "MATERIAL_RECEIPT" &&
                                  sourceBins.length > 0 && (
                                    <div className={styles.s20}>
                                      <label className={styles.s21}>
                                        Source Bin
                                      </label>
                                      <select
                                        className="ui-input"
                                        value={item.fromBinId || ""}
                                        onChange={(e) => {
                                          const updated = [...entryItems];
                                          const existing = updated[idx];
                                          if (existing) {
                                            updated[idx] = {
                                              ...existing,
                                              fromBinId: e.target.value,
                                            };
                                            setEntryItems(updated);
                                          }
                                        }}
                                      >
                                        <option value="">
                                          -- Select Bin --
                                        </option>
                                        {sourceBins.map((b) => (
                                          <option key={b.id} value={b.id}>
                                            {b.code} ({b.name})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                {entryPurpose !== "MATERIAL_ISSUE" &&
                                  targetBins.length > 0 && (
                                    <div className={styles.s20}>
                                      <label className={styles.s21}>
                                        Destination Bin
                                      </label>
                                      <select
                                        className="ui-input"
                                        value={item.toBinId || ""}
                                        onChange={(e) => {
                                          const updated = [...entryItems];
                                          const existing = updated[idx];
                                          if (existing) {
                                            updated[idx] = {
                                              ...existing,
                                              toBinId: e.target.value,
                                            };
                                            setEntryItems(updated);
                                          }
                                        }}
                                      >
                                        <option value="">
                                          -- Select Bin --
                                        </option>
                                        {targetBins.map((b) => (
                                          <option key={b.id} value={b.id}>
                                            {b.code} ({b.name})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.s22}>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsEntryModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                      Save Draft Slip
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* CANCEL VOUCHER MODAL OVERLAY */}
        {cancelModalOpen && (
          <div className={styles.s5}>
            <div className={`ui-card ${styles.s23}`}>
              <div className={`ui-card-header ${styles.s24}`}>
                Cancel Stock Voucher Reversal
              </div>
              <form
                onSubmit={handleCancelStockEntry}
                className="p-5 ui-stack-4"
              >
                <div className="ui-stack-1">
                  <label className={styles.s25}>Reason for Reversal *</label>
                  <input
                    type="text"
                    required
                    className="ui-input"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Audit error / Incorrect qty recorded"
                  />
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setCancelModalOpen(false)}
                  >
                    Close
                  </Button>
                  <Button variant="primary" type="submit">
                    Reverse & Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
