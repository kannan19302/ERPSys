'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { ClipboardList, GitCommit, GitPullRequest, Check, X, ShieldAlert, ArrowDownUp } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

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

interface BOMTree {
  name: string;
  code: string;
  children?: TreeNode[];
}

export default function BOMsPage() {
  const client = useApiClient();
  const [boms, setBoms] = useState<BOM[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ecos, setEcos] = useState<ECO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [isECOModalOpen, setIsECOModalOpen] = useState(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  
  const [selectedBomForTree, setSelectedBomForTree] = useState<string | null>(null);
  const [bomTreeData, setBomTreeData] = useState<BOMTree | null>(null);
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
    void fetchData();
  }, [client]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bomsData, productsData, ecosData] = await Promise.all([
        client.get<BOM[] | { data?: BOM[] }>('/manufacturing/boms'),
        client.get<Product[] | { data?: Product[] }>('/inventory/products'),
        client.get<ECO[] | { data?: ECO[] }>('/manufacturing/ecos'),
      ]);
      setBoms(Array.isArray(bomsData) ? bomsData : bomsData.data || []);
      setProducts(Array.isArray(productsData) ? productsData : productsData.data || []);
      setEcos(Array.isArray(ecosData) ? ecosData : ecosData.data || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const fetchBOMTree = async (bomId: string) => {
    try {
      setTreeLoading(true);
      setBomTreeData(await client.get<BOMTree>(`/manufacturing/boms/${bomId}/tree`));
    } catch {
      // Ignored
    } finally {
      setTreeLoading(false);
    }
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/manufacturing/boms', {
          ...newBOM,
          items: newBOM.items.map((item) => ({
            productId: item.productId,
            quantity: parseFloat(item.quantity),
          })),
      });
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
      await client.post('/manufacturing/ecos', {
          ...newECO,
          requestedBy: 'admin@unerp.dev',
      });
      setIsECOModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleResolveECO = async (id: string, status: string) => {
    try {
      await client.post(`/manufacturing/ecos/${id}/resolve`, { status });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: TreeNode) => {
    return (
      <div key={node.id} className={styles.p1}>
        <div className={styles.p2}>
          <GitCommit size={14} style={{ color: node.hasSubAssembly ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
          <span className={styles.p3}>{node.productName}</span>
          <span className="ui-text-xs-muted">({node.sku})</span>
          <span className={styles.p4}>
            Qty: {node.quantity}
          </span>
          {node.hasSubAssembly && (
            <span className={styles.p5}>
              Sub-Assembly
            </span>
          )}
        </div>
        {node.children && node.children.map(child => renderTreeNode(child))}
      </div>
    );
  };

  return (
    <div className="ui-stack-6">
      {/* Page Header */}
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p6}>
            <ClipboardList size={28} className="ui-text-primary" />
            Bills of Materials (BOM)
          </h1>
          <p className={styles.p7}>
            Configure product recipe components, raw materials breakdowns, revision controls, and engineering modifications.
          </p>
        </div>
        <button
          onClick={() => setIsBOMModalOpen(true)}
          className={styles.p8}
        >
          New BOM Formula
        </button>
      </div>

      {loading ? (
        <div className="text-center p-12">Loading BOM formulas...</div>
      ) : (
        <div className={styles.p9}>
          {/* Left panel: BOM Lists */}
          <div className="ui-stack-4">
            <h3 className="ui-heading-lg">Formulations & Standard Recipes</h3>
            <div className="ui-stack-4">
              {boms.map((bom) => (
                <div key={bom.id} className={styles.p10}>
                  <div className="ui-flex-between ui-items-start">
                    <div>
                      <h4 className={styles.p11}>{bom.name}</h4>
                      <p className={styles.p12}>Code: {bom.code}</p>
                    </div>
                    <div className={styles.p13}>
                      <span className={styles.p14}>
                        Rev v{bom.version}
                      </span>
                      <span style={{ background: bom.status === 'APPROVED' ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: bom.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s1}>
                        {bom.status}
                      </span>
                    </div>
                  </div>

                  <div className={styles.p15}>
                    <p className={styles.p16}>RECIPE ITEMS</p>
                    {bom.items && bom.items.slice(0, 3).map((item, idx) => {
                      const p = products.find((pr) => pr.id === item.productId);
                      return (
                        <div key={idx} className={styles.p17}>
                          <span>{p ? p.name : 'Unknown Component'}</span>
                          <span>Qty: {Number(item.quantity)}</span>
                        </div>
                      );
                    })}
                    {bom.items && bom.items.length > 3 && (
                      <p className={styles.p18}>
                        + {bom.items.length - 3} more ingredients
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={styles.p19}>
                    <button
                      onClick={() => handleOpenTree(bom.id)}
                      className={styles.p20}
                    >
                      <ArrowDownUp size={12} /> View BOM Tree
                    </button>
                    <button
                      onClick={() => handleOpenECO(bom.id)}
                      className={styles.p21}
                    >
                      <GitPullRequest size={12} /> Request ECO Revision
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: ECO Engineering Change Orders */}
          <div className={styles.p22}>
            <h3 className={styles.p23}>
              <GitPullRequest size={20} className="ui-text-primary" />
              Engineering Change Orders (ECO)
            </h3>
            <div className="ui-stack-3">
              {ecos.map((eco) => (
                <div key={eco.id} className={styles.p24}>
                  <div className="ui-flex-between">
                    <span className={styles.p25}>{eco.bom.code} ECO Request</span>
                    <span style={{ background: eco.status === 'APPROVED' ? 'var(--color-success-light)' : eco.status === 'PENDING' ? 'var(--color-warning-light)' : 'var(--color-danger-light)', color: eco.status === 'APPROVED' ? 'var(--color-success)' : eco.status === 'PENDING' ? 'var(--color-warning)' : 'var(--color-danger)' }} className={styles.s2}>
                      {eco.status}
                    </span>
                  </div>
                  <p className="ui-text-xs-muted">{eco.changeDescription}</p>
                  <div className={styles.p26}>
                    <span className={styles.p27}>By: {eco.requestedBy}</span>
                    {eco.status === 'PENDING' && (
                      <div className={styles.p28}>
                        <button
                          onClick={() => handleResolveECO(eco.id, 'APPROVED')}
                          className={styles.p29}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => handleResolveECO(eco.id, 'REJECTED')}
                          className={styles.p30}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {ecos.length === 0 && (
                <div className={styles.p31}>
                  No active change orders logged.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Multi-level BOM Tree Modal */}
      {isTreeModalOpen && (
        <div className={styles.p32}>
          <div className={styles.p33}>
            <div className={styles.p34}>
              <h3 className="ui-heading-lg">Hierarchical BOM Tree Explosion</h3>
              <button onClick={() => setIsTreeModalOpen(false)} className={styles.p35}>&times;</button>
            </div>

            {treeLoading ? (
              <div className={styles.p36}>Exploding recipe configurations...</div>
            ) : bomTreeData ? (
              <div className={styles.p37}>
                <div className={styles.p38}>
                  ROOT: {bomTreeData.name} ({bomTreeData.code})
                </div>
                <div className="ui-stack-1">
                  {bomTreeData.children && bomTreeData.children.map((child: TreeNode) => renderTreeNode(child))}
                  {(!bomTreeData.children || bomTreeData.children.length === 0) && (
                    <p className={styles.p39}>No component ingredients.</p>
                  )}
                </div>
              </div>
            ) : null}

            <div className={styles.p40}>
              <button onClick={() => setIsTreeModalOpen(false)} className={styles.p41}>Close tree</button>
            </div>
          </div>
        </div>
      )}

      {/* Submit ECO Modal */}
      {isECOModalOpen && (
        <div className={styles.p42}>
          <form onSubmit={handleSubmitECO} className={styles.p43}>
            <h3 className="ui-heading-lg">Submit Revision Change Order</h3>
            <div>
              <label className="ui-text-xs-label">Describe Engineering Changes Required</label>
              <textarea required placeholder="Explain why this formula needs updating..." value={newECO.changeDescription} onChange={(e) => setNewECO({ ...newECO, changeDescription: e.target.value })} className={styles.p44} />
            </div>

            <div className="ui-flex-end ui-gap-2">
              <button type="button" onClick={() => setIsECOModalOpen(false)} className={styles.p45}>Cancel</button>
              <button type="submit" className={styles.p46}>Submit Request</button>
            </div>
          </form>
        </div>
      )}

      {/* New BOM Modal */}
      {isBOMModalOpen && (
        <div className={styles.p47}>
          <form onSubmit={handleCreateBOM} className={styles.p48}>
            <h3 className="ui-heading-lg">Create New Bill of Materials</h3>
            
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-xs-label">Formula Name</label>
                <input required type="text" placeholder="e.g. Laptop assembly" value={newBOM.name} onChange={(e) => setNewBOM({ ...newBOM, name: e.target.value })} className={styles.p49} />
              </div>
              <div>
                <label className="ui-text-xs-label">BOM Code</label>
                <input required type="text" placeholder="e.g. BOM-LAP-001" value={newBOM.code} onChange={(e) => setNewBOM({ ...newBOM, code: e.target.value })} className={styles.p50} />
              </div>
            </div>

            <div>
              <label className="ui-text-xs-label">Product to Manufacture</label>
              <select required value={newBOM.productId} onChange={(e) => setNewBOM({ ...newBOM, productId: e.target.value })} className={styles.p51}>
                <option value="">Select Target Product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <div className="ui-flex-between mb-2">
                <label className="ui-text-xs-label">Formula Ingredients / Component Products</label>
                <button
                  type="button"
                  onClick={() => setNewBOM({ ...newBOM, items: [...newBOM.items, { productId: '', quantity: '1' }] })}
                  className={styles.p52}
                >
                  + Add Component
                </button>
              </div>

              <div className={styles.p53}>
                {newBOM.items.map((item, idx) => (
                  <div key={idx} className={styles.p54}>
                    <select required value={item.productId} onChange={(e) => {
                      const updated = [...newBOM.items];
                      updated[idx]!.productId = e.target.value;
                      setNewBOM({ ...newBOM, items: updated });
                    }} className={styles.p55}>
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    <input required type="number" min="0.001" step="any" value={item.quantity} onChange={(e) => {
                      const updated = [...newBOM.items];
                      updated[idx]!.quantity = e.target.value;
                      setNewBOM({ ...newBOM, items: updated });
                    }} className={styles.p56} />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = newBOM.items.filter((_, i) => i !== idx);
                        setNewBOM({ ...newBOM, items: updated });
                      }}
                      className={styles.p57}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="ui-flex-end ui-gap-2 mt-2">
              <button type="button" onClick={() => setIsBOMModalOpen(false)} className={styles.p58}>Cancel</button>
              <button type="submit" className={styles.p59}>Save formula</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
