'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { Plus, X, Trash2, MapPin, Play, ListChecks } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete, ApiRequestError } from '../../../../../src/lib/api';
import styles from './page.module.css';

interface Territory { id: string; name: string; }

interface TerritoryRule {
  id: string;
  name: string;
  ruleType: 'GEOGRAPHY' | 'INDUSTRY' | 'COMPANY_SIZE' | 'ROUND_ROBIN';
  priority: number;
  isActive: boolean;
  territoryId: string;
  territory?: { id: string; name: string };
  conditions: Record<string, unknown>;
  createdAt: string;
}

interface AssignmentLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  territoryId: string | null;
  reason: string;
  createdAt: string;
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' };
const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' };

export default function TerritoryAssignmentRulesPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<TerritoryRule[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [log, setLog] = useState<AssignmentLogEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState<TerritoryRule['ruleType']>('GEOGRAPHY');
  const [territoryId, setTerritoryId] = useState('');
  const [priority, setPriority] = useState(0);
  const [countries, setCountries] = useState('');
  const [industries, setIndustries] = useState('');
  const [minEmployees, setMinEmployees] = useState('');
  const [maxEmployees, setMaxEmployees] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesRes, terrRes, logRes] = await Promise.all([
        apiGet<TerritoryRule[]>('/crm/territory-rules'),
        apiGet<Territory[]>('/crm/territories'),
        apiGet<AssignmentLogEntry[]>('/crm/territory-rules/log/entries'),
      ]);
      setRules(Array.isArray(rulesRes) ? rulesRes : []);
      setTerritories(Array.isArray(terrRes) ? terrRes : []);
      setLog(Array.isArray(logRes) ? logRes : []);
    } catch (err) {
      toast.error('Could not load territory rules', err instanceof Error ? err.message : undefined);
      setRules([]); setTerritories([]); setLog([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setName(''); setRuleType('GEOGRAPHY'); setTerritoryId(''); setPriority(0);
    setCountries(''); setIndustries(''); setMinEmployees(''); setMaxEmployees('');
  };

  const buildConditions = () => {
    if (ruleType === 'GEOGRAPHY') return { countries: countries.split(',').map((s) => s.trim()).filter(Boolean) };
    if (ruleType === 'INDUSTRY') return { industries: industries.split(',').map((s) => s.trim()).filter(Boolean) };
    if (ruleType === 'COMPANY_SIZE') return {
      ...(minEmployees ? { minEmployees: Number(minEmployees) } : {}),
      ...(maxEmployees ? { maxEmployees: Number(maxEmployees) } : {}),
    };
    return {};
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/crm/territory-rules', {
        name, ruleType, territoryId, priority, conditions: buildConditions(), isActive: true,
      });
      toast.success('Assignment rule created', `"${name}" is now active.`);
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error('Could not create rule', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (rule: TerritoryRule) => {
    try {
      await apiPut(`/crm/territory-rules/${rule.id}`, { isActive: !rule.isActive });
      toast.success(rule.isActive ? 'Rule disabled' : 'Rule enabled');
      loadData();
    } catch (err) {
      toast.error('Could not update rule', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const handleDelete = async (rule: TerritoryRule) => {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await apiDelete(`/crm/territory-rules/${rule.id}`);
      toast.success('Rule deleted');
      loadData();
    } catch (err) {
      toast.error('Could not delete rule', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const handleReassignAll = async () => {
    try {
      const result = await apiPost<{ processed: number; matched: number }>('/crm/territory-rules/reassign-all');
      toast.success('Bulk reassignment complete', `${result.matched} of ${result.processed} open leads matched a rule.`);
      loadData();
    } catch (err) {
      toast.error('Bulk reassignment failed', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const columns: Column<TerritoryRule>[] = [
    { key: 'priority', header: 'Priority', align: 'right', sortable: true, render: (r) => <Badge variant="default">{r.priority}</Badge> },
    { key: 'name', header: 'Rule', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'ruleType', header: 'Type', render: (r) => <Badge variant="info">{r.ruleType.replace('_', ' ')}</Badge> },
    { key: 'territory', header: 'Territory', render: (r) => r.territory?.name || '—' },
    { key: 'isActive', header: 'Status', render: (r) => (
      <button onClick={() => handleToggleActive(r)} className={styles.style0}>
        <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Disabled'}</Badge>
      </button>
    ) },
    { key: 'actions', header: '', align: 'right', render: (r) => (
      <button title="Delete" onClick={() => handleDelete(r)} className={styles.style1}><Trash2 size={14} /></button>
    ) },
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Territory Assignment Rules"
        description="Auto-route leads and accounts to sales territories by geography, industry, company size, or round-robin."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Territories', href: '/crm/territories' }, { label: 'Assignment Rules' }]}
        actions={
          <div className="ui-flex ui-gap-3">
            <ProtectedComponent permission="crm.lead.update">
              <Button variant="secondary" onClick={handleReassignAll} className="ui-hstack-2">
                <Play size={16} /> Reassign Open Leads
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="crm.settings.create">
              <Button onClick={() => setIsModalOpen(true)} variant="primary" className="ui-hstack-2">
                <Plus size={16} /> New Rule
              </Button>
            </ProtectedComponent>
          </div>
        }
      />

      <Card>
        <div className={styles.style2}>
          <h3 className="ui-heading-base">Rules (highest priority evaluated first)</h3>
        </div>
        {loading ? (
          <div className="ui-center-pad"><Spinner size="lg" /></div>
        ) : rules.length === 0 ? (
          <div className="ui-empty-state">
            <MapPin size={48} className="ui-hr-faded" />
            <div className="font-semibold">No Assignment Rules Yet</div>
            <div className="text-sm">Create a rule to start auto-routing leads to territories.</div>
          </div>
        ) : (
          <DataTable<TerritoryRule> columns={columns} data={rules} rowKey={(r) => r.id} />
        )}
      </Card>

      <Card>
        <div className={styles.style3}>
          <ListChecks size={16} />
          <h3 className="ui-heading-base">Recent Assignment Log</h3>
        </div>
        <div className={styles.style4}>
          {log.length === 0 && <div className="ui-text-sm-muted">No assignment decisions recorded yet.</div>}
          {log.slice(0, 20).map((entry) => (
            <div key={entry.id} className={styles.style5}>
              <span>{entry.entityType} {entry.entityId} — {entry.reason}</span>
              <span className="ui-text-muted">{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>

      {isModalOpen && (
        <div className={styles.style6}>
          <div className={styles.style7}>
            <div className={styles.style8}>
              <h3 className="ui-heading-base">New Assignment Rule</h3>
              <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 ui-stack-4">
              <div>
                <label style={labelStyle}>Rule Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="ui-input" style={inputStyle} placeholder="e.g. EU Enterprise Routing" />
              </div>
              <div className="ui-grid-2">
                <div>
                  <label style={labelStyle}>Rule Type</label>
                  <select value={ruleType} onChange={(e) => setRuleType(e.target.value as TerritoryRule['ruleType'])} className="ui-input" style={inputStyle}>
                    <option value="GEOGRAPHY">Geography</option>
                    <option value="INDUSTRY">Industry</option>
                    <option value="COMPANY_SIZE">Company Size</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Territory</label>
                  <select required value={territoryId} onChange={(e) => setTerritoryId(e.target.value)} className="ui-input" style={inputStyle}>
                    <option value="">Select…</option>
                    {territories.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Priority (higher wins)</label>
                <input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="ui-input" style={inputStyle} />
              </div>
              {ruleType === 'GEOGRAPHY' && (
                <div>
                  <label style={labelStyle}>Countries (comma-separated, e.g. US,CA)</label>
                  <input value={countries} onChange={(e) => setCountries(e.target.value)} className="ui-input" style={inputStyle} />
                </div>
              )}
              {ruleType === 'INDUSTRY' && (
                <div>
                  <label style={labelStyle}>Industries (comma-separated)</label>
                  <input value={industries} onChange={(e) => setIndustries(e.target.value)} className="ui-input" style={inputStyle} />
                </div>
              )}
              {ruleType === 'COMPANY_SIZE' && (
                <div className="ui-grid-2">
                  <div>
                    <label style={labelStyle}>Min Employees</label>
                    <input type="number" value={minEmployees} onChange={(e) => setMinEmployees(e.target.value)} className="ui-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Max Employees</label>
                    <input type="number" value={maxEmployees} onChange={(e) => setMaxEmployees(e.target.value)} className="ui-input" style={inputStyle} />
                  </div>
                </div>
              )}
              <div className={styles.style9}>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Rule'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
