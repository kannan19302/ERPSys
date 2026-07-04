'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Plus, Calendar, Settings, ShieldCheck, ClipboardList,
  Wrench, Activity, AlertCircle, RefreshCw, Eye, ArrowRight
} from 'lucide-react';
import { Card, Button } from '@unerp/ui';
import { apiGet, apiPost } from '@/lib/api';

interface FixedAsset {
  id: string;
  name: string;
  assetCode: string;
  status: string;
  purchaseValue: number;
  currentValue: number;
  depreciationMethod: string;
  usefulLifeYears: number;
  purchaseDate: string;
  categoryId: string | null;
  category?: { name: string } | null;
}

interface FixedAssetCategory {
  id: string;
  name: string;
  description: string | null;
  depreciationMethod: string;
  expectedLifeMonths: number;
  depreciationRate: number | null;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

export default function FixedAssetsDashboard() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [categories, setCategories] = useState<FixedAssetCategory[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Depreciation Wizard State
  const [depPeriod, setDepPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [depRunning, setDepRunning] = useState(false);
  const [depSuccessMsg, setDepSuccessMsg] = useState<string | null>(null);

  // Category Form State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    depreciationMethod: 'SLM',
    expectedLifeMonths: '36',
    depreciationRate: '',
    assetAccountId: '',
    depreciationAccountId: '',
    expenseAccountId: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetsData, categoriesData, accountsData] = await Promise.all([
        apiGet<FixedAsset[]>('/fixed-assets'),
        apiGet<FixedAssetCategory[]>('/fixed-assets/categories'),
        apiGet<GLAccount[]>('/advanced-finance/accounts'),
      ]);

      setAssets(assetsData || []);
      setCategories(categoriesData || []);
      setAccounts(accountsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Category creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: categoryFormData.name,
        description: categoryFormData.description || null,
        depreciationMethod: categoryFormData.depreciationMethod as 'SLM' | 'WDV',
        expectedLifeMonths: parseInt(categoryFormData.expectedLifeMonths) || 36,
        depreciationRate: categoryFormData.depreciationRate ? parseFloat(categoryFormData.depreciationRate) : null,
        assetAccountId: categoryFormData.assetAccountId || null,
        depreciationAccountId: categoryFormData.depreciationAccountId || null,
        expenseAccountId: categoryFormData.expenseAccountId || null,
      };

      await apiPost('/fixed-assets/categories', payload);
      setShowCategoryModal(false);
      setCategoryFormData({
        name: '', description: '', depreciationMethod: 'SLM', expectedLifeMonths: '36',
        depreciationRate: '', assetAccountId: '', depreciationAccountId: '', expenseAccountId: '',
      });
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error creating category.');
    }
  };

  // Run depreciation batch for a selected period
  const handleRunDepreciationBatch = async () => {
    if (!confirm(`Are you sure you want to run and post monthly depreciation for period ${depPeriod}?`)) {
      return;
    }
    setDepRunning(true);
    setDepSuccessMsg(null);
    setError(null);

    // Filter active assets
    const activeAssets = assets.filter(a => a.status === 'ACTIVE');
    if (activeAssets.length === 0) {
      setError('No active assets available for depreciation.');
      setDepRunning(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let errorsList: string[] = [];

    for (const asset of activeAssets) {
      try {
        await apiPost(`/fixed-assets/${asset.id}/depreciate`, { periodName: depPeriod });
        successCount++;
      } catch (err: any) {
        failCount++;
        errorsList.push(`${asset.name}: ${err.message}`);
      }
    }

    setDepRunning(false);
    if (successCount > 0) {
      setDepSuccessMsg(`Successfully processed depreciation for ${successCount} assets for ${depPeriod}.`);
      fetchDashboardData();
    }
    if (failCount > 0) {
      setError(`Failed to process ${failCount} assets. Errors:\n` + errorsList.join('\n'));
    }
  };

  // Calculate metrics
  const totalAssetCost = assets.reduce((sum, a) => sum + Number(a.purchaseValue), 0);
  const totalBookValue = assets.reduce((sum, a) => sum + Number(a.currentValue), 0);
  const totalAccumulatedDep = totalAssetCost - totalBookValue;
  const activeCount = assets.filter(a => a.status === 'ACTIVE').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <RefreshCw className="animate-spin" style={{ color: 'var(--color-primary)', width: '32px', height: '32px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Fixed Asset Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Track asset lifecycles, manage locations, log maintenance, and post automated GL depreciation logs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
            <Settings style={{ marginRight: 'var(--space-2)', width: '16px' }} />
            Add Category
          </Button>
          <Link href="/finance/advanced/fixed-assets/assets/new" passHref>
            <Button>
              <Plus style={{ marginRight: 'var(--space-2)', width: '16px' }} />
              Register Asset
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--color-bg-danger)', color: 'var(--color-text-danger)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--space-3)' }}>
          <AlertCircle />
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'var(--text-sm)' }}>{error}</pre>
        </div>
      )}

      {depSuccessMsg && (
        <div style={{ background: 'var(--color-bg-success)', color: 'var(--color-text-success)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--space-3)' }}>
          <ShieldCheck />
          <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{depSuccessMsg}</p>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="frappe-grid-4">
        <Card className="hover:shadow-md transition-shadow">
          <div style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase' }}>Total Asset Registry Cost</p>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-2)' }}>
              ${totalAssetCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <div style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase' }}>Net Book Value (NBV)</p>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)', marginTop: 'var(--space-2)' }}>
              ${totalBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <div style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase' }}>Accumulated Depreciation</p>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
              ${totalAccumulatedDep.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <div style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase' }}>Active/Total Assets</p>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-2)' }}>
              {activeCount} / {assets.length}
            </h2>
          </div>
        </Card>
      </div>

      <div className="frappe-grid-3">
        {/* Left Side: Asset Registry Preview */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Asset Registers</h3>
            <Link href="/finance/advanced/fixed-assets/assets" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              View Complete Registry Table
              <ArrowRight style={{ width: '14px' }} />
            </Link>
          </div>

          <Card>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: 'var(--space-3)' }}>Asset Code</th>
                  <th style={{ padding: 'var(--space-3)' }}>Name</th>
                  <th style={{ padding: 'var(--space-3)' }}>Category</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Cost</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>NBV</th>
                  <th style={{ padding: 'var(--space-3)' }}>Status</th>
                  <th style={{ padding: 'var(--space-3)' }}></th>
                </tr>
              </thead>
              <tbody>
                {assets.slice(0, 5).map(asset => (
                  <tr key={asset.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="hover:bg-muted/40">
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-semibold)' }}>{asset.assetCode}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{asset.name}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{asset.category?.name || 'Unassigned'}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>${Number(asset.purchaseValue).toFixed(2)}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>
                      ${Number(asset.currentValue).toFixed(2)}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        asset.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        asset.status === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                      <Link href={`/finance/advanced/fixed-assets/assets/${asset.id}`} className="frappe-btn frappe-btn-secondary" style={{ paddingInline: 'var(--space-2)', paddingBlock: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
                        <Eye style={{ width: '12px', height: '12px' }} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No asset registers found. Register an asset to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Right Side: Depreciation Running Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Calculations & Posting</h3>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Calendar style={{ color: 'var(--color-primary)' }} />
                <h4 style={{ fontWeight: 'var(--weight-bold)' }}>Monthly Depreciation Run</h4>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Select a financial period (YYYY-MM) and execute depreciation runs for all active fixed assets. Double-entry ledger journals will be automatically generated.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Target Run Period</label>
                <input
                  type="month"
                  className="frappe-input"
                  value={depPeriod}
                  onChange={e => setDepPeriod(e.target.value)}
                />
              </div>

              <Button
                onClick={handleRunDepreciationBatch}
                disabled={depRunning}
                className="w-full"
              >
                {depRunning ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" />
                    Running Batch...
                  </>
                ) : 'Run Monthly Depreciation'}
              </Button>
            </div>
          </Card>

          {/* Categories List Cards */}
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginTop: 'var(--space-2)' }}>Asset Categories</h3>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  <div>
                    <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{cat.name}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {cat.depreciationMethod} · {cat.expectedLifeMonths / 12}y life
                    </p>
                  </div>
                  {cat.depreciationRate && (
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', background: 'var(--color-bg-primary)', color: 'var(--color-primary)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                      {Number(cat.depreciationRate)}%
                    </span>
                  )}
                </div>
              ))}
              {categories.length === 0 && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                  No categories defined.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-bg-card)', width: '600px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Add Asset Category</h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-lg)' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Category Name</label>
                  <input
                    required
                    className="frappe-input"
                    placeholder="IT Equipment, Plant & Machinery"
                    value={categoryFormData.name}
                    onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Description</label>
                  <textarea
                    className="frappe-input"
                    style={{ minHeight: '60px' }}
                    placeholder="Provide details about category boundaries..."
                    value={categoryFormData.description}
                    onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  />
                </div>

                <div className="frappe-grid-2">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Depreciation Method</label>
                    <select
                      className="frappe-input"
                      value={categoryFormData.depreciationMethod}
                      onChange={e => setCategoryFormData({ ...categoryFormData, depreciationMethod: e.target.value })}
                    >
                      <option value="SLM">Straight Line (SLM)</option>
                      <option value="WDV">Written Down Value (WDV)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Expected Life (Months)</label>
                    <input
                      type="number"
                      required
                      className="frappe-input"
                      placeholder="36"
                      value={categoryFormData.expectedLifeMonths}
                      onChange={e => setCategoryFormData({ ...categoryFormData, expectedLifeMonths: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Depreciation Rate % (Only for WDV)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="frappe-input"
                    placeholder="20"
                    value={categoryFormData.depreciationRate}
                    onChange={e => setCategoryFormData({ ...categoryFormData, depreciationRate: e.target.value })}
                  />
                </div>

                <h4 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-1)' }}>
                  Accounts Mapping (Double-Entry Ledger)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Asset Cost GL Account</label>
                  <select
                    className="frappe-input"
                    value={categoryFormData.assetAccountId}
                    onChange={e => setCategoryFormData({ ...categoryFormData, assetAccountId: e.target.value })}
                  >
                    <option value="">Select Asset Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="frappe-grid-2">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Accum. Depreciation Account</label>
                    <select
                      className="frappe-input"
                      value={categoryFormData.depreciationAccountId}
                      onChange={e => setCategoryFormData({ ...categoryFormData, depreciationAccountId: e.target.value })}
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Depreciation Expense Account</label>
                    <select
                      className="frappe-input"
                      value={categoryFormData.expenseAccountId}
                      onChange={e => setCategoryFormData({ ...categoryFormData, expenseAccountId: e.target.value })}
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
                <Button type="submit">Create Category</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
