'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, Button } from '@unerp/ui';
import { apiGet, apiPost } from '@/lib/api';

interface FixedAssetCategory {
  id: string;
  name: string;
  depreciationMethod: string;
  expectedLifeMonths: number;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export default function RegisterFixedAsset() {
  const router = useRouter();
  const [categories, setCategories] = useState<FixedAssetCategory[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    assetCode: '',
    name: '',
    description: '',
    categoryId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseValue: '',
    salvageValue: '0',
    usefulLifeYears: '5',
    depreciationMethod: 'SLM',
    depreciationRate: '',
    accountId: '',
    accumDepAccountId: '',
    locationId: '',
    custodianId: '',
  });

  useEffect(() => {
    fetchFormDropdowns();
  }, []);

  const fetchFormDropdowns = async () => {
    setLoading(true);
    try {
      const [categoriesData, accountsData, warehousesRes, employeesRes] = await Promise.all([
        apiGet<FixedAssetCategory[]>('/fixed-assets/categories'),
        apiGet<GLAccount[]>('/advanced-finance/accounts'),
        apiGet<any>('/inventory/warehouses'),
        apiGet<any>('/hr/employees'),
      ]);

      setCategories(categoriesData || []);
      setAccounts(accountsData || []);
      // Map paginated responses
      setWarehouses(warehousesRes?.data || []);
      setEmployees(employeesRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill configuration when category changes
  const handleCategoryChange = (catId: string) => {
    const selectedCat = categories.find(c => c.id === catId);
    setFormData(prev => ({
      ...prev,
      categoryId: catId,
      depreciationMethod: selectedCat ? selectedCat.depreciationMethod : prev.depreciationMethod,
      usefulLifeYears: selectedCat ? String(Math.ceil(selectedCat.expectedLifeMonths / 12)) : prev.usefulLifeYears,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        assetCode: formData.assetCode,
        name: formData.name,
        description: formData.description || null,
        categoryId: formData.categoryId || null,
        purchaseDate: formData.purchaseDate,
        purchaseValue: parseFloat(formData.purchaseValue),
        salvageValue: parseFloat(formData.salvageValue || '0'),
        usefulLifeYears: parseInt(formData.usefulLifeYears),
        depreciationMethod: formData.depreciationMethod as 'SLM' | 'WDV',
        depreciationRate: formData.depreciationRate ? parseFloat(formData.depreciationRate) : null,
        accountId: formData.accountId,
        accumDepAccountId: formData.accumDepAccountId,
        locationId: formData.locationId || null,
        custodianId: formData.custodianId || null,
      };

      await apiPost('/fixed-assets', payload);
      router.push('/finance/advanced/fixed-assets');
    } catch (err: any) {
      setError(err.message || 'Failed to register the fixed asset.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <RefreshCw className="animate-spin" style={{ color: 'var(--color-primary)', width: '32px', height: '32px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Link href="/finance/advanced/fixed-assets" className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-2)' }}>
          <ArrowLeft style={{ width: '16px' }} />
        </Link>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Register Fixed Asset</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Enter purchase details and accounting configurations to generate the asset ledger entry.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--color-bg-danger)', color: 'var(--color-text-danger)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <AlertCircle />
          <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Section 1: General Details */}
          <Card>
            <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>General Details</h3>
              
              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Asset Code (Unique ID) *</label>
                  <input
                    required
                    className="frappe-input"
                    placeholder="AST-IT-2026-0001"
                    value={formData.assetCode}
                    onChange={e => setFormData({ ...formData, assetCode: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Asset Name *</label>
                  <input
                    required
                    className="frappe-input"
                    placeholder="MacBook Pro 16 Inch"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Asset Category</label>
                  <select
                    className="frappe-input"
                    value={formData.categoryId}
                    onChange={e => handleCategoryChange(e.target.value)}
                  >
                    <option value="">Select Category (Optional)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Asset Description</label>
                <textarea
                  className="frappe-input"
                  style={{ minHeight: '60px' }}
                  placeholder="Specify brand, specs, serial number, etc..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Valuation & Depreciation Configuration */}
          <Card>
            <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>Valuation & Depreciation</h3>
              
              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Purchase Date *</label>
                  <input
                    type="date"
                    required
                    className="frappe-input"
                    value={formData.purchaseDate}
                    onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Purchase Value ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="frappe-input"
                    placeholder="2500.00"
                    value={formData.purchaseValue}
                    onChange={e => setFormData({ ...formData, purchaseValue: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Salvage Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="frappe-input"
                    placeholder="100.00"
                    value={formData.salvageValue}
                    onChange={e => setFormData({ ...formData, salvageValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Depreciation Method *</label>
                  <select
                    className="frappe-input"
                    value={formData.depreciationMethod}
                    onChange={e => setFormData({ ...formData, depreciationMethod: e.target.value })}
                  >
                    <option value="SLM">Straight Line (SLM)</option>
                    <option value="WDV">Written Down Value (WDV)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Useful Life (Years) *</label>
                  <input
                    type="number"
                    required
                    className="frappe-input"
                    placeholder="3"
                    value={formData.usefulLifeYears}
                    onChange={e => setFormData({ ...formData, usefulLifeYears: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Rate % (Only for WDV)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="frappe-input"
                    placeholder="20"
                    value={formData.depreciationRate}
                    onChange={e => setFormData({ ...formData, depreciationRate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3: Accounting & Custody Setup */}
          <Card>
            <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>Accounting & Custody Setup</h3>
              
              <div className="frappe-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Asset Cost GL Account *</label>
                  <select
                    required
                    className="frappe-input"
                    value={formData.accountId}
                    onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                  >
                    <option value="">Select Asset Account</option>
                    {accounts.filter(a => a.type === 'ASSET').map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Accumulated Depreciation contra-account *</label>
                  <select
                    required
                    className="frappe-input"
                    value={formData.accumDepAccountId}
                    onChange={e => setFormData({ ...formData, accumDepAccountId: e.target.value })}
                  >
                    <option value="">Select Contra Account</option>
                    {accounts.filter(a => a.type === 'ASSET').map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="frappe-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Asset Warehouse / Location</label>
                  <select
                    className="frappe-input"
                    value={formData.locationId}
                    onChange={e => setFormData({ ...formData, locationId: e.target.value })}
                  >
                    <option value="">Corporate / In-Transit Store</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>Custodian Employee</label>
                  <select
                    className="frappe-input"
                    value={formData.custodianId}
                    onChange={e => setFormData({ ...formData, custodianId: e.target.value })}
                  >
                    <option value="">General Corporate Custody</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Link href="/finance/advanced/fixed-assets" className="frappe-btn frappe-btn-secondary" style={{ paddingInline: 'var(--space-6)', paddingBlock: 'var(--space-2)' }}>
              Cancel
            </Link>
            <Button type="submit" disabled={submitting}>
              <Save style={{ marginRight: 'var(--space-2)', width: '16px' }} />
              {submitting ? 'Registering...' : 'Register Asset'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
