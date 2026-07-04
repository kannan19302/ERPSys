'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, FileText, Send, Wrench, RefreshCw,
  Plus, Building, Trash2, CheckCircle2, User, MapPin
} from 'lucide-react';
import { Card, Button, ChangeHistory, ProtectedComponent } from '@unerp/ui';
import { apiGet, apiPost } from '@/lib/api';

interface AssetDepreciation {
  id: string;
  date: string;
  amount: number;
  periodName: string | null;
  accumulatedDepreciation: number;
  bookValue: number;
  status: string;
  journalId: string | null;
}

interface AssetTransferLog {
  id: string;
  transferDate: string;
  fromLocation?: { name: string } | null;
  toLocation?: { name: string } | null;
  fromCustodian?: { name: string } | null;
  toCustodian?: { name: string } | null;
  reason: string | null;
  performedBy: string;
}

interface AssetMaintenanceLog {
  id: string;
  maintenanceDate: string;
  type: string;
  description: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate: string | null;
}

interface FixedAsset {
  id: string;
  name: string;
  assetCode: string;
  status: string;
  purchaseValue: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: string;
  depreciationRate: number | null;
  currentValue: number;
  purchaseDate: string;
  accountId: string;
  accumDepAccountId: string;
  category?: { name: string } | null;
  location?: { name: string } | null;
  custodian?: { name: string } | null;
  depreciations: AssetDepreciation[];
  transfers: AssetTransferLog[];
  maintenanceLogs: AssetMaintenanceLog[];
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export default function FixedAssetDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [asset, setAsset] = useState<FixedAsset | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'depreciation' | 'transfers' | 'maintenance'>('depreciation');

  // Sub-Forms
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferFormData, setTransferFormData] = useState({
    transferDate: new Date().toISOString().split('T')[0],
    toLocationId: '',
    toCustodianId: '',
    reason: '',
  });

  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    maintenanceDate: new Date().toISOString().split('T')[0],
    type: 'PREVENTIVE',
    description: '',
    cost: '0',
    performedBy: '',
    nextMaintenanceDate: '',
  });

  const [depPeriod, setDepPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [depRunning, setDepRunning] = useState(false);

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const fetchAssetDetails = async () => {
    setLoading(true);
    try {
      const [assetData, warehousesRes, employeesRes] = await Promise.all([
        apiGet<FixedAsset>(`/fixed-assets/${id}`),
        apiGet<any>('/inventory/warehouses'),
        apiGet<any>('/hr/employees'),
      ]);

      setAsset(assetData);
      setWarehouses(warehousesRes?.data || []);
      setEmployees(employeesRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        transferDate: transferFormData.transferDate,
        toLocationId: transferFormData.toLocationId || null,
        toCustodianId: transferFormData.toCustodianId || null,
        reason: transferFormData.reason || null,
      };

      await apiPost(`/fixed-assets/${id}/transfer`, payload);
      setShowTransferForm(false);
      setTransferFormData({
        transferDate: new Date().toISOString().split('T')[0],
        toLocationId: '',
        toCustodianId: '',
        reason: '',
      });
      fetchAssetDetails();
    } catch (err: any) {
      alert(err.message || 'Error recording transfer.');
    }
  };

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        maintenanceDate: maintenanceFormData.maintenanceDate,
        type: maintenanceFormData.type as 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION',
        description: maintenanceFormData.description,
        cost: parseFloat(maintenanceFormData.cost || '0'),
        performedBy: maintenanceFormData.performedBy,
        nextMaintenanceDate: maintenanceFormData.nextMaintenanceDate || null,
      };

      await apiPost(`/fixed-assets/${id}/maintenance`, payload);
      setShowMaintenanceForm(false);
      setMaintenanceFormData({
        maintenanceDate: new Date().toISOString().split('T')[0],
        type: 'PREVENTIVE',
        description: '',
        cost: '0',
        performedBy: '',
        nextMaintenanceDate: '',
      });
      fetchAssetDetails();
    } catch (err: any) {
      alert(err.message || 'Error recording maintenance.');
    }
  };

  const handleRunSingleDepreciation = async () => {
    setDepRunning(true);
    try {
      await apiPost(`/fixed-assets/${id}/depreciate`, { periodName: depPeriod });
      fetchAssetDetails();
    } catch (err: any) {
      alert(err.message || 'Depreciation run failed.');
    } finally {
      setDepRunning(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <RefreshCw className="animate-spin" style={{ color: 'var(--color-primary)', width: '32px', height: '32px' }} />
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <Building style={{ color: 'var(--color-text-secondary)', marginInline: 'auto', marginBottom: 'var(--space-4)' }} />
        <h3>Asset Registry Entry Not Found</h3>
        <Link href="/finance/advanced/fixed-assets" style={{ color: 'var(--color-primary)' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link href="/finance/advanced/fixed-assets/assets" className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-2)' }}>
            <ArrowLeft style={{ width: '16px' }} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>{asset.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                asset.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                asset.status === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {asset.status}
              </span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              Asset Code: <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{asset.assetCode}</span> · Category: {asset.category?.name || 'Unassigned'}
            </p>
          </div>
        </div>
      </div>

      {/* Asset Valuation Stats */}
      <div className="frappe-grid-3">
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase' }}>Purchase Value</p>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-1)' }}>
              ${Number(asset.purchaseValue).toFixed(2)}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              Acquired: {new Date(asset.purchaseDate).toLocaleDateString()} · Salvage: ${Number(asset.salvageValue).toFixed(2)}
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase' }}>Current Book Value</p>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)', marginTop: 'var(--space-1)' }}>
              ${Number(asset.currentValue).toFixed(2)}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              Method: {asset.depreciationMethod} · Useful Life: {asset.usefulLifeYears}y
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase' }}>Custody & Location</p>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-1)' }}>
              {asset.location?.name || 'In-Transit Store'}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              Custodian: {asset.custodian?.name || 'General Corporate'}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs Menu */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-6)' }}>
        <button
          onClick={() => setActiveTab('depreciation')}
          style={{ paddingBottom: 'var(--space-3)', fontWeight: 'var(--weight-semibold)', borderBottom: activeTab === 'depreciation' ? '2px solid var(--color-primary)' : 'none', color: activeTab === 'depreciation' ? 'var(--color-primary)' : 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Depreciation Schedule
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          style={{ paddingBottom: 'var(--space-3)', fontWeight: 'var(--weight-semibold)', borderBottom: activeTab === 'transfers' ? '2px solid var(--color-primary)' : 'none', color: activeTab === 'transfers' ? 'var(--color-primary)' : 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Custody & Transfers
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          style={{ paddingBottom: 'var(--space-3)', fontWeight: 'var(--weight-semibold)', borderBottom: activeTab === 'maintenance' ? '2px solid var(--color-primary)' : 'none', color: activeTab === 'maintenance' ? 'var(--color-primary)' : 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Maintenance Logs
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'depreciation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 'var(--weight-bold)' }}>Calculations Registry</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                type="month"
                className="frappe-input"
                style={{ width: '150px', paddingBlock: 'var(--space-1)' }}
                value={depPeriod}
                onChange={e => setDepPeriod(e.target.value)}
              />
              <ProtectedComponent permission="assets.depreciation.post">
                <Button onClick={handleRunSingleDepreciation} disabled={depRunning || asset.status !== 'ACTIVE'}>
                  {depRunning ? <RefreshCw className="animate-spin mr-2" /> : <RefreshCw style={{ marginRight: 'var(--space-2)' }} />}
                  Run Single Depreciation
                </Button>
              </ProtectedComponent>
            </div>
          </div>

          <Card>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: 'var(--space-3)' }}>Period</th>
                  <th style={{ padding: 'var(--space-3)' }}>Date</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Depreciation Amount</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Accumulated Depreciation</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Net Book Value</th>
                  <th style={{ padding: 'var(--space-3)' }}>Journal Reference</th>
                  <th style={{ padding: 'var(--space-3)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {asset.depreciations.map(dep => (
                  <tr key={dep.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-semibold)' }}>{dep.periodName || 'N/A'}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{new Date(dep.date).toLocaleDateString()}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>-${Number(dep.amount).toFixed(2)}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>${Number(dep.accumulatedDepreciation).toFixed(2)}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>${Number(dep.bookValue).toFixed(2)}</td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-primary)' }}>{dep.journalId || 'Manual Entry'}</td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {dep.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {asset.depreciations.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No depreciation records posted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 'var(--weight-bold)' }}>Custody Transfer Log</h3>
            <Button onClick={() => setShowTransferForm(!showTransferForm)}>
              <Plus style={{ marginRight: 'var(--space-2)' }} />
              Transfer Asset
            </Button>
          </div>

          {showTransferForm && (
            <Card>
              <form onSubmit={handleTransfer} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h4 style={{ fontWeight: 'var(--weight-semibold)' }}>Log Custody / Location Transfer</h4>
                <div className="frappe-grid-3">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)' }}>Transfer Date</label>
                    <input
                      type="date"
                      required
                      className="frappe-input"
                      value={transferFormData.transferDate}
                      onChange={e => setTransferFormData({ ...transferFormData, transferDate: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)' }}>To Warehouse/Location</label>
                    <select
                      className="frappe-input"
                      value={transferFormData.toLocationId}
                      onChange={e => setTransferFormData({ ...transferFormData, toLocationId: e.target.value })}
                    >
                      <option value="">No Location / In-Transit</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)' }}>To Custodian Employee</label>
                    <select
                      className="frappe-input"
                      value={transferFormData.toCustodianId}
                      onChange={e => setTransferFormData({ ...transferFormData, toCustodianId: e.target.value })}
                    >
                      <option value="">No Custodian / General Corporate</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)' }}>Reason for Transfer</label>
                  <input
                    className="frappe-input"
                    placeholder="Department relocation, custodian swap..."
                    value={transferFormData.reason}
                    onChange={e => setTransferFormData({ ...transferFormData, reason: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  <Button type="button" variant="outline" onClick={() => setShowTransferForm(false)}>Cancel</Button>
                  <Button type="submit">Complete Transfer</Button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: 'var(--space-3)' }}>Transfer Date</th>
                  <th style={{ padding: 'var(--space-3)' }}>From Location</th>
                  <th style={{ padding: 'var(--space-3)' }}>To Location</th>
                  <th style={{ padding: 'var(--space-3)' }}>From Custodian</th>
                  <th style={{ padding: 'var(--space-3)' }}>To Custodian</th>
                  <th style={{ padding: 'var(--space-3)' }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {asset.transfers.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)' }}>{new Date(log.transferDate).toLocaleDateString()}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{log.fromLocation?.name || 'Corporate Store'}</td>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>
                      {log.toLocation?.name || 'Corporate Store'}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>{log.fromCustodian?.name || 'Unassigned'}</td>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-semibold)' }}>
                      {log.toCustodian?.name || 'Unassigned'}
                    </td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>{log.reason || 'N/A'}</td>
                  </tr>
                ))}
                {asset.transfers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No asset transfers recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 'var(--weight-bold)' }}>Maintenance Records</h3>
            <Button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}>
              <Plus style={{ marginRight: 'var(--space-2)' }} />
              Log Maintenance
            </Button>
          </div>

          {showMaintenanceForm && (
            <Card>
              <form onSubmit={handleMaintenance} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h4 style={{ fontWeight: 'var(--weight-semibold)' }}>Log Asset Maintenance</h4>
                
                <div className="frappe-grid-3">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)' }}>Maintenance Date</label>
                    <input
                      type="date"
                      required
                      className="frappe-input"
                      value={maintenanceFormData.maintenanceDate}
                      onChange={e => setMaintenanceFormData({ ...maintenanceFormData, maintenanceDate: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)' }}>Maintenance Type</label>
                    <select
                      className="frappe-input"
                      value={maintenanceFormData.type}
                      onChange={e => setMaintenanceFormData({ ...maintenanceFormData, type: e.target.value })}
                    >
                      <option value="PREVENTIVE">PREVENTIVE</option>
                      <option value="CORRECTIVE">CORRECTIVE</option>
                      <option value="CALIBRATION">CALIBRATION</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)' }}>Service Provider</label>
                    <input
                      required
                      className="frappe-input"
                      placeholder="Apple Store, internal tech desk..."
                      value={maintenanceFormData.performedBy}
                      onChange={e => setMaintenanceFormData({ ...maintenanceFormData, performedBy: e.target.value })}
                    />
                  </div>
                </div>

                <div className="frappe-grid-2">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)' }}>Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="frappe-input"
                      value={maintenanceFormData.cost}
                      onChange={e => setMaintenanceFormData({ ...maintenanceFormData, cost: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)' }}>Next Scheduled Date (Optional)</label>
                    <input
                      type="date"
                      className="frappe-input"
                      value={maintenanceFormData.nextMaintenanceDate}
                      onChange={e => setMaintenanceFormData({ ...maintenanceFormData, nextMaintenanceDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)' }}>Work Description</label>
                  <textarea
                    required
                    className="frappe-input"
                    style={{ minHeight: '60px' }}
                    placeholder="Provide details about actions taken during maintenance..."
                    value={maintenanceFormData.description}
                    onChange={e => setMaintenanceFormData({ ...maintenanceFormData, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  <Button type="button" variant="outline" onClick={() => setShowMaintenanceForm(false)}>Cancel</Button>
                  <Button type="submit">Submit Maintenance Log</Button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: 'var(--space-3)' }}>Date</th>
                  <th style={{ padding: 'var(--space-3)' }}>Type</th>
                  <th style={{ padding: 'var(--space-3)' }}>Description</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Cost</th>
                  <th style={{ padding: 'var(--space-3)' }}>Performed By</th>
                  <th style={{ padding: 'var(--space-3)' }}>Next Schedule</th>
                </tr>
              </thead>
              <tbody>
                {asset.maintenanceLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)' }}>{new Date(log.maintenanceDate).toLocaleDateString()}</td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        log.type === 'PREVENTIVE' ? 'bg-green-100 text-green-700' :
                        log.type === 'CORRECTIVE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>{log.description}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>${Number(log.cost).toFixed(2)}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{log.performedBy}</td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                      {log.nextMaintenanceDate ? new Date(log.nextMaintenanceDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
                {asset.maintenanceLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No maintenance events logged for this asset.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Change History Timeline */}
      <Card>
        <div style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
            Asset Audit Trail & Edit Timeline
          </h3>
          <ChangeHistory entityType="FixedAsset" entityId={id} />
        </div>
      </Card>
    </div>
  );
}
