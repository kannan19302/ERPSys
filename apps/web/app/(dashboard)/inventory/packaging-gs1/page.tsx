"use client";
import styles from "./page.module.css";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
interface Dashboard {
  activePackagingSpecs: number;
  activeBarcodes: number;
  labelTemplates: number;
  sscc: { total: number; used: number; available: number };
  gs1Ais: number;
}

interface PackagingSpec {
  id: string;
  productId: string;
  level: string;
  unitsPerLevel: number;
  grossWeightKg?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  active: boolean;
  barcodes: {
    id: string;
    barcodeValue: string;
    symbology: string;
    isPrimary: boolean;
  }[];
}

interface LabelTemplate {
  id: string;
  name: string;
  templateType: string;
  widthMm: number;
  heightMm: number;
  active: boolean;
}

interface SsccRecord {
  id: string;
  sscc: string;
  gs1CompanyPrefix: string;
  allocatedAt: string;
  usedAt?: string;
  shipmentRef?: string;
}

const BASE = "/api/inventory/packaging-gs1";

const LEVEL_COLORS: Record<string, string> = {
  EACH: "bg-gray-100 text-gray-700",
  INNER: "bg-blue-100 text-blue-700",
  CASE: "bg-purple-100 text-purple-700",
  MASTER_CARTON: "bg-orange-100 text-orange-700",
  PALLET: "bg-green-100 text-green-700",
};

const TYPE_COLORS: Record<string, string> = {
  ITEM: "bg-gray-100 text-gray-700",
  INNER: "bg-blue-100 text-blue-700",
  CASE: "bg-purple-100 text-purple-700",
  PALLET: "bg-green-100 text-green-700",
  SHIPPING: "bg-cyan-100 text-cyan-700",
  COMPLIANCE: "bg-red-100 text-red-700",
};

export default function PackagingGs1Page() {
  const client = useApiClient();
  const [tab, setTab] = useState<
    "dashboard" | "specs" | "barcodes" | "labels" | "sscc"
  >("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [specs, setSpecs] = useState<PackagingSpec[]>([]);
  const [barcodes, setBarcodes] = useState<
    {
      id: string;
      barcodeValue: string;
      symbology: string;
      isPrimary: boolean;
      packagingSpecId: string;
    }[]
  >([]);
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [ssccRecords, setSsccRecords] = useState<SsccRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiFetch = useCallback(
    <T,>(path: string, opts?: RequestInit) =>
      client.request<T>(path.replace("/api", ""), {
        method: opts?.method,
        body: opts?.body ? String(opts.body) : undefined,
      }),
    [client],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "dashboard")
        setDashboard(await apiFetch<Dashboard>(`${BASE}/dashboard`));
      else if (tab === "specs")
        setSpecs(await apiFetch<PackagingSpec[]>(`${BASE}/specs?productId=`));
      else if (tab === "barcodes")
        setBarcodes(await apiFetch<typeof barcodes>(`${BASE}/barcodes`));
      else if (tab === "labels")
        setTemplates(
          await apiFetch<LabelTemplate[]>(`${BASE}/label-templates`),
        );
      else if (tab === "sscc")
        setSsccRecords(await apiFetch<SsccRecord[]>(`${BASE}/sscc`));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tab, apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const seedGs1Ais = async () => {
    await apiFetch(`${BASE}/gs1-ais/seed-standard`, { method: "POST" });
    load();
  };

  const TABS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "specs", label: "Packaging Specs" },
    { key: "barcodes", label: "Barcodes" },
    { key: "labels", label: "Label Templates" },
    { key: "sscc", label: "SSCC Registry" },
  ] as const;

  return (
    <RouteGuard permission="inventory.packaging-gs1.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Manage inventory operations for this workspace."
      >
        <div className="ui-page-shell">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Packaging Specifications & GS1
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Item packaging hierarchy, GTIN/EAN/UPC barcodes, GS1 standards,
              label templates, and SSCC management
            </p>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex gap-4 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`pb-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    tab === t.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Dashboard */}
          {tab === "dashboard" && dashboard && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  {
                    label: "Packaging Specs",
                    value: dashboard.activePackagingSpecs,
                  },
                  { label: "Active Barcodes", value: dashboard.activeBarcodes },
                  { label: "Label Templates", value: dashboard.labelTemplates },
                  { label: "SSCC Available", value: dashboard.sscc.available },
                  { label: "GS1 App Identifiers", value: dashboard.gs1Ais },
                ].map((c) => (
                  <div key={c.label} className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {c.value}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">GS1 Setup</h3>
                  <button
                    onClick={seedGs1Ais}
                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Seed Standard GS1 AIs
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{dashboard.sscc.total}</span>{" "}
                    <span className="text-gray-500">SSCC allocated</span>
                  </div>
                  <div>
                    <span className="font-medium">{dashboard.sscc.used}</span>{" "}
                    <span className="text-gray-500">used</span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {dashboard.sscc.available}
                    </span>{" "}
                    <span className="text-gray-500">available</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Packaging Specs */}
          {tab === "specs" && (
            <ListPageTemplate
              columns={
                [
                  {
                    key: "productId",
                    header: "Product",
                    render: (v) => (
                      <span className="font-mono text-xs">
                        {String(v).slice(-8)}
                      </span>
                    ),
                  },
                  {
                    key: "level",
                    header: "Level",
                    render: (v) => (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLORS[String(v)] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {String(v)}
                      </span>
                    ),
                  },
                  {
                    key: "unitsPerLevel",
                    header: "Units/Level",
                    render: (v) => <strong>{String(v)}</strong>,
                  },
                  {
                    key: "lengthMm",
                    header: "Dimensions",
                    render: (v, row) =>
                      v ? `${v}×${row.widthMm}×${row.heightMm}` : "—",
                  },
                  {
                    key: "grossWeightKg",
                    header: "Weight",
                    render: (v) => (v ? `${Number(v).toFixed(3)} kg` : "—"),
                  },
                  {
                    key: "barcodes",
                    header: "Barcodes",
                    render: (v) => String((v as any)?.length ?? 0),
                  },
                ] as ListColumn[]
              }
              data={specs as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No packaging specs defined"
              emptyDescription="No packaging specifications found."
            />
          )}

          {/* Barcodes */}
          {tab === "barcodes" && (
            <ListPageTemplate
              columns={
                [
                  {
                    key: "barcodeValue",
                    header: "Barcode Value",
                    render: (v) => (
                      <span className="font-mono">{String(v)}</span>
                    ),
                  },
                  {
                    key: "symbology",
                    header: "Symbology",
                    render: (v) => (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                        {String(v)}
                      </span>
                    ),
                  },
                  {
                    key: "isPrimary",
                    header: "Primary",
                    render: (v) =>
                      v ? (
                        <span className="text-green-600 font-medium">✓</span>
                      ) : (
                        "—"
                      ),
                  },
                  {
                    key: "packagingSpecId",
                    header: "Spec",
                    render: (v) => (
                      <span className={styles.s1}>
                        {String(v ?? "").slice(-8)}
                      </span>
                    ),
                  },
                ] as ListColumn[]
              }
              data={barcodes as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No barcodes registered"
              emptyDescription="No barcodes have been registered."
            />
          )}

          {/* Label Templates */}
          {tab === "labels" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
                <div key={t.id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {t.name}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[t.templateType] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {t.templateType}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${t.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {t.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {Number(t.widthMm).toFixed(0)} ×{" "}
                    {Number(t.heightMm).toFixed(0)} mm
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-400">
                  No label templates defined
                </div>
              )}
            </div>
          )}

          {/* SSCC Registry */}
          {tab === "sscc" && (
            <ListPageTemplate
              columns={
                [
                  {
                    key: "sscc",
                    header: "SSCC",
                    render: (v) => (
                      <span className="font-mono text-xs">{String(v)}</span>
                    ),
                  },
                  { key: "gs1CompanyPrefix", header: "Company Prefix" },
                  {
                    key: "allocatedAt",
                    header: "Allocated",
                    render: (v) => new Date(String(v)).toLocaleDateString(),
                  },
                  {
                    key: "usedAt",
                    header: "Used",
                    render: (v) =>
                      v ? (
                        <span className="text-green-600 text-xs">
                          {new Date(String(v)).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Available</span>
                      ),
                  },
                  {
                    key: "shipmentRef",
                    header: "Shipment Ref",
                    render: (v) => String(v ?? "—"),
                  },
                ] as ListColumn[]
              }
              data={ssccRecords as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No SSCC records allocated"
              emptyDescription="No SSCC records have been allocated."
            />
          )}
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
