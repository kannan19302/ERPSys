'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  FolderTree,
  Scale,
  Settings,
  Boxes,
  Plus,
  Trash2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  parent?: Category;
}

interface UoM {
  id: string;
  name: string;
  abbreviation: string;
  type: string;
  isBase: boolean;
}

interface UoMConversion {
  id: string;
  fromUoMId: string;
  toUoMId: string;
  factor: number;
  fromUoM: UoM;
  toUoM: UoM;
}

interface ReorderRule {
  id: string;
  productId: string;
  warehouseId?: string;
  minQty: number;
  maxQty?: number;
  reorderQty: number;
  leadTimeDays: number;
  product: { name: string; sku: string };
  isActive: boolean;
}

interface KitComponent {
  id: string;
  productId: string;
  quantity: number;
  product: { name: string; sku: string };
}

interface ProductKit {
  id: string;
  productId: string;
  name: string;
  sellPrice: number;
  discount: number;
  components: KitComponent[];
  product: { sku: string };
}

export default function AdvancedInventoryPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'uoms' | 'reorder' | 'kits'>('categories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUoms] = useState<UoM[]>([]);
  const [uomConversions, setUomConversions] = useState<UoMConversion[]>([]);
  const [reorderRules, setReorderRules] = useState<ReorderRule[]>([]);
  const [kits, setKits] = useState<ProductKit[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Modals / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'category' | 'uom' | 'conversion' | 'rule' | 'kit'>('category');

  // Category Form
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParent, setCatParent] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // UoM Form
  const [uomName, setUomName] = useState('');
  const [uomAbbr, setUomAbbr] = useState('');
  const [uomType, setUomType] = useState('UNIT');
  const [uomIsBase, setUomIsBase] = useState(false);

  // Conversion Form
  const [convFrom, setConvFrom] = useState('');
  const [convTo, setConvTo] = useState('');
  const [convFactor, setConvFactor] = useState(1);

  // Reorder Rule Form
  const [ruleProd, setRuleProd] = useState('');
  const [ruleWh, setRuleWh] = useState('');
  const [ruleMin, setRuleMin] = useState(0);
  const [ruleMax, setRuleMax] = useState(0);
  const [ruleReorder, setRuleReorder] = useState(0);
  const [ruleLead, setRuleLead] = useState(0);

  // Kit Form
  const [kitProd, setKitProd] = useState('');
  const [kitName, setKitName] = useState('');
  const [kitPrice, setKitPrice] = useState(0);
  const [kitDiscount, setKitDiscount] = useState(0);
  const [kitComps, setKitComps] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: '', quantity: 1 }
  ]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Helper to fetch list and return items
      const fetchList = async (url: string) => {
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error();
        const json = await res.json();
        return Array.isArray(json) ? json : (json?.data || []);
      };

      if (activeTab === 'categories') {
        const cats = await fetchList('/api/v1/inventory/categories');
        setCategories(cats);
      } else if (activeTab === 'uoms') {
        const list = await fetchList('/api/v1/inventory/uoms');
        const convs = await fetchList('/api/v1/inventory/uom-conversions');
        setUoms(list);
        setUomConversions(convs);
      } else if (activeTab === 'reorder') {
        const rules = await fetchList('/api/v1/inventory/reorder-rules');
        const prods = await fetchList('/api/v1/inventory/products');
        const whs = await fetchList('/api/v1/inventory/warehouses');
        setReorderRules(rules);
        setProducts(prods);
        setWarehouses(whs);
      } else if (activeTab === 'kits') {
        const list = await fetchList('/api/v1/inventory/kits');
        const prods = await fetchList('/api/v1/inventory/products');
        setKits(list);
        setProducts(prods);
      }
    } catch {
      setError('Serving local mock fallback data.');
      // Mock fallbacks
      if (activeTab === 'categories') {
        setCategories([
          { id: 'cat-1', name: 'Raw Materials', slug: 'raw-materials' },
          { id: 'cat-2', name: 'Finished Goods', slug: 'finished-goods' }
        ]);
      } else if (activeTab === 'uoms') {
        setUoms([
          { id: 'uom-1', name: 'Each', abbreviation: 'PCS', type: 'UNIT', isBase: true },
          { id: 'uom-2', name: 'Kilogram', abbreviation: 'KG', type: 'WEIGHT', isBase: true }
        ]);
        setUomConversions([]);
      } else if (activeTab === 'reorder') {
        setReorderRules([
          { id: 'rule-1', productId: 'prod-1', minQty: 10, maxQty: 100, reorderQty: 50, leadTimeDays: 5, product: { name: 'Vibranium', sku: 'SKU-VIB' }, isActive: true }
        ]);
        setProducts([{ id: 'prod-1', name: 'Vibranium', sku: 'SKU-VIB' }]);
        setWarehouses([{ id: 'wh-1', name: 'Central Depot', code: 'WH-01' }]);
      } else if (activeTab === 'kits') {
        setKits([
          { id: 'kit-1', productId: 'prod-1', name: 'Defense Shield Assembly Kit', sellPrice: 24500, discount: 5, components: [], product: { sku: 'SKU-VIB' } }
        ]);
        setProducts([{ id: 'prod-1', name: 'Vibranium', sku: 'SKU-VIB' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    let url = '';
    let payload = {};

    if (modalType === 'category') {
      url = '/api/v1/inventory/categories';
      payload = { name: catName, slug: catSlug, parentId: catParent || undefined, description: catDesc };
    } else if (modalType === 'uom') {
      url = '/api/v1/inventory/uoms';
      payload = { name: uomName, abbreviation: uomAbbr, type: uomType, isBase: uomIsBase };
    } else if (modalType === 'conversion') {
      url = '/api/v1/inventory/uom-conversions';
      payload = { fromUoMId: convFrom, toUoMId: convTo, factor: Number(convFactor) };
    } else if (modalType === 'rule') {
      url = '/api/v1/inventory/reorder-rules';
      payload = { productId: ruleProd, warehouseId: ruleWh || undefined, minQty: Number(ruleMin), maxQty: ruleMax ? Number(ruleMax) : undefined, reorderQty: Number(ruleReorder), leadTimeDays: Number(ruleLead) };
    } else if (modalType === 'kit') {
      url = '/api/v1/inventory/kits';
      payload = { productId: kitProd, name: kitName, sellPrice: Number(kitPrice), discount: Number(kitDiscount), components: kitComps.filter(c => c.productId !== '') };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      setIsModalOpen(false);
      loadData();
    } catch {
      // Mock local insertion
      setIsModalOpen(false);
      alert('Action completed (mock mode)');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Advanced Inventory Hub"
        description="Configure classifications, Unit of Measure mappings, reorder rules, and product bundle definitions."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Advanced Settings' }]}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="builder-tabs">
        <button className={`builder-tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          <FolderTree size={16} />
          Product Categories
        </button>
        <button className={`builder-tab ${activeTab === 'uoms' ? 'active' : ''}`} onClick={() => setActiveTab('uoms')}>
          <Scale size={16} />
          Units of Measure
        </button>
        <button className={`builder-tab ${activeTab === 'reorder' ? 'active' : ''}`} onClick={() => setActiveTab('reorder')}>
          <Settings size={16} />
          Reorder Rules
        </button>
        <button className={`builder-tab ${activeTab === 'kits' ? 'active' : ''}`} onClick={() => setActiveTab('kits')}>
          <Boxes size={16} />
          Kits & Bundling
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <div>
            {/* Category Tab */}
            {activeTab === 'categories' && (
              <Card padding="none">
                <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Classifications Hierarchy</span>
                  <Button variant="primary" onClick={() => { setModalType('category'); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={14} /> Add Category
                  </Button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Name</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Slug</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Parent Category</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>{cat.name}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{cat.slug}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{cat.parent?.name || 'Root'}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right' }}>
                          <button style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {/* UoM Tab */}
            {activeTab === 'uoms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Card padding="none">
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Standard Measurement Codes</span>
                    <Button variant="primary" onClick={() => { setModalType('uom'); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Plus size={14} /> Add UoM
                    </Button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                        <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Name</th>
                        <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Code</th>
                        <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Dimension Type</th>
                        <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Base Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uoms.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>{u.name}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}><Badge variant="info">{u.abbreviation}</Badge></td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{u.type}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{u.isBase ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card padding="none">
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>UoM Conversion Matrix</span>
                    <Button variant="primary" onClick={() => { setModalType('conversion'); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Plus size={14} /> Add Conversion Factor
                    </Button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                        <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Source UoM</th>
                        <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Target UoM</th>
                        <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Conversion Factor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uomConversions.map((conv) => (
                        <tr key={conv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{conv.fromUoM.name}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{conv.toUoM.name}</td>
                          <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{conv.factor}</td>
                        </tr>
                      ))}
                      {uomConversions.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No conversion rates loaded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}

            {/* Reorder Rules Tab */}
            {activeTab === 'reorder' && (
              <Card padding="none">
                <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Automatic Replenishment Limits</span>
                  <Button variant="primary" onClick={() => { setModalType('rule'); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={14} /> Add Rule
                  </Button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Product</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Min Threshold</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Max Limit</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Trigger PO Qty</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Lead Time (Days)</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reorderRules.map((rule) => (
                      <tr key={rule.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{rule.product.name} ({rule.product.sku})</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{rule.minQty}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{rule.maxQty || 'N/A'}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{rule.reorderQty}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{rule.leadTimeDays}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}><Badge variant="success">Active</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {/* Kits Tab */}
            {activeTab === 'kits' && (
              <Card padding="none">
                <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Production Assemblies & Kits</span>
                  <Button variant="primary" onClick={() => { setModalType('kit'); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={14} /> Add Kit
                  </Button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Assembly SKU</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Kit Name</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Base Price</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Discount %</th>
                      <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>Components Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kits.map((k) => (
                      <tr key={k.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>{k.product.sku}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{k.name}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>${Number(k.sellPrice).toLocaleString()}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{k.discount}%</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{k.components.length} items</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div className="frappe-card modal-card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Add New config Record</span>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Close</button>
            </div>
            <div className="frappe-card-body" style={{ padding: '20px' }}>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {modalType === 'category' && (
                  <>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Category Name</label>
                      <input type="text" className="frappe-input" value={catName} onChange={e => { setCatName(e.target.value); setCatSlug(e.target.value.toLowerCase().replace(/ /g, '-')); }} required />
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Slug</label>
                      <input type="text" className="frappe-input" value={catSlug} onChange={e => setCatSlug(e.target.value)} required />
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Parent Category</label>
                      <select className="frappe-input" value={catParent} onChange={e => setCatParent(e.target.value)}>
                        <option value="">-- Root --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {modalType === 'uom' && (
                  <>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Measurement Name</label>
                      <input type="text" className="frappe-input" value={uomName} onChange={e => setUomName(e.target.value)} required />
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Abbreviation</label>
                      <input type="text" className="frappe-input" value={uomAbbr} onChange={e => setUomAbbr(e.target.value)} required />
                    </div>
                  </>
                )}

                {modalType === 'rule' && (
                  <>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Select Product</label>
                      <select className="frappe-input" value={ruleProd} onChange={e => setRuleProd(e.target.value)} required>
                        <option value="">-- Select --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Min Alert Stock Qty</label>
                      <input type="number" className="frappe-input" value={ruleMin} onChange={e => setRuleMin(Number(e.target.value))} required />
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Purchase Trigger Qty</label>
                      <input type="number" className="frappe-input" value={ruleReorder} onChange={e => setRuleReorder(Number(e.target.value))} required />
                    </div>
                  </>
                )}

                {modalType === 'kit' && (
                  <>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Kit Parent Product</label>
                      <select className="frappe-input" value={kitProd} onChange={e => setKitProd(e.target.value)} required>
                        <option value="">-- Select --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Display Kit Name</label>
                      <input type="text" className="frappe-input" value={kitName} onChange={e => setKitName(e.target.value)} required />
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Package Pricing</label>
                      <input type="number" className="frappe-input" value={kitPrice} onChange={e => setKitPrice(Number(e.target.value))} required />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Submit Rule</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
