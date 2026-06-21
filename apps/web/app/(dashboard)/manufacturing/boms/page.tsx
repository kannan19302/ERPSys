'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, GitCommit, GitPullRequest, Check, X, ShieldAlert, ArrowDownUp } from 'lucide-react';

interface BOMItem {
  id: string;
  productId: string;
  quantity: number | string;
}

interface BOM {
  id: string;
  name: string;
  code: string;
  productId: string;
  isActive: boolean;
  version: string;
  status: string;
  items?: BOMItem[];
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface ECO {
  id: string;
  bomId: string;
  changeDescription: string;
  requestedBy: string;
  approvedBy: string | null;
  status: string;
  createdAt: string;
  bom: {
    name: string;
    code: string;
  };
}

interface TreeNode {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  type: string;
  hasSubAssembly: boolean;
  subAssemblyBomId: string | null;
  children: TreeNode[];
}

export default function BOMsPage() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ecos, setEcos] = useState<ECO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [isECOModalOpen, setIsECOModalOpen] = useState(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  
  const [selectedBomForTree, setSelectedBomForTree] = useState<string | null>(null);
  const [bomTreeData, setBomTreeData] = useState<any>(null);
  const [treeLoading, setTreeLoading] = useState(false);

  const [newBOM, setNewBOM] = useState({
    name: '',
    code: '',
    productId: '',
    items: [{ productId: '', quantity: '1' }],
  });

  const [newECO, setNewECO] = useState({
    bomId: '',
    changeDescription: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [bomsRes, prodRes, ecosRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/manufacturing/boms', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/inventory/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/manufacturing/ecos', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (bomsRes.ok) setBoms(await bomsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (prodRes.ok) setProducts(await prodRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (ecosRes.ok) setEcos(await ecosRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const fetchBOMTree = async (bomId: string) => {
    try {
      setTreeLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/manufacturing/boms/${bomId}/tree`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBomTreeData(await res.json());
      }
    } catch {
      // Ignored
    } finally {
      setTreeLoading(false);
    }
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/boms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newBOM,
          items: newBOM.items.map((item) => ({
            productId: item.productId,
            quantity: parseFloat(item.quantity),
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed to create BOM');
      setIsBOMModalOpen(false);
      setNewBOM({ name: '', code: '', productId: '', items: [{ productId: '', quantity: '1' }] });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleOpenTree = (bomId: string) => {
    setSelectedBomForTree(bomId);
    setIsTreeModalOpen(true);
    fetchBOMTree(bomId);
  };

  const handleOpenECO = (bomId: string) => {
    setNewECO({ bomId, changeDescription: '' });
    setIsECOModalOpen(true);
  };

  const handleSubmitECO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/ecos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newECO,
          requestedBy: 'admin@unerp.dev',
        }),
      });
      if (!res.ok) throw new Error('Failed to submit ECO');
      setIsECOModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleResolveECO = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/manufacturing/ecos/${id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to resolve ECO');
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: TreeNode) => {
    return (
      <div key={node.id} style={{ marginLeft: '24px', borderLeft: '1px dashed var(--color-border)', paddingLeft: '16px', marginTop: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
          <GitCommit size={14} style={{ color: node.hasSubAssembly ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{node.productName}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>({node.sku})</span>
          <span style={{ fontSize: 'var(--text-xs)', marginLeft: 'auto', background: 'var(--color-bg-hover)', padding: '2px 8px', borderRadius: '4px' }}>
            Qty: {node.quantity}
          </span>
          {node.hasSubAssembly && (
            <span style={{ fontSize: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
              Sub-Assembly
            </span>
          )}
        </div>
        {node.children && node.children.map(child => renderTreeNode(child))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ClipboardList size={28} style={{ color: 'var(--color-primary)' }} />
            Bills of Materials (BOM)
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Configure product recipe components, raw materials breakdowns, revision controls, and engineering modifications.
          </p>
        </div>
        <button
          onClick={() => setIsBOMModalOpen(true)}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            padding: 'var(--space-2.5) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
          }}
        >
          New BOM Formula
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading BOM formulas...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
          {/* Left panel: BOM Lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Formulations & Standard Recipes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {boms.map((bom) => (
                <div key={bom.id} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-md)' }}>{bom.name}</h4>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Code: {bom.code}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', background: 'var(--color-bg-hover)', color: 'var(--color-text)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'bold' }}>
                        Rev v{bom.version}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 'bold',
                        background: bom.status === 'APPROVED' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                        color: bom.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-danger)',
                      }}>
                        {bom.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-1)' }}>RECIPE ITEMS</p>
                    {bom.items && bom.items.slice(0, 3).map((item, idx) => {
                      const p = products.find((pr) => pr.id === item.productId);
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', padding: '2px 0' }}>
                          <span>{p ? p.name : 'Unknown Component'}</span>
                          <span>Qty: {Number(item.quantity)}</span>
                        </div>
                      );
                    })}
                    {bom.items && bom.items.length > 3 && (
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginTop: '2px' }}>
                        + {bom.items.length - 3} more ingredients
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                    <button
                      onClick={() => handleOpenTree(bom.id)}
                      style={{
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ArrowDownUp size={12} /> View BOM Tree
                    </button>
                    <button
                      onClick={() => handleOpenECO(bom.id)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <GitPullRequest size={12} /> Request ECO Revision
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: ECO Engineering Change Orders */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitPullRequest size={20} style={{ color: 'var(--color-primary)' }} />
              Engineering Change Orders (ECO)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {ecos.map((eco) => (
                <div key={eco.id} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{eco.bom.code} ECO Request</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: eco.status === 'APPROVED' ? 'var(--color-success-light)' : eco.status === 'PENDING' ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
                      color: eco.status === 'APPROVED' ? 'var(--color-success)' : eco.status === 'PENDING' ? 'var(--color-warning)' : 'var(--color-danger)',
                    }}>
                      {eco.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{eco.changeDescription}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)' }}>By: {eco.requestedBy}</span>
                    {eco.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleResolveECO(eco.id, 'APPROVED')}
                          style={{ background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => handleResolveECO(eco.id, 'REJECTED')}
                          style={{ background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {ecos.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', color: 'var(--color-text-tertiary)' }}>
                  No active change orders logged.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Multi-level BOM Tree Modal */}
      {isTreeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '600px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Hierarchical BOM Tree Explosion</h3>
              <button onClick={() => setIsTreeModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 'var(--text-lg)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>&times;</button>
            </div>

            {treeLoading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Exploding recipe configurations...</div>
            ) : bomTreeData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 'var(--space-2)' }}>
                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                  ROOT: {bomTreeData.name} ({bomTreeData.code})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {bomTreeData.children && bomTreeData.children.map((child: TreeNode) => renderTreeNode(child))}
                  {(!bomTreeData.children || bomTreeData.children.length === 0) && (
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No component ingredients.</p>
                  )}
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button onClick={() => setIsTreeModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Close tree</button>
            </div>
          </div>
        </div>
      )}

      {/* Submit ECO Modal */}
      {isECOModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleSubmitECO} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Submit Revision Change Order</h3>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Describe Engineering Changes Required</label>
              <textarea required placeholder="Explain why this formula needs updating..." value={newECO.changeDescription} onChange={(e) => setNewECO({ ...newECO, changeDescription: e.target.value })} style={{ width: '100%', padding: 'var(--space-2.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)', height: '100px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsECOModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Submit Request</button>
            </div>
          </form>
        </div>
      )}

      {/* New BOM Modal */}
      {isBOMModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateBOM} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '480px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Create New Bill of Materials</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Formula Name</label>
                <input required type="text" placeholder="e.g. Laptop assembly" value={newBOM.name} onChange={(e) => setNewBOM({ ...newBOM, name: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>BOM Code</label>
                <input required type="text" placeholder="e.g. BOM-LAP-001" value={newBOM.code} onChange={(e) => setNewBOM({ ...newBOM, code: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product to Manufacture</label>
              <select required value={newBOM.productId} onChange={(e) => setNewBOM({ ...newBOM, productId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="">Select Target Product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Formula Ingredients / Component Products</label>
                <button
                  type="button"
                  onClick={() => setNewBOM({ ...newBOM, items: [...newBOM.items, { productId: '', quantity: '1' }] })}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 'var(--weight-bold)' }}
                >
                  + Add Component
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '140px', overflowY: 'auto' }}>
                {newBOM.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 40px', gap: 'var(--space-2)' }}>
                    <select required value={item.productId} onChange={(e) => {
                      const updated = [...newBOM.items];
                      updated[idx]!.productId = e.target.value;
                      setNewBOM({ ...newBOM, items: updated });
                    }} style={{ padding: 'var(--space-1.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    <input required type="number" min="0.001" step="any" value={item.quantity} onChange={(e) => {
                      const updated = [...newBOM.items];
                      updated[idx]!.quantity = e.target.value;
                      setNewBOM({ ...newBOM, items: updated });
                    }} style={{ padding: 'var(--space-1.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = newBOM.items.filter((_, i) => i !== idx);
                        setNewBOM({ ...newBOM, items: updated });
                      }}
                      style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsBOMModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Save formula</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
