'use client';
import styles from './page.module.css';
import React, { useEffect, useState } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent } from '@unerp/ui';
import { Plus, Trash2, GripVertical, AlertCircle, Save } from 'lucide-react';
import { Modal, inputStyle, labelStyle } from '../../_components/Modal';
import { apiGet, apiSend } from '../../_components/api';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Stage {
  id: string;
  name: string;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  position?: number;
}
interface Pipeline {
  id: string;
  name: string;
  isDefault?: boolean;
  stages?: Stage[];
}

const emptyStage = (): Omit<Stage, 'id'> & { id: string } => ({ id: `new-${Math.random().toString(36).slice(2, 9)}`, name: '', probability: 10, isWon: false, isLost: false });

function SortableRow({ stage, onChange, onDelete }: { stage: Stage; onChange: (s: Stage) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'grid',
    gridTemplateColumns: '24px 2fr 1fr auto auto auto',
    gap: 'var(--space-2)',
    alignItems: 'center',
    padding: 'var(--space-2)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg-elevated, var(--bg-primary))',
    marginBottom: 'var(--space-2)',
  };
  return (
    <div ref={setNodeRef} style={style}>
      <button {...attributes} {...listeners} className={styles.style0} aria-label="Drag">
        <GripVertical size={16} />
      </button>
      <input style={inputStyle} placeholder="Stage name" value={stage.name} onChange={(e) => onChange({ ...stage, name: e.target.value })} />
      <input style={inputStyle} type="number" min={0} max={100} placeholder="Prob %" value={stage.probability} onChange={(e) => onChange({ ...stage, probability: Number(e.target.value) })} />
      <label className={styles.style1}>
        <input type="checkbox" checked={stage.isWon} onChange={(e) => onChange({ ...stage, isWon: e.target.checked, isLost: e.target.checked ? false : stage.isLost })} /> Won
      </label>
      <label className={styles.style2}>
        <input type="checkbox" checked={stage.isLost} onChange={(e) => onChange({ ...stage, isLost: e.target.checked, isWon: e.target.checked ? false : stage.isWon })} /> Lost
      </label>
      <button onClick={onDelete} className="ui-btn-icon ui-text-danger" aria-label="Delete stage"><Trash2 size={16} /></button>
    </div>
  );
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet<Pipeline[]>('/crm/pipelines');
      const list = Array.isArray(data) ? data : [];
      setPipelines(list);
      if (list.length > 0 && !selectedId && list[0]) setSelectedId(list[0].id);
    } catch { setError('Could not load pipelines.'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedId) { setStages([]); return; }
    (async () => {
      try {
        const data = await apiGet<Stage[]>(`/crm/pipelines/${selectedId}/stages`);
        setStages(Array.isArray(data) ? data : []);
      } catch { setStages([]); }
    })();
  }, [selectedId]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = stages.findIndex((s) => s.id === active.id);
    const newIdx = stages.findIndex((s) => s.id === over.id);
    setStages(arrayMove(stages, oldIdx, newIdx));
  };

  const addStage = () => setStages((prev) => [...prev, emptyStage() as Stage]);
  const updateStage = (s: Stage) => setStages((prev) => prev.map((x) => x.id === s.id ? s : x));
  const removeStage = (id: string) => setStages((prev) => prev.filter((s) => s.id !== id));

  const saveStages = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      // Persist reorder + upsert each stage. GUESSED SHAPE.
      await apiSend(`/crm/pipelines/${selectedId}/stages/reorder`, 'POST', {
        stages: stages.map((s, i) => ({
          id: s.id.startsWith('new-') ? undefined : s.id,
          name: s.name,
          probability: s.probability,
          isWon: s.isWon,
          isLost: s.isLost,
          position: i,
        })),
      });
      const fresh = await apiGet<Stage[]>(`/crm/pipelines/${selectedId}/stages`);
      setStages(Array.isArray(fresh) ? fresh : []);
    } catch { setError('Could not save stages.'); } finally { setSaving(false); }
  };

  const createPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const p = await apiSend<Pipeline>('/crm/pipelines', 'POST', { name: newName });
      setCreating(false);
      setNewName('');
      await load();
      if (p?.id) setSelectedId(p.id);
    } catch { setError('Could not create pipeline.'); }
  };

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Sales Pipelines"
        description="Configure the stages for each sales process."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Settings', href: '/crm/settings' }, { label: 'Pipelines' }]}
        actions={
          <ProtectedComponent permission="crm.pipelines.create">
            <Button variant="primary" size="sm" onClick={() => setCreating(true)}><Plus size={14} /> New Pipeline</Button>
          </ProtectedComponent>
        }
      />

      {error && (
        <div className={styles.style3}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <div className={styles.style4}>
        <Card padding="sm">
          <div className={styles.style5}>Pipelines</div>
          {pipelines.length === 0 && <div className={styles.style6}>No pipelines yet.</div>}
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{ background: selectedId === p.id ? 'var(--color-bg-sunken)' : 'transparent', fontWeight: selectedId === p.id ? 'var(--weight-semibold)' : 'var(--weight-normal)' }} className={styles.s1}
            >
              <span>{p.name}</span>
              {p.isDefault && <Badge variant="success">Default</Badge>}
            </button>
          ))}
        </Card>

        <Card padding="md">
          {!selectedId ? (
            <p className={styles.style7}>Select a pipeline to edit its stages.</p>
          ) : (
            <>
              <div className={styles.style8}>
                <h4 className="m-0">Stages</h4>
                <div className="ui-flex ui-gap-2">
                  <ProtectedComponent permission="crm.pipelines.update">
                    <Button variant="outline" size="sm" onClick={addStage}><Plus size={14} /> Add Stage</Button>
                    <Button variant="primary" size="sm" onClick={saveStages} disabled={saving}><Save size={14} /> {saving ? 'Saving…' : 'Save Order'}</Button>
                  </ProtectedComponent>
                </div>
              </div>
              {stages.length === 0 && <p className={styles.style9}>No stages yet. Add your first stage.</p>}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  {stages.map((s) => (
                    <SortableRow key={s.id} stage={s} onChange={updateStage} onDelete={() => removeStage(s.id)} />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          )}
        </Card>
      </div>

      {creating && (
        <Modal title="New Pipeline" onClose={() => setCreating(false)}>
          <form onSubmit={createPipeline} className="ui-stack-3">
            <div>
              <label style={labelStyle}>Pipeline Name</label>
              <input style={inputStyle} required value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setCreating(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Create</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
