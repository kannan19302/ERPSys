/* eslint-disable */
// @ts-nocheck
'use client';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';
import { useBuilderData } from '@/lib/hooks/useBuilderData';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Database,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  Table,
  Link,
  GitBranch,
  Hash,
} from 'lucide-react';

const MODULES_LIST = [
  {
    id: 1, name: 'Maintenance Request', module: 'Field Service', status: 'Published',
    tables: 2, fields: 16, relationships: 3, createdAt: '1 month ago',
    description: 'Track and manage on-site maintenance requests with SLA timers',
  },
  {
    id: 2, name: 'Insurance Claim', module: 'Finance', status: 'Draft',
    tables: 1, fields: 12, relationships: 2, createdAt: '3 weeks ago',
    description: 'Custom insurance claim processing module with approval chains',
  },
  {
    id: 3, name: 'Research Grant', module: 'Education', status: 'Published',
    tables: 3, fields: 22, relationships: 4, createdAt: '2 months ago',
    description: 'Manage university research grant applications and disbursements',
  },
  {
    id: 4, name: 'Property Inspection', module: 'Real Estate', status: 'Published',
    tables: 1, fields: 14, relationships: 2, createdAt: '6 weeks ago',
    description: 'Digital inspection reports with photo attachments and scoring',
  },
  {
    id: 5, name: 'Patient Intake Form', module: 'Healthcare', status: 'Draft',
    tables: 2, fields: 18, relationships: 3, createdAt: '2 weeks ago',
    description: 'Electronic patient registration and medical history capture',
  },
];


function ERPModulesPageContent() {

  const { data: dbModules, refetch } = useBuilderData('modules', MODULES_LIST);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  
  const handleSave = async (data: any) => {
    try {
      const token = localStorage.getItem('token') || '';
      const method = editingItem ? 'PATCH' : 'POST';
      const url = editingItem ? `/api/v1/builder/modules/${editingItem.id}` : '/api/v1/builder/modules';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...data, entities: [], relationships: [], permissions: {} })
      });
      refetch();
      
      if (res.ok && method === 'POST') {
        const newMod = await res.json();
        router.push(`/builder/erp/modules/${newMod.id}`);
      }
    } catch {}
    setIsModalOpen(false);
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm('Delete this module?')) return;
    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`/api/v1/builder/modules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedModule(null);
      refetch();
    } catch {}
  };

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<'list' | 'schema'>('list');

  const filtered = dbModules.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const currentMod = dbModules.find(m => m.id === selectedModule);

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Database size={20} style={{ color: '#d97706' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Custom Modules
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Define custom DocTypes, data models, relationships, and permissions for new ERP modules
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/erp')}>
            ← App Studio
          </button>
          <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
            <PlusCircle size={15} />
            <span>New Module</span>
          </button>
        </div>
      </div>

      {/* Layout: List + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedModule ? '340px 1fr' : '1fr', gap: 'var(--space-4)' }}>
        {/* List Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input className="frappe-input" type="text" placeholder="Search modules..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
          </div>

          {/* Create New Card */}
          <div
            className="frappe-card"
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            style={{ padding: 'var(--space-3)', cursor: 'pointer', border: '2px dashed var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d97706'; e.currentTarget.style.background = 'rgba(217,119,6,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = ''; }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PlusCircle size={18} style={{ color: '#d97706' }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>Create New Module</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Design schema from scratch</p>
            </div>
          </div>

          {filtered.map(mod => (
            <div
              key={mod.id}
              className="frappe-card"
              onClick={() => setSelectedModule(mod.id === selectedModule ? null : mod.id)}
              style={{
                padding: 'var(--space-3)', cursor: 'pointer',
                border: `2px solid ${selectedModule === mod.id ? '#d97706' : 'var(--color-border)'}`,
                background: selectedModule === mod.id ? 'rgba(217,119,6,0.05)' : '',
                transition: 'all var(--duration-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{mod.name}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{mod.module} Module · {mod.createdAt}</p>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: mod.status === 'Published' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: mod.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)', flexShrink: 0, marginLeft: 'var(--space-2)' }}>
                  {mod.status}
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-2) 0', lineHeight: 1.5 }}>{mod.description}</p>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                {[
                  { icon: Hash, label: `${mod.fields} fields` },
                  { icon: Table, label: `${mod.tables} tables` },
                  { icon: Link, label: `${mod.relationships} links` },
                ].map(stat => (
                  <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <stat.icon size={11} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selectedModule && currentMod && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Module Header */}
            <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{currentMod.name}</h2>
                <div style={{ display: 'flex', gap: 'var(--space-1.5)' }}>
                  <button onClick={() => router.push(`/builder/erp/modules/${currentMod.id}`)} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}>
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button onClick={() => { /* Preview module */ }} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}>
                    <Eye size={13} />
                  </button>
                  <button onClick={() => handleDeleteModule(currentMod.id)} className="frappe-btn" style={{ padding: 'var(--space-1.5) var(--space-2.5)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-4)' }}>
                {[
                  { id: 'list', label: 'Schema Fields', icon: Table },
                  { id: 'schema', label: 'Relationships', icon: GitBranch },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id as typeof activeSection)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)',
                      padding: 'var(--space-2) var(--space-3)',
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      fontSize: 'var(--text-xs)', fontWeight: activeSection === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                      color: activeSection === tab.id ? '#d97706' : 'var(--color-text-secondary)',
                      borderBottom: activeSection === tab.id ? '2px solid #d97706' : '2px solid transparent',
                      marginBottom: '-1px',
                    }}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeSection === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {/* Field Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px', gap: 'var(--space-2)', padding: '0 var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    {['Field Name', 'Type', 'Required', ''].map(h => (
                      <span key={h} style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                    ))}
                  </div>
                  {[
                    { name: 'request_id', type: 'Auto ID', required: true },
                    { name: 'customer_name', type: 'Data', required: true },
                    { name: 'customer', type: 'Link (Customer)', required: true },
                    { name: 'request_date', type: 'Date', required: true },
                    { name: 'priority', type: 'Select', required: false },
                    { name: 'description', type: 'Text Editor', required: false },
                    { name: 'assigned_technician', type: 'Link (Employee)', required: false },
                    { name: 'items', type: 'Child Table', required: false },
                  ].map(field => (
                    <div key={field.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px', gap: 'var(--space-2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace', color: 'var(--color-text)', fontWeight: 'var(--weight-medium)' }}>{field.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{field.type}</span>
                      {field.required
                        ? <CheckCircle size={13} style={{ color: '#059669' }} />
                        : <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>optional</span>}
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <button onClick={() => { /* Edit field */ }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-text-secondary)' }}><Edit3 size={11} /></button>
                        <button onClick={() => { /* Delete field */ }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-danger)' }}><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { /* Add permission rule */ }} className="frappe-btn frappe-btn-secondary" style={{ alignSelf: 'flex-start', marginTop: 'var(--space-1)' }}>
                    <PlusCircle size={13} />
                    <span>Add Field</span>
                  </button>
                </div>
              )}

              {activeSection === 'schema' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {[
                    { from: currentMod.name, type: 'Many-to-One', to: 'Customer', via: 'customer' },
                    { from: currentMod.name, type: 'Many-to-One', to: 'Employee', via: 'assigned_technician' },
                    { from: currentMod.name, type: 'One-to-Many', to: 'Maintenance Item', via: 'items table' },
                  ].map((rel, i) => (
                    <div key={i} style={{ padding: 'var(--space-3)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <GitBranch size={14} style={{ color: '#d97706' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>
                          {rel.from} → {rel.to}
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', margin: 0 }}>{rel.type} · via {rel.via}</p>
                      </div>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(217,119,6,0.1)', color: '#d97706', fontWeight: 'var(--weight-semibold)' }}>{rel.type}</span>
                    </div>
                  ))}
                  <button onClick={() => { /* Add relationship */ }} className="frappe-btn frappe-btn-secondary" style={{ alignSelf: 'flex-start' }}>
                    <Link size={13} />
                    <span>Add Relationship</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    
      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Item" : "Create New"}
        fields={[ { name: 'name', label: 'Name', type: 'text', required: true }, { name: 'slug', label: 'Slug', type: 'text', required: true }, { name: 'color', label: 'Color', type: 'text' } ]}
        initialData={editingItem}
      />
    </div>
  );
}

import { Suspense } from 'react';

export default function ERPModulesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Loading Custom Modules...</div>}>
      <ERPModulesPageContent />
    </Suspense>
  );
}
