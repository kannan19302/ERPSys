'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Plus, Search, Eye, ArrowLeft, RefreshCw
} from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
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
      <div className={styles.s1}>
        <RefreshCw className={`animate-spin ${styles.s2}`}  />
      </div>
    );
  }

  return (
    <div className={styles.s3}>
      {/* Header */}
      <div className="ui-flex-between">
        <div className="ui-hstack-3">
          <Link href="/finance/advanced/fixed-assets" className="ui-btn ui-btn-secondary p-2">
            <ArrowLeft className={styles.s4} />
          </Link>
          <div>
            <h1 className="text-3xl">Fixed Asset Registry</h1>
            <p className="ui-text-muted mt-1">
              Complete record of active, disposed, or maintenance-pending corporate assets.
            </p>
          </div>
        </div>
        <Link href="/finance/advanced/fixed-assets/assets/new" passHref>
          <Button>
            <Plus className={styles.s5} />
            Register Asset
          </Button>
        </Link>
      </div>

      {/* Search & Filters Card */}
      <Card>
        <div className={styles.s6}>
          {/* Search */}
          <div className={styles.s7}>
            <Search className={styles.s8} />
            <input
              className={`ui-input ${styles.s9}`}

              placeholder="Search assets by code or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className={styles.s10}>
            <select
              className="ui-input"
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
          <div className={styles.s11}>
            <select
              className="ui-input"
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
      {(() => {
        const assetColumns: ListColumn[] = [
          { key: 'assetCode', header: 'Asset Code', render: (v) => <span className="font-semibold">{v as string}</span> },
          { key: 'name', header: 'Asset Name' },
          { key: 'category', header: 'Category', render: (_v, row) => <span>{(row as unknown as FixedAsset).category?.name || 'Unassigned'}</span> },
          { key: 'location', header: 'Location', render: (_v, row) => <span>{(row as unknown as FixedAsset).location?.name || 'In Transit / Store'}</span> },
          { key: 'custodian', header: 'Custodian', render: (_v, row) => <span>{(row as unknown as FixedAsset).custodian?.name || 'Corporate'}</span> },
          { key: 'purchaseValue', header: 'Purchase Value', render: (v) => <span>${Number(v).toFixed(2)}</span> },
          { key: 'currentValue', header: 'Net Book Value', render: (v) => <span className={styles.s12}>${Number(v).toFixed(2)}</span> },
          { key: 'status', header: 'Status', render: (v) => {
            const s = v as string;
            return (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                s === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                s === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
              }`}>{s}</span>
            );
          }},
          { key: 'id', header: 'Action', render: (v) => (
            <Link href={`/finance/advanced/fixed-assets/assets/${v as string}`} className={`ui-btn ui-btn-primary ${styles.s13}`} >
              <Eye className={styles.s14} />
              View Details
            </Link>
          )},
        ];
        return (
          <Card>
            <ListPageTemplate
              columns={assetColumns}
              data={filteredAssets as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No Assets Found"
              emptyDescription="No matching assets found in registry."
            />
          </Card>
        );
      })()}
    </div>
  );
}
