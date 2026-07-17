'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

import { FormField } from '@/stores/builderStore';

function AsyncLinkSelect({ slug, value, onChange, disabled, style }: { slug: string, value: any, onChange: (v: any) => void, disabled?: boolean, style?: React.CSSProperties }) {
  const [options, setOptions] = useState<{id: string, label: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    
    async function fetchLinks() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        // 1. Fetch schema by slug to get schemaId
        const schemaRes = await fetch(`/api/v1/builder/schema-registries`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!schemaRes.ok) throw new Error();
        const schemas = await schemaRes.json();
        const schema = schemas.find((s: any) => s.slug === slug);
        if (!schema) throw new Error();

        // 2. Fetch custom records for that schemaId
        const recordsRes = await fetch(`/api/v1/builder/custom-records/${schema.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!recordsRes.ok) throw new Error();
        const records = await recordsRes.json();
        
        if (isMounted) {
          // Attempt to find a 'name', 'title', or 'id' in the JSONB data to use as label
          const opts = records.map((r: any) => {
             const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
             const label = data.name || data.title || data.form_name || r.id;
             return { id: r.id, label };
          });
          setOptions(opts);
        }
      } catch (err) {
        if (isMounted) setOptions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    fetchLinks();
    return () => { isMounted = false; };
  }, [slug]);

  return (
    <select 
      className="ui-input" 
      style={style} 
      disabled={disabled || loading}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{loading ? 'Loading...' : `Select ${slug}...`}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>{opt.label}</option>
      ))}
    </select>
  );
}

interface DynamicFormRendererProps {
  formId?: string;
  schema?: FormField[]; // Pass schema directly if not using localStorage
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function DynamicFormRenderer({ 
  formId, 
  schema, 
  onSubmit, 
  initialData = {},
  isSubmitting = false,
  submitLabel = "Submit"
}: DynamicFormRendererProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>(() => {
     // Pre-populate default values if no initialData is given
     const initial = { ...initialData };
     if (Array.isArray(schema) && Object.keys(initial).length === 0) {
        schema.forEach(f => {
           if (f.defaultValue) initial[f.name] = f.defaultValue;
        });
     }
     return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!schema || !Array.isArray(schema)) return;
    schema.forEach(f => {
      if ((f.type === 'Select' || f.type === 'Radio' || f.type === 'Link') && f.dataSource) {
         fetch(f.dataSource.startsWith('/') ? f.dataSource : `/api/v1/${f.dataSource}`, {
           headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
         })
         .then(res => res.json())
         .then(data => {
            const arr = Array.isArray(data) ? data : data.data || [];
            let mapped = arr.map((item: any) => typeof item === 'object' ? (item.name || item.title || item.id) : String(item));
            setDynamicOptions(prev => ({ ...prev, [f.name]: mapped }));
         })
         .catch(err => console.error('Failed to fetch data source for', f.name, err));
      }
    });
  }, [schema]);

  useEffect(() => {
    if (schema && Array.isArray(schema)) {
      setFields(schema);
      if (Object.keys(initialData).length === 0) {
         const initial = { ...initialData };
         schema.forEach(f => {
           if (f.defaultValue && !initial[f.name]) initial[f.name] = f.defaultValue;
         });
         setFormData(initial);
      }
      setLoading(false);
      return;
    }

    if (formId) {
      const saved = localStorage.getItem(`form_${formId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFields(parsed);
          
          if (Object.keys(initialData).length === 0) {
             const initial = { ...initialData };
             if (Array.isArray(parsed)) {
               parsed.forEach((f: any) => {
                 if (f.defaultValue && !initial[f.name]) initial[f.name] = f.defaultValue;
               });
             }
             setFormData(initial);
          }
        } catch {
          console.error('Failed to parse form schema');
        }
      }
      setLoading(false);
    }
  }, [formId, schema, initialData]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Evaluate Formulas
  useEffect(() => {
    if (fields.length === 0) return;
    let updated = false;
    const nextData = { ...formData };

    fields.forEach(f => {
      if (f.formula) {
        let expression = f.formula;
        // Extract all {field_name} tokens
        const tokens = expression.match(/\{[a-zA-Z0-9_]+\}/g);
        let canEvaluate = true;
        
        if (tokens) {
          tokens.forEach(token => {
            const key = token.slice(1, -1);
            let val = nextData[key];
            if (val === undefined || val === null || val === '') {
              val = 0; // default empty to 0 for math
            }
            if (isNaN(Number(val))) {
               canEvaluate = false; // Cannot evaluate math on non-numbers (for now)
            }
            expression = expression.replace(token, String(val));
          });
        }

        if (canEvaluate) {
          try {
            // Very basic math evaluation using Function
            // Strip everything except numbers, math operators, and parentheses to prevent injection
            const sanitized = expression.replace(/[^0-9+\-*/(). ]/g, '');
            // eslint-disable-next-line no-new-func
            const result = new Function(`return ${sanitized}`)();
            if (Number.isFinite(result) && nextData[f.name] !== result) {
              nextData[f.name] = result;
              updated = true;
            }
          } catch (e) {
            // Formula error, ignore
          }
        }
      }
    });

    if (updated) {
      setFormData(nextData);
    }
  }, [formData, fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(f => {
      const value = formData[f.name];
      
      if (f.required && !value && value !== 0 && f.type !== 'Section Break' && f.type !== 'Column Break' && f.type !== 'HTML' && f.type !== 'Button') {
        newErrors[f.name] = 'This field is required';
        isValid = false;
        return;
      }
      
      if (value && typeof value === 'string') {
        if (f.minLength && value.length < f.minLength) {
          newErrors[f.name] = `Must be at least ${f.minLength} characters`;
          isValid = false;
        }
        if (f.maxLength && value.length > f.maxLength) {
          newErrors[f.name] = `Cannot exceed ${f.maxLength} characters`;
          isValid = false;
        }
        if (f.regexPattern) {
          try {
             const regex = new RegExp(f.regexPattern);
             if (!regex.test(value)) {
               newErrors[f.name] = 'Invalid format';
               isValid = false;
             }
          } catch {
             // invalid regex pattern configured by user
          }
        }
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading form...</div>;
  }

  if (!fields.length) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-danger)' }}>Form schema not found.</div>;
  }

  const renderFieldInput = (f: FormField) => {
    const customHeight = f.height ? `${f.height}px` : undefined;
    const value = formData[f.name] || '';
    const error = errors[f.name];
    
    const inputStyle = { width: '100%', height: customHeight, borderColor: error ? 'var(--color-danger)' : undefined };

    switch (f.type) {
      case 'Select': {
        const manualOptions = (f.options || '').split('\n').map(o => o.trim()).filter(Boolean);
        const optionsList = dynamicOptions[f.name] || manualOptions;
        
        return (
          <select 
            className="ui-input" 
            style={inputStyle} 
            disabled={f.readOnly}
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
          >
            <option value="">Select an option...</option>
            {optionsList.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        );
      }
      case 'Link':
        return <AsyncLinkSelect slug={f.options?.trim() || ''} value={value} onChange={(v) => handleChange(f.name, v)} disabled={f.readOnly} style={inputStyle} />;
      case 'Check':
        return (
          <input 
            type="checkbox" 
            style={{ width: '16px', height: '16px' }} 
            disabled={f.readOnly}
            checked={!!value}
            onChange={(e) => handleChange(f.name, e.target.checked)}
          />
        );
      case 'Text Editor':
        // WYSIWYG Placeholder using simple textarea for now
        return (
          <div style={{ ...inputStyle, minHeight: '120px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2)' }}>
            <textarea 
               style={{ width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent' }} 
               placeholder="Rich Text Editor (Markdown/WYSIWYG Supported)"
               disabled={f.readOnly}
               value={value}
               onChange={(e) => handleChange(f.name, e.target.value)}
            />
          </div>
        );
      case 'File':
      case 'Image':
        return (
          <div style={{ ...inputStyle, minHeight: '100px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-sunken)', flexDirection: 'column', gap: 'var(--space-2)' }}>
             <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>Drop {f.type === 'Image' ? 'image' : 'file'} here or click to upload</span>
             <button type="button" className="ui-btn ui-btn-secondary">Upload</button>
          </div>
        );
      case 'Signature':
        return (
          <div style={{ ...inputStyle, minHeight: '150px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-sunken)', position: 'relative' }}>
             <span style={{ position: 'absolute', bottom: '8px', left: '8px', color: 'var(--color-text-tertiary)', fontSize: '10px' }}>Sign Here</span>
             <canvas style={{ width: '100%', height: '100%' }}></canvas>
          </div>
        );
      case 'Table': {
        const cols = (f.options || '').split('\n').filter(Boolean).map(line => {
           const [colName, colType] = line.split(':');
           return { name: colName?.trim() || 'Column', type: (colType || 'Text').trim() };
        });
        
        const tableValue = Array.isArray(value) ? value : [];
        const handleAddRow = () => handleChange(f.name, [...tableValue, {}]);
        const handleRemoveRow = (idx: number) => {
           const next = [...tableValue];
           next.splice(idx, 1);
           handleChange(f.name, next);
        };
        const handleRowChange = (idx: number, colName: string, colVal: any) => {
           const next = [...tableValue];
           if (!next[idx]) next[idx] = {};
           next[idx][colName] = colVal;
           handleChange(f.name, next);
        };

        if (cols.length === 0) {
          return <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>Please define columns in field options (e.g. Item:Text)</div>;
        }

        return (
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-bg-elevated)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead style={{ background: 'var(--color-bg-sunken)' }}>
                  <tr>
                    <th style={{ width: '40px', padding: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>#</th>
                    {cols.map((c, i) => (
                      <th key={i} style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', minWidth: '120px' }}>{c.name}</th>
                    ))}
                    {!f.readOnly && <th style={{ width: '40px', padding: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {tableValue.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2)', color: 'var(--color-text-tertiary)' }}>{idx + 1}</td>
                      {cols.map((c, i) => (
                        <td key={i} style={{ padding: '0', borderLeft: '1px solid var(--color-border-subtle)' }}>
                           <input 
                              type={c.type === 'Int' || c.type === 'Currency' ? 'number' : c.type === 'Date' ? 'date' : 'text'}
                              style={{ width: '100%', border: 'none', background: 'transparent', padding: 'var(--space-2)', outline: 'none', color: 'var(--color-text)' }}
                              value={row[c.name] || ''}
                              disabled={f.readOnly}
                              onChange={(e) => handleRowChange(idx, c.name, e.target.value)}
                              placeholder={`Enter ${c.name}...`}
                           />
                        </td>
                      ))}
                      {!f.readOnly && (
                        <td style={{ padding: 'var(--space-2)', textAlign: 'center', borderLeft: '1px solid var(--color-border-subtle)' }}>
                           <button type="button" onClick={() => handleRemoveRow(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 'var(--text-lg)', lineHeight: 1 }}>&times;</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {tableValue.length === 0 && (
                    <tr>
                      <td colSpan={cols.length + 2} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                        No rows added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!f.readOnly && (
              <div style={{ padding: 'var(--space-2)', background: 'var(--color-bg-sunken)', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" onClick={handleAddRow} className="ui-btn ui-btn-secondary" style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1.5) var(--space-3)' }}>+ Add Row</button>
              </div>
            )}
          </div>
        );
      }
      case 'HTML':
        return <div style={{ padding: 'var(--space-2)', minHeight: customHeight, height: customHeight, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: f.options || '' }} />;
      case 'Button':
        return <button type="button" className="ui-btn ui-btn-secondary" style={{ width: '100%', height: customHeight }}>{f.label}</button>;
      case 'Date':
        return (
          <input 
            type="date" 
            className="ui-input" 
            style={inputStyle} 
            disabled={f.readOnly}
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
          />
        );
      case 'Int':
      case 'Currency':
        return (
          <div style={{ position: 'relative', height: customHeight }}>
            {f.type === 'Currency' && <DollarSign size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />}
            <input 
              type="number" 
              className="ui-input" 
              style={{ ...inputStyle, paddingLeft: f.type === 'Currency' ? '28px' : 'var(--space-2)', height: '100%' }} 
              placeholder={`0${f.type === 'Currency' ? '.00' : ''}`} 
              disabled={f.readOnly}
              value={value}
              onChange={(e) => handleChange(f.name, e.target.value)}
            />
          </div>
        );
      case 'Password':
        return (
          <input 
            type="password" 
            className="ui-input" 
            style={inputStyle} 
            disabled={f.readOnly}
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
          />
        );
      default:
        return (
          <input 
            type="text" 
            className="ui-input" 
            style={inputStyle} 
            placeholder={`Enter ${f.label}...`} 
            disabled={f.readOnly}
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
          />
        );
    }
  };

  // Build the nested hierarchy just like the Builder
  interface ColumnNode { breakField?: FormField, fields: {field: FormField}[] }
  interface SectionNode { breakField?: FormField, columns: ColumnNode[] }
  
  const sections: SectionNode[] = [];
  let currentSection: SectionNode = { columns: [ { fields: [] } ] };
  sections.push(currentSection);
  
  fields.forEach((f) => {
    if (f.type === 'Section Break') {
      currentSection = { breakField: f, columns: [ { fields: [] } ] };
      sections.push(currentSection);
    } else if (f.type === 'Column Break') {
      currentSection.columns.push({ breakField: f, fields: [] });
    } else {
      currentSection.columns[currentSection.columns.length - 1]?.fields.push({ field: f });
    }
  });

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', background: 'var(--color-bg-elevated)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
      {sections.map((section, sIdx) => {
        const colWeights = section.columns.map((c, i) => {
           if (i === 0) return section.breakField?.weight || 1;
           return c.breakField?.weight || 1;
        });
        const gridTemplate = colWeights.map(w => `${w}fr`).join(' ');

        return (
          <React.Fragment key={`sec_${sIdx}`}>
            {section.breakField && section.breakField.label && section.breakField.label !== 'New Section Break' && (
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', margin: 0, marginTop: sIdx > 0 ? 'var(--space-4)' : 0 }}>
                {section.breakField.label}
              </h3>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap: 'var(--space-8)' }}>
              {section.columns.map((col, cIdx) => (
                <div key={`col_${sIdx}_${cIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  
                  {/* 12-Column Grid inside the Column */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-4)', flex: 1, alignContent: 'start' }}>
                    
                    {col.fields.map((fNode) => {
                      const evaluateVisibility = (rule?: string) => {
                         if (!rule) return true;
                         let expr = rule.startsWith('eval:') ? rule.replace('eval:', '') : rule;
                         const tokens = expr.match(/\{[a-zA-Z0-9_]+\}/g);
                         if (tokens) {
                            tokens.forEach(t => {
                               const k = t.slice(1, -1);
                               const val = formData[k];
                               const safeVal = typeof val === 'string' ? `'${val.replace(/'/g, "\\'")}'` : val === undefined ? "''" : val;
                               expr = expr.replace(t, safeVal);
                            });
                         }
                         try {
                            // eslint-disable-next-line no-new-func
                            return !!new Function(`return ${expr}`)();
                         } catch (e) {
                            return true;
                         }
                      };

                      if (!evaluateVisibility(fNode.field.visibilityRule)) {
                         return null;
                      }

                      const span = fNode.field.columnSpan || 12;
                      const isCheck = fNode.field.type === 'Check';
                      const isHtml = fNode.field.type === 'HTML';
                      const isButton = fNode.field.type === 'Button';
                      
                      return (
                        <div key={fNode.field.id} style={{ gridColumn: `span ${span}`, display: 'flex', flexDirection: 'column' }}>
                          <div className="ui-form-group" style={{ marginBottom: 0, height: '100%', display: 'flex', flexDirection: isCheck ? 'row-reverse' : 'column', justifyContent: isCheck ? 'flex-end' : 'flex-start', alignItems: isCheck ? 'center' : 'stretch', gap: isCheck ? 'var(--space-2)' : 0 }}>
                            {!isButton && !isHtml && (
                              <label className="ui-label" style={{ marginBottom: isCheck ? 0 : 'var(--space-1.5)' }}>
                                {fNode.field.label} {fNode.field.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
                              </label>
                            )}
                            <div style={{ flex: isCheck ? 'none' : 1 }}>
                                {renderFieldInput(fNode.field)}
                            </div>
                            {errors[fNode.field.name] && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', margin: 'var(--space-1) 0 0 0' }}>{errors[fNode.field.name]}</p>}
                            {fNode.field.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 'var(--space-1) 0 0 0' }}>{fNode.field.description}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </React.Fragment>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
        <button type="submit" className="ui-btn ui-btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
          ) : null}
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  );
}
