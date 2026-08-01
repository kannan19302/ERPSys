"use client";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { Package as InventoryModuleIcon } from "lucide-react";
type Tab = "dashboard" | "capas" | "calibrations" | "deviations" | "sops";

function useFrameworkFetch() {
  const client = useApiClient();
  return useCallback(<T,>(path: string) => client.get<T>(path), [client]);
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    PENDING_VERIFICATION: "bg-purple-100 text-purple-800",
    CLOSED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-500",
    DUE: "bg-orange-100 text-orange-800",
    OVERDUE: "bg-red-100 text-red-800",
    PASSED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    UNDER_REVIEW: "bg-indigo-100 text-indigo-800",
    DRAFT: "bg-gray-100 text-gray-600",
    APPROVED: "bg-green-100 text-green-800",
    OBSOLETE: "bg-gray-200 text-gray-500",
    SUPERSEDED: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function severityBadge(severity: string) {
  const colors: Record<string, string> = {
    MINOR: "bg-blue-50 text-blue-700",
    MAJOR: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[severity] ?? "bg-gray-100 text-gray-600"}`}
    >
      {severity}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: number | string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${warn && Number(value) > 0 ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-semibold ${warn && Number(value) > 0 ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

interface ComplianceDashboard {
  capa: {
    open: number;
    inProgress: number;
    pendingVerification: number;
    closed: number;
    overdue: number;
  };
  calibration: {
    due: number;
    inProgress: number;
    passed: number;
    failed: number;
    overdue: number;
  };
  deviations: {
    open: number;
    underReview: number;
    closed: number;
    bySeverity: { critical: number; major: number; minor: number };
  };
  sops: { approved: number; overdueReviews: number; expiringSoon: number };
}

function DashboardTab() {
  const apiFetch = useFrameworkFetch();
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ComplianceDashboard>("/inventory/quality-compliance/dashboard")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;
  if (!data)
    return (
      <p className="text-sm text-red-500 p-4">
        Failed to load compliance dashboard.
      </p>
    );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          CAPA Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Open" value={data.capa.open} />
          <StatCard label="In Progress" value={data.capa.inProgress} />
          <StatCard
            label="Pending Verification"
            value={data.capa.pendingVerification}
          />
          <StatCard label="Closed" value={data.capa.closed} />
          <StatCard label="Overdue" value={data.capa.overdue} warn />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          Calibration Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Due" value={data.calibration.due} />
          <StatCard label="In Progress" value={data.calibration.inProgress} />
          <StatCard label="Passed" value={data.calibration.passed} />
          <StatCard label="Failed" value={data.calibration.failed} warn />
          <StatCard label="Overdue" value={data.calibration.overdue} warn />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          Deviations Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Open" value={data.deviations.open} />
          <StatCard label="Under Review" value={data.deviations.underReview} />
          <StatCard
            label="Critical"
            value={data.deviations.bySeverity.critical}
            warn
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          SOP Documents
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Approved" value={data.sops.approved} />
          <StatCard
            label="Overdue Reviews"
            value={data.sops.overdueReviews}
            warn
          />
          <StatCard
            label="Expiring (30d)"
            value={data.sops.expiringSoon}
            warn
          />
        </div>
      </div>
    </div>
  );
}

interface CapaRecord {
  id: string;
  capaNumber: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  assignedTo?: string;
  actions: {
    id: string;
    actionType: string;
    status: string;
    description: string;
  }[];
}

function CapasTab() {
  const apiFetch = useFrameworkFetch();
  const [capas, setCapas] = useState<CapaRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<CapaRecord[]>("/inventory/quality-compliance/capas")
      .then(setCapas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  const priorityColor: Record<string, string> = {
    LOW: "text-gray-400",
    MEDIUM: "text-blue-600",
    HIGH: "text-orange-600",
    CRITICAL: "text-red-600",
  };

  return (
    <ListPageTemplate
      columns={
        [
          {
            key: "capaNumber",
            header: "CAPA #",
            render: (v) => (
              <span className="font-mono text-blue-600 font-medium">
                {String(v)}
              </span>
            ),
          },
          { key: "title", header: "Title" },
          { key: "type", header: "Type" },
          {
            key: "priority",
            header: "Priority",
            render: (v) => (
              <span
                className={`font-semibold text-xs ${priorityColor[String(v)] ?? "text-gray-500"}`}
              >
                {String(v)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (v) => statusBadge(String(v)),
          },
          {
            key: "actions",
            header: "Actions Done",
            render: (v) => {
              const arr = (v as any[]) ?? [];
              return `${arr.filter((a: any) => a.status === "COMPLETE").length}/${arr.length}`;
            },
          },
          {
            key: "dueDate",
            header: "Due Date",
            render: (v) => (v ? new Date(String(v)).toLocaleDateString() : "—"),
          },
        ] as ListColumn[]
      }
      data={capas as unknown as Record<string, unknown>[]}
      loading={false}
      emptyTitle="No CAPA records found"
      emptyDescription="No CAPA records found."
    />
  );
}

interface CalibrationRecord {
  id: string;
  instrumentName: string;
  serialNumber?: string;
  calibrationType: string;
  status: string;
  scheduledDate: string;
  nextDueDate?: string;
  result?: string;
}

function CalibrationsTab() {
  const apiFetch = useFrameworkFetch();
  const [records, setRecords] = useState<CalibrationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<CalibrationRecord[]>("/inventory/quality-compliance/calibrations")
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <ListPageTemplate
      columns={
        [
          { key: "instrumentName", header: "Instrument" },
          {
            key: "serialNumber",
            header: "Serial #",
            render: (v) => String(v ?? "—"),
          },
          { key: "calibrationType", header: "Type" },
          {
            key: "status",
            header: "Status",
            render: (v) => statusBadge(String(v)),
          },
          {
            key: "scheduledDate",
            header: "Scheduled",
            render: (v) => new Date(String(v)).toLocaleDateString(),
          },
          {
            key: "nextDueDate",
            header: "Next Due",
            render: (v) => (v ? new Date(String(v)).toLocaleDateString() : "—"),
          },
          { key: "result", header: "Result", render: (v) => String(v ?? "—") },
        ] as ListColumn[]
      }
      data={records as unknown as Record<string, unknown>[]}
      loading={false}
      emptyTitle="No calibration records found"
      emptyDescription="No calibration records found."
    />
  );
}

interface DeviationRecord {
  id: string;
  deviationNumber: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  detectedAt: string;
  area?: string;
}

function DeviationsTab() {
  const apiFetch = useFrameworkFetch();
  const [records, setRecords] = useState<DeviationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DeviationRecord[]>("/inventory/quality-compliance/deviations")
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <ListPageTemplate
      columns={
        [
          {
            key: "deviationNumber",
            header: "Deviation #",
            render: (v) => (
              <span className="font-mono text-blue-600 font-medium">
                {String(v)}
              </span>
            ),
          },
          { key: "title", header: "Title" },
          { key: "type", header: "Type" },
          {
            key: "severity",
            header: "Severity",
            render: (v) => severityBadge(String(v)),
          },
          {
            key: "status",
            header: "Status",
            render: (v) => statusBadge(String(v)),
          },
          {
            key: "detectedAt",
            header: "Detected",
            render: (v) => new Date(String(v)).toLocaleDateString(),
          },
          { key: "area", header: "Area", render: (v) => String(v ?? "—") },
        ] as ListColumn[]
      }
      data={records as unknown as Record<string, unknown>[]}
      loading={false}
      emptyTitle="No deviation records found"
      emptyDescription="No deviation records found."
    />
  );
}

interface SopDocument {
  id: string;
  docNumber: string;
  title: string;
  category: string;
  department?: string;
  status: string;
  version: string;
  effectiveDate?: string;
  reviewDate?: string;
}

function SopsTab() {
  const apiFetch = useFrameworkFetch();
  const [docs, setDocs] = useState<SopDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<SopDocument[]>("/inventory/quality-compliance/sops")
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <ListPageTemplate
      columns={
        [
          {
            key: "docNumber",
            header: "Doc #",
            render: (v) => (
              <span className="font-mono text-blue-600 font-medium">
                {String(v)}
              </span>
            ),
          },
          { key: "title", header: "Title" },
          { key: "category", header: "Category" },
          {
            key: "department",
            header: "Dept",
            render: (v) => String(v ?? "—"),
          },
          { key: "version", header: "Version" },
          {
            key: "status",
            header: "Status",
            render: (v) => statusBadge(String(v)),
          },
          {
            key: "effectiveDate",
            header: "Effective",
            render: (v) => (v ? new Date(String(v)).toLocaleDateString() : "—"),
          },
          {
            key: "reviewDate",
            header: "Review Due",
            render: (v) => (v ? new Date(String(v)).toLocaleDateString() : "—"),
          },
        ] as ListColumn[]
      }
      data={docs as unknown as Record<string, unknown>[]}
      loading={false}
      emptyTitle="No SOP documents found"
      emptyDescription="No SOP documents found."
    />
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "capas", label: "CAPA" },
  { id: "calibrations", label: "Calibrations" },
  { id: "deviations", label: "Deviations" },
  { id: "sops", label: "SOP Documents" },
];

export default function QualityCompliancePage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <RouteGuard permission="inventory.quality-compliance.read">
      <div className="ui-page-shell">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quality & Compliance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            CAPA management, instrument calibration, deviation tracking, and SOP
            document control
          </p>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-1 -mb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div>
          {tab === "dashboard" && <DashboardTab />}
          {tab === "capas" && <CapasTab />}
          {tab === "calibrations" && <CalibrationsTab />}
          {tab === "deviations" && <DeviationsTab />}
          {tab === "sops" && <SopsTab />}
        </div>
      </div>
    </RouteGuard>
  );
}
