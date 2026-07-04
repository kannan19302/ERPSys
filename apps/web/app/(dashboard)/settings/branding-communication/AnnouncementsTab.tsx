'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, TextField, FormField, Textarea, Select } from '@unerp/ui';
import { Plus, Edit3, Trash2, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
}

const API_BASE = '/api/v1/admin/announcements';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ann-1', title: 'Scheduled Maintenance', message: 'System will be under maintenance on June 25 from 2:00 AM to 4:00 AM UTC.', type: 'warning', priority: 'high', isActive: true, expiresAt: '2026-06-26T00:00:00Z', createdBy: 'admin@unerp.dev', createdAt: '2026-06-20T10:00:00Z' },
  { id: 'ann-2', title: 'New Feature: Scheduled Reports', message: 'You can now schedule automated reports from the Administration panel.', type: 'info', priority: 'normal', isActive: true, expiresAt: null, createdBy: 'admin@unerp.dev', createdAt: '2026-06-19T08:00:00Z' },
  { id: 'ann-3', title: 'Security Update Required', message: 'Please update your password before July 1. Passwords older than 90 days will be expired.', type: 'critical', priority: 'high', isActive: true, expiresAt: '2026-07-01T00:00:00Z', createdBy: 'admin@unerp.dev', createdAt: '2026-06-18T12:00:00Z' },
];

export default function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState('info');
  const [formPriority, setFormPriority] = useState('normal');
  const [formExpires, setFormExpires] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    try {
      const data = await apiFetch<Announcement[]>('');
      setAnnouncements(data);
    } catch { /* keep mock */ }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const resetForm = () => {
    setFormTitle(''); setFormMessage(''); setFormType('info'); setFormPriority('normal'); setFormExpires('');
    setEditingId(null); setModalOpen(false);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };

  const openEdit = (a: Announcement) => {
    setFormTitle(a.title); setFormMessage(a.message); setFormType(a.type);
    setFormPriority(a.priority); setFormExpires(a.expiresAt ? a.expiresAt.slice(0, 10) : '');
    setEditingId(a.id); setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = { title: formTitle, message: formMessage, type: formType, priority: formPriority, expiresAt: formExpires || undefined };
    try {
      if (editingId) {
        await apiFetch(`/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('', { method: 'POST', body: JSON.stringify(payload) });
      }
      await fetchAnnouncements();
    } catch {
      if (!editingId) {
        setAnnouncements((prev) => [{ id: `ann-${Date.now()}`, ...payload, isActive: true, expiresAt: formExpires || null, createdBy: 'current-user', createdAt: new Date().toISOString() }, ...prev]);
      } else {
        setAnnouncements((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...payload, expiresAt: formExpires || null } : a)));
      }
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/${id}`, { method: 'DELETE' });
      await fetchAnnouncements();
    } catch {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const typeIcon = (type: string) => {
    if (type === 'warning') return <AlertTriangle size={14} />;
    if (type === 'critical') return <AlertOctagon size={14} />;
    return <Info size={14} />;
  };

  const typeBadgeStyle = (type: string): React.CSSProperties => {
    const map: Record<string, { color: string; background: string }> = {
      info: { color: 'var(--color-primary)', background: 'var(--color-primary-light)' },
      warning: { color: 'var(--color-warning)', background: 'var(--color-warning-light)' },
      critical: { color: 'var(--color-error)', background: 'var(--color-error-light)' },
    };
    return { fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)', display: 'inline-flex', alignItems: 'center', gap: '4px', ...(map[type] || map.info) };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={14} style={{ marginRight: 6 }} /> New Announcement
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {announcements.length === 0 && (
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            No announcements yet. Create one to get started.
          </div>
        )}
        {announcements.map((a) => (
          <div key={a.id} style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
            borderLeft: `3px solid ${a.type === 'critical' ? 'var(--color-error)' : a.type === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)'}`,
          }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0 }}>{a.title}</h3>
                  <span style={typeBadgeStyle(a.type)}>{typeIcon(a.type)} {a.type}</span>
                  {!a.isActive && (
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg)', color: 'var(--color-text-tertiary)' }}>Inactive</span>
                  )}
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0', lineHeight: '1.5' }}>
                  {a.message}
                </p>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'flex', gap: 'var(--space-3)' }}>
                  <span>Created: {new Date(a.createdAt).toLocaleDateString()}</span>
                  {a.expiresAt && <span>Expires: {new Date(a.expiresAt).toLocaleDateString()}</span>}
                  <span>Priority: {a.priority}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'var(--space-3)' }}>
                <button onClick={() => openEdit(a)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-2)', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                  <Edit3 size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-2)', cursor: 'pointer', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={resetForm}
        title={editingId ? 'Edit Announcement' : 'Create Announcement'}
        footer={
          <>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!formTitle || !formMessage}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <TextField label="Title" placeholder="Announcement title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
          <FormField label="Message">
            <Textarea rows={3} value={formMessage} onChange={(e) => setFormMessage(e.target.value)} placeholder="Announcement details..." />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Type">
              <Select value={formType} onChange={(e) => setFormType(e.target.value)}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select value={formPriority} onChange={(e) => setFormPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </Select>
            </FormField>
            <TextField label="Expires" type="date" value={formExpires} onChange={(e) => setFormExpires(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
