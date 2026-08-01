"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, PageHeader, Button, Badge, Input } from "@unerp/ui";
import {
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  ScanLine,
  X,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { Package as InventoryModuleIcon } from "lucide-react";
interface PickWaveItem {
  id: string;
  productId: string;
  quantity: number | string;
  pickedQty: number | string;
  status: string;
  product?: { name: string; sku?: string };
  binLocation?: { code: string };
}

interface PickWave {
  id: string;
  waveNumber: string;
  status: string;
  items: PickWaveItem[];
}

/** Mobile-optimized, scan-first pick/pack flow: one item at a time, large touch targets,
 * keyboard-wedge barcode scanner input (auto-submits on Enter, the standard scanner behavior). */
export default function MobilePickPage() {
  const client = useApiClient();
  const [waves, setWaves] = useState<PickWave[]>([]);
  const [activeWave, setActiveWave] = useState<PickWave | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemIndex, setItemIndex] = useState(0);
  const [qty, setQty] = useState(0);
  const [scanValue, setScanValue] = useState("");
  const [scannedSerials, setScannedSerials] = useState<string[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const loadWaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.get<unknown>(
        "/inventory/pick-waves?status=PICKING",
      );
      const list = Array.isArray(data)
        ? (data as PickWave[])
        : ((data as { data?: PickWave[] })?.data ?? []);
      setWaves(
        list.filter((w) => w.status === "PICKING" || w.status === "OPEN"),
      );
    } catch {
      setError("Serving local mock fallback registry.");
      setWaves([
        {
          id: "wave-1",
          waveNumber: "WAVE-2026-00001",
          status: "PICKING",
          items: [
            {
              id: "wi-1",
              productId: "p1",
              quantity: 10,
              pickedQty: 0,
              status: "PENDING",
              product: {
                name: "Refined Vibranium Alloy Ingot",
                sku: "RVA-001",
              },
              binLocation: { code: "A-01-03" },
            },
            {
              id: "wi-2",
              productId: "p2",
              quantity: 4,
              pickedQty: 0,
              status: "PENDING",
              product: { name: "Carbon Fiber Housing", sku: "CFH-020" },
              binLocation: { code: "A-02-01" },
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadWaves();
  }, [loadWaves]);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, [itemIndex, activeWave]);

  const pendingItems = activeWave
    ? activeWave.items.filter((i) => i.status !== "PICKED")
    : [];
  const currentItem = pendingItems[itemIndex];
  const pickedCount = activeWave
    ? activeWave.items.length - pendingItems.length
    : 0;
  const totalCount = activeWave?.items.length ?? 0;
  const progressPct =
    totalCount > 0 ? Math.round((pickedCount / totalCount) * 100) : 0;

  const openWave = async (wave: PickWave) => {
    try {
      const full = await client.get<PickWave>(
        `/inventory/pick-waves/${wave.id}`,
      );
      setActiveWave(full);
    } catch {
      setActiveWave(wave);
    }
    setItemIndex(0);
    setScanError(null);
  };

  useEffect(() => {
    if (currentItem) {
      setQty(Number(currentItem.quantity));
      setScannedSerials([]);
      setScanValue("");
      setScanError(null);
    }
  }, [currentItem?.id]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;
    if (!currentItem) return;
    const expectedSku = currentItem.product?.sku;
    if (
      expectedSku &&
      code.toUpperCase() !== expectedSku.toUpperCase() &&
      !scannedSerials.includes(code)
    ) {
      // Treat as a serial scan when it doesn't match the product SKU directly.
      if (!scannedSerials.includes(code))
        setScannedSerials((prev) => [...prev, code]);
    }
    setScanValue("");
    setScanError(null);
  };

  const confirmPick = async () => {
    if (!currentItem || !activeWave) return;
    setSubmitting(true);
    setScanError(null);
    try {
      await client.post(
        `/inventory/pick-waves/items/${currentItem.id}/record-pick`,
        {
          pickedQty: qty,
          scannedSerials,
        },
      );
      const refreshed = await client.get<PickWave>(
        `/inventory/pick-waves/${activeWave.id}`,
      );
      setActiveWave(refreshed);
      setItemIndex(0);
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : "Could not record this pick — check the scanned serials and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const skipItem = () => {
    if (itemIndex < pendingItems.length - 1) setItemIndex(itemIndex + 1);
  };

  const completeWave = async () => {
    if (!activeWave) return;
    setSubmitting(true);
    try {
      await client.post(`/inventory/pick-waves/${activeWave.id}/complete`, {});
      setActiveWave(null);
      loadWaves();
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : "Could not complete the wave — all items must be fully picked.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RouteGuard permission="inventory.stock.read">
      <div className={`ui-stack-5 ui-animate-in ${styles.wrap}`}>
        <PageHeader
          title="Mobile Scan Pick"
          description="Scan-first, one-item-at-a-time picking for handheld/mobile devices."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Inventory", href: "/inventory" },
            { label: "Mobile Scan Pick" },
          ]}
        />

        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>Note: {error}</span>
          </div>
        )}

        {!activeWave ? (
          <div className={styles.waveList}>
            {loading && <Card className="p-5">Loading waves…</Card>}
            {!loading && waves.length === 0 && (
              <Card className="p-5">No waves in PICKING status right now.</Card>
            )}
            {waves.map((w) => (
              <button
                key={w.id}
                className={styles.waveBtn}
                onClick={() => openWave(w)}
              >
                <span className="ui-hstack-2">
                  <ScanLine size={20} />
                  {w.waveNumber}
                </span>
                <Badge variant={w.status === "PICKING" ? "warning" : "default"}>
                  {w.status}
                </Badge>
              </button>
            ))}
          </div>
        ) : pendingItems.length === 0 ? (
          <Card className={styles.doneWrap}>
            <CheckCircle2 size={48} color="var(--color-success)" />
            <div className="ui-heading-base">All items picked</div>
            <div className={styles.itemMeta}>
              {activeWave.waveNumber} is ready to pack.
            </div>
            {scanError && (
              <div className={styles.errorBanner}>
                <AlertCircle size={16} />
                {scanError}
              </div>
            )}
            <div className={styles.actionRow} style={{ width: "100%" }}>
              <Button
                variant="primary"
                size="lg"
                className={styles.bigBtn}
                disabled={submitting}
                onClick={completeWave}
              >
                <PackageCheck size={18} /> Complete &amp; Pack Wave
              </Button>
              <Button
                variant="outline"
                className={styles.bigBtn}
                onClick={() => setActiveWave(null)}
              >
                Back to waves
              </Button>
            </div>
          </Card>
        ) : (
          <div className="ui-stack-4">
            <div className={styles.header}>
              <span className={styles.itemMeta}>{activeWave.waveNumber}</span>
              <button
                className="ui-btn-icon ui-text-muted"
                onClick={() => setActiveWave(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className={styles.progressLabel}>
                {pickedCount} of {totalCount} picked
              </div>
            </div>

            <Card className={styles.itemCard}>
              <div>
                <div className={styles.itemName}>
                  {currentItem?.product?.name ?? currentItem?.productId}
                </div>
                <div className={styles.itemMeta}>
                  SKU {currentItem?.product?.sku ?? "—"}
                </div>
              </div>
              <Badge variant="default" className={styles.binBadge}>
                Bin {currentItem?.binLocation?.code ?? "—"}
              </Badge>

              <form onSubmit={handleScanSubmit}>
                <Input
                  ref={scanInputRef}
                  className={styles.scanInput}
                  placeholder="Scan SKU or serial…"
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  autoFocus
                />
              </form>

              {scannedSerials.length > 0 && (
                <div className={styles.serialChips}>
                  {scannedSerials.map((s) => (
                    <span key={s} className={styles.serialChip}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.qtyRow}>
                <button
                  type="button"
                  className={`ui-btn ui-btn-outline ${styles.qtyBtn}`}
                  onClick={() => setQty(Math.max(0, qty - 1))}
                >
                  −
                </button>
                <span className={styles.qtyValue}>{qty}</span>
                <button
                  type="button"
                  className={`ui-btn ui-btn-outline ${styles.qtyBtn}`}
                  onClick={() => setQty(qty + 1)}
                >
                  +
                </button>
              </div>
              <div className={styles.itemMeta} style={{ textAlign: "center" }}>
                of {String(currentItem?.quantity)} expected
              </div>

              {scanError && (
                <div className={styles.errorBanner}>
                  <AlertCircle size={16} />
                  {scanError}
                </div>
              )}

              <div className={styles.actionRow}>
                <Button
                  variant="primary"
                  size="lg"
                  className={styles.bigBtn}
                  disabled={submitting}
                  onClick={confirmPick}
                >
                  <CheckCircle2 size={18} /> Confirm Pick
                </Button>
                {pendingItems.length > 1 && (
                  <Button
                    variant="outline"
                    className={styles.bigBtn}
                    onClick={skipItem}
                  >
                    Skip for now
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
