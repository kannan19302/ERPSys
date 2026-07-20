"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, PageHeader, DataTable, Tabs, Spinner, Modal, TextField, FormField, Select, Button } from "@unerp/ui";
import {
  ShieldCheck,
  Database,
  Shield,
  FileText,
  Plus,
  RefreshCw,
  Play,
  CheckCircle,
  ChevronRight,
  Trash2,
  Award,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

/* ── Types ───────────────────────────────────────── */
interface ComplianceCheck { name: string; passed: boolean; score: number; maxScore: number; details: string; }
interface ComplianceReport { id: string; generatedBy: string; generatedAt: string; score: number; status: string; checks: ComplianceCheck[]; }
interface RetentionPolicy { id: string; entityType: string; retentionDays: number; action: string; isActive: boolean; }
interface ErasureRequest { id: string; requestedBy: string; subjectEmail: string; subjectName: string | null; status: string; entityTypes: string[]; erasedAt: string | null; createdAt: string; }
interface Certification { id: string; standard: string; status: string; requestedAt?: string; }

const ENTITY_TYPES = ["Customer", "Vendor", "Contact", "Lead", "User", "Organization", "Employee"];

const TAB_KEYS = ["reports", "data-retention", "erasure", "certifications"] as const;
type TabKey = (typeof TAB_KEYS)[number];
function isTabKey(v: string | null): v is TabKey { return !!v && (TAB_KEYS as readonly string[]).includes(v); }

/* ── Reports Tab ─────────────────────────────────── */
function ReportsTab() {
  const client = useApiClient();
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [selected, setSelected] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async (selectFirst = false) => {
    setLoading(true);
    try {
      const data = await client.get<ComplianceReport[]>("/saas-portal/gdpr-compliance/reports");
      setReports(data || []);
      if (data?.length && (selectFirst || !selected)) setSelected(data[0] ?? null);
    } catch { /* handled via empty state */ }
    finally { setLoading(false); }
  }, [client, selected]);

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    setGenerating(true);
    try {
      const rep = await client.post<ComplianceReport>("/saas-portal/gdpr-compliance/reports/generate", { type: "custom" });
      setSelected(rep);
      await load(true);
    } catch { /* ignore */ }
    finally { setGenerating(false); }
  };

  const statusColor = (status: string) => status === "COMPLIANT" ? "ui-badge-success" : status === "WARNING" ? "ui-badge-warning" : "ui-badge-danger";

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <div className="ui-grid-2">
      <Card padding="lg">
        <div className="ui-flex-between ui-mb-4">
          <h3 className="ui-heading-sm">Report History</h3>
          <button className="ui-btn ui-btn-primary" onClick={generate} disabled={generating}>
            {generating ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
            {generating ? "Analyzing..." : "Run Audit"}
          </button>
        </div>
        {reports.length === 0 ? (
          <p className="ui-text-xs-muted">No compliance audits run yet.</p>
        ) : (
          <div className="ui-stack-2">
            {reports.map((r) => (
              <div key={r.id} className="ui-list-item" onClick={() => setSelected(r)} style={{ cursor: "pointer" }}>
                <div className="ui-flex-between">
                  <span className="font-semibold text-sm">Score: {r.score}%</span>
                  <span className={`ui-badge ${statusColor(r.status)}`}>{r.status}</span>
                </div>
                <div className="ui-flex-between ui-text-xs-muted">
                  <span>{new Date(r.generatedAt).toLocaleString()}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card padding="lg">
        {selected ? (
          <>
            <div className="ui-flex-between ui-mb-4">
              <div>
                <h3 className="ui-heading-sm">Security Audit Overview</h3>
                <p className="ui-text-xs-muted">Report ID: {selected.id.slice(0, 8)} &bull; {new Date(selected.generatedAt).toLocaleString()}</p>
              </div>
              <div className="ui-stat-value">{selected.score}%</div>
            </div>
            <div className="ui-stack-3">
              {selected.checks?.map((c, i) => (
                <div key={i} className="ui-kv-pair">
                  <span className="ui-hstack-2">
                    {c.passed ? <CheckCircle size={14} className="ui-text-success" /> : <Shield size={14} className="ui-text-warning" />}
                    {c.name}
                  </span>
                  <span className="ui-text-xs-muted">{c.score}/{c.maxScore} pts</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="ui-empty-state">
            <FileText size={40} className="ui-text-muted" />
            <p className="ui-text-xs-muted">Run an audit to see the report here.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Data Retention Tab ──────────────────────────── */
function DataRetentionTab() {
  const client = useApiClient();
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("AuditLog");
  const [days, setDays] = useState(180);
  const [action, setAction] = useState<"ARCHIVE" | "DELETE" | "ANONYMIZE">("ARCHIVE");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPolicies(await client.get<RetentionPolicy[]>("/saas-portal/gdpr-compliance/retention-policies") || []); }
    catch { /* keep empty */ }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post("/saas-portal/gdpr-compliance/retention-policies", { entityType, retentionDays: days, action, isActive: true });
      await load();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="ui-stack-6">
      <Card padding="lg">
        <h3 className="ui-heading-sm ui-mb-4">Create or Update Retention Window</h3>
        <form onSubmit={save} className="ui-grid-auto ui-gap-4">
          <FormField label="Entity Type">
            <Select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
              <option value="AuditLog">Audit Logs</option>
              <option value="UserSession">User Sessions</option>
              <option value="Invoice">Invoices & Finance</option>
              <option value="Activity">CRM Activity Logs</option>
            </Select>
          </FormField>
          <TextField label="Retention (days)" type="number" min={1} value={String(days)} onChange={(e) => setDays(parseInt(e.target.value, 10) || 1)} />
          <FormField label="End-of-Life Action">
            <Select value={action} onChange={(e) => setAction(e.target.value as typeof action)}>
              <option value="ARCHIVE">Archive</option>
              <option value="DELETE">Hard Delete</option>
              <option value="ANONYMIZE">Anonymize</option>
            </Select>
          </FormField>
          <div className="ui-flex-end">
            <Button variant="primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Set Policy"}</Button>
          </div>
        </form>
      </Card>
      <Card padding="lg">
        <h3 className="ui-heading-sm ui-mb-4">Configured Policies ({policies.length})</h3>
        {loading ? <Spinner size="md" /> : policies.length === 0 ? (
          <p className="ui-text-xs-muted">No custom retention policies configured.</p>
        ) : (
          <div className="ui-stack-3">
            {policies.map((p) => (
              <div key={p.id} className="ui-list-item ui-flex-between">
                <div className="ui-hstack-3">
                  <Database size={18} className="ui-text-primary" />
                  <div>
                    <div className="font-medium text-sm">{p.entityType}</div>
                    <div className="ui-text-xs-muted">Retain {p.retentionDays} days, then {p.action.toLowerCase()}</div>
                  </div>
                </div>
                <span className={`ui-badge ${p.isActive ? "ui-badge-success" : "ui-badge-neutral"}`}>{p.isActive ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── GDPR Erasure Tab ────────────────────────────── */
function ErasureTab() {
  const client = useApiClient();
  const [requests, setRequests] = useState<ErasureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [types, setTypes] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await client.get<ErasureRequest[]>("/saas-portal/gdpr-compliance/erasure-requests") || []); }
    catch { /* keep empty */ }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { void load(); }, [load]);

  const toggleType = (t: string) => setTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const create = async () => {
    if (!email || types.length === 0) return;
    try {
      await client.post("/saas-portal/gdpr-compliance/erasure-requests", { subjectEmail: email, subjectName: name || undefined, entityTypes: types });
      await load();
    } catch { /* ignore */ }
    setModalOpen(false); setEmail(""); setName(""); setTypes([]);
  };

  const execute = async (id: string) => {
    try { await client.post(`/saas-portal/gdpr-compliance/erasure-requests/${id}/execute`); await load(); }
    catch { /* ignore */ }
  };

  const statusBadge = (s: string) => s === "COMPLETED" ? "ui-badge-success" : s === "REJECTED" ? "ui-badge-danger" : "ui-badge-warning";

  return (
    <div className="ui-stack-4">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setModalOpen(true)}>New Erasure Request</Button>
      </div>
      <Card padding="lg">
        <DataTable
          columns={[
            { key: "subject", header: "Subject" },
            { key: "entityTypes", header: "Entity Types" },
            { key: "status", header: "Status" },
            { key: "createdAt", header: "Date", sortable: true },
            { key: "actions", header: "" },
          ]}
          data={requests.map((r) => ({
            ...r,
            subject: <div><div className="text-sm">{r.subjectEmail}</div>{r.subjectName && <div className="ui-text-xs-muted">{r.subjectName}</div>}</div>,
            entityTypes: r.entityTypes?.join(", "),
            status: <span className={`ui-badge ${statusBadge(r.status)}`}>{r.status}</span>,
            createdAt: new Date(r.createdAt).toLocaleDateString(),
            actions: r.status === "PENDING" ? (
              <button className="ui-table-action-btn" onClick={(e) => { e.stopPropagation(); execute(r.id); }} title="Execute">
                <Play size={12} />
              </button>
            ) : r.status === "COMPLETED" ? <CheckCircle size={14} className="ui-text-success" /> : null,
          })) as unknown as Record<string, unknown>[]}
          emptyTitle={loading ? "Loading..." : "No erasure requests"}
          emptyMessage="No GDPR erasure requests have been filed."
        />
      </Card>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New GDPR Erasure Request"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={create}>Create Request</Button></>}
      >
        <div className="ui-stack-4">
          <TextField label="Subject Email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" />
          <TextField label="Subject Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
          <FormField label="Entity Types">
            <div className="ui-grid-auto">
              {ENTITY_TYPES.map((t) => (
                <label key={t} className="ui-hstack-2">
                  <input type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} />
                  <span className="text-sm">{t}</span>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

/* ── Certifications / HIPAA / DPA Tab ────────────── */
function CertificationsTab() {
  const client = useApiClient();
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [standard, setStandard] = useState<"soc2" | "hipaa" | "gdpr" | "iso27001">("soc2");
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCerts(await client.get<Certification[]>("/saas-portal/gdpr-compliance/certifications") || []); }
    catch { /* keep empty */ }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { void load(); }, [load]);

  const request = async () => {
    setRequesting(true);
    try { await client.post("/saas-portal/gdpr-compliance/certifications", { standard }); await load(); }
    catch { /* ignore */ }
    finally { setRequesting(false); }
  };

  return (
    <div className="ui-stack-6">
      <Card padding="lg">
        <h3 className="ui-heading-sm ui-mb-4">Request Certification</h3>
        <div className="ui-hstack-3">
          <Select value={standard} onChange={(e) => setStandard(e.target.value as typeof standard)}>
            <option value="soc2">SOC 2</option>
            <option value="hipaa">HIPAA</option>
            <option value="gdpr">GDPR</option>
            <option value="iso27001">ISO 27001</option>
          </Select>
          <Button variant="primary" onClick={request} disabled={requesting}>{requesting ? "Requesting..." : "Request"}</Button>
        </div>
      </Card>
      <Card padding="lg">
        <h3 className="ui-heading-sm ui-mb-4">Certifications</h3>
        {loading ? <Spinner size="md" /> : certs.length === 0 ? (
          <p className="ui-text-xs-muted">No certifications requested yet.</p>
        ) : (
          <div className="ui-stack-2">
            {certs.map((c) => (
              <div key={c.id} className="ui-list-item ui-flex-between">
                <span className="ui-hstack-2"><Award size={16} className="ui-text-primary" /> {c.standard.toUpperCase()}</span>
                <span className="ui-badge ui-badge-info">{c.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Page ────────────────────────────────────────── */
function CompliancePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get("tab")) ? (searchParams.get("tab") as TabKey) : "reports";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([initialTab]));

  const handleChange = (key: string) => {
    if (!isTabKey(key)) return;
    setActiveTab(key);
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    router.replace(`/saas/compliance?tab=${key}`, { scroll: false });
  };

  return (
    <RouteGuard permission="saas.compliance.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Compliance & Data Governance"
          description="GDPR erasure, data retention, compliance reports, and certifications."
          breadcrumbs={[{ label: "SaaS", href: "/saas/portal" }, { label: "Compliance" }]}
        />

        <Tabs
          tabs={[
            { key: "reports", label: "Compliance Reports", icon: <ShieldCheck size={14} /> },
            { key: "data-retention", label: "Data Retention", icon: <Database size={14} /> },
            { key: "erasure", label: "GDPR Erasure", icon: <Shield size={14} /> },
            { key: "certifications", label: "Certifications", icon: <Award size={14} /> },
          ]}
          value={activeTab}
          onChange={handleChange}
        />

        <div style={{ display: activeTab === "reports" ? "block" : "none" }}>{visited.has("reports") && <ReportsTab />}</div>
        <div style={{ display: activeTab === "data-retention" ? "block" : "none" }}>{visited.has("data-retention") && <DataRetentionTab />}</div>
        <div style={{ display: activeTab === "erasure" ? "block" : "none" }}>{visited.has("erasure") && <ErasureTab />}</div>
        <div style={{ display: activeTab === "certifications" ? "block" : "none" }}>{visited.has("certifications") && <CertificationsTab />}</div>
      </div>
    </RouteGuard>
  );
}

export default function SaasCompliancePage() {
  return (
    <Suspense fallback={<div className="ui-center-pad"><Spinner size="lg" /></div>}>
      <CompliancePageContent />
    </Suspense>
  );
}
