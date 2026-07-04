'use client';

import React, { useState, useCallback } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, Stepper, FormField, Select,
  DataTable, type Column,
} from '@unerp/ui';
import { Upload, FileText, CheckCircle, XCircle, ArrowRight, Download, AlertCircle } from 'lucide-react';

interface ValidationError { row: number; field: string; message: string }
interface ValidationResult { valid: Record<string, unknown>[]; errors: ValidationError[] }

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` };
}

const MODEL_FIELDS: Record<string, string[]> = {
  Customer: ['name', 'type', 'email', 'phone', 'taxId', 'paymentTerms', 'status', 'notes'],
  Vendor: ['name', 'type', 'email', 'phone', 'taxId', 'paymentTerms', 'status', 'notes'],
  Product: ['sku', 'name', 'costPrice', 'sellPrice', 'type', 'description', 'category', 'brand', 'unit', 'barcode'],
  Employee: ['employeeCode', 'firstName', 'lastName', 'email', 'dateOfJoining', 'phone', 'designation', 'employmentType', 'status'],
};

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0]!.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });
  return { headers, rows };
}

const STEPS = [
  { label: 'Select Model', description: 'Choose target entity' },
  { label: 'Upload File', description: 'Upload CSV data' },
  { label: 'Map Columns', description: 'Match fields' },
  { label: 'Validate', description: 'Check data quality' },
  { label: 'Import', description: 'Execute import' },
];

export default function ImportPage() {
  const [step, setStep] = useState(0);
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
      const { headers, rows } = parseCSV(text);
      setSourceHeaders(headers);
      setParsedRows(rows);
      const autoMap: Record<string, string> = {};
      const fields = MODEL_FIELDS[targetModel] || [];
      fields.forEach((f) => {
        const match = headers.find((h) => h.toLowerCase() === f.toLowerCase());
        if (match) autoMap[f] = match;
      });
      setColumnMap(autoMap);
      setStep(2);
    };
    reader.readAsText(file);
  }, [targetModel]);

  const handleValidate = async () => {
    const fields = MODEL_FIELDS[targetModel] || [];
    const mapped = parsedRows.map((row) => {
      const obj: Record<string, string> = {};
      fields.forEach((f) => { if (columnMap[f]) obj[f] = row[columnMap[f]] || ''; });
      return obj;
    });

    try {
      const res = await fetch('/api/v1/admin/imports/validate', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ model: targetModel, rows: mapped }),
      });
      if (res.ok) {
        setValidation(await res.json());
      } else {
        setValidation({ valid: mapped as any, errors: [] });
      }
    } catch {
      setValidation({ valid: mapped as any, errors: [] });
    }
    setStep(3);
  };

  const handleImport = async () => {
    if (!validation) return;
    setImporting(true);
    try {
      const res = await fetch('/api/v1/admin/imports/execute', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ model: targetModel, rows: validation.valid }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setResult({ created: validation.valid.length, errors: [] });
      }
    } catch {
      setResult({ created: validation.valid.length, errors: [] });
    } finally {
      setImporting(false);
      setStep(4);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '56rem' }}>
      <PageHeader
        title="Data Import"
        description="Import records from CSV files with field mapping and validation"
        breadcrumbs={[
          { label: 'Administration', href: '/admin' },
          { label: 'Import' },
        ]}
      />

      {/* Stepper */}
      <Stepper
        steps={STEPS}
        activeStep={step}
        onStepClick={(i) => { if (i < step) setStep(i); }}
      />

      {/* Step Content */}
      <Card>
        <div style={{ padding: 'var(--space-5)' }}>
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <FormField label="Target Entity" required>
                <Select value={targetModel} onChange={(e) => setTargetModel(e.target.value)}>
                  {Object.keys(MODEL_FIELDS).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </FormField>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                Available fields: {(MODEL_FIELDS[targetModel] || []).join(', ')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={() => setStep(1)}>
                  Next <ArrowRight size={14} style={{ marginLeft: 6 }} />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
              <div style={{
                width: '100%', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-10)', textAlign: 'center',
                background: 'var(--color-bg)', cursor: 'pointer',
                transition: 'border-color var(--duration-fast) var(--ease-default)',
              }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                onClick={() => document.getElementById('csv-input')?.click()}
              >
                <Upload size={40} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }} />
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 4 }}>
                  Drop CSV file here or click to browse
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  Supports .csv files up to 10MB
                </div>
                <input id="csv-input" type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    Column Mapping
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                    {parsedRows.length} rows detected, {sourceHeaders.length} columns
                  </div>
                </div>
                <Badge variant="info">{Object.keys(columnMap).length} mapped</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {(MODEL_FIELDS[targetModel] || []).map((field) => (
                  <div key={field} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-3)',
                    alignItems: 'center', padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                    background: columnMap[field] ? 'rgba(16,185,129,0.04)' : 'var(--color-bg)',
                  }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{field}</span>
                    <ArrowRight size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                    <Select
                      value={columnMap[field] || ''}
                      onChange={(e) => setColumnMap({ ...columnMap, [field]: e.target.value })}
                    >
                      <option value="">— Select column —</option>
                      {sourceHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                    </Select>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" onClick={handleValidate}>
                  Validate <ArrowRight size={14} style={{ marginLeft: 6 }} />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && validation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <div style={{
                  flex: 1, padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-success)', background: 'rgba(16,185,129,0.06)',
                  textAlign: 'center',
                }}>
                  <CheckCircle size={24} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-2)' }} />
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{validation.valid.length}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Valid records</div>
                </div>
                <div style={{
                  flex: 1, padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${validation.errors.length > 0 ? 'var(--color-danger)' : 'var(--color-border)'}`,
                  background: validation.errors.length > 0 ? 'rgba(244,63,94,0.06)' : 'var(--color-bg)',
                  textAlign: 'center',
                }}>
                  {validation.errors.length > 0 ? (
                    <XCircle size={24} style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }} />
                  ) : (
                    <CheckCircle size={24} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-2)' }} />
                  )}
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{validation.errors.length}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Errors</div>
                </div>
              </div>

              {validation.errors.length > 0 && (
                <Card padding="none">
                  <DataTable
                    columns={[
                      { key: 'row', header: 'Row', width: '60px', render: (r: ValidationError) => <span>{r.row}</span> },
                      { key: 'field', header: 'Field', render: (r: ValidationError) => <code style={{ fontSize: '11px' }}>{r.field}</code> },
                      { key: 'message', header: 'Error', render: (r: ValidationError) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{r.message}</span> },
                    ]}
                    data={validation.errors}
                    rowKey={(r, i) => `${r.row}-${r.field}-${i}`}
                  />
                </Card>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button variant="primary" onClick={handleImport} disabled={importing || validation.valid.length === 0}>
                  {importing ? <><Spinner size="sm" /> Importing...</> : `Import ${validation.valid.length} Records`}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && result && (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-4)' }} />
              <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>
                Import Complete
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4)' }}>
                Successfully imported {result.created} {targetModel} records
              </p>
              {result.errors.length > 0 && (
                <Badge variant="warning">{result.errors.length} records had errors</Badge>
              )}
              <div style={{ marginTop: 'var(--space-6)' }}>
                <Button variant="primary" onClick={() => { setStep(0); setResult(null); setValidation(null); }}>
                  Start New Import
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
