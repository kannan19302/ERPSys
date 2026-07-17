// @ts-nocheck
'use client';
import styles from './page.module.css';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';
import { useBuilderData } from '@/lib/hooks/useBuilderData';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
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
  const client = useApiClient();

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
      const payload = { ...data, entities: [], relationships: [], permissions: {} };
      const newMod = editingItem
        ? await client.patch(`/builder/modules/${editingItem.id}`, payload)
        : await client.post<any>('/builder/modules', payload);
      refetch();
      
      if (!editingItem) {
        router.push(`/builder/erp/modules/${newMod.id}`);
      }
    } catch {}
    setIsModalOpen(false);
  };

  const [deleteTarget, setDeleteTarget] = useState<string | number | null>(null);

  const handleDeleteModule = async (id: string) => {
    try {
      await client.delete(`/builder/modules/${id}`);
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
    <div className="p-6 ui-stack-5">
      {/* Header */}
      <PageHeader
        title="Custom Modules"
        description="Define custom DocTypes, data models, relationships, and permissions for new ERP modules"
        actions={
          <div className="ui-flex ui-gap-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => router.push('/builder/erp')}>
              ← App Studio
            </button>
            <button className="ui-btn ui-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
              <PlusCircle size={15} />
              <span>New Module</span>
            </button>
          </div>
        }
      />

      {/* Layout: List + Detail */}
      <div style={{ gridTemplateColumns: selectedModule ? '340px 1fr' : '1fr' }} className={styles.s1}>
        {/* List Side */}
        <div className="ui-stack-3">
          <div className="relative">
            <Search size={15} className="ui-input-icon-abs" />
            <input className={`ui-input ${styles.s2}`} type="text" placeholder="Search modules..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}  />
          </div>

          {/* Create New Card */}
          <div
            className={`ui-card ${styles.s3} ${styles.createModuleCard}`}
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            
          >
            <div className={styles.s4}>
              <PlusCircle size={18} className={styles.s5} />
            </div>
            <div>
              <p className={styles.s6}>Create New Module</p>
              <p className="ui-text-xs-muted m-0">Design schema from scratch</p>
            </div>
          </div>

          {filtered.map(mod => (
            <div
              key={mod.id}
              className={`ui-card ${styles.s7}`}
              onClick={() => setSelectedModule(mod.id === selectedModule ? null : mod.id)}
              style={{ border: `2px solid ${selectedModule === mod.id ? '#d97706' : 'var(--color-border)'}`, background: selectedModule === mod.id ? 'rgba(217,119,6,0.05)' : '' }}
            >
              <div className={styles.s8}>
                <div>
                  <p className={styles.s6}>{mod.name}</p>
                  <p className="ui-text-xs-muted m-0">{mod.module} Module · {mod.createdAt}</p>
                </div>
                <span style={{ background: mod.status === 'Published' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: mod.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)' }} className={styles.s9}>
                  {mod.status}
                </span>
              </div>
              <p className={styles.s10}>{mod.description}</p>
              <div className="ui-flex ui-gap-3">
                {[
                  { icon: Hash, label: `${mod.fields} fields` },
                  { icon: Table, label: `${mod.tables} tables` },
                  { icon: Link, label: `${mod.relationships} links` },
                ].map(stat => (
                  <div key={stat.label} className="ui-flex ui-items-center ui-gap-1">
                    <stat.icon size={11} className="ui-text-tertiary" />
                    <span className="ui-text-micro ui-text-muted">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selectedModule && currentMod && (
          <div className="ui-stack-4">
            {/* Module Header */}
            <div className="ui-card p-4">
              <div className={styles.s11}>
                <h2 className={styles.s12}>{currentMod.name}</h2>
                <div className={styles.s13}>
                  <button onClick={() => router.push(`/builder/erp/modules/${currentMod.id}`)} className={`ui-btn ui-btn-secondary ${styles.s14}`} >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button onClick={() => { /* Preview module */ }} className={`ui-btn ui-btn-secondary ${styles.s14}`} >
                    <Eye size={13} />
                  </button>
                  <button onClick={() => setDeleteTarget(currentMod.id)} className={`ui-btn ${styles.s15}`} >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className={styles.s16}>
                {[
                  { id: 'list', label: 'Schema Fields', icon: Table },
                  { id: 'schema', label: 'Relationships', icon: GitBranch },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id as typeof activeSection)}
                    style={{ fontWeight: activeSection === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)', color: activeSection === tab.id ? '#d97706' : 'var(--color-text-secondary)', borderBottom: activeSection === tab.id ? '2px solid #d97706' : '2px solid transparent' }} className={styles.s17}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeSection === 'list' && (
                <div className="ui-stack-2">
                  {/* Field Header */}
                  <div className={styles.s18}>
                    {['Field Name', 'Type', 'Required', ''].map(h => (
                      <span key={h} className={styles.s19}>{h}</span>
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
                    <div key={field.name} className={styles.s20}>
                      <span className={styles.s21}>{field.name}</span>
                      <span className="ui-text-xs-muted">{field.type}</span>
                      {field.required
                        ? <CheckCircle size={13} className={styles.s22} />
                        : <span className="ui-text-micro">optional</span>}
                      <div className="ui-flex ui-gap-1">
                        <button onClick={() => { /* Edit field */ }} className={styles.s23}><Edit3 size={11} /></button>
                        <button onClick={() => { /* Delete field */ }} className={styles.s24}><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { /* Add permission rule */ }} className={`ui-btn ui-btn-secondary ${styles.s25}`} >
                    <PlusCircle size={13} />
                    <span>Add Field</span>
                  </button>
                </div>
              )}

              {activeSection === 'schema' && (
                <div className="ui-stack-3">
                  {[
                    { from: currentMod.name, type: 'Many-to-One', to: 'Customer', via: 'customer' },
                    { from: currentMod.name, type: 'Many-to-One', to: 'Employee', via: 'assigned_technician' },
                    { from: currentMod.name, type: 'One-to-Many', to: 'Maintenance Item', via: 'items table' },
                  ].map((rel, i) => (
                    <div key={i} className={styles.s26}>
                      <div className={styles.s27}>
                        <GitBranch size={14} className={styles.s5} />
                      </div>
                      <div className="flex-1">
                        <p className={styles.s28}>
                          {rel.from} → {rel.to}
                        </p>
                        <p className={styles.s29}>{rel.type} · via {rel.via}</p>
                      </div>
                      <span className={styles.s30}>{rel.type}</span>
                    </div>
                  ))}
                  <button onClick={() => { /* Add relationship */ }} className={`ui-btn ui-btn-secondary ${styles.s31}`} >
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
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { handleDeleteModule(deleteTarget); setDeleteTarget(null); } }}
        title="Delete Module"
        message="Are you sure you want to delete this module? All associated data will be removed."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

import { Suspense } from 'react';

export default function ERPModulesPage() {
  return (
    <Suspense fallback={<div className={styles.s32}>Loading Custom Modules...</div>}>
      <ERPModulesPageContent />
    </Suspense>
  );
}
