'use client';
import styles from './page.module.css';
export const dynamic = 'force-dynamic';

import React, { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, ArrowLeft, ShieldCheck, FileSearch, Pill, Stethoscope,
  BarChart3, Network, Loader2, AlertTriangle, CheckCircle2, XCircle, Search,
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

type TabId = 'eligibility' | 'scrubber' | 'interactions' | 'cds' | 'quality' | 'fhir';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'eligibility', label: 'Eligibility', icon: <ShieldCheck size={16} /> },
  { id: 'scrubber', label: 'Claim Scrubber', icon: <FileSearch size={16} /> },
  { id: 'interactions', label: 'Drug Interactions', icon: <Pill size={16} /> },
  { id: 'cds', label: 'Decision Support', icon: <Stethoscope size={16} /> },
  { id: 'quality', label: 'Quality Measures', icon: <BarChart3 size={16} /> },
  { id: 'fhir', label: 'FHIR API', icon: <Network size={16} /> },
];

const SIDE_INFO: Record<TabId, { title: string; body: string }> = {
  eligibility: { title: 'Eligibility (270/271)', body: 'Checks the patient’s active coverage on file and returns payer, member ID, copay and deductible — the same data an X12 271 response would carry.' },
  scrubber: { title: 'Claim Scrubbing', body: 'Rule-based edits validate diagnosis (ICD-10), procedure (CPT), payer and charge amount before submission, flagging errors that would cause denials.' },
  interactions: { title: 'Drug Interactions', body: 'Cross-checks a medication list (plus the patient’s active meds) against the interaction reference set, surfacing major/moderate conflicts.' },
  cds: { title: 'Clinical Decision Support', body: 'Evaluates allergies, active problems and critical labs against a proposed order to raise real-time safety and care-gap alerts.' },
  quality: { title: 'Quality Measures', body: 'HEDIS/MIPS-style measures (HbA1c testing & control, immunization rates) computed live from the tenant’s clinical records.' },
  fhir: { title: 'FHIR R4 Interop', body: 'Read-only FHIR projections expose Patient and Observation resources as searchset Bundles for downstream interoperability.' },
};

export default function ClinicalToolsPage() {
  const params = useParams();
  const moduleSlug = params.module as string;
  const [tab, setTab] = useState<TabId>('eligibility');

  // Only meaningful for the healthcare app
  if (moduleSlug !== 'healthcare') {
    return (
      <div className={styles.s1}>
        <h2 className={styles.s2}>Clinical Tools unavailable</h2>
        <p className="ui-text-muted">This workspace is only available for the Healthcare app.</p>
        <Link href={`/app/${moduleSlug}`} className="ui-text-primary">← Back to app</Link>
      </div>
    );
  }

  const info = SIDE_INFO[tab];

  return (
    <RouteGuard permission="healthcare.clinical.read">
    <div className={styles.s3}>
      {/* Header */}
      <div className={styles.s4}>
        <div className={styles.s5}>
          <Link href={`/app/${moduleSlug}`} className={styles.s34}><ArrowLeft size={18} /></Link>
          <div>
            <h1 className={styles.s6}>
              <Activity className="ui-text-primary" /> Clinical Tools
            </h1>
            <p className={styles.s7}>
              Smart clinical &amp; revenue-cycle services — eligibility, claim scrubbing, drug-interaction &amp; decision support, quality measures and FHIR.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.s8}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent', color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s9}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Grid content */}
      <div className={styles.s10}>
        <div className="ui-card p-5">
          {tab === 'eligibility' && <EligibilityTool />}
          {tab === 'scrubber' && <ScrubberTool />}
          {tab === 'interactions' && <InteractionsTool />}
          {tab === 'cds' && <CdsTool />}
          {tab === 'quality' && <QualityTool />}
          {tab === 'fhir' && <FhirTool />}
        </div>

        {/* Side panel */}
        <div className={styles.s11}>
          <h3 className={styles.s12}>
            <Activity size={16} className="ui-text-primary" /> {info.title}
          </h3>
          <p className={styles.s13}>{info.body}</p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} }`}</style>
    </div>
    </RouteGuard>
  );
}

// ── Shared primitives ──
const inputStyle: React.CSSProperties = {
  width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)',
};
const labelStyle: React.CSSProperties = { fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

function RunButton({ onClick, loading, children }: { onClick: () => void; loading: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }} className={styles.s14}>
      {loading ? <Loader2 size={16} className={styles.s33} /> : <Search size={16} />} {children}
    </button>
  );
}

function severityColor(sev: string): string {
  const s = sev.toLowerCase();
  if (s === 'error' || s === 'high' || s === 'major' || s === 'critical') return 'var(--color-danger)';
  if (s === 'warning' || s === 'moderate' || s === 'warn') return 'var(--color-warning)';
  return 'var(--color-primary)';
}

function useApi() {
  const client = useApiClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const call = useCallback(async (method: 'GET' | 'POST', path: string, body?: any) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await client.request<unknown>(`/ext/healthcare${path}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      setResult(data);
    } catch {
      setError('Network error — is the API running?');
    } finally { setLoading(false); }
  }, [client]);
  return { loading, result, error, call };
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className={styles.s15}>
      <AlertTriangle size={16} className="ui-text-danger" /> {error}
    </div>
  );
}

// ── Eligibility ──
function EligibilityTool() {
  const [mrn, setMrn] = useState('MRN1002');
  const { loading, result, error, call } = useApi();
  return (
    <div className="ui-stack-4">
      <Field label="Patient MRN"><input style={inputStyle} value={mrn} onChange={e => setMrn(e.target.value)} placeholder="MRN1002" /></Field>
      <RunButton loading={loading} onClick={() => call('POST', '/eligibility/check', { patient_mrn: mrn })}>Check Eligibility</RunButton>
      <ErrorNote error={error} />
      {result && (
        <div className="ui-stack-3">
          <div style={{ color: result.eligible ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s16}>
            {result.eligible ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.eligible ? 'Active coverage found' : (result.message || 'Not eligible')}
          </div>
          {result.eligible && (
            <div className={styles.s17}>
              <Stat label="Payer" value={result.payer} />
              <Stat label="Member ID" value={result.member_id} />
              <Stat label="Group" value={result.plan?.group} />
              <Stat label="Copay" value={`$${result.plan?.copay ?? 0}`} />
              <Stat label="Deductible" value={`$${result.plan?.deductible ?? 0}`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className={styles.s18}>
      <div className="ui-text-xs-muted">{label}</div>
      <div className="ui-heading-lg">{value ?? '—'}</div>
    </div>
  );
}

// ── Claim Scrubber ──
function ScrubberTool() {
  const [form, setForm] = useState({ patient_mrn: 'MRN1002', payer: 'Aetna', icd10_code: 'E11.9', cpt_code: '99214', amount: 180 });
  const { loading, result, error, call } = useApi();
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="ui-stack-4">
      <div className={styles.s17}>
        <Field label="Patient MRN"><input style={inputStyle} value={form.patient_mrn} onChange={e => set('patient_mrn', e.target.value)} /></Field>
        <Field label="Payer"><input style={inputStyle} value={form.payer} onChange={e => set('payer', e.target.value)} /></Field>
        <Field label="ICD-10"><input style={inputStyle} value={form.icd10_code} onChange={e => set('icd10_code', e.target.value)} /></Field>
        <Field label="CPT"><input style={inputStyle} value={form.cpt_code} onChange={e => set('cpt_code', e.target.value)} /></Field>
        <Field label="Amount"><input style={inputStyle} type="number" value={form.amount} onChange={e => set('amount', Number(e.target.value))} /></Field>
      </div>
      <RunButton loading={loading} onClick={() => call('POST', '/claims/scrub', form)}>Scrub Claim</RunButton>
      <ErrorNote error={error} />
      {result && (
        <div className="ui-stack-3">
          <div style={{ color: result.clean ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s16}>
            {result.clean ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.clean ? 'Clean — ready to submit' : `${result.edits.length} edit(s) found`}
          </div>
          {result.edits.map((e: any, i: number) => (
            <div key={i} style={{ borderLeft: `4px solid ${severityColor(e.severity)}` }} className={styles.s19}>
              <span style={{ color: severityColor(e.severity) }} className={styles.s20}>{e.severity}</span>
              <span className={styles.s21}>{e.code}</span>
              <div>{e.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Drug Interactions ──
function InteractionsTool() {
  const [mrn, setMrn] = useState('MRN1002');
  const [meds, setMeds] = useState('Warfarin, Oxycodone');
  const { loading, result, error, call } = useApi();
  return (
    <div className="ui-stack-4">
      <Field label="Patient MRN (optional — pulls active meds)"><input style={inputStyle} value={mrn} onChange={e => setMrn(e.target.value)} /></Field>
      <Field label="Additional medications (comma-separated)"><input style={inputStyle} value={meds} onChange={e => setMeds(e.target.value)} /></Field>
      <RunButton loading={loading} onClick={() => call('POST', '/rx/interactions', { patient_mrn: mrn || undefined, meds: meds.split(',').map(s => s.trim()).filter(Boolean) })}>Check Interactions</RunButton>
      <ErrorNote error={error} />
      {result && (
        <div className="ui-stack-3">
          <div className="ui-text-xs-muted">Evaluated: {(result.meds || []).join(', ') || '—'}</div>
          {result.interactions.length === 0 ? (
            <div className={styles.s22}><CheckCircle2 size={18} /> No interactions detected</div>
          ) : result.interactions.map((h: any, i: number) => (
            <div key={i} style={{ borderLeft: `4px solid ${severityColor(h.severity)}` }} className={styles.s19}>
              <span style={{ color: severityColor(h.severity) }} className={styles.s23}>{h.severity}</span> — {h.drugs.join(' + ')}
              <div className="ui-text-muted">{h.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CDS ──
function CdsTool() {
  const [mrn, setMrn] = useState('MRN1004');
  const [drug, setDrug] = useState('Warfarin');
  const { loading, result, error, call } = useApi();
  return (
    <div className="ui-stack-4">
      <Field label="Patient MRN"><input style={inputStyle} value={mrn} onChange={e => setMrn(e.target.value)} /></Field>
      <Field label="Proposed order / drug (optional)"><input style={inputStyle} value={drug} onChange={e => setDrug(e.target.value)} /></Field>
      <RunButton loading={loading} onClick={() => call('POST', '/cds/evaluate', { patient_mrn: mrn, order_drug: drug || undefined })}>Evaluate</RunButton>
      <ErrorNote error={error} />
      {result && (
        <div className="ui-stack-3">
          {result.alerts.length === 0 ? (
            <div className={styles.s22}><CheckCircle2 size={18} /> No alerts</div>
          ) : result.alerts.map((a: any, i: number) => (
            <div key={i} style={{ borderLeft: `4px solid ${severityColor(a.severity)}` }} className={styles.s19}>
              <span style={{ color: severityColor(a.severity) }} className={styles.s24}>{a.type}</span>
              <span className={styles.s25}>({a.severity})</span>
              <div>{a.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Quality Measures ──
function QualityTool() {
  const { loading, result, error, call } = useApi();
  return (
    <div className="ui-stack-4">
      <RunButton loading={loading} onClick={() => call('GET', '/quality/measures')}>Compute Measures</RunButton>
      <ErrorNote error={error} />
      {result && (
        <div className="ui-stack-3">
          {result.measures.map((m: any) => (
            <div key={m.id} className={styles.s26}>
              <div className="ui-flex-between mb-2">
                <div>
                  <div className="font-bold">{m.title}</div>
                  <div className={styles.s27}>{m.id}</div>
                </div>
                <div className={styles.s28}>{m.rate}%</div>
              </div>
              <div className={styles.s29}>
                <div style={{ width: `${m.rate}%` }} className={styles.s30} />
              </div>
              <div className={styles.s31}>{m.numerator} / {m.denominator}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FHIR ──
function FhirTool() {
  const [mrn, setMrn] = useState('MRN1002');
  const [resource, setResource] = useState<'Patient' | 'Observation'>('Patient');
  const { loading, result, error, call } = useApi();
  return (
    <div className="ui-stack-4">
      <div className="ui-grid-2 ui-gap-3">
        <Field label="Resource">
          <select style={inputStyle} value={resource} onChange={e => setResource(e.target.value as any)}>
            <option value="Patient">Patient</option>
            <option value="Observation">Observation</option>
          </select>
        </Field>
        <Field label="Patient MRN (optional)"><input style={inputStyle} value={mrn} onChange={e => setMrn(e.target.value)} /></Field>
      </div>
      <RunButton loading={loading} onClick={() => call('GET', `/fhir/${resource}${mrn ? `?mrn=${encodeURIComponent(mrn)}` : ''}`)}>Fetch Bundle</RunButton>
      <ErrorNote error={error} />
      {result && (
        <>
          <div className="ui-text-xs-muted">{result.resourceType} · {result.type} · {result.total} entr{result.total === 1 ? 'y' : 'ies'}</div>
          <pre className={styles.s32}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
