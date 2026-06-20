'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { ArrowLeft, Save, Database, Shield, Link2, Settings, Type, Hash, Calendar, ToggleLeft, List, BoxSelect } from 'lucide-react';

import { SortableField } from '@/components/builder/SortableField';
import { useToast } from '@/components/builder/ToastProvider';

const FIELD_TYPES = [
  { type: 'text', label: 'Short Text', icon: Type },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'boolean', label: 'Checkbox', icon: ToggleLeft },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'link', label: 'Link (Foreign Key)', icon: Link2 },
];

export default function EntityDesignerWorkspace() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [moduleData, setModuleData] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'schema' | 'permissions' | 'relationships'>('schema');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    async function loadModule() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/builder/modules/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setModuleData(data);
          const entities = typeof data.entities === 'string' ? JSON.parse(data.entities) : data.entities;
          if (Array.isArray(entities) && entities.length > 0) {
            setFields(entities[0].fields || []);
          } else {
            setFields([
              { id: `f_${Date.now()}`, type: 'text', name: 'title', label: 'Title', required: true }
            ]);
          }
        }
      } catch (err) {
        showToast('Failed to load module', 'error');
      }
    }
    if (params.id && params.id !== 'new') {
      loadModule();
    }
  }, [params.id, showToast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      
      const payload = {
        entities: [
          {
            name: moduleData?.name || 'CustomEntity',
            tableName: moduleData?.slug || 'custom_entity',
            fields: fields
          }
        ]
      };

      const res = await fetch(`/api/v1/builder/modules/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Module schema saved successfully!', 'success');
      } else {
        showToast('Failed to save module.', 'error');
      }
    } catch (err) {
      showToast('Network error while saving.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addField = (type: string) => {
    const newField = {
      id: `f_${Date.now()}`,
      type: type,
      name: `field_${fields.length + 1}`,
      label: `New ${type} field`,
      required: false,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        return newItems;
      });
    }
  };

  const updateSelectedField = (key: string, value: any) => {
    if (!selectedFieldId) return;
    setFields(fields.map(f => f.id === selectedFieldId ? { ...f, [key]: value } : f));
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      {/* Top Navbar */}
      <div style={{ height: '60px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-4)', backgroundColor: 'var(--color-bg-elevated)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button onClick={() => router.push('/builder/erp/modules')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Database size={18} style={{ color: '#d97706' }} />
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>
              Entity Designer: {moduleData?.name || 'Loading...'}
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Schema'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Palette */}
        <div style={{ width: '260px', borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-elevated)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-2) 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Database Columns
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0 }}>
              Click to add fields to your custom entity schema.
            </p>
          </div>
          <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', overflowY: 'auto' }}>
            {FIELD_TYPES.map((ft) => (
              <button
                key={ft.type}
                onClick={() => addField(ft.type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)',
                  cursor: 'pointer', color: 'var(--color-text)', fontSize: 'var(--text-sm)', transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <ft.icon size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <span>{ft.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div style={{ flexGrow: 1, backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', background: 'var(--color-bg-elevated)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <button onClick={() => setActiveTab('schema')} className={`frappe-btn ${activeTab === 'schema' ? 'frappe-btn-primary' : ''}`} style={{ background: activeTab === 'schema' ? '' : 'transparent', color: activeTab === 'schema' ? '' : 'var(--color-text-secondary)', border: 'none' }}><Database size={14}/>Schema</button>
              <button onClick={() => setActiveTab('permissions')} className={`frappe-btn ${activeTab === 'permissions' ? 'frappe-btn-primary' : ''}`} style={{ background: activeTab === 'permissions' ? '' : 'transparent', color: activeTab === 'permissions' ? '' : 'var(--color-text-secondary)', border: 'none' }}><Shield size={14}/>Permissions</button>
            </div>
          </div>

          <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            
            {activeTab === 'schema' && (
              <div className="frappe-card" style={{ padding: 'var(--space-6)', minHeight: '500px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>
                  Table Schema
                </h2>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={fields.map((f) => f.id)} strategy={rectSortingStrategy}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {fields.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                          No fields added yet. Click a field type on the left to add it.
                        </div>
                      ) : (
                        fields.map((field) => (
                          <div key={field.id} onClick={() => setSelectedFieldId(field.id)} style={{ border: selectedFieldId === field.id ? '2px solid #d97706' : '2px solid transparent', borderRadius: 'var(--radius-md)', padding: '2px' }}>
                            <SortableField
                              field={field}
                              isSelected={selectedFieldId === field.id}
                              onClick={() => setSelectedFieldId(field.id)}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="frappe-card" style={{ padding: 'var(--space-6)' }}>
                 <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>
                  Role-Based Access
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>Define which roles can interact with records in this custom module.</p>
                {/* Mocked UI for now */}
                <div className="frappe-form-group">
                  <label>Read Access (Roles)</label>
                  <input type="text" className="frappe-input" placeholder="e.g. System Admin, Manager" defaultValue="System Admin" />
                </div>
                <div className="frappe-form-group">
                  <label>Write Access (Roles)</label>
                  <input type="text" className="frappe-input" placeholder="e.g. System Admin" defaultValue="System Admin" />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {activeTab === 'schema' && (
          <div style={{ width: '300px', borderLeft: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-elevated)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Field Properties
              </h3>
            </div>
            
            <div style={{ padding: 'var(--space-4)' }}>
              {selectedField ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group">
                    <label>Field Label</label>
                    <input 
                      type="text" 
                      className="frappe-input" 
                      value={selectedField.label} 
                      onChange={(e) => updateSelectedField('label', e.target.value)} 
                    />
                  </div>
                  <div className="frappe-form-group">
                    <label>Database Column Name (Slug)</label>
                    <input 
                      type="text" 
                      className="frappe-input" 
                      style={{ fontFamily: 'monospace' }}
                      value={selectedField.name} 
                      onChange={(e) => updateSelectedField('name', e.target.value)} 
                    />
                  </div>
                  
                  {selectedField.type === 'select' && (
                    <div className="frappe-form-group">
                      <label>Options (One per line)</label>
                      <textarea 
                        className="frappe-input" 
                        rows={4}
                        value={selectedField.options || ''} 
                        onChange={(e) => updateSelectedField('options', e.target.value)} 
                        placeholder="Option 1&#10;Option 2"
                      />
                    </div>
                  )}

                  {selectedField.type === 'link' && (
                    <div className="frappe-form-group">
                      <label>Target Table (Foreign Key)</label>
                      <select 
                        className="frappe-input"
                        value={selectedField.linkTarget || ''}
                        onChange={(e) => updateSelectedField('linkTarget', e.target.value)}
                      >
                        <option value="">Select Table...</option>
                        <option value="Customer">Customer</option>
                        <option value="Employee">Employee</option>
                        <option value="Product">Product</option>
                      </select>
                    </div>
                  )}

                  <div className="frappe-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedField.required} 
                      onChange={(e) => updateSelectedField('required', e.target.checked)} 
                    />
                    <label style={{ margin: 0 }}>Required Field</label>
                  </div>
                  
                  <div className="frappe-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedField.unique} 
                      onChange={(e) => updateSelectedField('unique', e.target.checked)} 
                    />
                    <label style={{ margin: 0 }}>Enforce Unique Values</label>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
                  <Settings size={32} style={{ margin: '0 auto var(--space-2) auto', opacity: 0.5 }} />
                  <p>Select a field on the canvas to edit its properties.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
