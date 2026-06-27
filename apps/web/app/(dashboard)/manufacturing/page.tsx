'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Hammer, Play, CheckCircle2, Wrench, Truck, Plus, Calendar, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card, PageHeader, Button, Spinner, DashboardKPICard, DashboardChart, ViewSwitcher } from '@unerp/ui';

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
  product: { name: string; sku: string; id: string };
}

interface EquipmentTool {
  id: string;
  name: string;
  code: string;
  maxCycles: number;
  currentCycles: number;
  status: string;
  workstation: { name: string };
}

interface WorkstationShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  workstation: { name: string };
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'work-orders' | 'capacity' | 'cmms' | 'subcontracting' | 'equipment'>('dashboard');
  const [boms, setBoms] = useState<BOM[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadBalancing, setLoadBalancing] = useState<LoadBalance[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [subcontracting, setSubcontracting] = useState<SubcontractingOrder[]>([]);
  const [tools, setTools] = useState<EquipmentTool[]>([]);
  const [shifts, setShifts] = useState<WorkstationShift[]>([]);
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

  // Issue Materials Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueSubOrder, setIssueSubOrder] = useState<SubcontractingOrder | null>(null);
  const [issueForm, setIssueForm] = useState({
    warehouseId: 'WH-MAIN',
    quantity: '',
  });

  // Shifts Modal
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [newShift, setNewShift] = useState({
    workstationId: '',
    name: '',
    startTime: '08:00',
    endTime: '16:00',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'dashboard') {
        const [bomsRes, ordersRes, wsRes, loadRes, cmmsRes, subRes, toolsRes] = await Promise.all([
          fetch('/api/v1/manufacturing/boms', { headers }),
          fetch('/api/v1/manufacturing/work-orders', { headers }),
          fetch('/api/v1/manufacturing/workstations', { headers }),
          fetch('/api/v1/manufacturing/workstations/load-balancing', { headers }),
          fetch('/api/v1/manufacturing/maintenance', { headers }),
          fetch('/api/v1/manufacturing/subcontracting', { headers }),
          fetch('/api/v1/manufacturing/tools', { headers }),
        ]);

        if (bomsRes.ok) setBoms(await bomsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (ordersRes.ok) setWorkOrders(await ordersRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (wsRes.ok) setWorkstations(await wsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (loadRes.ok) setLoadBalancing(await loadRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (cmmsRes.ok) setMaintenance(await cmmsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (subRes.ok) setSubcontracting(await subRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (toolsRes.ok) setTools(await toolsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      } else if (activeTab === 'work-orders') {
        const [bomsRes, ordersRes, wsRes] = await Promise.all([
          fetch('/api/v1/manufacturing/boms', { headers }),
          fetch('/api/v1/manufacturing/work-orders', { headers }),
          fetch('/api/v1/manufacturing/workstations', { headers }),
        ]);
        if (bomsRes.ok) setBoms(await bomsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (ordersRes.ok) setWorkOrders(await ordersRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (wsRes.ok) setWorkstations(await wsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      } else if (activeTab === 'capacity') {
        const [loadRes, shiftsRes, wsRes] = await Promise.all([
          fetch('/api/v1/manufacturing/workstations/load-balancing', { headers }),
          fetch('/api/v1/manufacturing/shifts', { headers }),
          fetch('/api/v1/manufacturing/workstations', { headers }),
        ]);
        if (loadRes.ok) setLoadBalancing(await loadRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (shiftsRes.ok) setShifts(await shiftsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (wsRes.ok) setWorkstations(await wsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      } else if (activeTab === 'cmms') {
        const [cmmsRes, wsRes] = await Promise.all([
          fetch('/api/v1/manufacturing/maintenance', { headers }),
          fetch('/api/v1/manufacturing/workstations', { headers }),
        ]);
        if (cmmsRes.ok) setMaintenance(await cmmsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (wsRes.ok) setWorkstations(await wsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      } else if (activeTab === 'subcontracting') {
        const [subRes, vendorRes, productRes] = await Promise.all([
          fetch('/api/v1/manufacturing/subcontracting', { headers }),
          fetch('/api/v1/crm/vendors', { headers }),
          fetch('/api/v1/inventory/products', { headers }),
        ]);
        if (subRes.ok) setSubcontracting(await subRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (vendorRes.ok) setVendors(await vendorRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
        if (productRes.ok) setProducts(await productRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      } else if (activeTab === 'equipment') {
        const res = await fetch('/api/v1/manufacturing/tools', { headers });
        if (res.ok) setTools(await res.json());
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
      const res = await fetch('/api/v1/manufacturing/work-orders', {
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

      if (!res.ok) throw new Error('Failed to dispatch work order');
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
      const res = await fetch('/api/v1/manufacturing/maintenance', {
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
      const res = await fetch('/api/v1/manufacturing/subcontracting', {
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

  const handleOpenIssueModal = (sub: SubcontractingOrder) => {
    setIssueSubOrder(sub);
    setIssueForm({ warehouseId: 'WH-MAIN', quantity: String(sub.quantity) });
    setIsIssueModalOpen(true);
  };

  const handleIssueMaterials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueSubOrder) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/manufacturing/subcontracting/${issueSubOrder.id}/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          materials: [
            {
              productId: issueSubOrder.product.id,
              quantity: parseFloat(issueForm.quantity),
              warehouseId: issueForm.warehouseId,
            }
          ]
        }),
      });

      if (!res.ok) throw new Error('Failed to issue raw materials');
      setIsIssueModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/manufacturing/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newShift,
          daysOfWeek: [1, 2, 3, 4, 5],
        }),
      });

      if (!res.ok) throw new Error('Failed to create shift');
      setIsShiftModalOpen(false);
      setNewShift({ workstationId: '', name: '', startTime: '08:00', endTime: '16:00' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  // Computed values
  const averageOee = useMemo(() => {
    const validScores = workOrders.filter(w => w.oeeScore !== null && w.oeeScore !== undefined).map(w => Number(w.oeeScore));
    if (validScores.length === 0) return 85; // default OEE target
    return Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
  }, [workOrders]);

  const totalScrap = useMemo(() => {
    return workOrders.reduce((sum, w) => sum + (Number(w.scrapQuantity) || 0), 0);
  }, [workOrders]);

  const totalCostVariance = useMemo(() => {
    return workOrders.reduce((sum, w) => sum + (Number(w.costVariance) || 0), 0);
  }, [workOrders]);

  const activeMaintenanceCount = useMemo(() => {
    return maintenance.filter(m => m.status !== 'RESOLVED').length;
  }, [maintenance]);

  // Chart data
  const oeeTrendData = useMemo(() => {
    return workOrders
      .filter(w => w.oeeScore !== null && w.oeeScore !== undefined)
      .slice(0, 10)
      .map(w => ({
        name: w.workOrderNumber,
        OEE: Number(w.oeeScore),
      }));
  }, [workOrders]);

  const capacityLoadChartData = useMemo(() => {
    return loadBalancing.map(lb => ({
      name: lb.workstation,
      Allocated: Math.round(lb.allocatedHours),
      Capacity: Math.round(lb.capacityHours),
      Utilization: Math.round(lb.utilizationRate),
    }));
  }, [loadBalancing]);

  const costComparisonData = useMemo(() => {
    return workOrders
      .filter(w => w.standardCost && w.actualCost)
      .slice(0, 8)
      .map(w => ({
        name: w.workOrderNumber,
        Standard: Number(w.standardCost),
        Actual: Number(w.actualCost),
      }));
  }, [workOrders]);

  const workOrderStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    workOrders.forEach(w => {
      counts[w.status] = (counts[w.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [workOrders]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Page Header */}
      <PageHeader
        title="Manufacturing Operations"
        description="Dispatch production runs, evaluate shifts capacity, execute maintenance, track tooling metrics, and subcontracting flows."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Manufacturing' }]}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: '2px' }}>
        {['dashboard', 'work-orders', 'capacity', 'cmms', 'subcontracting', 'equipment'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: 'var(--space-2.5) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : 'none',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
      ) : (
        <div>
          {/* TAB 0: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* KPI metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                <DashboardKPICard
                  title="Average Machine OEE"
                  value={`${averageOee}%`}
                  icon={<ShieldCheck size={18} />}
                  color="var(--color-success)"
                  progress={averageOee}
                  progressLabel="Target: 85%"
                  drillDown={{
                    modalTitle: 'Work Order OEE Scores',
                    columns: [
                      { key: 'workOrderNumber', label: 'Work Order' },
                      { key: 'workstation', label: 'Workstation', render: (v: any) => v?.name || '—' },
                      { key: 'oeeScore', label: 'OEE Score', render: (v: any) => v ? `${Number(v)}%` : '—' }
                    ],
                    rows: workOrders.filter(w => w.oeeScore !== null && w.oeeScore !== undefined).map(w => ({ ...w }))
                  }}
                />
                <DashboardKPICard
                  title="Active Work Orders"
                  value={String(workOrders.filter(w => w.status === 'IN_PROGRESS').length)}
                  icon={<Play size={18} />}
                  color="var(--color-primary)"
                  drillDown={{
                    modalTitle: 'Active Work Orders',
                    columns: [
                      { key: 'workOrderNumber', label: 'Work Order' },
                      { key: 'bom', label: 'BOM', render: (v: any) => v?.name || '—' },
                      { key: 'quantity', label: 'Qty' },
                      { key: 'status', label: 'Status' }
                    ],
                    rows: workOrders.filter(w => w.status === 'IN_PROGRESS').map(w => ({ ...w }))
                  }}
                />
                <DashboardKPICard
                  title="Production Scrap Qty"
                  value={String(totalScrap)}
                  icon={<AlertTriangle size={18} />}
                  color="var(--color-danger)"
                  drillDown={{
                    modalTitle: 'Scrapped Quantities',
                    columns: [
                      { key: 'workOrderNumber', label: 'Work Order' },
                      { key: 'lotNumber', label: 'Lot Number' },
                      { key: 'scrapQuantity', label: 'Scrap Qty' }
                    ],
                    rows: workOrders.filter(w => Number(w.scrapQuantity || 0) > 0).map(w => ({ ...w }))
                  }}
                />
                <DashboardKPICard
                  title="Cost Variance"
                  value={`$${totalCostVariance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  icon={<TrendingUp size={18} />}
                  color={totalCostVariance > 0 ? 'var(--color-danger)' : 'var(--color-success)'}
                  drillDown={{
                    modalTitle: 'Production Cost Variance',
                    columns: [
                      { key: 'workOrderNumber', label: 'Work Order' },
                      { key: 'standardCost', label: 'Standard Cost', render: (v: any) => `$${Number(v).toLocaleString()}` },
                      { key: 'actualCost', label: 'Actual Cost', render: (v: any) => `$${Number(v).toLocaleString()}` },
                      { key: 'costVariance', label: 'Variance', render: (v: any) => `$${Number(v).toLocaleString()}` }
                    ],
                    rows: workOrders.filter(w => w.costVariance !== null && w.costVariance !== undefined).map(w => ({ ...w }))
                  }}
                />
              </div>

              {/* Dashboard Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
                <DashboardChart
                  title="Finite Workstation Capacity"
                  subtitle="Allocated vs Total hours capacity"
                  data={capacityLoadChartData}
                  config={{
                    xAxisKey: 'name',
                    series: [
                      { dataKey: 'Allocated', name: 'Allocated Hours', color: 'var(--color-primary)' },
                      { dataKey: 'Capacity', name: 'Capacity Hours', color: 'var(--color-border)' },
                    ]
                  }}
                  defaultChartType="bar"
                  allowedChartTypes={['bar', 'stacked-bar', 'line']}
                  height={280}
                />
                <DashboardChart
                  title="OEE Score Trend"
                  subtitle="Overall Equipment Effectiveness across orders"
                  data={oeeTrendData}
                  config={{ xAxisKey: 'name', series: [{ dataKey: 'OEE', name: 'OEE %', color: '#22c55e' }] }}
                  defaultChartType="line"
                  allowedChartTypes={['line', 'area', 'bar']}
                  height={280}
                />
                <DashboardChart
                  title="Cost Variance Analysis"
                  subtitle="Standard vs Actual production costs"
                  data={costComparisonData}
                  config={{
                    xAxisKey: 'name',
                    series: [
                      { dataKey: 'Standard', name: 'Standard Cost', color: 'var(--color-info-text)' },
                      { dataKey: 'Actual', name: 'Actual Cost', color: 'var(--color-warning)' },
                    ]
                  }}
                  defaultChartType="bar"
                  allowedChartTypes={['bar', 'composed', 'line']}
                  height={280}
                />
                <DashboardChart
                  title="Work Order Status Breakout"
                  subtitle="Total work orders grouped by stage"
                  data={workOrderStatusData}
                  config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Orders' }], valueKey: 'value', nameKey: 'name' }}
                  defaultChartType="donut"
                  allowedChartTypes={['donut', 'pie', 'bar']}
                  height={280}
                />
              </div>
            </div>
          )}

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
                      gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1fr',
                      alignItems: 'center',
                      gap: 'var(--space-4)'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{wo.workOrderNumber}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>BOM: {wo.bom.name}</p>
                      {wo.workstation && (
                        <p style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold', marginTop: '2px' }}>Machine: {wo.workstation.name}</p>
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
                      <p style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{Number(wo.quantity)}</p>
                    </div>

                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>STANDARD COST</p>
                      <p style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                        {wo.standardCost ? `$${Number(wo.standardCost).toFixed(2)}` : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>ACTUAL COST</p>
                      <p style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', color: wo.costVariance && Number(wo.costVariance) > 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>
                        {wo.actualCost ? `$${Number(wo.actualCost).toFixed(2)}` : 'N/A'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {wo.status === 'COMPLETED' ? (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', fontWeight: 'bold' }}>
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      ) : (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          Pending execution
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CAPACITY LOAD PLANNING & SHIFTS */}
          {activeTab === 'capacity' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
              
              {/* Load Balancing list */}
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

              {/* Workstation Shift Managers */}
              <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Workstation Shifts Roster</h3>
                  <button
                    onClick={() => setIsShiftModalOpen(true)}
                    style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    + Add Shift
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {shifts.map((s) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                      <div>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{s.name}</p>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Station: {s.workstation.name}</p>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px' }}>
                        {s.startTime} - {s.endTime}
                      </span>
                    </div>
                  ))}
                  {shifts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', color: 'var(--color-text-tertiary)' }}>
                      No shifts configured. Defaulting to 8-hour daily runs.
                    </div>
                  )}
                </div>
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
                      gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr',
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
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>TOTAL COST</p>
                      <p style={{ fontWeight: 'bold', fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>${Number(sub.totalCost).toFixed(2)}</p>
                    </div>

                    <div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background: sub.status === 'MATERIALS_SHIPPED' ? 'var(--color-success-light)' : 'var(--color-primary-light)',
                        color: sub.status === 'MATERIALS_SHIPPED' ? 'var(--color-success)' : 'var(--color-primary)',
                      }}>
                        {sub.status}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {sub.status === 'SENT' && (
                        <button
                          onClick={() => handleOpenIssueModal(sub)}
                          style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Issue Raw Materials
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EQUIPMENT & TOOLS */}
          {activeTab === 'equipment' && (
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Equipment tools cycle limits</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)', marginTop: '8px' }}>
                {tools.map((t) => (
                  <div key={t.id} style={{ background: 'var(--color-bg)', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{t.name}</h4>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: t.status === 'OK' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                        color: t.status === 'OK' ? 'var(--color-success)' : 'var(--color-danger)',
                      }}>
                        {t.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Code: {t.code} | Station: {t.workstation.name}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        <span>Cycles Count: {t.currentCycles} / {t.maxCycles}</span>
                        <span>{Math.round((t.currentCycles / t.maxCycles) * 100)}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min((t.currentCycles / t.maxCycles) * 100, 100)}%`,
                          height: '100%',
                          background: t.status !== 'OK' ? 'var(--color-danger)' : 'var(--color-primary)'
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* Issue Materials Modal */}
      {isIssueModalOpen && issueSubOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleIssueMaterials} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Issue Materials to Subcontractor</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Transfer raw material components for product <strong>{issueSubOrder.product.name}</strong> to the subcontractor vendor warehouse.
            </p>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Source Stock Warehouse</label>
              <select value={issueForm.warehouseId} onChange={(e) => setIssueForm({ ...issueForm, warehouseId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="WH-MAIN">WH-MAIN (Main Store)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Transfer Quantity</label>
              <input required type="number" value={issueForm.quantity} onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsIssueModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Issue materials</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Shift Modal */}
      {isShiftModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateShift} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Add Workstation Shift</h3>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Workstation</label>
              <select required value={newShift.workstationId} onChange={(e) => setNewShift({ ...newShift, workstationId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                <option value="">Select workstation...</option>
                {workstations.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Shift Name</label>
              <input required type="text" placeholder="e.g. Morning Shift" value={newShift.name} onChange={(e) => setNewShift({ ...newShift, name: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Start Time</label>
                <input type="text" placeholder="e.g. 08:00" value={newShift.startTime} onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>End Time</label>
                <input type="text" placeholder="e.g. 16:00" value={newShift.endTime} onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsShiftModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Save Shift</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
