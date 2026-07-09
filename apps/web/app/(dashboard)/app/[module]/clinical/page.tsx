'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, ArrowLeft, ShieldCheck, FileSearch, Pill, Stethoscope,
  BarChart3, Network, Loader2, AlertTriangle, CheckCircle2, XCircle, Search,
} from 'lucide-react';

const API = '/api/v1/ext/healthcare';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

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
      <div style={{ textAlign: 'center', padding: 60 }}>
        <h2 style={{ marginBottom: 8 }}>Clinical Tools unavailable</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>This workspace is only available for the Healthcare app.</p>
        <Link href={`/app/${moduleSlug}`} style={{ color: 'var(--color-primary)' }}>← Back to app</Link>
      </div>
    );
  }

  const info = SIDE_INFO[tab];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href={`/app/${moduleSlug}`} style={{ color: 'var(--color-text-secondary)', display: 'flex' }}><ArrowLeft size={18} /></Link>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Activity style={{ color: 'var(--color-primary)' }} /> Clinical Tools
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Smart clinical &amp; revenue-cycle services — eligibility, claim scrubbing, drug-interaction &amp; decision support, quality measures and FHIR.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Grid content */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {tab === 'eligibility' && <EligibilityTool />}
          {tab === 'scrubber' && <ScrubberTool />}
          {tab === 'interactions' && <InteractionsTool />}
          {tab === 'cds' && <CdsTool />}
          {tab === 'quality' && <QualityTool />}
          {tab === 'fhir' && <FhirTool />}
        </div>

        {/* Side panel */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0, display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
            <Activity size={16} style={{ color: 'var(--color-primary)' }} /> {info.title}
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{info.body}</p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} }`}</style>
    </div>
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
    <button onClick={onClick} disabled={loading} style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', alignSelf: 'flex-start',
      background: 'var(--color-primary)', border: 'none', color: '#fff', padding: 'var(--space-2) var(--space-4)',
      borderRadius: 'var(--radius-md)', cursor: loading ? 'wait' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
      opacity: loading ? 0.7 : 1,
    }}>
      {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />} {children}
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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const call = useCallback(async (method: 'GET' | 'POST', path: string, body?: any) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API}${path}`, { method, headers: authHeaders(), ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError((data && data.message) || `Request failed (${res.status})`); return; }
      setResult(data);
    } catch {
      setError('Network error — is the API running?');
    } finally { setLoading(false); }
  }, []);
  return { loading, result, error, call };
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger-text, var(--color-text))', fontSize: 'var(--text-sm)' }}>
      <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} /> {error}
    </div>
  );
}

// ── Eligibility ──
function EligibilityTool() {
  const [mrn, setMrn] = useState('MRN1002');
  const { loading, result, error, call } = useApi();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Field label="Patient MRN"><input style={inputStyle} value={mrn} onChange={e => setMrn(e.target.value)} placeholder="MRN1002" /></Field>
      <RunButton loading={loading} onClick={() => call('POST', '/eligibility/check', { patient_mrn: mrn })}>Check Eligibility</RunButton>
      <ErrorNote error={error} />
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'var(--weight-bold)', color: result.eligible ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {result.eligible ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.eligible ? 'Active coverage found' : (result.message || 'Not eligible')}
          </div>
          {result.eligible && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
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
    <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{label}</div>
      <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>{value ?? '—'}</div>
    </div>
  );
}

// ── Claim Scrubber ──
function ScrubberTool() {
  const [form, setForm] = useState({ patient_mrn: 'MRN1002', payer: 'Aetna', icd10_code: 'E11.9', cpt_code: '99214', amount: 180 });
  const { loading, result, error, call } = useApi();
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
        <Field label="Patient MRN"><input style={inputStyle} value={form.patient_mrn} onChange={e => set('patient_mrn', e.target.value)} /></Field>
        <Field label="Payer"><input style={inputStyle} value={form.payer} onChange={e => set('payer', e.target.value)} /></Field>
        <Field label="ICD-10"><input style={inputStyle} value={form.icd10_code} onChange={e => set('icd10_code', e.target.value)} /></Field>
        <Field label="CPT"><input style={inputStyle} value={form.cpt_code} onChange={e => set('cpt_code', e.target.value)} /></Field>
        <Field label="Amount"><input style={inputStyle} type="number" value={form.amount} onChange={e => set('amount', Number(e.target.value))} /></Field>
      </div>
      <RunButton loading={loading} onClick={() => call('POST', '/claims/scrub', form)}>Scrub Claim</RunButton>
      <ErrorNote error={error} />
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'var(--weight-bold)', color: result.clean ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {result.clean ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.clean ? 'Clean — ready to submit' : `${result.edits.length} edit(s) found`}
          </div>
          {result.edits.map((e: any, i: number) => (
            <div key={i} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderLeft: `4px solid ${severityColor(e.severity)}`, borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
              <span style={{ fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: severityColor(e.severity) }}>{e.severity}</span>
              <span style={{ marginLeft: 8, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{e.code}</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Field label="Patient MRN (optional — pulls active meds)"><input style={inputStyle} value={mrn} onChange={e => setMrn(e.target.value)} /></Field>
      <Field label="Additional medications (comma-separated)"><input style={inputStyle} value={meds} onChange={e => setMeds(e.target.value)} /></Field>
      <RunButton loading={loading} onClick={() => call('POST', '/rx/interactions', { patient_mrn: mrn || undefined, meds: meds.split(',').map(s => s.trim()).filter(Boolean) })}>Check Interactions</RunButton>
      <ErrorNote error={error} />
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Evaluated: {(result.meds || []).join(', ') || '—'}</div>
          {result.interactions.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)', fontWeight: 'var(--weight-bold)' }}><CheckCircle2 size={18} /> No interactions detected</div>
          ) : result.interactions.map((h: any, i: number) => (
            <div key={i} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderLeft: `4px solid ${severityColor(h.severity)}`, borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
              <span style={{ fontWeight: 'var(--weight-bold)', color: severityColor(h.severity) }}>{h.severity}</span> — {h.drugs.join(' + ')}
              <div style={{ color: 'var(--color-text-secondary)' }}>{h.note}</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Field label="Patient MRN"><input style={inputStyle} value={mrn} onChange={e => setMrn(e.target.value)} /></Field>
      <Field label="Proposed order / drug (optional)"><input style={inputStyle} value={drug} onChange={e => setDrug(e.target.value)} /></Field>
      <RunButton loading={loading} onClick={() => call('POST', '/cds/evaluate', { patient_mrn: mrn, order_drug: drug || undefined })}>Evaluate</RunButton>
      <ErrorNote error={error} />
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {result.alerts.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)', fontWeight: 'var(--weight-bold)' }}><CheckCircle2 size={18} /> No alerts</div>
          ) : result.alerts.map((a: any, i: number) => (
            <div key={i} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderLeft: `4px solid ${severityColor(a.severity)}`, borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
              <span style={{ fontWeight: 'var(--weight-bold)', textTransform: 'capitalize', color: severityColor(a.severity) }}>{a.type}</span>
              <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>({a.severity})</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <RunButton loading={loading} onClick={() => call('GET', '/quality/measures')}>Compute Measures</RunButton>
      <ErrorNote error={error} />
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {result.measures.map((m: any) => (
            <div key={m.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <div>
                  <div style={{ fontWeight: 'var(--weight-bold)' }}>{m.title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{m.id}</div>
                </div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>{m.rate}%</div>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--color-bg-sunken)', overflow: 'hidden' }}>
                <div style={{ width: `${m.rate}%`, height: '100%', background: 'var(--color-primary)' }} />
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>{m.numerator} / {m.denominator}</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
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
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{result.resourceType} · {result.type} · {result.total} entr{result.total === 1 ? 'y' : 'ies'}</div>
          <pre style={{ margin: 0, padding: 'var(--space-4)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', overflow: 'auto', maxHeight: 420, color: 'var(--color-text)' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
