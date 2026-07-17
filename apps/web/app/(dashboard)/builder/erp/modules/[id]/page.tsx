'use client';
import styles from './page.module.css';
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
import { useApiClient } from '@unerp/framework';

const FIELD_TYPES = [
  { type: 'text', label: 'Short Text', icon: Type },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'boolean', label: 'Checkbox', icon: ToggleLeft },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'link', label: 'Link (Foreign Key)', icon: Link2 },
];

export default function EntityDesignerWorkspace() {
  const client = useApiClient();
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
          const data = await client.get<any>(`/builder/modules/${params.id}`);
          setModuleData(data);
          const entities = typeof data.entities === 'string' ? JSON.parse(data.entities) : data.entities;
          if (Array.isArray(entities) && entities.length > 0) {
            setFields(entities[0].fields || []);
          } else {
            setFields([
              { id: `f_${Date.now()}`, type: 'text', name: 'title', label: 'Title', required: true }
            ]);
          }
      } catch (err) {
        showToast('Failed to load module', 'error');
      }
    }
    if (params.id && params.id !== 'new') {
      loadModule();
    }
  }, [client, params.id, showToast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        entities: [
          {
            name: moduleData?.name || 'CustomEntity',
            tableName: moduleData?.slug || 'custom_entity',
            fields: fields
          }
        ]
      };

      await client.patch(`/builder/modules/${params.id}`, payload);
      showToast('Module schema saved successfully!', 'success');
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
    <div className={styles.s1}>
      {/* Top Navbar */}
      <div className={styles.s2}>
        <div className="ui-hstack-4">
          <button onClick={() => router.push('/builder/erp/modules')} className={styles.s3}>
            <ArrowLeft size={18} />
          </button>
          <div className="ui-hstack-2">
            <Database size={18} className={styles.s4} />
            <h1 className={styles.s5}>
              Entity Designer: {moduleData?.name || 'Loading...'}
            </h1>
          </div>
        </div>
        <div className="ui-flex ui-gap-2">
          <button className="ui-btn ui-btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Schema'}</span>
          </button>
        </div>
      </div>

      <div className={styles.s6}>
        {/* Left Sidebar - Palette */}
        <div className={styles.s7}>
          <div className={styles.s8}>
            <h3 className={styles.s9}>
              Database Columns
            </h3>
            <p className={styles.s10}>
              Click to add fields to your custom entity schema.
            </p>
          </div>
          <div className={styles.s11}>
            {FIELD_TYPES.map((ft) => (
              <button
                key={ft.type}
                onClick={() => addField(ft.type)}
                className={styles.s12}
              >
                <ft.icon size={16} className="ui-text-tertiary" />
                <span>{ft.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div className={styles.s13}>
          
          <div className={styles.s14}>
            <div className={styles.s15}>
              <button onClick={() => setActiveTab('schema')} className={`ui-btn ${activeTab === 'schema' ? 'ui-btn-primary' : ''} ${styles.s16}`} style={{ background: activeTab === 'schema' ? '' : 'transparent', color: activeTab === 'schema' ? '' : 'var(--color-text-secondary)' }}><Database size={14}/>Schema</button>
              <button onClick={() => setActiveTab('permissions')} className={`ui-btn ${activeTab === 'permissions' ? 'ui-btn-primary' : ''} ${styles.s16}`} style={{ background: activeTab === 'permissions' ? '' : 'transparent', color: activeTab === 'permissions' ? '' : 'var(--color-text-secondary)' }}><Shield size={14}/>Permissions</button>
            </div>
          </div>

          <div className={styles.s17}>
            
            {activeTab === 'schema' && (
              <div className={`ui-card ${styles.s18}`} >
                <h2 className={styles.s19}>
                  Table Schema
                </h2>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={fields.map((f) => f.id)} strategy={rectSortingStrategy}>
                    <div className="ui-stack-3">
                      {fields.length === 0 ? (
                        <div className={styles.s20}>
                          No fields added yet. Click a field type on the left to add it.
                        </div>
                      ) : (
                        fields.map((field) => (
                          <div key={field.id} onClick={() => setSelectedFieldId(field.id)} style={{ border: selectedFieldId === field.id ? '2px solid #d97706' : '2px solid transparent' }} className={styles.s21}>
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
              <div className="ui-card p-6">
                 <h2 className={styles.s19}>
                  Role-Based Access
                </h2>
                <p className={styles.s22}>Define which roles can interact with records in this custom module.</p>
                {/* Mocked UI for now */}
                <div className="ui-form-group">
                  <label>Read Access (Roles)</label>
                  <input type="text" className="ui-input" placeholder="e.g. System Admin, Manager" defaultValue="System Admin" />
                </div>
                <div className="ui-form-group">
                  <label>Write Access (Roles)</label>
                  <input type="text" className="ui-input" placeholder="e.g. System Admin" defaultValue="System Admin" />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {activeTab === 'schema' && (
          <div className={styles.s23}>
            <div className={styles.s8}>
              <h3 className={styles.s24}>
                Field Properties
              </h3>
            </div>
            
            <div className="p-4">
              {selectedField ? (
                <div className="ui-stack-4">
                  <div className="ui-form-group">
                    <label>Field Label</label>
                    <input 
                      type="text" 
                      className="ui-input" 
                      value={selectedField.label} 
                      onChange={(e) => updateSelectedField('label', e.target.value)} 
                    />
                  </div>
                  <div className="ui-form-group">
                    <label>Database Column Name (Slug)</label>
                    <input 
                      type="text" 
                      className="ui-input font-mono"
                      value={selectedField.name} 
                      onChange={(e) => updateSelectedField('name', e.target.value)} 
                    />
                  </div>
                  
                  {selectedField.type === 'select' && (
                    <div className="ui-form-group">
                      <label>Options (One per line)</label>
                      <textarea 
                        className="ui-input" 
                        rows={4}
                        value={selectedField.options || ''} 
                        onChange={(e) => updateSelectedField('options', e.target.value)} 
                        placeholder="Option 1&#10;Option 2"
                      />
                    </div>
                  )}

                  {selectedField.type === 'link' && (
                    <div className="ui-form-group">
                      <label>Target Table (Foreign Key)</label>
                      <select 
                        className="ui-input"
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

                  <div className={`ui-form-group ${styles.s25}`} >
                    <input 
                      type="checkbox" 
                      checked={selectedField.required} 
                      onChange={(e) => updateSelectedField('required', e.target.checked)} 
                    />
                    <label className="m-0">Required Field</label>
                  </div>
                  
                  <div className={`ui-form-group ${styles.s25}`} >
                    <input 
                      type="checkbox" 
                      checked={selectedField.unique} 
                      onChange={(e) => updateSelectedField('unique', e.target.checked)} 
                    />
                    <label className="m-0">Enforce Unique Values</label>
                  </div>
                </div>
              ) : (
                <div className={styles.s26}>
                  <Settings size={32} className={styles.s27} />
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
