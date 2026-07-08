'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, useToast, Badge } from '@unerp/ui';
import { Calculator, DollarSign, Percent, BarChart3, Settings, ShieldCheck } from 'lucide-react';
import { apiGet } from '../../crm/_components/api';

interface ProductConfig {
  id: string;
  name: string;
  sellPrice: number;
  minQty: number;
  tiers: Array<{ threshold: number; discount: number }>;
}

interface Profitability {
  totalRevenue: number;
  totalCost: number;
  netMargin: number;
  marginPct: number;
  averageDiscountPct: number;
  byCategory: Array<{ category: string; revenue: number; marginPct: number }>;
}

export default function CpqPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [config, setConfig] = useState<ProductConfig | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [profitability, setProfitability] = useState<Profitability | null>(null);
  const toast = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const [prodList, profitData] = await Promise.all([
          apiGet<any[]>('/inventory/products?limit=50'),
          apiGet<Profitability>('/sales/expansion/quote-profitability'),
        ]);
        setProducts(Array.isArray(prodList) ? prodList : (prodList as any)?.data || []);
        setProfitability(profitData);
        if (Array.isArray(prodList) && prodList.length > 0) {
          setSelectedProduct(prodList[0].id);
        } else if ((prodList as any)?.data?.length > 0) {
          setSelectedProduct((prodList as any).data[0].id);
        }
      } catch (err) {
        toast.error('Failed to load CPQ dashboard', err instanceof Error ? err.message : 'Please try again');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [toast]);

  useEffect(() => {
    if (!selectedProduct) return;
    const fetchConfig = async () => {
      try {
        const data = await apiGet<ProductConfig>(`/sales/expansion/product-configuration/${selectedProduct}`);
        setConfig(data);
        // Reset dynamic pricing
        const basePrice = data.sellPrice;
        const discountPct = quantity >= 100 ? 15 : quantity >= 50 ? 10 : quantity >= 20 ? 5 : 0;
        const finalPrice = basePrice * (1 - discountPct / 100);
        setPricingResult({
          basePrice,
          discountPct,
          finalPrice,
          totalPrice: finalPrice * quantity,
        });
      } catch {
        setConfig(null);
      }
    };
    fetchConfig();
  }, [selectedProduct, quantity]);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Number(e.target.value));
    setQuantity(val);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  const fmtCurrency = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Configure, Price, Quote (CPQ)"
        description="Configure product variations, analyze margins, and view quote profitability"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Sales', href: '/sales' },
          { label: 'CPQ Dashboard' },
        ]}
      />

      {profitability && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-primary)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Value</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{fmtCurrency(profitability.totalRevenue)}</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-success)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                <Percent size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Net Margin</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{fmtCurrency(profitability.netMargin)} ({profitability.marginPct}%)</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-warning)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                <Calculator size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Discount</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{profitability.averageDiscountPct}%</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-info)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-info)' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Active Rules</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>4 Rules Active</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Configurator Card */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Settings size={18} /> Dynamic Pricing & Configurator
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)' }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQtyChange}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)' }}
                />
              </div>

              {config && pricingResult && (
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                    <span>Base Unit Price:</span>
                    <strong>{fmtCurrency(pricingResult.basePrice)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-success)' }}>
                    <span>Volume Discount:</span>
                    <strong>-{pricingResult.discountPct}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                    <span>Final Unit Price:</span>
                    <strong>{fmtCurrency(pricingResult.finalPrice)}</strong>
                  </div>
                  <hr style={{ border: 0, borderTop: '1px solid var(--color-border)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-md)', fontWeight: 700 }}>
                    <span>Total Cost:</span>
                    <span>{fmtCurrency(pricingResult.totalPrice)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Profitability Analysis */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <BarChart3 size={18} /> Margin Analysis by Product Category
            </h3>
            {profitability && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {profitability.byCategory.map(c => (
                  <div key={c.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                      <span>{c.category}</span>
                      <strong>{c.marginPct}% Margin ({fmtCurrency(c.revenue)})</strong>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'var(--color-bg-sunken)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.marginPct}%`, background: 'var(--color-success)', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
