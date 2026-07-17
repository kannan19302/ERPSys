'use client';

import styles from './page.module.css';

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
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  const fmtCurrency = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="ui-stack-6 ui-animate-in">
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
        <div className={styles.p1}>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p2}>
                <DollarSign size={20} />
              </div>
              <div>
                <div className={styles.p3}>Total Value</div>
                <div className={styles.p4}>{fmtCurrency(profitability.totalRevenue)}</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p5}>
                <Percent size={20} />
              </div>
              <div>
                <div className={styles.p6}>Net Margin</div>
                <div className={styles.p7}>{fmtCurrency(profitability.netMargin)} ({profitability.marginPct}%)</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p8}>
                <Calculator size={20} />
              </div>
              <div>
                <div className={styles.p9}>Avg Discount</div>
                <div className={styles.p10}>{profitability.averageDiscountPct}%</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p11}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className={styles.p12}>Active Rules</div>
                <div className={styles.p13}>4 Rules Active</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="ui-grid-2 ui-gap-6">
        {/* Configurator Card */}
        <Card>
          <div className="p-6">
            <h3 className={styles.p14}>
              <Settings size={18} /> Dynamic Pricing & Configurator
            </h3>
            <div className="ui-stack-4">
              <div>
                <label className={styles.p15}>Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className={styles.p16}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.p17}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQtyChange}
                  className={styles.p18}
                />
              </div>

              {config && pricingResult && (
                <div className={styles.p19}>
                  <div className={styles.p20}>
                    <span>Base Unit Price:</span>
                    <strong>{fmtCurrency(pricingResult.basePrice)}</strong>
                  </div>
                  <div className={styles.p21}>
                    <span>Volume Discount:</span>
                    <strong>-{pricingResult.discountPct}%</strong>
                  </div>
                  <div className={styles.p22}>
                    <span>Final Unit Price:</span>
                    <strong>{fmtCurrency(pricingResult.finalPrice)}</strong>
                  </div>
                  <hr className={styles.p23} />
                  <div className={styles.p24}>
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
          <div className="p-6">
            <h3 className={styles.p25}>
              <BarChart3 size={18} /> Margin Analysis by Product Category
            </h3>
            {profitability && (
              <div className="ui-stack-4">
                {profitability.byCategory.map(c => (
                  <div key={c.category}>
                    <div className={styles.p26}>
                      <span>{c.category}</span>
                      <strong>{c.marginPct}% Margin ({fmtCurrency(c.revenue)})</strong>
                    </div>
                    <div className={styles.p27}>
                      <div style={{ width: `${c.marginPct}%` }} />
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
