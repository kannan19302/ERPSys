'use client';

import React, { useState, useEffect } from 'react';
import { Hammer, Play, CheckCircle2, Wrench, Truck, Plus } from 'lucide-react';

interface BOM {
  id: string;
  name: string;
  code: string;
  productId: string;
  isActive: boolean;
}

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  status: string;
  quantity: number;
  startDate: string | null;
  endDate: string | null;
  bom: BOM;
  oeeScore?: string | number | null;
  scrapQuantity?: string | number | null;
  lotNumber?: string | null;
  standardCost?: string | number | null;
  actualCost?: string | number | null;
  costVariance?: string | number | null;
  workstation?: { name: string } | null;
}

interface LoadBalance {
  workstation: string;
  capacityHours: number;
  allocatedHours: number;
  status: string;
  utilizationRate: number;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  cost?: string | number | null;
  workstation: { name: string };
}

interface SubcontractingOrder {
  id: string;
  quantity: string | number;
  unitCost: string | number;
  totalCost: string | number;
  status: string;
  deliveryDate: string | null;
  vendor: { name: string };
  product: { name: string; sku: string };
}

interface WorkstationModel {
  id: string;
  name: string;
  code: string;
}

interface VendorModel {
  id: string;
  name: string;
}

interface ProductModel {
  id: string;
  name: string;
  sku: string;
}

export default function ManufacturingDashboard() {
  const [activeTab, setActiveTab] = useState<'work-orders' | 'capacity' | 'cmms' | 'subcontracting'>('work-orders');
  const [boms, setBoms] = useState<BOM[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadBalancing, setLoadBalancing] = useState<LoadBalance[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [subcontracting, setSubcontracting] = useState<SubcontractingOrder[]>([]);
  const [workstations, setWorkstations] = useState<WorkstationModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isWOModalOpen, setIsWOModalOpen] = useState(false);
  const [newWO, setNewWO] = useState({
    bomId: '',
    workOrderNumber: '',
    quantity: '',
    startDate: '',
    workstationId: '',
  });

  const [isCmmsModalOpen, setIsCmmsModalOpen] = useState(false);
  const [newCmms, setNewCmms] = useState({
    workstationId: '',
    type: 'CORRECTIVE',
    priority: 'MEDIUM',
    title: '',
    description: '',
  });

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [vendors, setVendors] = useState<VendorModel[]>([]);
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [newSub, setNewSub] = useState({
    vendorId: '',
    productId: '',
    quantity: '',
    unitCost: '',
    deliveryDate: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (activeTab === 'work-orders') {
        const [bomsRes, ordersRes, wsRes] = await Promise.all([
          fetch('http://localhost:3001/api/v1/manufacturing/boms', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:3001/api/v1/manufacturing/work-orders', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:3001/api/v1/manufacturing/workstations', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (bomsRes.ok) setBoms(await bomsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (ordersRes.ok) setWorkOrders(await ordersRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (wsRes.ok) setWorkstations(await wsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      } else if (activeTab === 'capacity') {
        const res = await fetch('http://localhost:3001/api/v1/manufacturing/workstations/load-balancing', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) (async () => { const _d = await res.json(); setLoadBalancing(Array.isArray(_d) ? _d : (_d?.data || [])); })();
      } else if (activeTab === 'cmms') {
        const [cmmsRes, wsRes] = await Promise.all([
          fetch('http://localhost:3001/api/v1/manufacturing/maintenance', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:3001/api/v1/manufacturing/workstations', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (cmmsRes.ok) setMaintenance(await cmmsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (wsRes.ok) setWorkstations(await wsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      } else if (activeTab === 'subcontracting') {
        const [subRes, vendorRes, productRes] = await Promise.all([
          fetch('http://localhost:3001/api/v1/manufacturing/subcontracting', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:3001/api/v1/crm/vendors', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:3001/api/v1/inventory/products', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (subRes.ok) setSubcontracting(await subRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (vendorRes.ok) setVendors(await vendorRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (productRes.ok) setProducts(await productRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newWO,
          quantity: parseFloat(newWO.quantity),
        }),
      });

      if (!res.ok) throw new Error('Failed to dispatch work order run');
      setIsWOModalOpen(false);
      setNewWO({ bomId: '', workOrderNumber: '', quantity: '', startDate: '', workstationId: '' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleCreateCmmsRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCmms),
      });

      if (!res.ok) throw new Error('Failed to request CMMS maintenance');
      setIsCmmsModalOpen(false);
      setNewCmms({ workstationId: '', type: 'CORRECTIVE', priority: 'MEDIUM', title: '', description: '' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleCreateSubcontracting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/subcontracting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newSub,
          quantity: parseFloat(newSub.quantity),
          unitCost: parseFloat(newSub.unitCost),
        }),
      });

      if (!res.ok) throw new Error('Failed to request subcontracting');
      setIsSubModalOpen(false);
      setNewSub({ vendorId: '', productId: '', quantity: '', unitCost: '', deliveryDate: '' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Hammer size={28} style={{ color: 'var(--color-primary)' }} />
            Manufacturing Operations
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Dispatch production runs, evaluate scheduling capacities, execute maintenance, and log subcontracting logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('work-orders')}
          style={{
            padding: 'var(--space-2.5) var(--space-4)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'work-orders' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'work-orders' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer'
          }}
        >
          Work Orders Dispatch
        </button>
        <button
          onClick={() => setActiveTab('capacity')}
          style={{
            padding: 'var(--space-2.5) var(--space-4)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'capacity' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'capacity' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer'
          }}
        >
          Capacity Balancing
        </button>
        <button
          onClick={() => setActiveTab('cmms')}
          style={{
            padding: 'var(--space-2.5) var(--space-4)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'cmms' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'cmms' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer'
          }}
        >
          CMMS Machine Maintenance
        </button>
        <button
          onClick={() => setActiveTab('subcontracting')}
          style={{
            padding: 'var(--space-2.5) var(--space-4)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'subcontracting' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'subcontracting' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer'
          }}
        >
          Subcontracting Orders
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading details...</div>
      ) : (
        <div>
          {/* TAB 1: WORK ORDERS */}
          {activeTab === 'work-orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsWOModalOpen(true)}
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={16} /> New Work Order
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {workOrders.map((wo) => (
                  <div
                    key={wo.id}
                    style={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-2xl)',
                      padding: 'var(--space-5)',
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1.2fr 1fr',
                      alignItems: 'center',
                      gap: 'var(--space-4)'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{wo.workOrderNumber}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>BOM: {wo.bom.name}</p>
                      {wo.workstation && (
                        <p style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'semibold', marginTop: '2px' }}>Machine: {wo.workstation.name}</p>
                      )}
                    </div>

                    <div>
                      <span style={{
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background:
                          wo.status === 'COMPLETED' ? 'var(--color-success-light)' :
                          wo.status === 'IN_PROGRESS' ? 'var(--color-primary-light)' : 'var(--color-bg-hover)',
                        color:
                          wo.status === 'COMPLETED' ? 'var(--color-success)' :
                          wo.status === 'IN_PROGRESS' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      }}>
                        {wo.status}
                      </span>
                    </div>

                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>QUANTITY</p>
                      <p style={{ fontWeight: 'semibold', fontSize: 'var(--text-sm)' }}>{Number(wo.quantity)}</p>
                    </div>

                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>STANDARD COST</p>
                      <p style={{ fontWeight: 'semibold', fontSize: 'var(--text-sm)' }}>
                        {wo.standardCost ? `$${Number(wo.standardCost).toFixed(2)}` : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>ACTUAL COST</p>
                      <p style={{ fontWeight: 'semibold', fontSize: 'var(--text-sm)', color: wo.costVariance && Number(wo.costVariance) > 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>
                        {wo.actualCost ? `$${Number(wo.actualCost).toFixed(2)}` : 'N/A'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {wo.status === 'COMPLETED' && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', fontWeight: 'bold' }}>
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      )}
                      {wo.status === 'IN_PROGRESS' && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', fontWeight: 'bold' }}>
                          <Play size={14} /> Running MES...
                        </span>
                      )}
                      {wo.status === 'PLANNED' && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          Dispatched
                        </span>
                      )}
                      {wo.status === 'DRAFT' && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CAPACITY LOAD PLANNING */}
          {activeTab === 'capacity' && (
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Finite Capacity Load Utilization</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginTop: 'var(--space-2)' }}>
                {loadBalancing.map((load, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{load.workstation}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          Allocated: {load.allocatedHours.toFixed(1)} hrs / Capacity: {load.capacityHours.toFixed(1)} hrs
                        </p>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: load.status === 'OVERLOADED' ? 'var(--color-danger-light)' : 'var(--color-success-light)',
                        color: load.status === 'OVERLOADED' ? 'var(--color-danger)' : 'var(--color-success)',
                      }}>
                        {load.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '10px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(load.utilizationRate, 100)}%`,
                        height: '100%',
                        background: load.utilizationRate > 90 ? 'var(--color-danger)' : 'var(--color-primary)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CMMS MAINTENANCE */}
          {activeTab === 'cmms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsCmmsModalOpen(true)}
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Wrench size={16} /> Request Machine Maintenance
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {maintenance.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-xl)',
                      padding: 'var(--space-4)',
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
                      alignItems: 'center',
                      gap: 'var(--space-3)'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{req.title}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Machine: {req.workstation.name}</p>
                    </div>

                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'semibold' }}>{req.type}</span>
                    </div>

                    <div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background:
                          req.priority === 'HIGH' ? 'var(--color-danger-light)' : 'var(--color-bg-hover)',
                        color:
                          req.priority === 'HIGH' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                      }}>
                        {req.priority}
                      </span>
                    </div>

                    <div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background:
                          req.status === 'COMPLETED' ? 'var(--color-success-light)' : 'var(--color-primary-light)',
                        color:
                          req.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-primary)',
                      }}>
                        {req.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      Tech: {req.assignedTo || 'Unassigned'}
                    </div>
                  </div>
                ))}

                {maintenance.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-12)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-2xl)', color: 'var(--color-text-secondary)' }}>
                    No active maintenance tickets.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SUBCONTRACTING */}
          {activeTab === 'subcontracting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsSubModalOpen(true)}
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Truck size={16} /> New Subcontracting PO
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {subcontracting.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-xl)',
                      padding: 'var(--space-4)',
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
                      alignItems: 'center',
                      gap: 'var(--space-3)'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{sub.product.name}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Vendor: {sub.vendor.name}</p>
                    </div>

                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>QUANTITY</p>
                      <p style={{ fontWeight: 'semibold', fontSize: 'var(--text-xs)' }}>{Number(sub.quantity)}</p>
                    </div>

                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>UNIT COST</p>
                      <p style={{ fontWeight: 'semibold', fontSize: 'var(--text-xs)' }}>${Number(sub.unitCost).toFixed(2)}</p>
                    </div>

                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>TOTAL COST</p>
                      <p style={{ fontWeight: 'bold', fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>${Number(sub.totalCost).toFixed(2)}</p>
                    </div>

                    <div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                      }}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}

                {subcontracting.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-12)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-2xl)', color: 'var(--color-text-secondary)' }}>
                    No active subcontracting tasks logged.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WO Dispatch Modal */}
      {isWOModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateWorkOrder} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Dispatch Work Order</h3>
            
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Select Formula (BOM)</label>
              <select required value={newWO.bomId} onChange={(e) => setNewWO({ ...newWO, bomId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="">Select BOM...</option>
                {boms.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Allocate Workstation</label>
              <select required value={newWO.workstationId} onChange={(e) => setNewWO({ ...newWO, workstationId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="">Select Machine Workstation...</option>
                {workstations.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name} ({ws.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Work Order Number</label>
              <input required type="text" placeholder="e.g. WO-2026-101" value={newWO.workOrderNumber} onChange={(e) => setNewWO({ ...newWO, workOrderNumber: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Quantity</label>
                <input required type="number" min="1" value={newWO.quantity} onChange={(e) => setNewWO({ ...newWO, quantity: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Start Date</label>
                <input type="date" value={newWO.startDate} onChange={(e) => setNewWO({ ...newWO, startDate: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsWOModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Save & Dispatch</button>
            </div>
          </form>
        </div>
      )}

      {/* CMMS Request Modal */}
      {isCmmsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateCmmsRequest} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Request Machine Maintenance</h3>
            
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Target Workstation</label>
              <select required value={newCmms.workstationId} onChange={(e) => setNewCmms({ ...newCmms, workstationId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="">Select Workstation...</option>
                {workstations.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Type</label>
                <select value={newCmms.type} onChange={(e) => setNewCmms({ ...newCmms, type: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                  <option value="PREVENTIVE">PREVENTIVE</option>
                  <option value="CORRECTIVE">CORRECTIVE</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Priority</label>
                <select value={newCmms.priority} onChange={(e) => setNewCmms({ ...newCmms, priority: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Request Title</label>
              <input required type="text" placeholder="e.g. Clean main calibration dial" value={newCmms.title} onChange={(e) => setNewCmms({ ...newCmms, title: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Detailed Description</label>
              <textarea value={newCmms.description} onChange={(e) => setNewCmms({ ...newCmms, description: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)', height: '60px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsCmmsModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Log Request</button>
            </div>
          </form>
        </div>
      )}

      {/* Subcontracting Modal */}
      {isSubModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateSubcontracting} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Issue Subcontracting Order</h3>
            
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Select Subcontractor Vendor</label>
              <select required value={newSub.vendorId} onChange={(e) => setNewSub({ ...newSub, vendorId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="">Select Vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Select Material Product</label>
              <select required value={newSub.productId} onChange={(e) => setNewSub({ ...newSub, productId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="">Select Product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Quantity</label>
                <input required type="number" min="1" value={newSub.quantity} onChange={(e) => setNewSub({ ...newSub, quantity: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Unit Cost</label>
                <input required type="number" min="0.1" step="0.1" value={newSub.unitCost} onChange={(e) => setNewSub({ ...newSub, unitCost: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Target Delivery Date</label>
              <input type="date" value={newSub.deliveryDate} onChange={(e) => setNewSub({ ...newSub, deliveryDate: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsSubModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Issue Subcontract PO</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
