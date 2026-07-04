'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Plus, Search, Eye, ArrowLeft, RefreshCw
} from 'lucide-react';
import { Card, Button } from '@unerp/ui';
import { apiGet } from '@/lib/api';

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
  location?: { name: string } | null;
  custodian?: { name: string } | null;
}

interface FixedAssetCategory {
  id: string;
  name: string;
}

export default function FixedAssetRegistry() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [categories, setCategories] = useState<FixedAssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsData, categoriesData] = await Promise.all([
        apiGet<FixedAsset[]>('/fixed-assets'),
        apiGet<FixedAssetCategory[]>('/fixed-assets/categories')
      ]);
      setAssets(assetsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? asset.categoryId === selectedCategory : true;
    const matchesStatus = selectedStatus ? asset.status === selectedStatus : true;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link href="/finance/advanced/fixed-assets" className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-2)' }}>
            <ArrowLeft style={{ width: '16px' }} />
          </Link>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Fixed Asset Registry</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              Complete record of active, disposed, or maintenance-pending corporate assets.
            </p>
          </div>
        </div>
        <Link href="/finance/advanced/fixed-assets/assets/new" passHref>
          <Button>
            <Plus style={{ marginRight: 'var(--space-2)', width: '16px' }} />
            Register Asset
          </Button>
        </Link>
      </div>

      {/* Search & Filters Card */}
      <Card>
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '250px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search style={{ position: 'absolute', left: 'var(--space-3)', width: '16px', color: 'var(--color-text-secondary)' }} />
            <input
              className="frappe-input"
              style={{ paddingLeft: 'var(--space-10)', width: '100%' }}
              placeholder="Search assets by code or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div style={{ width: '200px' }}>
            <select
              className="frappe-input"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: '150px' }}>
            <select
              className="frappe-input"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
              <option value="DISPOSED">DISPOSED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Asset Table */}
      <Card>
        <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-muted)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Asset Code</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Asset Name</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Category</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Location</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Custodian</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Purchase Value</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Net Book Value</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Status</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => (
              <tr key={asset.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="hover:bg-muted/40">
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{asset.assetCode}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{asset.name}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{asset.category?.name || 'Unassigned'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{asset.location?.name || 'In Transit / Store'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{asset.custodian?.name || 'Corporate'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>${Number(asset.purchaseValue).toFixed(2)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>
                  ${Number(asset.currentValue).toFixed(2)}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    asset.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    asset.status === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {asset.status}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <Link href={`/finance/advanced/fixed-assets/assets/${asset.id}`} className="frappe-btn frappe-btn-primary" style={{ paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-1)', fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <Eye style={{ width: '12px', height: '12px' }} />
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
            {filteredAssets.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No matching assets found in registry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
