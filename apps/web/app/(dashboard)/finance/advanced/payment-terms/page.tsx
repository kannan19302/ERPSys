/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Plus, Trash2, Edit, Loader2, Save,
  AlertTriangle, Check, ListFilter, DollarSign, Calendar
} from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface PaymentTerm {
  id: string;
  name: string;
  description: string | null;
  dueDays: number;
  discountDays: number;
  discountPct: string | number;
  isActive: boolean;
}

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

export default function PaymentTermsPage() {
  const [terms, setTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDays: '',
    discountDays: '',
    discountPct: '',
    isActive: true,
  });

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/payment-terms`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json() as PaymentTerm[];
        setTerms(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const handleEdit = (term: PaymentTerm) => {
    setEditingId(term.id);
    setFormData({
      name: term.name,
      description: term.description || '',
      dueDays: String(term.dueDays),
      discountDays: String(term.discountDays),
      discountPct: String(term.discountPct),
      isActive: term.isActive,
    });
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      dueDays: '30',
      discountDays: '0',
      discountPct: '0',
      isActive: true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `${API}/payment-terms/${editingId}` : `${API}/payment-terms`;
      const method = editingId ? 'PATCH' : 'POST';
      const body = {
        name: formData.name,
        description: formData.description,
        dueDays: parseInt(formData.dueDays) || 0,
        discountDays: parseInt(formData.discountDays) || 0,
        discountPct: parseFloat(formData.discountPct) || 0,
        isActive: formData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        fetchTerms();
      } else {
        const err = await res.json().catch(() => ({})) as { message?: string };
        alert('Action failed: ' + (err.message || 'Error'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete payment term "${name}"?`)) return;
    try {
      const res = await fetch(`${API}/payment-terms/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        fetchTerms();
      } else {
        const err = await res.json().catch(() => ({})) as { message?: string };
        alert('Delete failed: ' + (err.message || 'Error'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Payment Terms Templates</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Configure credit and early payment terms templates like Net 30, Net 60, and 2/10 Net 30.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={fetchTerms}>
            <RefreshCw size={16} style={{ marginRight: 'var(--space-2)' }} />Refresh
          </Button>
          <Button variant="primary" onClick={handleCreateNew}>
            <Plus size={16} style={{ marginRight: 'var(--space-2)' }} />Add Template
          </Button>
        </div>
      </div>

      {/* Form Card */}
      {showForm && (
        <Card className="frappe-card">
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>
              {editingId ? 'Edit Payment Term Template' : 'Create Payment Term Template'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="frappe-grid-3">
              <div className="frappe-form-group">
                <label className="frappe-label">Term Name *</label>
                <input
                  className="frappe-input"
                  required
                  placeholder="e.g. 2/10 Net 30"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Due Days (Net) *</label>
                <input
                  className="frappe-input"
                  type="number"
                  required
                  placeholder="30"
                  value={formData.dueDays}
                  onChange={e => setFormData({ ...formData, dueDays: e.target.value })}
                />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Discount Days (optional)</label>
                <input
                  className="frappe-input"
                  type="number"
                  placeholder="10"
                  value={formData.discountDays}
                  onChange={e => setFormData({ ...formData, discountDays: e.target.value })}
                />
              </div>
            </div>

            <div className="frappe-grid-3">
              <div className="frappe-form-group">
                <label className="frappe-label">Discount Percentage (%)</label>
                <input
                  className="frappe-input"
                  type="number"
                  step="0.01"
                  placeholder="2.00"
                  value={formData.discountPct}
                  onChange={e => setFormData({ ...formData, discountPct: e.target.value })}
                />
              </div>
              <div className="frappe-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="frappe-label">Description</label>
                <input
                  className="frappe-input"
                  placeholder="e.g. Payment due within 30 days. 2% discount if paid within 10 days."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                type="checkbox"
                id="active-check"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="active-check" style={{ fontSize: 'var(--text-sm)', cursor: 'pointer' }}>Active Template</label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" size={16} style={{ marginRight: 'var(--space-2)' }} /> : <Save size={16} style={{ marginRight: 'var(--space-2)' }} />}
                Save Template
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Templates List */}
      <Card className="frappe-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ListFilter size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Configured Templates</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {terms.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <AlertTriangle style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }} size={32} />
              <p>No payment terms templates configured yet.</p>
              <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Add a template to configure standard payment terms.</p>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Name</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Description</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Net Due Days</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Early Discount Days</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Discount %</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Status</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {terms.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{t.name}</td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>{t.description || '—'}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} style={{ color: 'var(--color-text-secondary)' }} />
                        {t.dueDays} days
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      {t.discountDays > 0 ? `${t.discountDays} days` : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: '#22c55e' }}>
                      {parseFloat(String(t.discountPct)) > 0 ? `${parseFloat(String(t.discountPct)).toFixed(2)}%` : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
                        borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                        background: t.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.15)',
                        color: t.isActive ? '#16a34a' : '#6b7280',
                      }}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(t)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 'var(--space-1)' }}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 'var(--space-1)' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
