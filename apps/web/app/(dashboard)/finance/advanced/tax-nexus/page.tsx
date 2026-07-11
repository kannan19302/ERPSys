'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Info, RefreshCw, MapPin, ShieldCheck } from 'lucide-react';
import { Card, Button, Badge, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

interface Threshold {
  id: string;
  country: string;
  state: string;
  revenueThreshold: number;
  transactionThreshold: number | null;
  measurementPeriod: string;
  isActive: boolean;
}

interface Snapshot {
  id: string;
  state: string;
  totalRevenue: number;
  transactionCount: number;
  revenueThreshold: number;
  transactionThreshold: number | null;
  revenuePct: number;
  transactionPct: number | null;
  status: 'NOT_MET' | 'APPROACHING' | 'EXCEEDED' | 'REGISTERED';
  computedAt: string;
}

interface Registration {
  id: string;
  state: string;
  status: 'NOT_REGISTERED' | 'PENDING' | 'REGISTERED' | 'DEREGISTERED';
  registrationNumber: string | null;
  filingFrequency: string | null;
  effectiveDate: string | null;
}

interface Dashboard {
  totalStatesMonitored: number;
  exceededCount: number;
  approachingCount: number;
  registeredCount: number;
  registrationsOnFile: number;
  totalRevenue: number;
  exceededStates: string[];
  approachingStates: string[];
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  NOT_MET: 'default',
  APPROACHING: 'warning',
  EXCEEDED: 'danger',
  REGISTERED: 'success',
  NOT_REGISTERED: 'default',
  PENDING: 'warning',
  DEREGISTERED: 'default',
};

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function EconomicNexusMonitoringPage() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'thresholds' | 'registrations'>('monitor');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, snapRes, thresholdRes, regRes] = await Promise.all([
        apiGet<Dashboard>('/advanced-finance/tax/nexus/dashboard'),
        apiGet<Snapshot[]>('/advanced-finance/tax/nexus/monitor'),
        apiGet<Threshold[]>('/advanced-finance/tax/nexus/thresholds'),
        apiGet<Registration[]>('/advanced-finance/tax/nexus/registrations'),
      ]);
      setDashboard(dashRes || null);
      setSnapshots(snapRes || []);
      setThresholds(thresholdRes || []);
      setRegistrations(regRes || []);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to load nexus monitoring dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSeedDefaults = async () => {
    try {
      const result = await apiPost<{ seeded: number; totalStates: number }>('/advanced-finance/tax/nexus/thresholds/seed-defaults', {});
      alert(`Seeded ${result.seeded} of ${result.totalStates} reference state thresholds.`);
      loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to seed default thresholds.'));
    }
  };

  const handleRefreshMonitoring = async () => {
    setRefreshing(true);
    try {
      await apiPost('/advanced-finance/tax/nexus/monitor/refresh', {});
      await loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to recompute nexus monitoring snapshots.'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleRegisterState = async (state: string) => {
    try {
      const existing = registrations.find((r) => r.state === state);
      if (existing) {
        await apiPatch(`/advanced-finance/tax/nexus/registrations/${existing.id}`, { status: 'REGISTERED' });
      } else {
        await apiPost('/advanced-finance/tax/nexus/registrations', { state, status: 'REGISTERED' });
      }
      loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to register nexus for this state.'));
    }
  };

  const snapshotColumns: Column<Snapshot>[] = [
    { key: 'state', header: 'State', sortable: true, render: (s) => <span className="font-medium flex items-center gap-1"><MapPin size={12} />{s.state}</span> },
    { key: 'totalRevenue', header: 'TTM Revenue', sortable: true, render: (s) => `$${Number(s.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { key: 'revenueThreshold', header: 'Threshold', render: (s) => `$${Number(s.revenueThreshold).toLocaleString('en-US')}` },
    { key: 'revenuePct', header: '% of Threshold', sortable: true, render: (s) => `${Number(s.revenuePct).toFixed(1)}%` },
    { key: 'transactionCount', header: 'Transactions', render: (s) => (s.transactionThreshold ? `${s.transactionCount} / ${s.transactionThreshold}` : String(s.transactionCount)) },
    { key: 'status', header: 'Status', sortable: true, render: (s) => <Badge variant={statusVariant[s.status]}>{s.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) =>
        s.status !== 'REGISTERED' && (s.status === 'EXCEEDED' || s.status === 'APPROACHING') ? (
          <Button variant="primary" size="sm" className="flex items-center gap-1 inline-flex" onClick={(e) => { e.stopPropagation(); handleRegisterState(s.state); }}>
            <ShieldCheck size={12} /> Mark Registered
          </Button>
        ) : null,
    },
  ];

  const thresholdColumns: Column<Threshold>[] = [
    { key: 'state', header: 'State', sortable: true },
    { key: 'revenueThreshold', header: 'Revenue Threshold', render: (t) => `$${Number(t.revenueThreshold).toLocaleString('en-US')}` },
    { key: 'transactionThreshold', header: 'Transaction Threshold', render: (t) => (t.transactionThreshold != null ? t.transactionThreshold : 'None') },
    { key: 'measurementPeriod', header: 'Measurement Period' },
    { key: 'isActive', header: 'Active', render: (t) => <Badge variant={t.isActive ? 'success' : 'default'}>{t.isActive ? 'Yes' : 'No'}</Badge> },
  ];

  const registrationColumns: Column<Registration>[] = [
    { key: 'state', header: 'State', sortable: true },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge> },
    { key: 'registrationNumber', header: 'Registration #', render: (r) => r.registrationNumber || '—' },
    { key: 'filingFrequency', header: 'Filing Frequency', render: (r) => r.filingFrequency || '—' },
    { key: 'effectiveDate', header: 'Effective Date', render: (r) => (r.effectiveDate ? new Date(r.effectiveDate).toLocaleDateString() : '—') },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold frappe-text-primary">Economic Nexus Monitoring</h1>
          <p className="text-sm frappe-text-muted mt-1">Trailing-12-month sales/use-tax nexus threshold tracking by state</p>
        </div>
        <ProtectedComponent permission="finance.tax-nexus.manage">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleSeedDefaults}>Seed Reference Thresholds</Button>
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleRefreshMonitoring}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Recompute
            </Button>
          </div>
        </ProtectedComponent>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-xs frappe-text-muted">States Monitored</p>
            <p className="text-2xl font-bold frappe-text-primary">{dashboard.totalStatesMonitored}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs frappe-text-muted">Exceeded (Action Needed)</p>
            <p className="text-2xl font-bold text-red-600">{dashboard.exceededCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs frappe-text-muted">Approaching</p>
            <p className="text-2xl font-bold text-amber-600">{dashboard.approachingCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs frappe-text-muted">Registered</p>
            <p className="text-2xl font-bold text-green-600">{dashboard.registeredCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs frappe-text-muted">TTM Revenue Tracked</p>
            <p className="text-2xl font-bold frappe-text-primary">${dashboard.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
          </Card>
        </div>
      )}

      <div className="flex border-b border-gray-200">
        {(['monitor', 'thresholds', 'registrations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-4 font-medium text-sm border-b-2 transition-all capitalize ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab === 'monitor'
              ? `Monitor (${snapshots.length})`
              : tab === 'thresholds'
                ? `Thresholds (${thresholds.length})`
                : `Registrations (${registrations.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'monitor' ? (
        <DataTable
          columns={snapshotColumns}
          data={snapshots}
          loading={loading}
          rowKey={(s) => s.id}
          emptyTitle="No monitoring snapshots yet"
          emptyMessage='Click "Recompute" to calculate trailing-12-month sales by state against configured thresholds.'
          emptyIcon={<Info size={48} />}
        />
      ) : activeTab === 'thresholds' ? (
        <DataTable
          columns={thresholdColumns}
          data={thresholds}
          loading={loading}
          rowKey={(t) => t.id}
          emptyTitle="No thresholds configured"
          emptyMessage='Click "Seed Reference Thresholds" to load default US state economic-nexus rules.'
          emptyIcon={<Info size={48} />}
        />
      ) : (
        <DataTable
          columns={registrationColumns}
          data={registrations}
          loading={loading}
          rowKey={(r) => r.id}
          emptyTitle="No nexus registrations on file"
          emptyMessage="Register a state from the Monitor tab once its threshold is exceeded."
          emptyIcon={<Info size={48} />}
        />
      )}
    </div>
  );
}
