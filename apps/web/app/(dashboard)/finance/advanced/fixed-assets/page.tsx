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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fixed Assets</h1>
          <p className="text-muted-foreground mt-1">Manage asset registers and automated depreciation.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Register New Fixed Asset</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm border-b pb-2">Asset Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Asset Code</label>
                      <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={formData.assetCode} onChange={e => setFormData({ ...formData, assetCode: e.target.value })} placeholder="MAC-001" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Asset Name</label>
                      <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="MacBook Pro" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Purchase Date</label>
                    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="date" required value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm border-b pb-2">Valuation & Depreciation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Purchase Value</label>
                      <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" required value={formData.purchaseValue} onChange={e => setFormData({ ...formData, purchaseValue: e.target.value })} placeholder="2000.00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Salvage Value</label>
                      <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" required value={formData.salvageValue} onChange={e => setFormData({ ...formData, salvageValue: e.target.value })} placeholder="200.00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Useful Life (Years)</label>
                      <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" type="number" required value={formData.usefulLifeYears} onChange={e => setFormData({ ...formData, usefulLifeYears: e.target.value })} placeholder="3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Method</label>
                      <select value={formData.depreciationMethod} onChange={(e) => setFormData({ ...formData, depreciationMethod: e.target.value })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">Select method</option>
                        
                          <option value="SLM">Straight Line (SLM)</option>
                          <option value="WDV">Written Down Value (WDV)</option>
                        
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 md:col-span-2">
                  <h3 className="font-semibold text-sm border-b pb-2">Accounting Setup</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Asset GL Account</label>
                      <select value={formData.accountId} onChange={(e) => setFormData({ ...formData, accountId: e.target.value })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">Select GL Account</option>
                        
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Accumulated Depreciation Account</label>
                      <select value={formData.accumDepAccountId} onChange={(e) => setFormData({ ...formData, accumDepAccountId: e.target.value })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">Select GL Account</option>
                        
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Register Asset</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map(asset => (
          <Card key={asset.id} className="hover:shadow-md transition-all group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                    <Building className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{asset.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{asset.assetCode}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${asset.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {asset.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Purchase Value</p>
                  <p className="font-medium">${Number(asset.purchaseValue).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Book Value</p>
                  <p className="font-medium text-primary">${Number(asset.currentValue).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Method / Life</p>
                  <p className="font-medium">{asset.depreciationMethod} / {asset.usefulLifeYears}y</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Purchased</p>
                  <p className="font-medium">{new Date(asset.purchaseDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" className="text-primary" size="sm">
                  View Depreciation Schedule <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {assets.length === 0 && !showForm && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground mb-1">No fixed assets</h3>
            <p>Register your first asset to start tracking depreciation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
