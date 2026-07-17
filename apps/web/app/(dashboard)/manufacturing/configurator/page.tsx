'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Settings, Check, FileCode } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Product {
  id: string;
  sku: string;
  name: string;
  costPrice: number | string;
}

export default function CPQConfigurator() {
  const client = useApiClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(true);

  // Configuration Choices
  const [processor, setProcessor] = useState('i5');
  const [ram, setRam] = useState('16gb');
  const [display, setDisplay] = useState('1080p');

  // Roll-Up Calculated Values
  const [basePrice, setBasePrice] = useState(650.0);
  const [optionPrice, setOptionPrice] = useState(0.0);
  const routingOverhead = 150.0;
  const [totalCost, setTotalCost] = useState(800.0);

  const [generatedBOM, setGeneratedBOM] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    void fetchProducts();
  }, [client]);

  useEffect(() => {
    calculatePrice();
  }, [processor, ram, display, selectedProductId]);

  const fetchProducts = async () => {
    try {
      const data = await client.get<Product[]>('/inventory/products');
      setProducts(data);
      if (data.length > 0 && data[0]) {
        setSelectedProductId(data[0].id);
        setBasePrice(Number(data[0].costPrice));
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    let optPrice = 0.0;
    
    // Processor prices
    if (processor === 'i7') optPrice += 100.0;
    if (processor === 'i9') optPrice += 250.0;

    // RAM prices
    if (ram === '32gb') optPrice += 60.0;
    if (ram === '64gb') optPrice += 140.0;

    // Display prices
    if (display === '4k') optPrice += 150.0;
    if (display === 'oled') optPrice += 280.0;

    setOptionPrice(optPrice);
    
    // Recalculate total cost roll-up (Base Product Cost + Selected Configuration Options + Workstation Overhead Rate)
    const product = products.find(p => p.id === selectedProductId);
    const costPrice = product ? Number(product.costPrice) : 650.0;
    setBasePrice(costPrice);
    setTotalCost(costPrice + optPrice + routingOverhead);
  };

  const handleGenerateBOM = async () => {
    if (!selectedProductId) return;
    try {
      setGenerating(true);
      const product = products.find(p => p.id === selectedProductId);
      if (!product) return;

      const bomCode = `BOM-CFG-${new Date().getTime().toString().slice(-6)}`;
      const bomName = `Custom Config: ${product.name} (${processor.toUpperCase()}/${ram.toUpperCase()}/${display.toUpperCase()})`;

      // Create custom dynamic BOM
      await client.post('/manufacturing/boms', {
          productId: selectedProductId,
          name: bomName,
          code: bomCode,
          materialCost: basePrice + optionPrice,
          overheadCost: routingOverhead,
          standardCost: totalCost,
          routingJson: JSON.stringify([
            { sequence: 1, name: 'CNC precision casing adjust', workstationCode: 'WS-CNC', durationMinutes: 90 },
            { sequence: 2, name: 'Assembly of custom components', workstationCode: 'WS-ASM', durationMinutes: 180 },
            { sequence: 3, name: 'Custom system flashing & calibration', workstationCode: 'WS-ASM', durationMinutes: 45 },
            { sequence: 4, name: 'Packaging and custom label application', workstationCode: 'WS-PKG', durationMinutes: 20 },
          ]),
          items: [
            { productId: selectedProductId, quantity: 1.0, type: 'COMPONENT' }
          ],
      });
      setGeneratedBOM(bomCode);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error generating BOM');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <RouteGuard permission="manufacturing.configurator.read">
    <div className="ui-stack-6">
      {/* Header */}
      <div>
        <h1 className={styles.p1}>
          <Settings size={28} className="ui-text-primary" />
          Product Configurator (CPQ)
        </h1>
        <p className={styles.p2}>
          Configure custom product requirements, calculate cost roll-up adjustments, and generate customized Bills of Materials (BOM) automatically.
        </p>
      </div>

      {loading ? (
        <div className="text-center p-12">Loading configurator components...</div>
      ) : (
        <div className={styles.p3}>
          {/* Option Selector Panel */}
          <div className={styles.p4}>
            <h3 className="ui-heading-lg">Customize Product Specifications</h3>
            
            <div>
              <label className="ui-text-xs-label">BASE PRODUCT MODEL</label>
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className={styles.p5}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            {/* Config Choices */}
            <div className="ui-stack-4">
              <div>
                <label className={styles.p6}>1. PROCESSOR UNIT</label>
                <div className={styles.p7}>
                  {['i5', 'i7', 'i9'].map((proc) => (
                    <button
                      key={proc}
                      onClick={() => setProcessor(proc)}
                      style={{ background: processor === proc ? 'var(--color-primary-light)' : 'var(--color-bg)', color: processor === proc ? 'var(--color-primary)' : 'var(--color-text)' }} className={styles.s1}
                    >
                      {proc === 'i5' ? 'Intel i5 Base' : proc === 'i7' ? 'Intel i7 (+$100)' : 'Intel i9 (+$250)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={styles.p8}>2. SYSTEM MEMORY (RAM)</label>
                <div className={styles.p9}>
                  {['16gb', '32gb', '64gb'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setRam(size)}
                      style={{ background: ram === size ? 'var(--color-primary-light)' : 'var(--color-bg)', color: ram === size ? 'var(--color-primary)' : 'var(--color-text)' }} className={styles.s1}
                    >
                      {size === '16gb' ? '16GB DDR5' : size === '32gb' ? '32GB DDR5 (+$60)' : '64GB DDR5 (+$140)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={styles.p10}>3. DISPLAY TECHNOLOGY</label>
                <div className={styles.p11}>
                  {['1080p', '4k', 'oled'].map((disp) => (
                    <button
                      key={disp}
                      onClick={() => setDisplay(disp)}
                      style={{ background: display === disp ? 'var(--color-primary-light)' : 'var(--color-bg)', color: display === disp ? 'var(--color-primary)' : 'var(--color-text)' }} className={styles.s1}
                    >
                      {disp === '1080p' ? '1080p IPS' : disp === '4k' ? '4K Curved (+$150)' : 'OLED 120Hz (+$280)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Cost Roll-Up Calculation Summary */}
          <div className={styles.p12}>
            <div>
              <h3 className={styles.p13}>Manufacturing Cost Roll-Up</h3>
              <div className="ui-stack-3">
                <div className={styles.p14}>
                  <span className="ui-text-sm-muted">Base Model Materials Cost</span>
                  <span className="font-bold">${basePrice.toFixed(2)}</span>
                </div>
                <div className={styles.p15}>
                  <span className="ui-text-sm-muted">Specification Upgrade Price</span>
                  <span className={styles.p16}>+${optionPrice.toFixed(2)}</span>
                </div>
                <div className={styles.p17}>
                  <span className="ui-text-sm-muted">Routing Workstation Overhead Rate</span>
                  <span className="font-bold">+${routingOverhead.toFixed(2)}</span>
                </div>
                <div className={styles.p18}>
                  <span className={styles.p19}>Total Roll-Up Cost Standard</span>
                  <span className={styles.p20}>${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {generatedBOM ? (
              <div className={styles.p21}>
                <p className={styles.p22}>
                  <Check size={16} /> Dynamic Custom BOM Created!
                </p>
                <p className={styles.p23}>
                  BOM Code: <strong>{generatedBOM}</strong> has been registered in the system database. You can now Dispatch a Work Order using this template.
                </p>
              </div>
            ) : (
              <button
                onClick={handleGenerateBOM}
                disabled={generating}
                className={styles.p24}
              >
                <FileCode size={18} />
                {generating ? 'Compiling Specifications...' : 'Generate Dynamic Custom BOM'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
