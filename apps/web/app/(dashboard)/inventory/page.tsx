'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader, Button, Spinner, StatusBadge, DashboardKPICard, DashboardChart, ViewSwitcher, type ViewMode } from '@unerp/ui';
import { useProducts, useWarehouses, useStockLevels, useStockEntries } from '../../../src/lib/hooks/useModuleData';
import { apiPost } from '../../../src/lib/api';
import {
  Package, Warehouse, AlertTriangle, TrendingDown, Search,
  AlertCircle, CheckCircle, X
} from 'lucide-react';

export default function InventoryPage() {
  const { data: productsData, isLoading: loadingProducts, refetch: refetchProducts } = useProducts();
  const { data: warehousesRaw = [], isLoading: loadingWarehouses, refetch: refetchWarehouses } = useWarehouses();
  const { data: stockLevelsRaw, isLoading: loadingStock, refetch: refetchStock } = useStockLevels();
  const { data: stockEntriesRaw = [], isLoading: loadingEntries } = useStockEntries();
  const loading = loadingProducts || loadingWarehouses || loadingStock || loadingEntries;

  const products = Array.isArray(productsData) ? productsData : (productsData as Record<string, unknown>)?.data ? (productsData as Record<string, unknown>).data as Record<string, unknown>[] : [];
  const warehouses = Array.isArray(warehousesRaw) ? warehousesRaw : (warehousesRaw as Record<string, unknown>)?.data ? (warehousesRaw as Record<string, unknown>).data as Record<string, unknown>[] : [];
  const stockLevels = Array.isArray(stockLevelsRaw) ? stockLevelsRaw : (stockLevelsRaw as Record<string, unknown>)?.data ? (stockLevelsRaw as Record<string, unknown>).data as Record<string, unknown>[] : [];
  const stockEntries = Array.isArray(stockEntriesRaw) ? stockEntriesRaw : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ViewMode>('chart');
  const [activeTab, setActiveTab] = useState<'products' | 'warehouses' | 'stock-levels'>('products');

  // Create Product Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ── KPI values ──
  const totalProducts = products.length;
  const totalWarehouses = warehouses.length;
  const lowStockCount = stockLevels.filter((sl: Record<string, unknown>) => Number(sl.currentQty || 0) <= Number(sl.reorderPoint || 0)).length;
  const totalStockValue = stockLevels.reduce((sum: number, sl: Record<string, unknown>) => {
    const qty = Number(sl.currentQty || 0);
    const cost = Number(sl.valuationRate || sl.costPrice || 0);
    return sum + (qty * cost);
  }, 0);

  // ── Chart data ──
  const stockByWarehouseData = useMemo(() => {
    const whMap: Record<string, number> = {};
    stockLevels.forEach((sl: Record<string, unknown>) => {
      const whName = String((sl.warehouse as Record<string, unknown>)?.name || sl.warehouseId || 'Unknown');
      whMap[whName] = (whMap[whName] || 0) + Number(sl.currentQty || 0);
    });
    return Object.entries(whMap).map(([name, quantity]) => ({ name, quantity }));
  }, [stockLevels]);

  const lowStockData = useMemo(() => {
    return stockLevels
      .filter((sl: Record<string, unknown>) => Number(sl.currentQty || 0) <= Number(sl.reorderPoint || 0))
      .slice(0, 8)
      .map((sl: Record<string, unknown>) => ({
        name: String((sl.product as Record<string, unknown>)?.name || sl.productId || 'Unknown').substring(0, 15),
        current: Number(sl.currentQty || 0),
        reorderPoint: Number(sl.reorderPoint || 0),
      }));
  }, [stockLevels]);

  const entryTypeData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    stockEntries.forEach((e: Record<string, unknown>) => {
      const type = String(e.type || 'Unknown');
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [stockEntries]);

  // ── Handlers ──
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !sku) { setModalError('Please fill all required fields'); return; }
    setSubmitting(true); setModalError(null);
    try {
      await apiPost('/inventory/products', { name: productName, sku, sellPrice, category: category || undefined });
      setModalSuccess(true);
      setTimeout(() => { setIsCreateModalOpen(false); setProductName(''); setSku(''); setSellPrice(0); setCategory(''); setModalSuccess(false); refetchProducts(); }, 1500);
    } catch { setModalError('Failed to create product.'); }
    setSubmitting(false);
  };

  const refetchAll = () => { refetchProducts(); refetchWarehouses(); refetchStock(); };

  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    switch (activeTab) {
      case 'products': return products.filter((p: Record<string, unknown>) => String(p.name || '').toLowerCase().includes(q) || String(p.sku || '').toLowerCase().includes(q));
      case 'warehouses': return warehouses.filter((w: Record<string, unknown>) => String(w.name || '').toLowerCase().includes(q));
      case 'stock-levels': return stockLevels.filter((sl: Record<string, unknown>) => String((sl.product as Record<string, unknown>)?.name || '').toLowerCase().includes(q) || String((sl.warehouse as Record<string, unknown>)?.name || '').toLowerCase().includes(q));
      default: return [];
    }
  };
  const filteredData = getFilteredData();

  const TABS = [
    { key: 'products' as const, label: 'Products', count: products.length },
    { key: 'warehouses' as const, label: 'Warehouses', count: warehouses.length },
    { key: 'stock-levels' as const, label: 'Stock Levels', count: stockLevels.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Inventory & Warehouse"
        description="Manage products, warehouses, stock levels, and movement entries."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart']} />
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Package size={16} /> Add Product
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <DashboardKPICard title="Total Products" value={String(totalProducts)} icon={<Package size={18} />} color="#4f46e5" loading={loading}
          drillDown={{
            modalTitle: 'All Products', columns: [
              { key: 'name', label: 'Product' }, { key: 'sku', label: 'SKU' },
              { key: 'sellPrice', label: 'Price', render: (v) => `$${Number(v).toFixed(2)}` },
            ],
            rows: products.map((p: Record<string, unknown>) => ({ name: p.name, sku: p.sku, sellPrice: p.sellPrice })),
          }}
        />
        <DashboardKPICard title="Warehouses" value={String(totalWarehouses)} icon={<Warehouse size={18} />} color="#22c55e" loading={loading}
          drillDown={{
            modalTitle: 'All Warehouses', columns: [
              { key: 'name', label: 'Warehouse' }, { key: 'code', label: 'Code' },
            ],
            rows: warehouses.map((w: Record<string, unknown>) => ({ name: w.name, code: w.code })),
          }}
        />
        <DashboardKPICard title="Low Stock Items" value={String(lowStockCount)} icon={<AlertTriangle size={18} />} color="#ef4444" loading={loading}
          drillDown={{
            modalTitle: 'Low Stock Items', columns: [
              { key: 'product', label: 'Product' }, { key: 'warehouse', label: 'Warehouse' },
              { key: 'current', label: 'Current Qty' }, { key: 'reorder', label: 'Reorder Point' },
            ],
            rows: stockLevels.filter((sl: Record<string, unknown>) => Number(sl.currentQty || 0) <= Number(sl.reorderPoint || 0))
              .map((sl: Record<string, unknown>) => ({
                product: (sl.product as Record<string, unknown>)?.name || sl.productId, warehouse: (sl.warehouse as Record<string, unknown>)?.name || sl.warehouseId,
                current: sl.currentQty, reorder: sl.reorderPoint,
              })),
          }}
        />
        <DashboardKPICard title="Total Stock Value" value={`$${totalStockValue.toLocaleString()}`} icon={<TrendingDown size={18} />} color="#8b5cf6" loading={loading}
          drillDown={{
            modalTitle: 'Stock Valuations', columns: [
              { key: 'product', label: 'Product' }, { key: 'warehouse', label: 'Warehouse' },
              { key: 'qty', label: 'Current Qty' },
              { key: 'rate', label: 'Valuation Rate', render: (v) => `$${Number(v).toFixed(2)}` },
              { key: 'value', label: 'Total Value', render: (v) => `$${Number(v).toLocaleString()}` },
            ],
            rows: stockLevels.map((sl: Record<string, unknown>) => {
              const qty = Number(sl.currentQty || 0);
              const rate = Number(sl.valuationRate || sl.costPrice || 0);
              return {
                product: (sl.product as Record<string, unknown>)?.name || sl.productId,
                warehouse: (sl.warehouse as Record<string, unknown>)?.name || sl.warehouseId,
                qty,
                rate,
                value: qty * rate,
              };
            }),
          }}
        />
      </div>

      {/* Chart View */}
      {activeView === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
          <DashboardChart
            title="Stock by Warehouse"
            subtitle="Total quantity across warehouses"
            data={stockByWarehouseData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'quantity', name: 'Quantity', color: '#4f46e5' }] }}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'pie', 'donut']}
            height={280}
            loading={loading}
          />
          <DashboardChart
            title="Low Stock Alerts"
            subtitle="Items at or below reorder point"
            data={lowStockData}
            config={{
              xAxisKey: 'name',
              series: [
                { dataKey: 'current', name: 'Current Qty', color: '#ef4444' },
                { dataKey: 'reorderPoint', name: 'Reorder Point', color: '#f59e0b' },
              ]
            }}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'composed', 'line']}
            height={280}
            loading={loading}
          />
          <DashboardChart
            title="Stock Entry Types"
            subtitle="Breakdown of movement types"
            data={entryTypeData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Entries' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="donut"
            allowedChartTypes={['donut', 'pie', 'bar']}
            height={280}
            loading={loading}
          />
        </div>
      )}

      {/* List View */}
      {activeView === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--color-border)' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ padding: 'var(--space-2-5) var(--space-4)', border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? 'var(--color-primary)' : 'transparent'}`, background: 'none', color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === tab.key ? 'var(--weight-semibold)' : 'normal', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="frappe-card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input type="text" className="frappe-input" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-9)' }} />
            </div>
          </div>

          <div className="frappe-card" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
            ) : filteredData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <Package size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
                <h4 style={{ margin: 0 }}>No {activeTab} found</h4>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    {activeTab === 'products' && (
                      <><th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>SKU</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Price</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th></>
                    )}
                    {activeTab === 'warehouses' && (
                      <><th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Code</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Location</th></>
                    )}
                    {activeTab === 'stock-levels' && (
                      <><th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Warehouse</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Qty</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Reorder Point</th></>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item: Record<string, unknown>, i: number) => (
                    <tr key={String(item.id || i)} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {activeTab === 'products' && (
                        <>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-medium)' }}>{String(item.name || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{String(item.sku || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>${Number(item.sellPrice || 0).toFixed(2)}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}><StatusBadge status={String(item.status || 'ACTIVE')} /></td>
                        </>
                      )}
                      {activeTab === 'warehouses' && (
                        <>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-medium)' }}>{String(item.name || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{String(item.code || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{String(item.location || '—')}</td>
                        </>
                      )}
                      {activeTab === 'stock-levels' && (
                        <>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-medium)' }}>{String((item.product as Record<string, unknown>)?.name || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{String((item.warehouse as Record<string, unknown>)?.name || '')}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{String(item.currentQty || 0)}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', color: Number(item.currentQty || 0) <= Number(item.reorderPoint || 0) ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>{String(item.reorderPoint || 0)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Create Product Modal */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>Add Product</h3>
              <button onClick={() => { setIsCreateModalOpen(false); setModalSuccess(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateProduct} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {modalSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <CheckCircle size={40} style={{ color: 'var(--color-success)' }} />
                  <p style={{ fontWeight: 'var(--weight-semibold)', margin: 'var(--space-2) 0 0' }}>Product Created!</p>
                </div>
              ) : (
                <>
                  {modalError && <div style={{ padding: 'var(--space-2)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-danger-text)' }}>{modalError}</div>}
                  <div className="frappe-form-group"><label className="frappe-label">Product Name *</label><input type="text" required className="frappe-input" value={productName} onChange={(e) => setProductName(e.target.value)} /></div>
                  <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="frappe-form-group"><label className="frappe-label">SKU *</label><input type="text" required className="frappe-input" value={sku} onChange={(e) => setSku(e.target.value)} /></div>
                    <div className="frappe-form-group"><label className="frappe-label">Sell Price</label><input type="number" step="0.01" className="frappe-input" value={sellPrice} onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)} /></div>
                  </div>
                  <div className="frappe-form-group"><label className="frappe-label">Category</label><input type="text" className="frappe-input" value={category} onChange={(e) => setCategory(e.target.value)} /></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                    <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : 'Create'}</Button>
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
