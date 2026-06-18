'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Check, FileCode } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  costPrice: number | string;
}

export default function CPQConfigurator() {
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
    fetchProducts();
  }, []);

  useEffect(() => {
    calculatePrice();
  }, [processor, ram, display, selectedProductId]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/inventory/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data?.data || []));
        if (data.length > 0) {
          setSelectedProductId(data[0].id);
          setBasePrice(Number(data[0].costPrice));
        }
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
      const token = localStorage.getItem('token');
      const product = products.find(p => p.id === selectedProductId);
      if (!product) return;

      const bomCode = `BOM-CFG-${new Date().getTime().toString().slice(-6)}`;
      const bomName = `Custom Config: ${product.name} (${processor.toUpperCase()}/${ram.toUpperCase()}/${display.toUpperCase()})`;

      // Create custom dynamic BOM
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/boms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
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
        }),
      });

      if (!res.ok) throw new Error('Failed to generate customized BOM');
      setGeneratedBOM(bomCode);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error generating BOM');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Settings size={28} style={{ color: 'var(--color-primary)' }} />
          Product Configurator (CPQ)
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
          Configure custom product requirements, calculate cost roll-up adjustments, and generate customized Bills of Materials (BOM) automatically.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading configurator components...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
          {/* Option Selector Panel */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Customize Product Specifications</h3>
            
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>BASE PRODUCT MODEL</label>
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{ width: '100%', padding: 'var(--space-2.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            {/* Config Choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>1. PROCESSOR UNIT</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {['i5', 'i7', 'i9'].map((proc) => (
                    <button
                      key={proc}
                      onClick={() => setProcessor(proc)}
                      style={{
                        flex: 1,
                        padding: 'var(--space-2.5)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        background: processor === proc ? 'var(--color-primary-light)' : 'var(--color-bg)',
                        color: processor === proc ? 'var(--color-primary)' : 'var(--color-text)',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {proc === 'i5' ? 'Intel i5 Base' : proc === 'i7' ? 'Intel i7 (+$100)' : 'Intel i9 (+$250)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>2. SYSTEM MEMORY (RAM)</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {['16gb', '32gb', '64gb'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setRam(size)}
                      style={{
                        flex: 1,
                        padding: 'var(--space-2.5)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        background: ram === size ? 'var(--color-primary-light)' : 'var(--color-bg)',
                        color: ram === size ? 'var(--color-primary)' : 'var(--color-text)',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {size === '16gb' ? '16GB DDR5' : size === '32gb' ? '32GB DDR5 (+$60)' : '64GB DDR5 (+$140)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>3. DISPLAY TECHNOLOGY</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {['1080p', '4k', 'oled'].map((disp) => (
                    <button
                      key={disp}
                      onClick={() => setDisplay(disp)}
                      style={{
                        flex: 1,
                        padding: 'var(--space-2.5)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        background: display === disp ? 'var(--color-primary-light)' : 'var(--color-bg)',
                        color: display === disp ? 'var(--color-primary)' : 'var(--color-text)',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {disp === '1080p' ? '1080p IPS' : disp === '4k' ? '4K Curved (+$150)' : 'OLED 120Hz (+$280)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Cost Roll-Up Calculation Summary */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)' }}>Manufacturing Cost Roll-Up</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Base Model Materials Cost</span>
                  <span style={{ fontWeight: 'bold' }}>${basePrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Specification Upgrade Price</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>+${optionPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Routing Workstation Overhead Rate</span>
                  <span style={{ fontWeight: 'bold' }}>+${routingOverhead.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 'bold', fontSize: 'var(--text-md)' }}>Total Roll-Up Cost Standard</span>
                  <span style={{ fontWeight: 'bold', fontSize: 'var(--text-xl)', color: 'var(--color-success)' }}>${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {generatedBOM ? (
              <div style={{ background: 'var(--color-success-light)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-4)' }}>
                <p style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={16} /> Dynamic Custom BOM Created!
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
                  BOM Code: <strong>{generatedBOM}</strong> has been registered in the system database. You can now Dispatch a Work Order using this template.
                </p>
              </div>
            ) : (
              <button
                onClick={handleGenerateBOM}
                disabled={generating}
                style={{
                  width: '100%',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-xl)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: 'var(--space-6)',
                  fontSize: 'var(--text-sm)'
                }}
              >
                <FileCode size={18} />
                {generating ? 'Compiling Specifications...' : 'Generate Dynamic Custom BOM'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
