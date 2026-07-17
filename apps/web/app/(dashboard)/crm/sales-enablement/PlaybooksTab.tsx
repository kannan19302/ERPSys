'use client';
import styles from './PlaybooksTab.module.css';
import React, { useState, useEffect } from 'react';
import { Card, StatusBadge, Spinner, Button, Modal, FormField, Input, Textarea } from '@unerp/ui';
import { BookOpen, Plus, Layers, Swords, ChevronRight, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface Playbook {
  id: string;
  name: string;
  description: string | null;
  pipelineId: string | null;
  pipelineName: string | null;
  isActive: boolean;
  stages: Array<{ id: string }>;
  battlecards: Array<{ id: string }>;
  createdAt: string;
}

const MOCK_PLAYBOOKS: Playbook[] = [
  { id: '1', name: 'Enterprise Sales', description: 'Playbook for large enterprise deals with long sales cycles', pipelineId: 'p1', pipelineName: 'Enterprise Pipeline', isActive: true, stages: [{ id: 's1' }, { id: 's2' }, { id: 's3' }], battlecards: [{ id: 'b1' }, { id: 'b2' }], createdAt: '2026-06-01' },
  { id: '2', name: 'SMB Quick Close', description: 'Fast-track playbook for small and mid-size businesses', pipelineId: 'p2', pipelineName: 'SMB Pipeline', isActive: true, stages: [{ id: 's4' }, { id: 's5' }], battlecards: [{ id: 'b3' }], createdAt: '2026-06-10' },
  { id: '3', name: 'Partner Channel', description: 'Reseller and partner-driven sales motion', pipelineId: null, pipelineName: null, isActive: false, stages: [{ id: 's6' }], battlecards: [], createdAt: '2026-05-20' },
  { id: '4', name: 'Inbound Qualification', description: 'Playbook for qualifying and converting inbound marketing leads', pipelineId: 'p3', pipelineName: 'Inbound Pipeline', isActive: true, stages: [{ id: 's7' }, { id: 's8' }, { id: 's9' }, { id: 's10' }], battlecards: [{ id: 'b4' }, { id: 'b5' }, { id: 'b6' }], createdAt: '2026-06-15' },
  { id: '5', name: 'Renewal Playbook', description: 'Customer renewal and upsell strategies for existing accounts', pipelineId: 'p4', pipelineName: 'Renewals Pipeline', isActive: true, stages: [{ id: 's11' }, { id: 's12' }], battlecards: [{ id: 'b7' }], createdAt: '2026-06-18' },
];

export default function PlaybooksTab() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', pipelineId: '' });
  const client = useApiClient();

  const fetchPlaybooks = async () => {
    setLoading(true);
    try {
      const res = await client.get<any>('/crm/playbooks');
      setPlaybooks(Array.isArray(res) ? res : res.data || MOCK_PLAYBOOKS);
    } catch {
      setPlaybooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlaybooks(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await client.post('/crm/playbooks', {
        name: form.name.trim(),
        description: form.description.trim() || null,
        pipelineId: form.pipelineId.trim() || null,
      });
      setShowModal(false);
      setForm({ name: '', description: '', pipelineId: '' });
      fetchPlaybooks();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.style0}><Spinner /></div>;
  }

  return (
    <div className={styles.style1}>
      <div className="ui-flex-end">
        <Button onClick={() => setShowModal(true)}>
          <Plus className={styles.style2} /> New Playbook
        </Button>
      </div>

      {/* Summary Stats */}
      <div className={styles.s1}>
        <Card className={styles.style3}>
          <div className={styles.style4}>
            {playbooks.length}
          </div>
          <div className={styles.style5}>
            Total Playbooks
          </div>
        </Card>
        <Card className={styles.style6}>
          <div className={styles.style7}>
            {playbooks.filter((p) => p.isActive).length}
          </div>
          <div className={styles.style8}>
            Active
          </div>
        </Card>
        <Card className={styles.style9}>
          <div className={styles.style10}>
            {playbooks.reduce((sum, p) => sum + p.stages.length, 0)}
          </div>
          <div className={styles.style11}>
            Total Stages
          </div>
        </Card>
        <Card className={styles.style12}>
          <div className={styles.style13}>
            {playbooks.reduce((sum, p) => sum + p.battlecards.length, 0)}
          </div>
          <div className={styles.style14}>
            Total Battlecards
          </div>
        </Card>
      </div>

      <div className={styles.style15}>
        {playbooks.map((pb) => (
          <Card key={pb.id} className={styles.style16}>
            <div className="ui-flex-between ui-items-start">
              <div className={styles.style17}>
                <BookOpen className={styles.style18} />
                <h3 className={styles.style19}>
                  {pb.name}
                </h3>
              </div>
              <StatusBadge
                status={pb.isActive ? 'ACTIVE' : 'INACTIVE'}
              />
            </div>

            {pb.description && (
              <p className={styles.s2}>
                {pb.description}
              </p>
            )}

            {pb.pipelineName && (
              <div className={styles.s3}>
                <Layers className={styles.style20} />
                <span className={styles.style21}>{pb.pipelineName}</span>
              </div>
            )}

            <div className={styles.s4}>
              <span className="ui-flex ui-items-center ui-gap-1">
                <ChevronRight className={styles.style22} />
                {pb.stages.length} {pb.stages.length === 1 ? 'stage' : 'stages'}
              </span>
              <span className="ui-flex ui-items-center ui-gap-1">
                <Swords className={styles.style23} />
                {pb.battlecards.length} {pb.battlecards.length === 1 ? 'battlecard' : 'battlecards'}
              </span>
            </div>

            <div className={styles.s5}>
              <span className={styles.s6}>
                <Calendar className={styles.style24} />
                Created {new Date(pb.createdAt).toLocaleDateString()}
              </span>
              <span style={{ color: pb.isActive ? 'var(--color-success)' : 'var(--color-text-secondary)' }} className={styles.s7}>
                {pb.isActive
                  ? <ToggleRight className={styles.style25} />
                  : <ToggleLeft className={styles.style26} />}
                {pb.isActive ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {playbooks.length === 0 && (
        <div className={styles.style27}>
          <BookOpen className={styles.s8} />
          <p>No playbooks yet. Create your first playbook to get started.</p>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Playbook"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleCreate} disabled={!form.name.trim() || saving}>{saving ? 'Creating...' : 'Create Playbook'}</Button></>}
      >
        <div className={styles.style28}>
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Enterprise Sales" />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the sales playbook..." rows={3} />
          </FormField>
          <FormField label="Pipeline ID (optional)">
            <Input value={form.pipelineId} onChange={(e) => setForm({ ...form, pipelineId: e.target.value })} placeholder="Link to a pipeline" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
