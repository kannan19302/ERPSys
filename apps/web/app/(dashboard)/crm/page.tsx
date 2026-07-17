'use client';

import React, { useState, useMemo } from 'react';
import styles from './page.module.css';
import { PageHeader, Button, StatusBadge, DashboardChart, ViewSwitcher, KanbanBoard, StatCardRow, ListPageTemplate, type ListColumn, type ViewMode, type KanbanColumn, type KanbanItem, Spinner } from '@unerp/ui';
import { useCustomers, useVendors, useContacts, useLeads, useOpportunities } from '../../../src/lib/hooks/useModuleData';
import { apiPost, apiPatch } from '../../../src/lib/api';
import {
  Users, UserPlus, Target, Handshake,
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
    { key: 'NEW', title: 'New', color: 'var(--chart-1)' },
    { key: 'CONTACTED', title: 'Contacted', color: 'var(--color-warning)' },
    { key: 'QUALIFIED', title: 'Qualified', color: 'var(--color-success)' },
    { key: 'CONVERTED', title: 'Converted', color: 'var(--chart-2)' },
    { key: 'LOST', title: 'Lost', color: 'var(--color-danger)' },
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

  const leadColumns: ListColumn[] = [
    { key: 'name', header: 'Name', render: (_, row) => `${String(row.firstName || '')} ${String(row.lastName || '')}`.trim() },
    { key: 'email', header: 'Email' },
    { key: 'company', header: 'Company', render: (v) => String(v || '—') },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v || '')} /> },
  ];
  const oppColumns: ListColumn[] = [
    { key: 'title', header: 'Title' },
    { key: 'stage', header: 'Stage', render: (v) => <StatusBadge status={String(v || '')} /> },
    { key: 'estimatedValue', header: 'Value', render: (v) => `$${Number(v || 0).toLocaleString()}` },
  ];
  const entityColumns: ListColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', render: (v) => String(v || '—') },
  ];
  const contactColumns: ListColumn[] = [
    { key: 'name', header: 'Name', render: (_, row) => `${String(row.firstName || '')} ${String(row.lastName || '')}`.trim() },
    { key: 'email', header: 'Email' },
    { key: 'title', header: 'Title', render: (v) => String(v || '—') },
  ];

  const TABS = [
    { key: 'leads' as const, label: 'Leads', count: safeLeads.length },
    { key: 'opportunities' as const, label: 'Opportunities', count: safeOpps.length },
    { key: 'customers' as const, label: 'Customers', count: safeCustomers.length },
    { key: 'vendors' as const, label: 'Vendors', count: safeVendors.length },
    { key: 'contacts' as const, label: 'Contacts', count: safeContacts.length },
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Customer Relationship Management"
        description="Oversee and manage all customer, vendor, and lead relationships."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM' }]}
        actions={
          <div className="ui-hstack-3">
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart', 'kanban']} />
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="ui-hstack-2">
              <UserPlus size={16} /> New Lead
            </Button>
          </div>
        }
      />

      {/* KPI stat cards */}
      <StatCardRow
        stats={[
          { label: 'Total Leads', value: safeLeads.length, icon: <Users size={16} />, color: 'var(--chart-1)', loading },
          { label: 'Qualified', value: qualifiedLeads, icon: <Target size={16} />, color: 'var(--chart-2)', loading },
          { label: 'Active Opportunities', value: activeOpps, icon: <Handshake size={16} />, color: 'var(--chart-3)', loading },
          { label: 'Pipeline Value', value: `$${totalPipelineValue.toLocaleString()}`, icon: <TrendingUp size={16} />, color: 'var(--chart-5)', loading },
        ]}
      />

      {/* Chart View */}
      {activeView === 'chart' && (
        <div className={styles.p20}>
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
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Estimated Value', color: 'var(--chart-4)' }] }}
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
              <div className={styles.p21}>{item.name}</div>
              <div className={styles.p22}>{item.company}</div>
              <div className="ui-text-micro">{item.email}</div>
              {item.source && <div className={styles.p23}>Source: {item.source}</div>}
            </div>
          )}
        />
      )}

      {/* List View */}
      {activeView === 'list' && (
        <>
          <div className={styles.tabs}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          {activeTab === 'leads' && <ListPageTemplate title="" columns={leadColumns} data={safeLeads as unknown as Record<string, unknown>[]} loading={loading} searchable searchPlaceholder="Search leads…" />}
          {activeTab === 'opportunities' && <ListPageTemplate title="" columns={oppColumns} data={safeOpps as unknown as Record<string, unknown>[]} loading={loading} searchable searchPlaceholder="Search opportunities…" />}
          {activeTab === 'customers' && <ListPageTemplate title="" columns={entityColumns} data={safeCustomers as unknown as Record<string, unknown>[]} loading={loading} searchable searchPlaceholder="Search customers…" />}
          {activeTab === 'vendors' && <ListPageTemplate title="" columns={entityColumns} data={safeVendors as unknown as Record<string, unknown>[]} loading={loading} searchable searchPlaceholder="Search vendors…" />}
          {activeTab === 'contacts' && <ListPageTemplate title="" columns={contactColumns} data={safeContacts as unknown as Record<string, unknown>[]} loading={loading} searchable searchPlaceholder="Search contacts…" />}
        </>
      )}

      {/* Create Lead Modal */}
      {isCreateModalOpen && (
        <div className={styles.p25}>
          <div className={styles.p26}>
            <div className={styles.p27}>
              <h3 className={styles.p28}>New Lead</h3>
              <button onClick={() => { setIsCreateModalOpen(false); setModalSuccess(false); setModalError(null); }} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateLead} className="p-5 ui-stack-4">
              {modalSuccess ? (
                <div className={styles.p29}>
                  <CheckCircle size={40} className={styles.p210} />
                  <p className={styles.p211}>Lead Created!</p>
                </div>
              ) : (
                <>
                  {modalError && (
                    <div className={styles.p212}>
                      <AlertCircle size={15} /><span>{modalError}</span>
                    </div>
                  )}
                  <div className={`ui-grid-2 ${styles.p213}`}>
                    <div className="ui-form-group"><label className="ui-label">First Name *</label><input type="text" required className="ui-input" value={leadFirstName} onChange={(e) => setLeadFirstName(e.target.value)} /></div>
                    <div className="ui-form-group"><label className="ui-label">Last Name *</label><input type="text" required className="ui-input" value={leadLastName} onChange={(e) => setLeadLastName(e.target.value)} /></div>
                  </div>
                  <div className="ui-form-group"><label className="ui-label">Email *</label><input type="email" required className="ui-input" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} /></div>
                  <div className="ui-form-group"><label className="ui-label">Company</label><input type="text" className="ui-input" value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} /></div>
                  <div className="ui-form-group"><label className="ui-label">Lead Source</label>
                    <select className="ui-input" value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>
                      <option value="WEBSITE">Website</option><option value="REFERRAL">Referral</option><option value="SOCIAL_MEDIA">Social Media</option><option value="COLD_CALL">Cold Call</option><option value="EVENT">Event</option>
                    </select>
                  </div>
                  <div className={styles.p214}>
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
