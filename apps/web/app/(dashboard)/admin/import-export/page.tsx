'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ValidationError { row: number; field: string; message: string }
interface ValidationResult { valid: Record<string, unknown>[]; errors: ValidationError[] }

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

const API = '/api/v1/admin/imports';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Field definitions per model                                        */
/* ------------------------------------------------------------------ */

const MODEL_FIELDS: Record<string, string[]> = {
  Customer: ['name', 'type', 'email', 'phone', 'taxId', 'paymentTerms', 'status', 'notes'],
  Vendor: ['name', 'type', 'email', 'phone', 'taxId', 'paymentTerms', 'status', 'notes'],
  Product: ['sku', 'name', 'costPrice', 'sellPrice', 'type', 'description', 'category', 'brand', 'unit', 'barcode'],
  Employee: ['employeeCode', 'firstName', 'lastName', 'email', 'dateOfJoining', 'phone', 'designation', 'employmentType', 'status'],
};

const EXPORT_ENTITIES = ['customers', 'vendors', 'products', 'employees', 'invoices'];

/* ------------------------------------------------------------------ */
/*  CSV parser                                                         */
/* ------------------------------------------------------------------ */

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });
  return { headers, rows };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  return (
    <div style={{ padding: 'var(--space-6, 24px)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl, 24px)', fontWeight: 700, marginBottom: 'var(--space-4, 16px)', color: 'var(--text-primary, #111)' }}>
        Import / Export Center
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2, 8px)', marginBottom: 'var(--space-6, 24px)', borderBottom: '1px solid var(--border-default, #e5e7eb)' }}>
        {(['import', 'export'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--color-primary, #6366f1)' : 'var(--text-secondary, #6b7280)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary, #6366f1)' : '2px solid transparent',
              fontSize: 'var(--text-sm, 14px)',
            }}
          >
            {tab === 'import' ? <><Upload size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Import</> : <><Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Export</>}
          </button>
        ))}
      </div>

      {activeTab === 'import' ? <ImportTab /> : <ExportTab />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Import Tab                                                         */
/* ------------------------------------------------------------------ */

function ImportTab() {
  const [step, setStep] = useState(1);
  const [targetModel, setTargetModel] = useState('Customer');
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          const data = JSON.parse(text);
          const rows = Array.isArray(data) ? data : [data];
          if (rows.length > 0) {
            setSourceHeaders(Object.keys(rows[0]));
            setParsedRows(rows);
            // Auto-map matching columns
            const fields = MODEL_FIELDS[targetModel] || [];
            const map: Record<string, string> = {};
            Object.keys(rows[0]).forEach(h => {
              if (fields.includes(h)) map[h] = h;
            });
            setColumnMap(map);
            setStep(3);
          }
        } catch { /* ignore */ }
      } else {
        const { headers, rows } = parseCSV(text);
        setSourceHeaders(headers);
        setParsedRows(rows);
        const fields = MODEL_FIELDS[targetModel] || [];
        const map: Record<string, string> = {};
        headers.forEach(h => {
          if (fields.includes(h)) map[h] = h;
        });
        setColumnMap(map);
        setStep(3);
      }
    };
    reader.readAsText(file);
  }, [targetModel]);

  const handleValidate = async () => {
    const mappedRows = parsedRows.map(row => {
      const mapped: Record<string, unknown> = {};
      Object.entries(columnMap).forEach(([src, tgt]) => {
        if (tgt) mapped[tgt] = row[src];
      });
      return mapped;
    });

    try {
      const res = await apiFetch<ValidationResult>(`${API}/validate`, {
        method: 'POST',
        body: JSON.stringify({ targetModel, rows: mappedRows }),
      });
      setValidation(res);
      setStep(4);
    } catch {
      setValidation({ valid: mappedRows, errors: [] });
      setStep(4);
    }
  };

  const handleExecute = async () => {
    if (!validation) return;
    setImporting(true);
    try {
      const res = await apiFetch<{ created: number; errors: { row: number; message: string }[] }>(`${API}/execute`, {
        method: 'POST',
        body: JSON.stringify({ targetModel, orgId: '', rows: validation.valid }),
      });
      setResult(res);
      setStep(5);
    } catch (err: any) {
      setResult({ created: 0, errors: [{ row: 0, message: err.message }] });
      setStep(5);
    } finally {
      setImporting(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card, #fff)',
    border: '1px solid var(--border-default, #e5e7eb)',
    borderRadius: 'var(--radius-lg, 12px)',
    padding: 'var(--space-5, 20px)',
    marginBottom: 'var(--space-4, 16px)',
  };

  const targetFields = MODEL_FIELDS[targetModel] || [];

  return (
    <div>
      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['Select Model', 'Upload File', 'Map Columns', 'Preview', 'Execute'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              background: step > i + 1 ? 'var(--color-success, #22c55e)' : step === i + 1 ? 'var(--color-primary, #6366f1)' : 'var(--bg-muted, #f3f4f6)',
              color: step >= i + 1 ? '#fff' : 'var(--text-secondary, #6b7280)',
            }}>
              {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--text-primary, #111)' : 'var(--text-secondary, #6b7280)' }}>{label}</span>
            {i < 4 && <ArrowRight size={12} style={{ color: 'var(--text-muted, #9ca3af)' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Model */}
      {step >= 1 && (
        <div className="frappe-card" style={cardStyle}>
          <h3 style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 600, marginBottom: 12, color: 'var(--text-primary, #111)' }}>
            1. Select Target Model
          </h3>
          <select
            value={targetModel}
            onChange={e => { setTargetModel(e.target.value); setStep(1); setValidation(null); setResult(null); }}
            style={{
              padding: '8px 12px', borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--border-default, #e5e7eb)',
              background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #111)',
              fontSize: 'var(--text-sm, 14px)', minWidth: 200,
            }}
          >
            {Object.keys(MODEL_FIELDS).map(m => <option key={m} value={m}>{m}s</option>)}
          </select>
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              style={{
                marginLeft: 12, padding: '8px 16px', borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--color-primary, #6366f1)', color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm, 14px)', fontWeight: 500,
              }}
            >
              Next
            </button>
          )}
        </div>
      )}

      {/* Step 2: Upload */}
      {step >= 2 && (
        <div className="frappe-card" style={cardStyle}>
          <h3 style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 600, marginBottom: 12, color: 'var(--text-primary, #111)' }}>
            2. Upload CSV or JSON File
          </h3>
          <input type="file" accept=".csv,.json" onChange={handleFileUpload}
            style={{ fontSize: 'var(--text-sm, 14px)' }} />
          <p style={{ fontSize: 12, color: 'var(--text-secondary, #6b7280)', marginTop: 8 }}>
            Expected fields: {targetFields.join(', ')}
          </p>
        </div>
      )}

      {/* Step 3: Column Mapping */}
      {step >= 3 && sourceHeaders.length > 0 && (
        <div className="frappe-card" style={cardStyle}>
          <h3 style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 600, marginBottom: 12, color: 'var(--text-primary, #111)' }}>
            3. Map Columns
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px 12px', alignItems: 'center', maxWidth: 600 }}>
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary, #6b7280)' }}>Source Column</span>
            <span />
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary, #6b7280)' }}>Target Field</span>
            {sourceHeaders.map(h => (
              <React.Fragment key={h}>
                <span style={{ fontSize: 13, color: 'var(--text-primary, #111)' }}>{h}</span>
                <ArrowRight size={14} style={{ color: 'var(--text-muted, #9ca3af)' }} />
                <select
                  value={columnMap[h] || ''}
                  onChange={e => setColumnMap(prev => ({ ...prev, [h]: e.target.value }))}
                  style={{
                    padding: '4px 8px', borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--border-default, #e5e7eb)',
                    fontSize: 13, background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #111)',
                  }}
                >
                  <option value="">-- skip --</option>
                  {targetFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </React.Fragment>
            ))}
          </div>
          {step === 3 && (
            <button onClick={handleValidate} style={{
              marginTop: 16, padding: '8px 16px', borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--color-primary, #6366f1)', color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-sm, 14px)', fontWeight: 500,
            }}>
              Validate
            </button>
          )}
        </div>
      )}

      {/* Step 4: Preview */}
      {step >= 4 && validation && (
        <div className="frappe-card" style={cardStyle}>
          <h3 style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 600, marginBottom: 12, color: 'var(--text-primary, #111)' }}>
            4. Validation Preview
          </h3>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <span style={{ color: 'var(--color-success, #22c55e)', fontWeight: 600, fontSize: 14 }}>
              <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {validation.valid.length} valid rows
            </span>
            {validation.errors.length > 0 && (
              <span style={{ color: 'var(--color-danger, #ef4444)', fontWeight: 600, fontSize: 14 }}>
                <XCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                {validation.errors.length} errors
              </span>
            )}
          </div>
          {validation.errors.length > 0 && (
            <div style={{ maxHeight: 200, overflow: 'auto', marginBottom: 12 }}>
              {validation.errors.map((err, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--color-danger, #ef4444)', padding: '2px 0' }}>
                  Row {err.row}: {err.field} - {err.message}
                </div>
              ))}
            </div>
          )}
          {validation.valid.length > 0 && step === 4 && (
            <button onClick={handleExecute} disabled={importing} style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--color-success, #22c55e)', color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-sm, 14px)', fontWeight: 500, opacity: importing ? 0.6 : 1,
            }}>
              {importing ? 'Importing...' : `Import ${validation.valid.length} Records`}
            </button>
          )}
        </div>
      )}

      {/* Step 5: Result */}
      {step >= 5 && result && (
        <div className="frappe-card" style={cardStyle}>
          <h3 style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 600, marginBottom: 12, color: 'var(--text-primary, #111)' }}>
            5. Import Complete
          </h3>
          <p style={{ fontSize: 14, color: 'var(--color-success, #22c55e)', fontWeight: 600 }}>
            <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {result.created} records created successfully
          </p>
          {result.errors.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {result.errors.map((err, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--color-danger, #ef4444)' }}>
                  Row {err.row}: {err.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Export Tab                                                          */
/* ------------------------------------------------------------------ */

function ExportTab() {
  const [entityType, setEntityType] = useState('customers');
  const [format, setFormat] = useState('json');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ format });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await apiFetch<any>(`${API}/exports/${entityType}?${params}`);

      let blob: Blob;
      let filename: string;
      if (format === 'csv' && res.csv) {
        blob = new Blob([res.csv], { type: 'text/csv' });
        filename = res.filename || `${entityType}.csv`;
      } else {
        blob = new Blob([JSON.stringify(res.data || res, null, 2)], { type: 'application/json' });
        filename = res.filename || `${entityType}.json`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card, #fff)',
    border: '1px solid var(--border-default, #e5e7eb)',
    borderRadius: 'var(--radius-lg, 12px)',
    padding: 'var(--space-5, 20px)',
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 'var(--radius-md, 8px)',
    border: '1px solid var(--border-default, #e5e7eb)',
    background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #111)',
    fontSize: 'var(--text-sm, 14px)', minWidth: 180,
  };

  return (
    <div className="frappe-card" style={cardStyle}>
      <h3 style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary, #111)' }}>
        <Download size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Export Data
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--text-secondary, #6b7280)' }}>Entity Type</label>
          <select value={entityType} onChange={e => setEntityType(e.target.value)} style={inputStyle}>
            {EXPORT_ENTITIES.map(e => (
              <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--text-secondary, #6b7280)' }}>Format</label>
          <select value={format} onChange={e => setFormat(e.target.value)} style={inputStyle}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--text-secondary, #6b7280)' }}>Date Range (optional)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, minWidth: 0, flex: 1 }} />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...inputStyle, minWidth: 0, flex: 1 }} />
          </div>
        </div>

        <button onClick={handleExport} disabled={loading} style={{
          padding: '10px 20px', borderRadius: 'var(--radius-md, 8px)',
          background: 'var(--color-primary, #6366f1)', color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 'var(--text-sm, 14px)', fontWeight: 500, opacity: loading ? 0.6 : 1,
        }}>
          {loading ? 'Exporting...' : 'Download Export'}
        </button>
      </div>
    </div>
  );
}
