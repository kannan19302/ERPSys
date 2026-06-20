'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { ArrowLeft, Save, Eye, Smartphone, Tablet, Monitor, Sparkles, Rocket, X } from 'lucide-react';

import { useToast } from '@/components/builder/ToastProvider';
import { useBuilderStore } from '@/stores/builderStore';
import { BuilderSidebar } from '@/components/builder/BuilderSidebar';
import { BuilderProperties } from '@/components/builder/BuilderProperties';
import { SortableField } from '@/components/builder/SortableField';
import { DeployFormModal } from '@/components/builder/DeployFormModal';

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export interface FormBuilderWorkspaceProps {
  /** 'new' to start a blank form, or an existing form id. */
  formId: string;
  /** Overlay close handler. When omitted, falls back to navigating to /builder/erp/forms. */
  onBack?: () => void;
  /** Called after a successful save (both new + existing). Used to auto-link a form to an app. */
  onSaved?: (form: { id: string; name: string }) => void;
  /** When embedded inside the app studio, the header shows "Close" instead of routing away. */
  embedded?: boolean;
  /** Pre-fill deploy/module metadata (e.g. the host app's module). */
  defaultModule?: string;
}

/**
 * The full visual Form Builder workspace. Used both as the standalone route
 * (/builder/erp/forms/[id]) and embedded as a full-screen overlay inside the
 * Custom App Studio so users never leave "build mode".
 */
export function FormBuilderWorkspace({ formId, onBack, onSaved, embedded = false, defaultModule }: FormBuilderWorkspaceProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const {
    fields, setFields, selectedFieldId, setSelectedFieldId, previewMode, setPreviewMode,
    moveField,
  } = useBuilderStore();
  const [currentId, setCurrentId] = useState(formId);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploySettings, setDeploySettings] = useState({ module: defaultModule || '', slug: '', title: '' });

  useEffect(() => { setCurrentId(formId); }, [formId]);

  useEffect(() => {
    let isMounted = true;
    async function loadForm() {
      if (formId === 'new') {
        setFields([
          { id: 'f_1', type: 'Section Break', label: 'General Info', name: 'general_info_section', required: false, readOnly: false, weight: 1, columnSpan: 12 },
          { id: 'f_2', type: 'Data', label: 'Form Name', name: 'form_name', required: true, readOnly: false, columnSpan: 12 },
          { id: 'f_3', type: 'Select', label: 'Status', name: 'status', required: false, readOnly: false, options: 'Draft\nPublished', columnSpan: 12 },
        ]);
        useBuilderStore.getState().updateFormSettings({});
        setDeploySettings({ module: defaultModule || 'Sales', slug: '', title: '' });
        return;
      }

      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/builder/forms/${formId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          let rawFields = data.fields || [];
          if (typeof rawFields === 'string') { try { rawFields = JSON.parse(rawFields); } catch { rawFields = []; } }
          if (Array.isArray(rawFields)) setFields(rawFields);
          let rawSettings = data.settings || {};
          if (typeof rawSettings === 'string') { try { rawSettings = JSON.parse(rawSettings); } catch { rawSettings = {}; } }
          useBuilderStore.getState().updateFormSettings(rawSettings);
          setDeploySettings({ module: data.module || defaultModule || 'Sales', slug: data.slug || '', title: data.name || '' });
        } else {
          showToast('Form not found or failed to load.', 'error');
        }
      } catch {
        if (isMounted) showToast('Network error loading form.', 'error');
      }

      try {
        const token = localStorage.getItem('token') || '';
        fetch('/api/v1/builder/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ event: 'canvas_opened', entityType: 'FORM', entityId: formId }),
        }).catch(() => {});
      } catch { /* ignore */ }
    }
    loadForm();
    return () => { isMounted = false; };
  }, [formId, setFields, showToast, defaultModule]);

  const handleClose = () => {
    if (onBack) onBack();
    else router.push('/builder/erp/forms');
  };

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      const formSettings = useBuilderStore.getState().formSettings;
      const isNew = currentId === 'new';
      const slug = deploySettings.slug || (isNew ? `custom-${Date.now()}` : currentId);
      const title = deploySettings.title || `Form ${slug}`;
      const module = deploySettings.module || defaultModule || 'Sales';

      const payload = { module, slug, name: title, fields, settings: formSettings, status: publish ? 'PUBLISHED' : 'DRAFT' };

      const res = await fetch(`/api/v1/builder/forms${isNew ? '' : `/${currentId}`}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(publish ? 'Form successfully published!' : 'Form successfully saved!', 'success');
        window.dispatchEvent(new Event('unerp_page_registry_updated'));
        const data = await res.json().catch(() => null);
        const savedId = isNew ? data?.id : currentId;
        if (isNew && savedId) setCurrentId(savedId);
        if (onSaved && savedId) {
          onSaved({ id: savedId, name: title });
        } else if (isNew && savedId) {
          router.push(`/builder/erp/forms/${savedId}`);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`Failed to save: ${errorData.message || 'Server error'}`, 'error');
      }
    } catch {
      showToast('Error saving to server.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      moveField(oldIndex, newIndex);
    }
  };

  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  return (
    <div className="builder-dark-theme" onClick={() => setSelectedFieldId(null)} style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      position: 'fixed', top: 0, left: 0, zIndex: 10000,
      backgroundColor: '#0f172a', color: '#e2e8f0', fontFamily: 'var(--font-sans)', overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-4)', height: '60px',
        background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button onClick={handleClose}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {embedded ? <X size={16} /> : <ArrowLeft size={16} />}
          </button>
          <div>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'white' }}>Form Builder</h1>
            <span style={{ fontSize: 'var(--text-xs)', color: '#94a3b8' }}>{currentId === 'new' ? 'New Form' : (deploySettings.title || `ID: ${currentId}`)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {([['desktop', Monitor, 'Desktop'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Mobile']] as const).map(([v, Icon, label]) => (
            <button key={v} onClick={() => setViewport(v)}
              style={{ background: viewport === v ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewport === v ? 'white' : '#64748b', border: 'none', padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon size={14} /> <span style={{ fontSize: '12px' }}>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button onClick={(e) => {
            e.stopPropagation();
            const prompt = window.prompt("What kind of form do you want to generate? (e.g., 'A patient intake form with medical history')");
            if (!prompt) return;
            showToast('Generating schema with AI...', 'success');
            fetch('/api/v1/builder/ai-generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
              body: JSON.stringify({ prompt }),
            }).then(res => res.json()).then(data => {
              if (data.schema) { setFields(data.schema); showToast('Form generated successfully!', 'success'); }
              else showToast('AI failed to generate a valid schema.', 'error');
            }).catch(() => showToast('Failed to connect to AI service.', 'error'));
          }}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', fontSize: '13px' }}>
            <Sparkles size={14} /> <span>AI Generate</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setPreviewMode(!previewMode); }}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: previewMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', color: previewMode ? '#60a5fa' : 'white', border: '1px solid ' + (previewMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.1)'), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', fontSize: '13px' }}>
            <Eye size={14} /> <span>{previewMode ? 'Build Mode' : 'Preview Mode'}</span>
          </button>
          {!embedded && (
            <button onClick={(e) => { e.stopPropagation(); setShowDeployModal(true); }}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'transparent', color: '#10b981', border: '1px solid #10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', fontSize: '13px' }}>
              <Rocket size={14} /> <span>Deploy to App</span>
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleSave(false); }} disabled={isSaving}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', fontSize: '13px' }}>
            {isSaving ? <span className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} /> : <Save size={14} />}
            <span>{embedded ? 'Save & Link' : 'Save Form'}</span>
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!previewMode && <BuilderSidebar />}

        <div style={{ flex: 1, position: 'relative', backgroundColor: '#0f172a', backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', overflow: 'hidden' }}>
          <TransformWrapper initialScale={1} minScale={0.2} maxScale={3} centerOnInit panning={{ excluded: ['builder-field-box'] }} wheel={{ step: 0.1 }} doubleClick={{ disabled: true }}>
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div style={{ position: 'absolute', bottom: 'var(--space-4)', right: 'var(--space-4)', zIndex: 10, display: 'flex', gap: 'var(--space-2)' }}>
                  <button onClick={() => zoomIn()} style={{ padding: 'var(--space-2)', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>+</button>
                  <button onClick={() => zoomOut()} style={{ padding: 'var(--space-2)', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>-</button>
                  <button onClick={() => resetTransform()} style={{ padding: 'var(--space-2) var(--space-4)', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Reset</button>
                </div>

                <TransformComponent wrapperStyle={{ width: '100%', height: '100%', cursor: previewMode ? 'default' : 'grab' }}>
                  <div style={{ padding: '200px', width: '2400px', minHeight: '1600px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '100%', maxWidth: viewport === 'desktop' ? (previewMode ? '1000px' : '900px') : (viewport === 'tablet' ? '768px' : '375px'),
                      background: 'white', color: '#0f172a', padding: previewMode ? 'var(--space-8)' : 'var(--space-4)',
                      borderRadius: viewport === 'desktop' ? 'var(--radius-lg)' : '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                      transition: 'max-width var(--duration-normal)', minHeight: viewport === 'desktop' ? '800px' : (viewport === 'tablet' ? '1024px' : '812px'),
                      border: viewport !== 'desktop' ? '12px solid #1e293b' : '1px solid var(--color-border)',
                    }}>
                      {viewport !== 'desktop' && (
                        <div style={{ height: '20px', display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                          <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '4px' }} />
                        </div>
                      )}

                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={fields.map(f => f.id)} strategy={rectSortingStrategy}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-4)' }}>
                            {fields.length === 0 && !previewMode && (
                              <div style={{ gridColumn: 'span 12', padding: 'var(--space-10)', textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: 'var(--radius-lg)', color: '#64748b' }}>
                                Drag fields from the palette or use the Tree to build your layout.
                              </div>
                            )}
                            {fields.map((field) => (
                              <SortableField key={field.id} field={field} isSelected={selectedFieldId === field.id && !previewMode} onClick={() => setSelectedFieldId(field.id)} />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>

        {!previewMode && <BuilderProperties />}
      </div>

      {!embedded && (
        <DeployFormModal
          isOpen={showDeployModal}
          onClose={() => setShowDeployModal(false)}
          pageId={currentId === 'new' ? '' : String(currentId)}
          existingModule={deploySettings.module}
          existingSlug={deploySettings.slug}
          existingTitle={deploySettings.title}
          onPublished={(result) => {
            setDeploySettings((prev) => ({ module: prev.module || result.route.split('/')[2] || '', slug: prev.slug || result.route.split('/')[3] || '', title: prev.title }));
            setShowDeployModal(false);
          }}
        />
      )}
    </div>
  );
}
