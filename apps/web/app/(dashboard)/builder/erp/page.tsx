'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Cpu,
  FileCode2,
  PlusCircle,
  Search,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  Layers,
  Grid3X3,
  ToggleLeft,
  Type,
  AlignLeft,
  Calendar,
  Hash,
  Link,
  Upload,
  ChevronDown,
  Database,
} from 'lucide-react';

const MODULES_LIST = [
  { id: 1, name: 'Sales Order Management', status: 'Published', fields: 18, tables: 2, updatedAt: '2 hours ago', icon: '🛒' },
  { id: 2, name: 'Expense Claim Module', status: 'Published', fields: 12, tables: 1, updatedAt: '1 day ago', icon: '💰' },
  { id: 3, name: 'Asset Requisition Form', status: 'Draft', fields: 9, tables: 0, updatedAt: '3 days ago', icon: '🖥️' },
  { id: 4, name: 'Customer Feedback Survey', status: 'Draft', fields: 7, tables: 0, updatedAt: '1 week ago', icon: '📋' },
  { id: 5, name: 'Vendor Evaluation Matrix', status: 'Published', fields: 14, tables: 2, updatedAt: '2 weeks ago', icon: '⭐' },
];

const FORM_FIELDS_PALETTE = [
  { type: 'text', label: 'Text Field', icon: Type },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'date', label: 'Date Picker', icon: Calendar },
  { type: 'select', label: 'Dropdown', icon: ChevronDown },
  { type: 'checkbox', label: 'Checkbox', icon: ToggleLeft },
  { type: 'link', label: 'Link / Relation', icon: Link },
  { type: 'table', label: 'Child Table', icon: Grid3X3 },
  { type: 'file', label: 'File Upload', icon: Upload },
];

const DEMO_FORM_FIELDS = [
  { id: 'f1', type: 'text', label: 'Customer Name', required: true, width: 'half' },
  { id: 'f2', type: 'link', label: 'Customer Account', required: true, width: 'half' },
  { id: 'f3', type: 'date', label: 'Order Date', required: true, width: 'half' },
  { id: 'f4', type: 'date', label: 'Delivery Date', required: false, width: 'half' },
  { id: 'f5', type: 'select', label: 'Order Status', required: true, width: 'full' },
  { id: 'f6', type: 'table', label: 'Order Items', required: false, width: 'full' },
  { id: 'f7', type: 'textarea', label: 'Internal Notes', required: false, width: 'full' },
];

export default function ERPBuilderPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'modules' | 'form-builder'>('modules');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const tabs = [
    { id: 'modules', label: 'My Modules', icon: Database },
    { id: 'form-builder', label: 'Form Builder', icon: FileCode2 },
  ];

  const filtered = MODULES_LIST.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Cpu size={20} style={{ color: 'var(--color-primary)' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              ERP App Builder
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Low-code / No-code environment for building internal ERP modules, forms, and workflows
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder')}>
            ← Back to Builder
          </button>
          <button className="frappe-btn frappe-btn-primary">
            <PlusCircle size={15} />
            <span>New Module</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-1)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: 'var(--space-2.5) var(--space-4)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all var(--duration-fast)',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '28rem' }}>
            <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              className="frappe-input"
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 'var(--space-8)' }}
            />
          </div>

          {/* Module Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {/* Create New Card */}
            <div
              className="frappe-card"
              style={{
                padding: 'var(--space-5)', cursor: 'pointer', border: '2px dashed var(--color-border)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 'var(--space-2)', minHeight: '160px', transition: 'all var(--duration-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary-light)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = ''; }}
            >
              <PlusCircle size={28} style={{ color: 'var(--color-primary)' }} />
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', margin: 0 }}>New Custom Module</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0, textAlign: 'center' }}>Design forms, fields, and workflows</p>
            </div>

            {/* Module Cards */}
            {filtered.map(mod => (
              <div
                key={mod.id}
                className="frappe-card"
                style={{ padding: 'var(--space-4)', cursor: 'pointer', transition: 'all var(--duration-fast)' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: '20px' }}>{mod.icon}</span>
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{mod.name}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Updated {mod.updatedAt}</p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 'var(--weight-semibold)',
                    padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    background: mod.status === 'Published' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                    color: mod.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)',
                  }}>
                    {mod.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                    <Layers size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{mod.fields} fields</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                    <Grid3X3 size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{mod.tables} child tables</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-1.5)' }}>
                  <button
                    className="frappe-btn frappe-btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', padding: 'var(--space-1.5)' }}
                    onClick={() => setActiveTab('form-builder')}
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="frappe-btn frappe-btn-secondary"
                    style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    className="frappe-btn"
                    style={{ padding: 'var(--space-1.5) var(--space-2.5)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Builder Tab */}
      {activeTab === 'form-builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 240px', gap: 'var(--space-4)', height: 'calc(100vh - 260px)' }}>
          {/* Left: Fields Palette */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-3) 0' }}>
              Field Types
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1.5)' }}>
              {FORM_FIELDS_PALETTE.map(field => (
                <div
                  key={field.type}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2.5)',
                    padding: 'var(--space-2) var(--space-2.5)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    cursor: 'grab', fontSize: 'var(--text-xs)', color: 'var(--color-text)',
                    fontWeight: 'var(--weight-medium)', transition: 'all var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-light)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <field.icon size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <span>{field.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Form Canvas */}
          <div className="frappe-card" style={{ padding: 'var(--space-4)', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>
                  Sales Order Management
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                  DocType · {DEMO_FORM_FIELDS.length} fields
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="frappe-btn frappe-btn-secondary">Preview</button>
                <button className="frappe-btn frappe-btn-primary">
                  <CheckCircle size={14} />
                  <span>Publish</span>
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {DEMO_FORM_FIELDS.map(field => (
                <div
                  key={field.id}
                  onClick={() => setSelectedField(field.id === selectedField ? null : field.id)}
                  style={{
                    gridColumn: field.width === 'full' ? '1 / -1' : 'auto',
                    padding: 'var(--space-2.5) var(--space-3)',
                    border: `1px ${selectedField === field.id ? 'solid var(--color-primary)' : 'dashed var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: selectedField === field.id ? 'var(--color-primary-light)' : 'var(--color-bg)',
                    transition: 'all var(--duration-fast)',
                    display: 'flex', flexDirection: 'column', gap: 'var(--space-1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                      {field.label}
                      {field.required && <span style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-elevated)', padding: '1px 6px', borderRadius: '4px' }}>
                      {field.type}
                    </span>
                  </div>
                  <div style={{ height: '28px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                </div>
              ))}
            </div>

            {/* Add field drop zone */}
            <div style={{
              border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 'var(--space-2)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}>
              <PlusCircle size={16} />
              <span>Drag a field type here to add</span>
            </div>
          </div>

          {/* Right: Properties Panel */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-3) 0' }}>
              Field Properties
            </p>
            {selectedField ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { label: 'Field Label', value: DEMO_FORM_FIELDS.find(f => f.id === selectedField)?.label || '' },
                  { label: 'Field Name', value: (DEMO_FORM_FIELDS.find(f => f.id === selectedField)?.label || '').toLowerCase().replace(/\s/g, '_') },
                  { label: 'Field Type', value: DEMO_FORM_FIELDS.find(f => f.id === selectedField)?.type || '' },
                ].map(prop => (
                  <div key={prop.label} className="frappe-form-group">
                    <label className="frappe-label">{prop.label}</label>
                    <input className="frappe-input" type="text" defaultValue={prop.value} style={{ fontSize: 'var(--text-xs)' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {[
                    { label: 'Required', checked: DEMO_FORM_FIELDS.find(f => f.id === selectedField)?.required },
                    { label: 'Read-Only', checked: false },
                    { label: 'Hidden', checked: false },
                    { label: 'In List View', checked: true },
                  ].map(toggle => (
                    <label key={toggle.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{toggle.label}</span>
                      <div style={{
                        width: '36px', height: '20px', borderRadius: '10px',
                        background: toggle.checked ? 'var(--color-primary)' : 'var(--color-border)',
                        position: 'relative', transition: 'background var(--duration-fast)',
                      }}>
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '8px', background: 'white',
                          position: 'absolute', top: '2px', left: toggle.checked ? '18px' : '2px',
                          transition: 'left var(--duration-fast)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-2)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                <Clock size={24} style={{ margin: '0 auto var(--space-2)', opacity: 0.4, display: 'block' }} />
                Click a field in the canvas to edit its properties
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
