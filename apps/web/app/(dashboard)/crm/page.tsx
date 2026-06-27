'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader, Button, Spinner, StatusBadge, DashboardKPICard, DashboardChart, ViewSwitcher, KanbanBoard, type ViewMode, type KanbanColumn, type KanbanItem } from '@unerp/ui';
import { useCustomers, useVendors, useContacts, useLeads, useOpportunities } from '../../../src/lib/hooks/useModuleData';
import { apiPost, apiPatch } from '../../../src/lib/api';
import {
  Users, UserPlus, Target, Handshake, Search,
  AlertCircle, CheckCircle, X, TrendingUp
} from 'lucide-react';

interface LeadItem extends KanbanItem {
  name: string;
  company: string;
  status: string;
  email: string;
  source?: string;
}

export default function CrmPage() {
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: vendors = [], isLoading: loadingVendors } = useVendors();
  const { data: contacts = [], isLoading: loadingContacts } = useContacts();
  const { data: leads = [], isLoading: loadingLeads, refetch: refetchLeads } = useLeads();
  const { data: opportunities = [], isLoading: loadingOpps } = useOpportunities();
  const loading = loadingCustomers || loadingVendors || loadingContacts || loadingLeads || loadingOpps;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ViewMode>('chart');
  const [activeTab, setActiveTab] = useState<'customers' | 'vendors' | 'contacts' | 'leads' | 'opportunities'>('leads');

  // Create Lead Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [leadFirstName, setLeadFirstName] = useState('');
  const [leadLastName, setLeadLastName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadSource, setLeadSource] = useState('WEBSITE');
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeVendors = Array.isArray(vendors) ? vendors : [];
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeOpps = Array.isArray(opportunities) ? opportunities : [];

  // ── KPI metrics ──
  const qualifiedLeads = safeLeads.filter((l: Record<string, unknown>) => l.status === 'QUALIFIED' || l.status === 'CONVERTED').length;
  const activeOpps = safeOpps.filter((o: Record<string, unknown>) => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST').length;
  const totalPipelineValue = safeOpps.reduce((s: number, o: Record<string, unknown>) => s + (Number(o.estimatedValue) || 0), 0);

  // ── Chart data ──
  const leadStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    safeLeads.forEach((l: Record<string, unknown>) => {
      const st = String(l.status || 'Unknown');
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [safeLeads]);

  const pipelineStageData = useMemo(() => {
    const stages: Record<string, number> = {};
    safeOpps.forEach((o: Record<string, unknown>) => {
      const st = String(o.stage || 'Unknown').replace('_', ' ');
      stages[st] = (stages[st] || 0) + 1;
    });
    return Object.entries(stages).map(([name, value]) => ({ name, value }));
  }, [safeOpps]);

  const revenueByOppData = useMemo(() => {
    return safeOpps
      .filter((o: Record<string, unknown>) => o.estimatedValue)
      .slice(0, 10)
      .map((o: Record<string, unknown>) => ({
        name: String(o.title || 'Untitled').substring(0, 20),
        value: Number(o.estimatedValue) || 0,
      }));
  }, [safeOpps]);

  // ── Kanban data (leads by status) ──
  const LEAD_STATUS_COLUMNS: KanbanColumn[] = [
    { key: 'NEW', title: 'New', color: '#6366f1' },
    { key: 'CONTACTED', title: 'Contacted', color: '#f59e0b' },
    { key: 'QUALIFIED', title: 'Qualified', color: '#22c55e' },
    { key: 'CONVERTED', title: 'Converted', color: '#4f46e5' },
    { key: 'LOST', title: 'Lost', color: '#ef4444' },
  ];

  const kanbanLeads: LeadItem[] = useMemo(() => {
    return safeLeads.map((l: Record<string, unknown>) => ({
      id: String(l.id),
      columnKey: String(l.status || 'NEW'),
      name: `${l.firstName || ''} ${l.lastName || ''}`.trim(),
      company: String(l.company || '—'),
      status: String(l.status || 'NEW'),
      email: String(l.email || ''),
      source: String(l.source || ''),
    }));
  }, [safeLeads]);

  const handleKanbanMove = async (itemId: string, _from: string, toColumn: string) => {
    try {
      await apiPatch(`/crm/leads/${itemId}`, { status: toColumn });
      refetchLeads();
    } catch {
      // Silently fail - user will see item snap back
    }
  };

  // ── Handlers ──
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadFirstName || !leadLastName || !leadEmail) {
      setModalError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      await apiPost('/crm/leads', {
        firstName: leadFirstName,
        lastName: leadLastName,
        email: leadEmail,
        company: leadCompany || undefined,
        source: leadSource,
      });
      setModalSuccess(true);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setLeadFirstName(''); setLeadLastName(''); setLeadEmail(''); setLeadCompany('');
        setModalSuccess(false);
        refetchLeads();
      }, 1500);
    } catch {
      setModalError('Failed to create lead. Please try again.');
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filter logic ──
  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    switch (activeTab) {
      case 'customers': return safeCustomers.filter((c: Record<string, unknown>) => String(c.name || '').toLowerCase().includes(q) || String(c.email || '').toLowerCase().includes(q));
      case 'vendors': return safeVendors.filter((v: Record<string, unknown>) => String(v.name || '').toLowerCase().includes(q) || String(v.email || '').toLowerCase().includes(q));
      case 'contacts': return safeContacts.filter((c: Record<string, unknown>) => `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(q) || String(c.email || '').toLowerCase().includes(q));
      case 'leads': return safeLeads.filter((l: Record<string, unknown>) => `${l.firstName || ''} ${l.lastName || ''}`.toLowerCase().includes(q) || String(l.email || '').toLowerCase().includes(q) || String(l.status || '').toLowerCase().includes(q));
      case 'opportunities': return safeOpps.filter((o: Record<string, unknown>) => String(o.title || '').toLowerCase().includes(q) || String(o.stage || '').toLowerCase().includes(q));
      default: return [];
    }
  };
  const filteredData = getFilteredData();

  const TABS = [
    { key: 'leads' as const, label: 'Leads', count: safeLeads.length },
    { key: 'opportunities' as const, label: 'Opportunities', count: safeOpps.length },
    { key: 'customers' as const, label: 'Customers', count: safeCustomers.length },
    { key: 'vendors' as const, label: 'Vendors', count: safeVendors.length },
    { key: 'contacts' as const, label: 'Contacts', count: safeContacts.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Customer Relationship Management"
        description="Oversee and manage all customer, vendor, and lead relationships."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart', 'kanban']} />
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <UserPlus size={16} /> New Lead
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <DashboardKPICard title="Total Leads" value={String(safeLeads.length)} icon={<Users size={18} />} color="#4f46e5" loading={loading}
          drillDown={{
            modalTitle: 'All Leads',
            columns: [
              { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
              { key: 'company', label: 'Company' }, { key: 'status', label: 'Status' },
            ],
            rows: safeLeads.map((l: Record<string, unknown>) => ({ name: `${l.firstName || ''} ${l.lastName || ''}`, email: String(l.email || ''), company: String(l.company || '—'), status: String(l.status || '') })),
          }}
        />
        <DashboardKPICard title="Qualified" value={String(qualifiedLeads)} icon={<Target size={18} />} color="#22c55e" loading={loading}
          drillDown={{
            modalTitle: 'Qualified Leads',
            columns: [
              { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
              { key: 'company', label: 'Company' },
            ],
            rows: safeLeads.filter((l: Record<string, unknown>) => l.status === 'QUALIFIED' || l.status === 'QUALIFIED_OPPORTUNITY').map((l: Record<string, unknown>) => ({ name: `${l.firstName || ''} ${l.lastName || ''}`, email: String(l.email || ''), company: String(l.company || '—') })),
          }}
        />
        <DashboardKPICard title="Active Opportunities" value={String(activeOpps)} icon={<Handshake size={18} />} color="#f59e0b" loading={loading}
          drillDown={{
            modalTitle: 'Active Opportunities',
            columns: [
              { key: 'title', label: 'Title' }, { key: 'stage', label: 'Stage' },
              { key: 'estimatedValue', label: 'Value', render: (v) => `$${Number(v).toLocaleString()}` },
            ],
            rows: safeOpps.filter((o: Record<string, unknown>) => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST').map((o: Record<string, unknown>) => ({ title: o.title, stage: o.stage, estimatedValue: o.estimatedValue })),
          }}
        />
        <DashboardKPICard title="Pipeline Value" value={`$${totalPipelineValue.toLocaleString()}`} icon={<TrendingUp size={18} />} color="#8b5cf6" loading={loading}
          drillDown={{
            modalTitle: 'Sales Pipeline Valuation',
            columns: [
              { key: 'title', label: 'Opportunity' },
              { key: 'stage', label: 'Stage' },
              { key: 'value', label: 'Estimated Value', render: (v) => `$${Number(v).toLocaleString()}` },
            ],
            rows: safeOpps.map((o: Record<string, unknown>) => ({ title: o.title, stage: o.stage, value: o.estimatedValue })),
          }}
        />
      </div>

      {/* Chart View */}
      {activeView === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
          <DashboardChart
            title="Lead Status Distribution"
            subtitle="Leads grouped by current status"
            data={leadStatusData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Leads' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="donut"
            allowedChartTypes={['donut', 'pie', 'bar']}
            height={280}
            loading={loading}
          />
          <DashboardChart
            title="Pipeline Funnel"
            subtitle="Opportunities by pipeline stage"
            data={pipelineStageData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Count' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="funnel"
            allowedChartTypes={['funnel', 'bar', 'pie']}
            height={280}
            loading={loading}
          />
          <DashboardChart
            title="Revenue Forecast"
            subtitle="Estimated value by opportunity (top 10)"
            data={revenueByOppData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Estimated Value', color: '#8b5cf6' }] }}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'line', 'area']}
            height={280}
            loading={loading}
          />
        </div>
      )}

      {/* Kanban View */}
      {activeView === 'kanban' && (
        <KanbanBoard<LeadItem>
          columns={LEAD_STATUS_COLUMNS}
          items={kanbanLeads}
          onCardMove={handleKanbanMove}
          renderCard={(item) => (
            <div>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginBottom: '4px' }}>{item.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>{item.company}</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{item.email}</div>
              {item.source && <div style={{ fontSize: '9px', color: 'var(--color-primary)', marginTop: '4px', fontWeight: 500 }}>Source: {item.source}</div>}
            </div>
          )}
        />
      )}

      {/* List View */}
      {activeView === 'list' && (
        <>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: 'var(--space-2-5) var(--space-4)',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.key ? 'var(--color-primary)' : 'transparent'}`,
                  background: 'none',
                  color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: activeTab === tab.key ? 'var(--weight-semibold)' : 'normal',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="frappe-card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input type="text" className="frappe-input" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-9)' }} />
            </div>
          </div>

          {/* Data Table */}
          <div className="frappe-card" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
            ) : filteredData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <Users size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
                <h4 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>No {activeTab} found</h4>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    {activeTab === 'leads' && (
                      <><th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Email</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Company</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th></>
                    )}
                    {activeTab === 'opportunities' && (
                      <><th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Title</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Stage</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Value</th></>
                    )}
                    {(activeTab === 'customers' || activeTab === 'vendors') && (
                      <><th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Email</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Phone</th></>
                    )}
                    {activeTab === 'contacts' && (
                      <><th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Email</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Title</th></>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item: Record<string, unknown>, i: number) => (
                    <tr key={String(item.id || i)} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {activeTab === 'leads' && (
                        <>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-medium)' }}>{String(item.firstName || '')} {String(item.lastName || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{String(item.email || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{String(item.company || '—')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}><StatusBadge status={String(item.status || '')} /></td>
                        </>
                      )}
                      {activeTab === 'opportunities' && (
                        <>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-medium)' }}>{String(item.title || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}><StatusBadge status={String(item.stage || '')} /></td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>${Number(item.estimatedValue || 0).toLocaleString()}</td>
                        </>
                      )}
                      {(activeTab === 'customers' || activeTab === 'vendors') && (
                        <>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-medium)' }}>{String(item.name || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{String(item.email || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{String(item.phone || '—')}</td>
                        </>
                      )}
                      {activeTab === 'contacts' && (
                        <>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-medium)' }}>{String(item.firstName || '')} {String(item.lastName || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{String(item.email || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{String(item.title || '—')}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Create Lead Modal */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>New Lead</h3>
              <button onClick={() => { setIsCreateModalOpen(false); setModalSuccess(false); setModalError(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateLead} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {modalSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <CheckCircle size={40} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
                  <p style={{ fontWeight: 'var(--weight-semibold)', margin: 0 }}>Lead Created!</p>
                </div>
              ) : (
                <>
                  {modalError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-text)', fontSize: 'var(--text-xs)' }}>
                      <AlertCircle size={15} /><span>{modalError}</span>
                    </div>
                  )}
                  <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="frappe-form-group"><label className="frappe-label">First Name *</label><input type="text" required className="frappe-input" value={leadFirstName} onChange={(e) => setLeadFirstName(e.target.value)} /></div>
                    <div className="frappe-form-group"><label className="frappe-label">Last Name *</label><input type="text" required className="frappe-input" value={leadLastName} onChange={(e) => setLeadLastName(e.target.value)} /></div>
                  </div>
                  <div className="frappe-form-group"><label className="frappe-label">Email *</label><input type="email" required className="frappe-input" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} /></div>
                  <div className="frappe-form-group"><label className="frappe-label">Company</label><input type="text" className="frappe-input" value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} /></div>
                  <div className="frappe-form-group"><label className="frappe-label">Lead Source</label>
                    <select className="frappe-input" value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>
                      <option value="WEBSITE">Website</option><option value="REFERRAL">Referral</option><option value="SOCIAL_MEDIA">Social Media</option><option value="COLD_CALL">Cold Call</option><option value="EVENT">Event</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                    <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : 'Create Lead'}</Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}