'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, Loader2, Save, Check, AlertTriangle, Settings } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface APMatchRule {
  id: string;
  vendorId: string | null;
  quantityTolerancePercent: string | number;
  priceTolerancePercent: string | number;
  effectiveDate: string;
  status: string;
  createdAt: string;
}

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}
function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...extra };
}

export default function APMatchRulesPage() {
  const [rules, setRules] = useState<APMatchRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    vendorId: '',
    quantityTolerancePercent: '2',
    priceTolerancePercent: '5',
    effectiveDate: new Date().toISOString().slice(0, 10),
  });

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/payables/match-rules`, { headers: authHeaders() });
      if (res.ok) setRules(await res.json() as APMatchRule[]);
    } catch { /* network error */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleSubmit = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const url = editingId ? `${API}/payables/match-rules/${editingId}` : `${API}/payables/match-rules`;
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          vendorId: form.vendorId || undefined,
          quantityTolerancePercent: parseFloat(form.quantityTolerancePercent),
          priceTolerancePercent: parseFloat(form.priceTolerancePercent),
          effectiveDate: form.effectiveDate,
        }),
      });
      if (res.ok) {
        setSuccess(editingId ? 'Rule updated' : 'Rule created');
        setShowForm(false);
        setEditingId(null);
        fetchRules();
      } else {
        const d = await res.json() as { message?: string };
        setError(d.message || 'Failed to save rule');
      }
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this match rule?')) return;
    await fetch(`${API}/payables/match-rules/${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchRules();
  };

  const startEdit = (rule: APMatchRule) => {
    setEditingId(rule.id);
    setForm({
      vendorId: rule.vendorId || '',
      quantityTolerancePercent: String(rule.quantityTolerancePercent),
      priceTolerancePercent: String(rule.priceTolerancePercent),
      effectiveDate: rule.effectiveDate.slice(0, 10),
    });
    setShowForm(true);
  };

  return (
    <div className="frappe-page-container">
      <div className="frappe-page-head">
        <div className="frappe-page-head-content">
          <nav className="frappe-breadcrumb">
            <span>Finance</span><span className="frappe-breadcrumb-sep">/</span>
            <span>Payables</span><span className="frappe-breadcrumb-sep">/</span>
            <span className="frappe-breadcrumb-current">AP Match Rules</span>
          </nav>
          <div className="frappe-title-section">
            <Settings className="frappe-title-icon" size={20} />
            <h1 className="frappe-page-title">AP Three-Way Match Rules</h1>
          </div>
          <p className="frappe-page-subtitle">
            Configure price and quantity tolerance thresholds for automated PO → Receipt → Invoice matching.
          </p>
        </div>
        <div className="frappe-page-actions">
          <Button onClick={() => { setEditingId(null); setForm({ vendorId: '', quantityTolerancePercent: '2', priceTolerancePercent: '5', effectiveDate: new Date().toISOString().slice(0, 10) }); setShowForm(true); }}>
            <Plus size={16} className="mr-1" /> New Rule
          </Button>
        </div>
      </div>

      {error && (
        <div className="frappe-alert frappe-alert-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="frappe-alert frappe-alert-success">
          <Check size={16} /> {success}
        </div>
      )}

      {showForm && (
        <Card className="frappe-form-card mb-4">
          <h3 className="frappe-form-title">{editingId ? 'Edit Rule' : 'New Match Rule'}</h3>
          <div className="frappe-form-grid">
            <div className="frappe-form-group">
              <label className="frappe-label">Vendor ID (leave blank for global default)</label>
              <input
                className="frappe-input"
                value={form.vendorId}
                onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                placeholder="vendor-id or blank for global"
              />
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label">Quantity Tolerance (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="frappe-input"
                value={form.quantityTolerancePercent}
                onChange={(e) => setForm({ ...form, quantityTolerancePercent: e.target.value })}
              />
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label">Price Tolerance (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="frappe-input"
                value={form.priceTolerancePercent}
                onChange={(e) => setForm({ ...form, priceTolerancePercent: e.target.value })}
              />
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label">Effective Date</label>
              <input
                type="date"
                className="frappe-input"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
              />
            </div>
          </div>
          <div className="frappe-form-actions">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
              {editingId ? 'Update' : 'Create'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card className="frappe-list-card">
        {loading ? (
          <div className="frappe-loading"><Loader2 className="animate-spin" size={20} /> Loading rules…</div>
        ) : rules.length === 0 ? (
          <div className="frappe-empty-state">
            <Settings size={40} className="frappe-empty-icon" />
            <p>No AP match rules configured. Create a global rule to enable three-way matching.</p>
          </div>
        ) : (
          <table className="frappe-table">
            <thead>
              <tr>
                <th className="frappe-th">Scope</th>
                <th className="frappe-th">Qty Tolerance</th>
                <th className="frappe-th">Price Tolerance</th>
                <th className="frappe-th">Effective Date</th>
                <th className="frappe-th">Status</th>
                <th className="frappe-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="frappe-tr">
                  <td className="frappe-td">{rule.vendorId ? `Vendor: ${rule.vendorId.slice(0, 8)}…` : 'Global'}</td>
                  <td className="frappe-td">{Number(rule.quantityTolerancePercent).toFixed(1)}%</td>
                  <td className="frappe-td">{Number(rule.priceTolerancePercent).toFixed(1)}%</td>
                  <td className="frappe-td">{new Date(rule.effectiveDate).toLocaleDateString()}</td>
                  <td className="frappe-td">
                    <span className={`frappe-badge ${rule.status === 'ACTIVE' ? 'frappe-badge-green' : 'frappe-badge-gray'}`}>
                      {rule.status}
                    </span>
                  </td>
                  <td className="frappe-td frappe-td-actions">
                    <button className="frappe-action-btn" onClick={() => startEdit(rule)} title="Edit"><Edit size={14} /></button>
                    <button className="frappe-action-btn frappe-action-btn-danger" onClick={() => handleDelete(rule.id)} title="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
