'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Edit3, Trash2, X, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ann-1', title: 'Scheduled Maintenance', message: 'System will be under maintenance on June 25 from 2:00 AM to 4:00 AM UTC.', type: 'warning', priority: 'high', isActive: true, expiresAt: '2026-06-26T00:00:00Z', createdBy: 'admin@unerp.dev', createdAt: '2026-06-20T10:00:00Z' },
  { id: 'ann-2', title: 'New Feature: Scheduled Reports', message: 'You can now schedule automated reports from the Administration panel.', type: 'info', priority: 'normal', isActive: true, expiresAt: null, createdBy: 'admin@unerp.dev', createdAt: '2026-06-19T08:00:00Z' },
  { id: 'ann-3', title: 'Security Update Required', message: 'Please update your password before July 1. Passwords older than 90 days will be expired.', type: 'critical', priority: 'high', isActive: true, expiresAt: '2026-07-01T00:00:00Z', createdBy: 'admin@unerp.dev', createdAt: '2026-06-18T12:00:00Z' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  /* Form state */
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState('info');
  const [formPriority, setFormPriority] = useState('normal');
  const [formExpires, setFormExpires] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    try {
      const data = await apiFetch<Announcement[]>('');
      setAnnouncements(data);
    } catch {
      // keep mock
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const resetForm = () => {
    setFormTitle(''); setFormMessage(''); setFormType('info'); setFormPriority('normal'); setFormExpires('');
    setEditingId(null); setShowForm(false);
  };

  const openEdit = (a: Announcement) => {
    setFormTitle(a.title); setFormMessage(a.message); setFormType(a.type);
    setFormPriority(a.priority); setFormExpires(a.expiresAt ? a.expiresAt.slice(0, 10) : '');
    setEditingId(a.id); setShowForm(true);
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
      // optimistic update for mock
      if (!editingId) {
        setAnnouncements(prev => [{ id: `ann-${Date.now()}`, ...payload, isActive: true, expiresAt: formExpires || null, createdBy: 'current-user', createdAt: new Date().toISOString() }, ...prev]);
      } else {
        setAnnouncements(prev => prev.map(a => a.id === editingId ? { ...a, ...payload, expiresAt: formExpires || null } : a));
      }
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/${id}`, { method: 'DELETE' });
      await fetchAnnouncements();
    } catch {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg-elevated)',
    color: 'var(--color-text)', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Megaphone style={{ color: 'var(--color-primary)' }} />
            System Announcements
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Create and manage system-wide announcements for your organization.
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}>
          <Plus size={14} /> New Announcement
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'block' }}>Title</label>
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Announcement title" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'block' }}>Message</label>
              <textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} placeholder="Announcement details..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'block' }}>Type</label>
                <select value={formType} onChange={e => setFormType(e.target.value)} style={inputStyle}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'block' }}>Priority</label>
                <select value={formPriority} onChange={e => setFormPriority(e.target.value)} style={inputStyle}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'block' }}>Expires</label>
                <input type="date" value={formExpires} onChange={e => setFormExpires(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button onClick={handleSubmit} disabled={!formTitle || !formMessage} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                cursor: !formTitle || !formMessage ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
                opacity: !formTitle || !formMessage ? 0.5 : 1,
              }}>
                {editingId ? 'Update' : 'Create'}
              </button>
              <button onClick={resetForm} style={{
                background: 'none', border: '1px solid var(--color-border)',
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {announcements.length === 0 && (
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            No announcements yet. Create one to get started.
          </div>
        )}
        {announcements.map(a => (
          <div key={a.id} style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
            borderLeft: `3px solid ${a.type === 'critical' ? 'var(--color-error)' : a.type === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)'}`,
          }}>
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
    </div>
  );
}
