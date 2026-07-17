'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Plus, Calendar, Settings, ShieldCheck, ClipboardList,
  Wrench, Activity, AlertCircle, RefreshCw, Eye, ArrowRight
} from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
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
      <div className={styles.s1}>
        <RefreshCw className={`animate-spin ${styles.s2}`}  />
      </div>
    );
  }

  return (
    <div className={styles.s3}>
      {/* Page Header */}
      <div className="ui-flex-between">
        <div>
          <h1 className="text-3xl">Fixed Asset Management</h1>
          <p className="ui-text-muted mt-1">
            Track asset lifecycles, manage locations, log maintenance, and post automated GL depreciation logs.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
            <Settings className={styles.s4} />
            Add Category
          </Button>
          <Link href="/finance/advanced/fixed-assets/assets/new" passHref>
            <Button>
              <Plus className={styles.s4} />
              Register Asset
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className={styles.s5}>
          <AlertCircle />
          <pre className={styles.s6}>{error}</pre>
        </div>
      )}

      {depSuccessMsg && (
        <div className={styles.s7}>
          <ShieldCheck />
          <p className={styles.s8}>{depSuccessMsg}</p>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="ui-grid-4">
        <Card className="hover:shadow-md transition-shadow">
          <div className="p-5">
            <p className={styles.s9}>Total Asset Registry Cost</p>
            <h2 className={styles.s10}>
              ${totalAssetCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <div className="p-5">
            <p className={styles.s9}>Net Book Value (NBV)</p>
            <h2 className={styles.s11}>
              ${totalBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <div className="p-5">
            <p className={styles.s9}>Accumulated Depreciation</p>
            <h2 className={styles.s12}>
              ${totalAccumulatedDep.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <div className="p-5">
            <p className={styles.s9}>Active/Total Assets</p>
            <h2 className={styles.s10}>
              {activeCount} / {assets.length}
            </h2>
          </div>
        </Card>
      </div>

      <div className="ui-grid-3">
        {/* Left Side: Asset Registry Preview */}
        <div className={styles.s13}>
          <div className="ui-flex-between">
            <h3 className={styles.s14}>Asset Registers</h3>
            <Link href="/finance/advanced/fixed-assets/assets" className={styles.s15}>
              View Complete Registry Table
              <ArrowRight className={styles.s16} />
            </Link>
          </div>

          <Card>
            <ListPageTemplate
              columns={[
                { key: 'assetCode', header: 'Asset Code', render: (v) => <span className="font-semibold">{String(v)}</span> },
                { key: 'name', header: 'Name' },
                { key: 'category', header: 'Category', render: (v) => String((v as any)?.name || 'Unassigned') },
                { key: 'purchaseValue', header: 'Cost', render: (v) => `$${Number(v).toFixed(2)}` },
                { key: 'currentValue', header: 'NBV', render: (v) => <span className={styles.s17}>${Number(v).toFixed(2)}</span> },
                { key: 'status', header: 'Status', render: (v) => (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${v === 'ACTIVE' ? 'bg-green-100 text-green-700' : v === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>{String(v)}</span>
                ) },
                { key: 'id', header: '', render: (v) => (
                  <Link href={`/finance/advanced/fixed-assets/assets/${String(v)}`} className={`ui-btn ui-btn-secondary ${styles.s18}`} ><Eye className={styles.s19} /></Link>
                ) },
              ] as ListColumn[]}
              data={(assets.slice(0, 5) as unknown as Record<string, unknown>[])}
              loading={false}
              emptyTitle="No assets"
              emptyDescription="No asset registers found. Register an asset to begin."
            />
          </Card>
        </div>

        {/* Right Side: Depreciation Running Box */}
        <div className="ui-stack-4">
          <h3 className={styles.s14}>Calculations & Posting</h3>
          <Card>
            <div className="p-5 ui-stack-4">
              <div className="ui-hstack-2">
                <Calendar className="ui-text-primary" />
                <h4 className="font-bold">Monthly Depreciation Run</h4>
              </div>
              <p className="ui-text-xs-muted">
                Select a financial period (YYYY-MM) and execute depreciation runs for all active fixed assets. Double-entry ledger journals will be automatically generated.
              </p>

              <div className="ui-stack-1">
                <label className={styles.s20}>Target Run Period</label>
                <input
                  type="month"
                  className="ui-input"
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
          <h3 className={styles.s21}>Asset Categories</h3>
          <Card>
            <div className={styles.s22}>
              {categories.map(cat => (
                <div key={cat.id} className={styles.s23}>
                  <div>
                    <p className="ui-heading-sm">{cat.name}</p>
                    <p className="ui-text-xs-muted">
                      {cat.depreciationMethod} · {cat.expectedLifeMonths / 12}y life
                    </p>
                  </div>
                  {cat.depreciationRate && (
                    <span className={styles.s24}>
                      {Number(cat.depreciationRate)}%
                    </span>
                  )}
                </div>
              ))}
              {categories.length === 0 && (
                <p className={styles.s25}>
                  No categories defined.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className={styles.s26}>
          <div className={styles.s27}>
            <div className={styles.s28}>
              <h3 className="ui-heading-lg">Add Asset Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className={styles.s29}>&times;</button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div className={styles.s30}>
                <div className="ui-stack-1">
                  <label className="ui-text-xs-label">Category Name</label>
                  <input
                    required
                    className="ui-input"
                    placeholder="IT Equipment, Plant & Machinery"
                    value={categoryFormData.name}
                    onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  />
                </div>

                <div className="ui-stack-1">
                  <label className="ui-text-xs-label">Description</label>
                  <textarea
                    className={`ui-input ${styles.s31}`}

                    placeholder="Provide details about category boundaries..."
                    value={categoryFormData.description}
                    onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  />
                </div>

                <div className="ui-grid-2">
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Depreciation Method</label>
                    <select
                      className="ui-input"
                      value={categoryFormData.depreciationMethod}
                      onChange={e => setCategoryFormData({ ...categoryFormData, depreciationMethod: e.target.value })}
                    >
                      <option value="SLM">Straight Line (SLM)</option>
                      <option value="WDV">Written Down Value (WDV)</option>
                    </select>
                  </div>

                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Expected Life (Months)</label>
                    <input
                      type="number"
                      required
                      className="ui-input"
                      placeholder="36"
                      value={categoryFormData.expectedLifeMonths}
                      onChange={e => setCategoryFormData({ ...categoryFormData, expectedLifeMonths: e.target.value })}
                    />
                  </div>
                </div>

                <div className="ui-stack-1">
                  <label className="ui-text-xs-label">Depreciation Rate % (Only for WDV)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="ui-input"
                    placeholder="20"
                    value={categoryFormData.depreciationRate}
                    onChange={e => setCategoryFormData({ ...categoryFormData, depreciationRate: e.target.value })}
                  />
                </div>

                <h4 className={styles.s32}>
                  Accounts Mapping (Double-Entry Ledger)
                </h4>

                <div className="ui-stack-1">
                  <label className="ui-text-xs-label">Asset Cost GL Account</label>
                  <select
                    className="ui-input"
                    value={categoryFormData.assetAccountId}
                    onChange={e => setCategoryFormData({ ...categoryFormData, assetAccountId: e.target.value })}
                  >
                    <option value="">Select Asset Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="ui-grid-2">
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Accum. Depreciation Account</label>
                    <select
                      className="ui-input"
                      value={categoryFormData.depreciationAccountId}
                      onChange={e => setCategoryFormData({ ...categoryFormData, depreciationAccountId: e.target.value })}
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Depreciation Expense Account</label>
                    <select
                      className="ui-input"
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

              <div className={styles.s33}>
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
