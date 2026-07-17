'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, Loader2, Save, Check, AlertTriangle, Settings } from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface APMatchRule {
  id: string;
  vendorId: string | null;
  quantityTolerancePercent: string | number;
  priceTolerancePercent: string | number;
  effectiveDate: string;
  status: string;
  createdAt: string;
}

export default function APMatchRulesPage() {
  const client = useApiClient();
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
      setRules(await client.get<APMatchRule[]>('/advanced-finance/payables/match-rules'));
    } catch { /* network error */ } finally { setLoading(false); }
  }, [client]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleSubmit = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const body = {
          vendorId: form.vendorId || undefined,
          quantityTolerancePercent: parseFloat(form.quantityTolerancePercent),
          priceTolerancePercent: parseFloat(form.priceTolerancePercent),
          effectiveDate: form.effectiveDate,
      };
      if (editingId) await client.patch(`/advanced-finance/payables/match-rules/${editingId}`, body);
      else await client.post('/advanced-finance/payables/match-rules', body);
        setSuccess(editingId ? 'Rule updated' : 'Rule created');
        setShowForm(false);
        setEditingId(null);
        fetchRules();
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this match rule?')) return;
    await client.delete(`/advanced-finance/payables/match-rules/${id}`);
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
    <RouteGuard permission="finance.payables.read">
      <div className="ui-page-container">
      <div className="ui-page-head">
        <div className="ui-page-head-content">
          <nav className="ui-breadcrumb">
            <span>Finance</span><span className="ui-breadcrumb-sep">/</span>
            <span>Payables</span><span className="ui-breadcrumb-sep">/</span>
            <span className="ui-breadcrumb-current">AP Match Rules</span>
          </nav>
          <div className="ui-title-section">
            <Settings className="ui-title-icon" size={20} />
            <h1 className="ui-page-title">AP Three-Way Match Rules</h1>
          </div>
          <p className="ui-page-subtitle">
            Configure price and quantity tolerance thresholds for automated PO → Receipt → Invoice matching.
          </p>
        </div>
        <div className="ui-page-actions">
          <Button onClick={() => { setEditingId(null); setForm({ vendorId: '', quantityTolerancePercent: '2', priceTolerancePercent: '5', effectiveDate: new Date().toISOString().slice(0, 10) }); setShowForm(true); }}>
            <Plus size={16} className="mr-1" /> New Rule
          </Button>
        </div>
      </div>

      {error && (
        <div className="ui-alert ui-alert-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="ui-alert ui-alert-success">
          <Check size={16} /> {success}
        </div>
      )}

      {showForm && (
        <Card className="ui-form-card mb-4">
          <h3 className="ui-form-title">{editingId ? 'Edit Rule' : 'New Match Rule'}</h3>
          <div className="ui-form-grid">
            <div className="ui-form-group">
              <label className="ui-label">Vendor ID (leave blank for global default)</label>
              <input
                className="ui-input"
                value={form.vendorId}
                onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                placeholder="vendor-id or blank for global"
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Quantity Tolerance (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="ui-input"
                value={form.quantityTolerancePercent}
                onChange={(e) => setForm({ ...form, quantityTolerancePercent: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Price Tolerance (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="ui-input"
                value={form.priceTolerancePercent}
                onChange={(e) => setForm({ ...form, priceTolerancePercent: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Effective Date</label>
              <input
                type="date"
                className="ui-input"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
              />
            </div>
          </div>
          <div className="ui-form-actions">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
              {editingId ? 'Update' : 'Create'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card className="ui-list-card">
        {loading ? (
          <div className="ui-loading"><Loader2 className="animate-spin" size={20} /> Loading rules…</div>
        ) : rules.length === 0 ? (
          <div className="ui-empty-state">
            <Settings size={40} className="ui-empty-icon" />
            <p>No AP match rules configured. Create a global rule to enable three-way matching.</p>
          </div>
        ) : (
          <ListPageTemplate
            columns={[
              { key: 'vendorId', header: 'Scope', render: (v) => v ? `Vendor: ${String(v).slice(0, 8)}…` : 'Global' },
              { key: 'quantityTolerancePercent', header: 'Qty Tolerance', render: (v) => `${Number(v).toFixed(1)}%` },
              { key: 'priceTolerancePercent', header: 'Price Tolerance', render: (v) => `${Number(v).toFixed(1)}%` },
              { key: 'effectiveDate', header: 'Effective Date', render: (v) => new Date(String(v)).toLocaleDateString() },
              { key: 'status', header: 'Status', render: (v) => <span className={`ui-badge ${v === 'ACTIVE' ? 'ui-badge-green' : 'ui-badge-gray'}`}>{String(v)}</span> },
              { key: 'id', header: 'Actions', render: (v, row) => (
                <div className="ui-td-actions">
                  <button className="ui-action-btn" onClick={() => startEdit(row as any)} title="Edit"><Edit size={14} /></button>
                  <button className="ui-action-btn ui-action-btn-danger" onClick={() => handleDelete(String(v))} title="Delete"><Trash2 size={14} /></button>
                </div>
              ) },
            ] as ListColumn[]}
            data={(rules as unknown as Record<string, unknown>[])}
            loading={false}
            emptyTitle="No AP match rules configured"
            emptyDescription="Create a global rule to enable three-way matching."
          />
        )}
      </Card>
      </div>
    </RouteGuard>
  );
}
