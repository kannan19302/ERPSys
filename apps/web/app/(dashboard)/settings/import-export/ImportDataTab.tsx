'use client';
import styles from './ImportDataTab.module.css';
import React, { useState, useCallback } from 'react';
import {
  Card, Button, Spinner, Badge, Stepper, FormField, Select, DataTable, type Column,
} from '@unerp/ui';
import { Upload, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface ValidationError { row: number; field: string; message: string }
interface ValidationResult { valid: Record<string, unknown>[]; errors: ValidationError[] }

const MODEL_FIELDS: Record<string, string[]> = {
  Customer: ['name', 'type', 'email', 'phone', 'taxId', 'paymentTerms', 'status', 'notes'],
  Vendor: ['name', 'type', 'email', 'phone', 'taxId', 'paymentTerms', 'status', 'notes'],
  Product: ['sku', 'name', 'costPrice', 'sellPrice', 'type', 'description', 'category', 'brand', 'unit', 'barcode'],
  Employee: ['employeeCode', 'firstName', 'lastName', 'email', 'dateOfJoining', 'phone', 'designation', 'employmentType', 'status'],
};

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
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

export default function ImportDataTab() {
  const client = useApiClient();
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
      setValidation(await client.post<ValidationResult>('/admin/imports/validate', { model: targetModel, rows: mapped }));
    } catch {
      setValidation({ valid: mapped as any, errors: [] });
    }
    setStep(3);
  };

  const handleImport = async () => {
    if (!validation) return;
    setImporting(true);
    try {
      setResult(await client.post<{ created: number; errors: { row: number; message: string }[] }>('/admin/imports/execute', { model: targetModel, rows: validation.valid }));
    } catch {
      setResult({ created: validation.valid.length, errors: [] });
    } finally {
      setImporting(false);
      setStep(4);
    }
  };

  return (
    <RouteGuard permission="settings.import-export.read">
    <div className={styles.s1}>
      <Stepper
        steps={STEPS}
        activeStep={step}
        onStepClick={(i) => { if (i < step) setStep(i); }}
      />

      <Card>
        <div className="p-5">
          {step === 0 && (
            <div className="ui-stack-4">
              <FormField label="Target Entity" required>
                <Select value={targetModel} onChange={(e) => setTargetModel(e.target.value)}>
                  {Object.keys(MODEL_FIELDS).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </FormField>
              <div className="ui-text-xs-tertiary">
                Available fields: {(MODEL_FIELDS[targetModel] || []).join(', ')}
              </div>
              <div className="ui-flex-end">
                <Button variant="primary" onClick={() => setStep(1)}>
                  Next <ArrowRight size={14} className={styles.s16} />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className={styles.s2}>
              <div
                className={styles.s3}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                onClick={() => document.getElementById('csv-input')?.click()}
              >
                <Upload size={40} className={styles.s17} />
                <div className={styles.s4}>
                  Drop CSV file here or click to browse
                </div>
                <div className="ui-text-xs-tertiary">
                  Supports .csv files up to 10MB
                </div>
                <input id="csv-input" type="file" accept=".csv" onChange={handleFileUpload} className={styles.s5} />
              </div>
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            </div>
          )}

          {step === 2 && (
            <div className="ui-stack-4">
              <div className="ui-flex-between">
                <div>
                  <div className="ui-heading-sm">
                    Column Mapping
                  </div>
                  <div className="ui-text-xs-tertiary">
                    {parsedRows.length} rows detected, {sourceHeaders.length} columns
                  </div>
                </div>
                <Badge variant="info">{Object.keys(columnMap).length} mapped</Badge>
              </div>

              <div className="ui-stack-2">
                {(MODEL_FIELDS[targetModel] || []).map((field) => (
                  <div key={field} style={{ background: columnMap[field] ? 'rgba(16,185,129,0.04)' : 'var(--color-bg)' }} className={styles.s6}
                  >
                    <span className="ui-heading-sm">{field}</span>
                    <ArrowRight size={14} className="ui-text-tertiary" />
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

              <div className="ui-flex-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" onClick={handleValidate}>
                  Validate <ArrowRight size={14} className={styles.s16} />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && validation && (
            <div className="ui-stack-4">
              <div className={styles.s7}>
                <div className={styles.s8}
                >
                  <CheckCircle size={24} className={styles.s18} />
                  <div className="text-2xl">{validation.valid.length}</div>
                  <div className="ui-text-xs-muted">Valid records</div>
                </div>
                <div style={{ border: `1px solid ${validation.errors.length > 0 ? 'var(--color-danger)' : 'var(--color-border)'}`, background: validation.errors.length > 0 ? 'rgba(244,63,94,0.06)' : 'var(--color-bg)' }} className={styles.s9}
                >
                  {validation.errors.length > 0 ? (
                    <XCircle size={24} className={styles.s19} />
                  ) : (
                    <CheckCircle size={24} className={styles.s18} />
                  )}
                  <div className="text-2xl">{validation.errors.length}</div>
                  <div className="ui-text-xs-muted">Errors</div>
                </div>
              </div>

              {validation.errors.length > 0 && (
                <Card padding="none">
                  <DataTable
                    columns={[
                      { key: 'row', header: 'Row', width: '60px', render: (r: ValidationError) => <span>{r.row}</span> },
                      { key: 'field', header: 'Field', render: (r: ValidationError) => <code className={styles.s10}>{r.field}</code> },
                      { key: 'message', header: 'Error', render: (r: ValidationError) => <span className={styles.s11}>{r.message}</span> },
                    ] as Column<ValidationError>[]}
                    data={validation.errors}
                    rowKey={(r, i) => `${r.row}-${r.field}-${i}`}
                  />
                </Card>
              )}

              <div className="ui-flex-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button variant="primary" onClick={handleImport} disabled={importing || validation.valid.length === 0}>
                  {importing ? <><Spinner size="sm" /> Importing...</> : `Import ${validation.valid.length} Records`}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && result && (
            <div className={styles.s12}>
              <CheckCircle size={48} className={styles.s20} />
              <h3 className={styles.s13}>
                Import Complete
              </h3>
              <p className={styles.s14}>
                Successfully imported {result.created} {targetModel} records
              </p>
              {result.errors.length > 0 && (
                <Badge variant="warning">{result.errors.length} records had errors</Badge>
              )}
              <div className={styles.s15}>
                <Button variant="primary" onClick={() => { setStep(0); setResult(null); setValidation(null); }}>
                  Start New Import
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
    </RouteGuard>
  );
}
