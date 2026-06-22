/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Building, Loader2, ArrowRight } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface FixedAsset {
  id: string;
  name: string;
  assetCode: string;
  status: string;
  purchaseValue: number | string;
  currentValue: number | string;
  depreciationMethod: string;
  usefulLifeYears: number;
  purchaseDate: string;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    assetCode: '',
    name: '',
    purchaseDate: '',
    purchaseValue: '',
    salvageValue: '',
    usefulLifeYears: '',
    depreciationMethod: 'SLM',
    accountId: '',
    accumDepAccountId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const [assetsRes, accountsRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/advanced-finance/fixed-assets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/accounts', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (assetsRes.ok) {
        setAssets((await assetsRes.json()) as FixedAsset[]);
      }
      if (accountsRes.ok) {
        const data = (await accountsRes.json()) as GLAccount[];
        setAccounts(data.filter((a) => a.type === 'ASSET' || a.type === 'EXPENSE'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const payload = {
        ...formData,
        purchaseValue: parseFloat(formData.purchaseValue),
        salvageValue: parseFloat(formData.salvageValue),
        usefulLifeYears: parseInt(formData.usefulLifeYears)
      };
      
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/fixed-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({
          assetCode: '', name: '', purchaseDate: '', purchaseValue: '', salvageValue: '', usefulLifeYears: '', depreciationMethod: 'SLM', accountId: '', accumDepAccountId: ''
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Fixed Assets</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Manage asset registers and automated depreciation.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus style={{ marginRight: 'var(--space-2)' }} />
          Add Asset
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Register New Fixed Asset</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div className="frappe-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-border)' }}>Asset Details</h3>
                  <div className="frappe-grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Asset Code</label>
                      <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={formData.assetCode} onChange={e => setFormData({ ...formData, assetCode: e.target.value })} placeholder="MAC-001" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Asset Name</label>
                      <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="MacBook Pro" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Purchase Date</label>
                    <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="date" required value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-border)' }}>Valuation & Depreciation</h3>
                  <div className="frappe-grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Purchase Value</label>
                      <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required value={formData.purchaseValue} onChange={e => setFormData({ ...formData, purchaseValue: e.target.value })} placeholder="2000.00" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Salvage Value</label>
                      <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required value={formData.salvageValue} onChange={e => setFormData({ ...formData, salvageValue: e.target.value })} placeholder="200.00" />
                    </div>
                  </div>
                  <div className="frappe-grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Useful Life (Years)</label>
                      <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required value={formData.usefulLifeYears} onChange={e => setFormData({ ...formData, usefulLifeYears: e.target.value })} placeholder="3" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Method</label>
                      <select value={formData.depreciationMethod} onChange={(e) => setFormData({ ...formData, depreciationMethod: e.target.value })} className="h-10 border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                        <option value="">Select method</option>
                        
                          <option value="SLM">Straight Line (SLM)</option>
                          <option value="WDV">Written Down Value (WDV)</option>
                        
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-border)' }}>Accounting Setup</h3>
                  <div className="frappe-grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Asset GL Account</label>
                      <select value={formData.accountId} onChange={(e) => setFormData({ ...formData, accountId: e.target.value })} className="h-10 border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                        <option value="">Select GL Account</option>
                        
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Accumulated Depreciation Account</label>
                      <select value={formData.accumDepAccountId} onChange={(e) => setFormData({ ...formData, accumDepAccountId: e.target.value })} className="h-10 border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                        <option value="">Select GL Account</option>
                        
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', paddingTop: 'var(--space-4)' }}>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Register Asset</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="frappe-grid-2">
        {assets.map(asset => (
          <Card key={asset.id} className="hover:shadow-md transition-all group">
            <div style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className="bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)' }}>
                    <Building className="text-blue-700 dark:text-blue-400" style={{ height: '24px', width: '24px' }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>{asset.name}</h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{asset.assetCode}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${asset.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {asset.status}
                </div>
              </div>
              
              <div className="frappe-grid-2" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Purchase Value</p>
                  <p style={{ fontWeight: 'var(--weight-medium)' }}>${Number(asset.purchaseValue).toFixed(2)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Current Book Value</p>
                  <p style={{ fontWeight: 'var(--weight-medium)', color: 'var(--color-primary)' }}>${Number(asset.currentValue).toFixed(2)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Method / Life</p>
                  <p style={{ fontWeight: 'var(--weight-medium)' }}>{asset.depreciationMethod} / {asset.usefulLifeYears}y</p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Purchased</p>
                  <p style={{ fontWeight: 'var(--weight-medium)' }}>{new Date(asset.purchaseDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="ghost" style={{ color: 'var(--color-primary)' }} size="sm">
                  View Depreciation Schedule <ArrowRight style={{ marginLeft: 'var(--space-2)' }} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {assets.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            <Building style={{ marginBottom: 'var(--space-4)' }} />
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-1)' }}>No fixed assets</h3>
            <p>Register your first asset to start tracking depreciation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
