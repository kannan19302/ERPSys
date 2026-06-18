import React, { useState } from 'react';
import { useBuilderStore } from '@/stores/builderStore';
import { Settings, Maximize, Shield, Database, Code, LayoutTemplate, ChevronDown, ChevronRight, Activity, Cpu, GitBranch, Plus, X } from 'lucide-react';

const AccordionSection = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent', border: 'none', cursor: 'pointer', color: '#e2e8f0', transition: 'background 0.2s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Icon && <Icon size={14} style={{ color: '#94a3b8' }} />}
          <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        </div>
        {isOpen ? <ChevronDown size={14} style={{ color: '#64748b' }} /> : <ChevronRight size={14} style={{ color: '#64748b' }} />}
      </button>
      {isOpen && (
        <div style={{ padding: '8px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// Simple dark input wrapper helper
const DarkInput = ({ label, children, description }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8' }}>{label}</label>
    {children}
    {description && <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{description}</p>}
  </div>
);

export function BuilderProperties() {
  const { fields, selectedFieldId, updateField, formSettings, updateFormSettings } = useBuilderStore();
  const webhooks = formSettings?.webhooks || [];
  const scripts = formSettings?.scripts || [];

  const selectedField = fields.find(f => f.id === selectedFieldId);
  const generateName = (label: string) => label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '');

  const inputStyle = {
    width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px', color: 'white', fontSize: '13px', outline: 'none'
  };

  if (!selectedField) {    return (
      <div style={{ width: '320px', borderLeft: '1px solid rgba(255,255,255,0.05)', background: '#1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0, color: '#e2e8f0' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
          <Settings size={20} style={{ color: '#3b82f6' }} />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: 'white' }}>Form Automations</h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Global Settings</span>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <AccordionSection title="Webhooks" icon={Activity} defaultOpen={true}>
            {(webhooks || []).map((wh, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                <button
                  onClick={() => {
                    const newHooks = [...(webhooks || [])];
                    newHooks.splice(idx, 1);
                    updateFormSettings({ webhooks: newHooks });
                  }}
                  style={{ position: 'absolute', top: '8px', right: '8px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                >
                  &times;
                </button>
                <DarkInput label="Event Trigger">
                  <select
                    style={inputStyle}
                    value={wh.event}
                    onChange={(e) => {
                      const newHooks = [...(webhooks || [])];
                      if (newHooks[idx]) { newHooks[idx].event = e.target.value; updateFormSettings({ webhooks: newHooks }); }
                    }}
                  >
                    <option value="record.created" style={{ color: 'black' }}>Record Created</option>
                    <option value="record.updated" style={{ color: 'black' }}>Record Updated</option>
                    <option value="record.deleted" style={{ color: 'black' }}>Record Deleted</option>
                  </select>
                </DarkInput>
                <div style={{ height: '12px' }}></div>
                <DarkInput label="Endpoint URL">
                  <input type="text" style={inputStyle} placeholder="https://api.example.com/hook" value={wh.url}
                    onChange={(e) => {
                      const newHooks = [...(webhooks || [])];
                      if (newHooks[idx]) { newHooks[idx].url = e.target.value; updateFormSettings({ webhooks: newHooks }); }
                    }}
                  />
                </DarkInput>
              </div>
            ))}
            <button
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
              onClick={() => updateFormSettings({ webhooks: [...(webhooks || []), { url: '', event: 'record.created', method: 'POST' }] })}
            >
              + Add Webhook
            </button>
          </AccordionSection>

          <AccordionSection title="JS Isolates (Node VM)" icon={Cpu} defaultOpen={true}>
            {(scripts || []).map((script, idx) => {
              return (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <button
                    onClick={() => {
                      const newScripts = [...scripts];
                      newScripts.splice(idx, 1);
                      updateFormSettings({ scripts: newScripts });
                    }}
                    style={{ position: 'absolute', top: '8px', right: '8px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                  >
                    &times;
                  </button>
                  <DarkInput label="Event Hook">
                    <select
                      style={inputStyle}
                      value={script.event}
                      onChange={(e) => {
                        const newScripts = [...scripts];
                        if (newScripts[idx]) { newScripts[idx].event = e.target.value; updateFormSettings({ scripts: newScripts }); }
                      }}
                    >
                      <option value="record.created" style={{ color: 'black' }}>Before Create</option>
                      <option value="record.updated" style={{ color: 'black' }}>Before Update</option>
                      <option value="record.deleted" style={{ color: 'black' }}>Before Delete</option>
                    </select>
                  </DarkInput>
                  <div style={{ height: '12px' }}></div>
                  <DarkInput label="JS Code block (Node VM)">
                    <textarea
                      style={{ ...inputStyle, height: '120px', fontFamily: 'monospace', fontSize: '12px' }}
                      placeholder="data.total = data.qty * data.price; return data;"
                      value={script.code}
                      onChange={(e) => {
                        const newScripts = [...scripts];
                        if (newScripts[idx]) { newScripts[idx].code = e.target.value; updateFormSettings({ scripts: newScripts }); }
                      }}
                    />
                  </DarkInput>
                </div>
              );
            })}
            <button
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
              onClick={() => {
                const scripts = useBuilderStore.getState().formSettings.scripts || [];
                updateFormSettings({ scripts: [...scripts, { code: '', event: 'record.created' }] });
              }}
            >
              + Add JS Automation
            </button>
          </AccordionSection>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '320px', borderLeft: '1px solid rgba(255,255,255,0.05)', background: '#1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0, color: '#e2e8f0' }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
        <Settings size={20} style={{ color: '#10b981' }} />
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: 'white' }}>Inspector</h3>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{selectedField.type} Field</span>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        <AccordionSection title="General" icon={Settings} defaultOpen={true}>
          <DarkInput label="Label">
            <input type="text" style={inputStyle} value={selectedField.label}
              onChange={(e) => {
                const label = e.target.value;
                updateField(selectedField.id, { label, name: generateName(label) });
              }}
            />
          </DarkInput>
          <DarkInput label="Name (ID)">
            <input type="text" style={{ ...inputStyle, fontFamily: 'monospace', color: '#94a3b8' }} value={selectedField.name}
              onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
            />
          </DarkInput>
          <DarkInput label="Description / Help Text">
            <textarea style={{ ...inputStyle, minHeight: '60px' }} value={selectedField.description || ''}
              onChange={(e) => updateField(selectedField.id, { description: e.target.value })}
            />
          </DarkInput>

          {selectedField.type !== 'Section Break' && selectedField.type !== 'Column Break' && selectedField.type !== 'Button' && selectedField.type !== 'HTML' && (
            <>
              <DarkInput label="Placeholder">
                <input type="text" style={inputStyle} value={selectedField.placeholder || ''} onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })} placeholder="e.g. Enter value..." />
              </DarkInput>
              <DarkInput label="Default Value">
                <input type="text" style={inputStyle} value={selectedField.defaultValue || ''} onChange={(e) => updateField(selectedField.id, { defaultValue: e.target.value })} />
              </DarkInput>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedField.required} onChange={(e) => updateField(selectedField.id, { required: e.target.checked })} style={{ accentColor: '#10b981' }} />
              <span style={{ fontSize: '13px' }}>Mandatory Field</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedField.readOnly} onChange={(e) => updateField(selectedField.id, { readOnly: e.target.checked })} style={{ accentColor: '#10b981' }} />
              <span style={{ fontSize: '13px' }}>Read-Only</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedField.inListView || false} onChange={(e) => updateField(selectedField.id, { inListView: e.target.checked })} style={{ accentColor: '#10b981' }} />
              <span style={{ fontSize: '13px' }}>Show in List View</span>
            </label>
          </div>
        </AccordionSection>

        <AccordionSection title="Layout & Appearance" icon={LayoutTemplate} defaultOpen={false}>
          {(selectedField.type === 'Column Break' || selectedField.type === 'Section Break') ? (
            <DarkInput label={`Column Weight: ${selectedField.weight || 1}x`}>
              <input type="range" min="1" max="10" step="1" value={selectedField.weight || 1} onChange={(e) => updateField(selectedField.id, { weight: parseInt(e.target.value) })} style={{ width: '100%', accentColor: '#3b82f6' }} />
            </DarkInput>
          ) : (
            <>
              <DarkInput label={`Width (Columns): ${selectedField.columnSpan || 12}/12`}>
                <input type="range" min="1" max="12" step="1" value={selectedField.columnSpan || 12} onChange={(e) => updateField(selectedField.id, { columnSpan: parseInt(e.target.value) })} style={{ width: '100%', accentColor: '#3b82f6' }} />
              </DarkInput>
              {(selectedField.type === 'Text Editor' || selectedField.type === 'Image' || selectedField.type === 'HTML' || selectedField.type === 'Signature' || selectedField.type === 'Table' || selectedField.type === 'Button') && (
                <DarkInput label="Height (px)">
                  <input type="number" style={inputStyle} placeholder="Auto" value={selectedField.height || ''} onChange={(e) => updateField(selectedField.id, { height: e.target.value ? parseInt(e.target.value) : undefined })} />
                </DarkInput>
              )}
            </>
          )}
          <DarkInput label="CSS Class Overrides">
            <input type="text" style={{ ...inputStyle, fontFamily: 'monospace' }} value={selectedField.cssClass || ''} onChange={(e) => updateField(selectedField.id, { cssClass: e.target.value })} placeholder="e.g. frappe-text-bold" />
          </DarkInput>
        </AccordionSection>

        {(selectedField.type === 'Select' || selectedField.type === 'Radio' || selectedField.type === 'Link' || selectedField.type === 'HTML' || selectedField.type === 'Table') && (
          <AccordionSection title={selectedField.type === 'HTML' ? 'HTML Content' : selectedField.type === 'Table' ? 'Table Columns' : 'Static Options'} icon={Database} defaultOpen={false}>
            <DarkInput label={selectedField.type === 'Table' ? 'Columns (e.g. Item:Text, Qty:Int)' : 'Options (One per line)'}>
              <textarea style={{ ...inputStyle, minHeight: '120px' }} value={selectedField.options || ''} onChange={(e) => updateField(selectedField.id, { options: e.target.value })}
                placeholder={selectedField.type === 'Link' ? 'Enter Target DocType' : selectedField.type === 'HTML' ? '<b>Hello</b>' : selectedField.type === 'Table' ? 'Item:Text\nQty:Int\nPrice:Currency' : 'Option 1\nOption 2'}
              />
            </DarkInput>
          </AccordionSection>
        )}

        {(selectedField.type === 'Data' || selectedField.type === 'Password' || selectedField.type === 'Text Editor') && (
          <AccordionSection title="Validation" icon={Shield} defaultOpen={false}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <DarkInput label="Min Length">
                <input type="number" style={inputStyle} value={selectedField.minLength || ''} onChange={(e) => updateField(selectedField.id, { minLength: e.target.value ? parseInt(e.target.value) : undefined })} />
              </DarkInput>
              <DarkInput label="Max Length">
                <input type="number" style={inputStyle} value={selectedField.maxLength || ''} onChange={(e) => updateField(selectedField.id, { maxLength: e.target.value ? parseInt(e.target.value) : undefined })} />
              </DarkInput>
            </div>
            <div style={{ height: '12px' }}></div>
            <DarkInput label="Regex Pattern">
              <input type="text" style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$" value={selectedField.regexPattern || ''} onChange={(e) => updateField(selectedField.id, { regexPattern: e.target.value || undefined })} />
            </DarkInput>
          </AccordionSection>
        )}

        <AccordionSection title="Conditional Logic" icon={GitBranch} defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DarkInput label="Show this field when..." description="Add conditions to dynamically show/hide this field">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select style={{ ...inputStyle, flex: 1, minHeight: '32px' }} value={selectedField.visibilityRule?.split(' ')[0] || ''}
                    onChange={(e) => {
                      const rest = selectedField.visibilityRule?.split(' ').slice(1).join(' ') || '';
                      updateField(selectedField.id, { visibilityRule: rest ? `${e.target.value} ${rest}` : e.target.value || undefined });
                    }}
                  >
                    <option value="">Select field...</option>
                    {fields.filter(f => f.id !== selectedField.id && f.type !== 'Section Break' && f.type !== 'Column Break').map(f => (
                      <option key={f.id} value={`{${f.name}}`}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select style={{ ...inputStyle, minHeight: '32px', flex: 1 }}
                    value={selectedField.visibilityRule?.match(/(==|!=|>|<|>=|<=|contains)/)?.[0] || '=='}
                    onChange={(e) => {
                      const fieldName = selectedField.visibilityRule?.split(' ')[0] || '{field}';
                      const val = selectedField.visibilityRule?.split(' ').slice(2).join(' ') || '';
                      updateField(selectedField.id, { visibilityRule: `${fieldName} ${e.target.value} ${val}` });
                    }}
                  >
                    <option value="==">equals (= =)</option>
                    <option value="!=">not equal (!=)</option>
                    <option value="contains">contains</option>
                    <option value=">">greater than (&gt;)</option>
                    <option value="<">less than (&lt;)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input type="text" style={{ ...inputStyle, flex: 1 }} placeholder="Value..."
                    value={selectedField.visibilityRule?.split(' ').slice(2).join(' ').replace(/^'|'$/g, '') || ''}
                    onChange={(e) => {
                      const fieldName = selectedField.visibilityRule?.split(' ')[0] || '{field}';
                      const op = selectedField.visibilityRule?.split(' ')[1] || '==';
                      updateField(selectedField.id, { visibilityRule: `${fieldName} ${op} '${e.target.value}'` });
                    }}
                  />
                </div>
              </div>
            </DarkInput>
            {selectedField.visibilityRule && (
              <div style={{ fontSize: '11px', color: '#10b981', fontFamily: 'monospace', padding: '6px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: '4px' }}>
                <GitBranch size={10} style={{ marginRight: '4px' }} />
                Show when: {selectedField.visibilityRule}
              </div>
            )}
          </div>
        </AccordionSection>

        <AccordionSection title="Computed Formula" icon={Code} defaultOpen={false}>
          {(selectedField.type === 'Data' || selectedField.type === 'Int' || selectedField.type === 'Currency' || selectedField.type === 'Float') && (
            <DarkInput label="Computed Formula" description="Wrap field names in curly braces. Auto-calculated on change.">
              <input type="text" style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="e.g. {qty} * {rate}" value={selectedField.formula || ''} onChange={(e) => updateField(selectedField.id, { formula: e.target.value || undefined, readOnly: e.target.value ? true : selectedField.readOnly })} />
            </DarkInput>
          )}
        </AccordionSection>

        <AccordionSection title="Security (RBAC)" icon={Shield} defaultOpen={false}>
          <DarkInput label="Allowed Read Roles" description="Comma-separated. Leave empty for all.">
            <input type="text" style={inputStyle} placeholder="e.g. Admin, Manager" value={selectedField.readRoles || ''} onChange={(e) => updateField(selectedField.id, { readRoles: e.target.value || undefined })} />
          </DarkInput>
          <div style={{ height: '12px' }}></div>
          <DarkInput label="Allowed Write Roles" description="Comma-separated. Leave empty for all.">
            <input type="text" style={inputStyle} placeholder="e.g. Admin" value={selectedField.writeRoles || ''} onChange={(e) => updateField(selectedField.id, { writeRoles: e.target.value || undefined })} />
          </DarkInput>
        </AccordionSection>

        {(selectedField.type === 'Select' || selectedField.type === 'Radio' || selectedField.type === 'Link') && (
          <AccordionSection title="Data Source" icon={Database} defaultOpen={false}>
            <DarkInput label="API URL or Module Schema">
              <input type="text" style={inputStyle} placeholder="e.g. /api/v1/customers" value={selectedField.dataSource || ''} onChange={(e) => updateField(selectedField.id, { dataSource: e.target.value || undefined })} />
            </DarkInput>
            <div style={{ height: '12px' }}></div>
            <DarkInput label="JSONPath / Filter" description="Path to map API response to options.">
              <input type="text" style={inputStyle} placeholder="e.g. $.data[*].name" value={selectedField.dataFilter || ''} onChange={(e) => updateField(selectedField.id, { dataFilter: e.target.value || undefined })} />
            </DarkInput>
          </AccordionSection>
        )}

      </div>
    </div>
  );
}
