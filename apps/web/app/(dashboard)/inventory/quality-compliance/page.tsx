'use client';

import { useState, useEffect } from 'react';

type Tab = 'dashboard' | 'capas' | 'calibrations' | 'deviations' | 'sops';

const API = '/api';
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    OPEN: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    PENDING_VERIFICATION: 'bg-purple-100 text-purple-800',
    CLOSED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-500',
    DUE: 'bg-orange-100 text-orange-800',
    OVERDUE: 'bg-red-100 text-red-800',
    PASSED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    UNDER_REVIEW: 'bg-indigo-100 text-indigo-800',
    DRAFT: 'bg-gray-100 text-gray-600',
    APPROVED: 'bg-green-100 text-green-800',
    OBSOLETE: 'bg-gray-200 text-gray-500',
    SUPERSEDED: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function severityBadge(severity: string) {
  const colors: Record<string, string> = {
    MINOR: 'bg-blue-50 text-blue-700',
    MAJOR: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[severity] ?? 'bg-gray-100 text-gray-600'}`}>
      {severity}
    </span>
  );
}

function StatCard({ label, value, sub, warn }: { label: string; value: number | string; sub?: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${warn && Number(value) > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${warn && Number(value) > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

interface ComplianceDashboard {
  capa: { open: number; inProgress: number; pendingVerification: number; closed: number; overdue: number };
  calibration: { due: number; inProgress: number; passed: number; failed: number; overdue: number };
  deviations: { open: number; underReview: number; closed: number; bySeverity: { critical: number; major: number; minor: number } };
  sops: { approved: number; overdueReviews: number; expiringSoon: number };
}

function DashboardTab() {
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ComplianceDashboard>('/inventory/quality-compliance/dashboard')
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;
  if (!data) return <p className="text-sm text-red-500 p-4">Failed to load compliance dashboard.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">CAPA Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Open" value={data.capa.open} />
          <StatCard label="In Progress" value={data.capa.inProgress} />
          <StatCard label="Pending Verification" value={data.capa.pendingVerification} />
          <StatCard label="Closed" value={data.capa.closed} />
          <StatCard label="Overdue" value={data.capa.overdue} warn />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Calibration Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Due" value={data.calibration.due} />
          <StatCard label="In Progress" value={data.calibration.inProgress} />
          <StatCard label="Passed" value={data.calibration.passed} />
          <StatCard label="Failed" value={data.calibration.failed} warn />
          <StatCard label="Overdue" value={data.calibration.overdue} warn />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Deviations Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Open" value={data.deviations.open} />
          <StatCard label="Under Review" value={data.deviations.underReview} />
          <StatCard label="Critical" value={data.deviations.bySeverity.critical} warn />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">SOP Documents</h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Approved" value={data.sops.approved} />
          <StatCard label="Overdue Reviews" value={data.sops.overdueReviews} warn />
          <StatCard label="Expiring (30d)" value={data.sops.expiringSoon} warn />
        </div>
      </div>
    </div>
  );
}

interface CapaRecord {
  id: string; capaNumber: string; title: string; type: string; priority: string;
  status: string; dueDate?: string; assignedTo?: string;
  actions: { id: string; actionType: string; status: string; description: string }[];
}

function CapasTab() {
  const [capas, setCapas] = useState<CapaRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<CapaRecord[]>('/inventory/quality-compliance/capas').then(setCapas).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  const priorityColor: Record<string, string> = {
    LOW: 'text-gray-400', MEDIUM: 'text-blue-600', HIGH: 'text-orange-600', CRITICAL: 'text-red-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {['CAPA #', 'Title', 'Type', 'Priority', 'Status', 'Actions Done', 'Due Date'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {capas.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No CAPA records found.</td></tr>
          )}
          {capas.map(c => {
            const done = c.actions.filter(a => a.status === 'COMPLETE').length;
            return (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{c.capaNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate">{c.title}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{c.type}</td>
                <td className="px-4 py-3 text-xs font-semibold">
                  <span className={priorityColor[c.priority] ?? 'text-gray-500'}>{c.priority}</span>
                </td>
                <td className="px-4 py-3">{statusBadge(c.status)}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{done}/{c.actions.length}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface CalibrationRecord {
  id: string; instrumentName: string; serialNumber?: string; calibrationType: string;
  status: string; scheduledDate: string; nextDueDate?: string; result?: string;
}

function CalibrationsTab() {
  const [records, setRecords] = useState<CalibrationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<CalibrationRecord[]>('/inventory/quality-compliance/calibrations').then(setRecords).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {['Instrument', 'Serial #', 'Type', 'Status', 'Scheduled', 'Next Due', 'Result'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {records.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No calibration records found.</td></tr>
          )}
          {records.map(r => (
            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{r.instrumentName}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{r.serialNumber ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{r.calibrationType}</td>
              <td className="px-4 py-3">{statusBadge(r.status)}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{new Date(r.scheduledDate).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.result ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DeviationRecord {
  id: string; deviationNumber: string; title: string; type: string; severity: string;
  status: string; detectedAt: string; area?: string;
}

function DeviationsTab() {
  const [records, setRecords] = useState<DeviationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DeviationRecord[]>('/inventory/quality-compliance/deviations').then(setRecords).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {['Deviation #', 'Title', 'Type', 'Severity', 'Status', 'Detected', 'Area'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {records.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No deviation records found.</td></tr>
          )}
          {records.map(r => (
            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{r.deviationNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate">{r.title}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{r.type}</td>
              <td className="px-4 py-3">{severityBadge(r.severity)}</td>
              <td className="px-4 py-3">{statusBadge(r.status)}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{new Date(r.detectedAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.area ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SopDocument {
  id: string; docNumber: string; title: string; category: string; department?: string;
  status: string; version: string; effectiveDate?: string; reviewDate?: string;
}

function SopsTab() {
  const [docs, setDocs] = useState<SopDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<SopDocument[]>('/inventory/quality-compliance/sops').then(setDocs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {['Doc #', 'Title', 'Category', 'Dept', 'Version', 'Status', 'Effective', 'Review Due'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {docs.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No SOP documents found.</td></tr>
          )}
          {docs.map(d => (
            <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{d.docNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate">{d.title}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{d.category}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{d.department ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{d.version}</td>
              <td className="px-4 py-3">{statusBadge(d.status)}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {d.effectiveDate ? new Date(d.effectiveDate).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {d.reviewDate ? new Date(d.reviewDate).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'capas', label: 'CAPA' },
  { id: 'calibrations', label: 'Calibrations' },
  { id: 'deviations', label: 'Deviations' },
  { id: 'sops', label: 'SOP Documents' },
];

export default function QualityCompliancePage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quality & Compliance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          CAPA management, instrument calibration, deviation tracking, and SOP document control
        </p>
      </div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div>
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'capas' && <CapasTab />}
        {tab === 'calibrations' && <CalibrationsTab />}
        {tab === 'deviations' && <DeviationsTab />}
        {tab === 'sops' && <SopsTab />}
      </div>
    </div>
  );
}
