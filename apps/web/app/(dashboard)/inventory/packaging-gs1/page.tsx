'use client';

import { useState, useEffect, useCallback } from 'react';

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
  barcodes: { id: string; barcodeValue: string; symbology: string; isPrimary: boolean }[];
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

const BASE = '/api/inventory/packaging-gs1';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const LEVEL_COLORS: Record<string, string> = {
  EACH: 'bg-gray-100 text-gray-700',
  INNER: 'bg-blue-100 text-blue-700',
  CASE: 'bg-purple-100 text-purple-700',
  MASTER_CARTON: 'bg-orange-100 text-orange-700',
  PALLET: 'bg-green-100 text-green-700',
};

const TYPE_COLORS: Record<string, string> = {
  ITEM: 'bg-gray-100 text-gray-700',
  INNER: 'bg-blue-100 text-blue-700',
  CASE: 'bg-purple-100 text-purple-700',
  PALLET: 'bg-green-100 text-green-700',
  SHIPPING: 'bg-cyan-100 text-cyan-700',
  COMPLIANCE: 'bg-red-100 text-red-700',
};

export default function PackagingGs1Page() {
  const [tab, setTab] = useState<'dashboard' | 'specs' | 'barcodes' | 'labels' | 'sscc'>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [specs, setSpecs] = useState<PackagingSpec[]>([]);
  const [barcodes, setBarcodes] = useState<{ id: string; barcodeValue: string; symbology: string; isPrimary: boolean; packagingSpecId: string }[]>([]);
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [ssccRecords, setSsccRecords] = useState<SsccRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (tab === 'dashboard') setDashboard(await apiFetch(`${BASE}/dashboard`));
      else if (tab === 'specs') setSpecs(await apiFetch(`${BASE}/specs?productId=`));
      else if (tab === 'barcodes') setBarcodes(await apiFetch(`${BASE}/barcodes`));
      else if (tab === 'labels') setTemplates(await apiFetch(`${BASE}/label-templates`));
      else if (tab === 'sscc') setSsccRecords(await apiFetch(`${BASE}/sscc`));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const seedGs1Ais = async () => {
    await apiFetch(`${BASE}/gs1-ais/seed-standard`, { method: 'POST' });
    load();
  };

  const TABS = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'specs', label: 'Packaging Specs' },
    { key: 'barcodes', label: 'Barcodes' },
    { key: 'labels', label: 'Label Templates' },
    { key: 'sscc', label: 'SSCC Registry' },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Packaging Specifications & GS1</h1>
        <p className="text-sm text-gray-500 mt-1">
          Item packaging hierarchy, GTIN/EAN/UPC barcodes, GS1 standards, label templates, and SSCC management
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</div>}

      {/* Dashboard */}
      {tab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Packaging Specs', value: dashboard.activePackagingSpecs },
              { label: 'Active Barcodes', value: dashboard.activeBarcodes },
              { label: 'Label Templates', value: dashboard.labelTemplates },
              { label: 'SSCC Available', value: dashboard.sscc.available },
              { label: 'GS1 App Identifiers', value: dashboard.gs1Ais },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-lg border p-4">
                <div className="text-2xl font-bold text-gray-900">{c.value}</div>
                <div className="text-xs text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">GS1 Setup</h3>
              <button onClick={seedGs1Ais}
                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                Seed Standard GS1 AIs
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="font-medium">{dashboard.sscc.total}</span> <span className="text-gray-500">SSCC allocated</span></div>
              <div><span className="font-medium">{dashboard.sscc.used}</span> <span className="text-gray-500">used</span></div>
              <div><span className="font-medium">{dashboard.sscc.available}</span> <span className="text-gray-500">available</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Packaging Specs */}
      {tab === 'specs' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Product', 'Level', 'Units/Level', 'Dimensions', 'Weight', 'Barcodes'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {specs.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.productId.slice(-8)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLORS[s.level] ?? 'bg-gray-100 text-gray-700'}`}>{s.level}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{s.unitsPerLevel}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {s.lengthMm ? `${s.lengthMm}×${s.widthMm}×${s.heightMm}` : '—'}
                  </td>
                  <td className="px-4 py-3">{s.grossWeightKg ? `${Number(s.grossWeightKg).toFixed(3)} kg` : '—'}</td>
                  <td className="px-4 py-3">{s.barcodes?.length ?? 0}</td>
                </tr>
              ))}
              {specs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No packaging specs defined</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Barcodes */}
      {tab === 'barcodes' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Barcode Value', 'Symbology', 'Primary', 'Spec'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {barcodes.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{b.barcodeValue}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{b.symbology}</span>
                  </td>
                  <td className="px-4 py-3">{b.isPrimary ? <span className="text-green-600 font-medium">✓</span> : '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{b.packagingSpecId?.slice(-8)}</td>
                </tr>
              ))}
              {barcodes.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No barcodes registered</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Label Templates */}
      {tab === 'labels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{t.name}</div>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[t.templateType] ?? 'bg-gray-100 text-gray-700'}`}>{t.templateType}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {t.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {Number(t.widthMm).toFixed(0)} × {Number(t.heightMm).toFixed(0)} mm
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">No label templates defined</div>
          )}
        </div>
      )}

      {/* SSCC Registry */}
      {tab === 'sscc' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['SSCC', 'Company Prefix', 'Allocated', 'Used', 'Shipment Ref'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {ssccRecords.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.sscc}</td>
                  <td className="px-4 py-3 text-gray-500">{r.gs1CompanyPrefix}</td>
                  <td className="px-4 py-3 text-xs">{new Date(r.allocatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {r.usedAt
                      ? <span className="text-green-600 text-xs">{new Date(r.usedAt).toLocaleDateString()}</span>
                      : <span className="text-gray-400 text-xs">Available</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.shipmentRef ?? '—'}</td>
                </tr>
              ))}
              {ssccRecords.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No SSCC records allocated</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
