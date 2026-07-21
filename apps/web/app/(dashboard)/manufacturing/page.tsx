"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Hammer,
  Play,
  CheckCircle2,
  Wrench,
  Truck,
  Plus,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  DashboardChart,
  ViewSwitcher,
  StatCardRow,
} from "@unerp/ui";
import { ModuleTabLayout, type ModuleTab } from "@unerp/ui-layout";
import { RouteGuard, useApiClient } from "@unerp/framework";

const MANUFACTURING_TABS: ModuleTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/manufacturing?tab=dashboard",
    icon: Hammer,
    description: "Production overview & KPIs",
  },
  {
    id: "work-orders",
    label: "Work Orders",
    href: "/manufacturing?tab=work-orders",
    icon: Play,
    description: "Dispatch & track production runs",
  },
  {
    id: "capacity",
    label: "Capacity",
    href: "/manufacturing?tab=capacity",
    icon: Calendar,
    description: "Load planning & shift management",
  },
  {
    id: "cmms",
    label: "CMMS",
    href: "/manufacturing?tab=cmms",
    icon: Wrench,
    description: "Machine maintenance requests",
  },
  {
    id: "subcontracting",
    label: "Subcontracting",
    href: "/manufacturing?tab=subcontracting",
    icon: Truck,
    description: "Subcontractor purchase orders",
  },
  {
    id: "equipment",
    label: "Equipment",
    href: "/manufacturing?tab=equipment",
    icon: ShieldCheck,
    description: "Equipment & tooling lifecycle",
  },
];

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
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") || "dashboard") as
    | "dashboard"
    | "work-orders"
    | "capacity"
    | "cmms"
    | "subcontracting"
    | "equipment";
  const [boms, setBoms] = useState<BOM[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadBalancing, setLoadBalancing] = useState<LoadBalance[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [subcontracting, setSubcontracting] = useState<SubcontractingOrder[]>(
    [],
  );
  const [tools, setTools] = useState<EquipmentTool[]>([]);
  const [shifts, setShifts] = useState<WorkstationShift[]>([]);
  const [workstations, setWorkstations] = useState<WorkstationModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isWOModalOpen, setIsWOModalOpen] = useState(false);
  const [newWO, setNewWO] = useState({
    bomId: "",
    workOrderNumber: "",
    quantity: "",
    startDate: "",
    workstationId: "",
  });

  const [isCmmsModalOpen, setIsCmmsModalOpen] = useState(false);
  const [newCmms, setNewCmms] = useState({
    workstationId: "",
    type: "CORRECTIVE",
    priority: "MEDIUM",
    title: "",
    description: "",
  });

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [vendors, setVendors] = useState<VendorModel[]>([]);
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [newSub, setNewSub] = useState({
    vendorId: "",
    productId: "",
    quantity: "",
    unitCost: "",
    deliveryDate: "",
  });

  // Issue Materials Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueSubOrder, setIssueSubOrder] =
    useState<SubcontractingOrder | null>(null);
  const [issueForm, setIssueForm] = useState({
    warehouseId: "WH-MAIN",
    quantity: "",
  });

  // Shifts Modal
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [newShift, setNewShift] = useState({
    workstationId: "",
    name: "",
    startTime: "08:00",
    endTime: "16:00",
  });

  useEffect(() => {
    void fetchData();
  }, [activeTab, client]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = <T,>(data: T[] | { data?: T[] }) =>
        Array.isArray(data) ? data : (data.data ?? []);

      if (activeTab === "dashboard") {
        const [
          boms,
          orders,
          workstations,
          loadBalancing,
          maintenance,
          subcontracting,
          tools,
        ] = await Promise.all([
          client.get<BOM[] | { data?: BOM[] }>("/manufacturing/boms"),
          client.get<WorkOrder[] | { data?: WorkOrder[] }>(
            "/manufacturing/work-orders",
          ),
          client.get<WorkstationModel[] | { data?: WorkstationModel[] }>(
            "/manufacturing/workstations",
          ),
          client.get<LoadBalance[] | { data?: LoadBalance[] }>(
            "/manufacturing/workstations/load-balancing",
          ),
          client.get<MaintenanceRequest[] | { data?: MaintenanceRequest[] }>(
            "/manufacturing/maintenance",
          ),
          client.get<SubcontractingOrder[] | { data?: SubcontractingOrder[] }>(
            "/manufacturing/subcontracting",
          ),
          client.get<EquipmentTool[] | { data?: EquipmentTool[] }>(
            "/manufacturing/tools",
          ),
        ]);
        setBoms(list(boms));
        setWorkOrders(list(orders));
        setWorkstations(list(workstations));
        setLoadBalancing(list(loadBalancing));
        setMaintenance(list(maintenance));
        setSubcontracting(list(subcontracting));
        setTools(list(tools));
      } else if (activeTab === "work-orders") {
        const [boms, orders, workstations] = await Promise.all([
          client.get<BOM[] | { data?: BOM[] }>("/manufacturing/boms"),
          client.get<WorkOrder[] | { data?: WorkOrder[] }>(
            "/manufacturing/work-orders",
          ),
          client.get<WorkstationModel[] | { data?: WorkstationModel[] }>(
            "/manufacturing/workstations",
          ),
        ]);
        setBoms(list(boms));
        setWorkOrders(list(orders));
        setWorkstations(list(workstations));
      } else if (activeTab === "capacity") {
        const [loadBalancing, shifts, workstations] = await Promise.all([
          client.get<LoadBalance[] | { data?: LoadBalance[] }>(
            "/manufacturing/workstations/load-balancing",
          ),
          client.get<WorkstationShift[] | { data?: WorkstationShift[] }>(
            "/manufacturing/shifts",
          ),
          client.get<WorkstationModel[] | { data?: WorkstationModel[] }>(
            "/manufacturing/workstations",
          ),
        ]);
        setLoadBalancing(list(loadBalancing));
        setShifts(list(shifts));
        setWorkstations(list(workstations));
      } else if (activeTab === "cmms") {
        const [maintenance, workstations] = await Promise.all([
          client.get<MaintenanceRequest[] | { data?: MaintenanceRequest[] }>(
            "/manufacturing/maintenance",
          ),
          client.get<WorkstationModel[] | { data?: WorkstationModel[] }>(
            "/manufacturing/workstations",
          ),
        ]);
        setMaintenance(list(maintenance));
        setWorkstations(list(workstations));
      } else if (activeTab === "subcontracting") {
        const [subcontracting, vendors, products] = await Promise.all([
          client.get<SubcontractingOrder[] | { data?: SubcontractingOrder[] }>(
            "/manufacturing/subcontracting",
          ),
          client.get<VendorModel[] | { data?: VendorModel[] }>("/crm/vendors"),
          client.get<ProductModel[] | { data?: ProductModel[] }>(
            "/inventory/products",
          ),
        ]);
        setSubcontracting(list(subcontracting));
        setVendors(list(vendors));
        setProducts(list(products));
      } else if (activeTab === "equipment") {
        setTools(await client.get<EquipmentTool[]>("/manufacturing/tools"));
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
      await client.post("/manufacturing/work-orders", {
        ...newWO,
        quantity: parseFloat(newWO.quantity),
      });
      setIsWOModalOpen(false);
      setNewWO({
        bomId: "",
        workOrderNumber: "",
        quantity: "",
        startDate: "",
        workstationId: "",
      });
      void fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  const handleCreateCmmsRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/manufacturing/maintenance", newCmms);
      setIsCmmsModalOpen(false);
      setNewCmms({
        workstationId: "",
        type: "CORRECTIVE",
        priority: "MEDIUM",
        title: "",
        description: "",
      });
      void fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  const handleCreateSubcontracting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/manufacturing/subcontracting", {
        ...newSub,
        quantity: parseFloat(newSub.quantity),
        unitCost: parseFloat(newSub.unitCost),
      });
      setIsSubModalOpen(false);
      setNewSub({
        vendorId: "",
        productId: "",
        quantity: "",
        unitCost: "",
        deliveryDate: "",
      });
      void fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  const handleOpenIssueModal = (sub: SubcontractingOrder) => {
    setIssueSubOrder(sub);
    setIssueForm({ warehouseId: "WH-MAIN", quantity: String(sub.quantity) });
    setIsIssueModalOpen(true);
  };

  const handleIssueMaterials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueSubOrder) return;
    try {
      await client.post(
        `/manufacturing/subcontracting/${issueSubOrder.id}/issue`,
        {
          materials: [
            {
              productId: issueSubOrder.product.id,
              quantity: parseFloat(issueForm.quantity),
              warehouseId: issueForm.warehouseId,
            },
          ],
        },
      );
      setIsIssueModalOpen(false);
      void fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/manufacturing/shifts", {
        ...newShift,
        daysOfWeek: [1, 2, 3, 4, 5],
      });
      setIsShiftModalOpen(false);
      setNewShift({
        workstationId: "",
        name: "",
        startTime: "08:00",
        endTime: "16:00",
      });
      void fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  // Computed values
  const averageOee = useMemo(() => {
    const validScores = workOrders
      .filter((w) => w.oeeScore !== null && w.oeeScore !== undefined)
      .map((w) => Number(w.oeeScore));
    if (validScores.length === 0) return 85; // default OEE target
    return Math.round(
      validScores.reduce((a, b) => a + b, 0) / validScores.length,
    );
  }, [workOrders]);

  const totalScrap = useMemo(() => {
    return workOrders.reduce(
      (sum, w) => sum + (Number(w.scrapQuantity) || 0),
      0,
    );
  }, [workOrders]);

  const totalCostVariance = useMemo(() => {
    return workOrders.reduce(
      (sum, w) => sum + (Number(w.costVariance) || 0),
      0,
    );
  }, [workOrders]);

  const activeMaintenanceCount = useMemo(() => {
    return maintenance.filter((m) => m.status !== "RESOLVED").length;
  }, [maintenance]);

  // Chart data
  const oeeTrendData = useMemo(() => {
    return workOrders
      .filter((w) => w.oeeScore !== null && w.oeeScore !== undefined)
      .slice(0, 10)
      .map((w) => ({
        name: w.workOrderNumber,
        OEE: Number(w.oeeScore),
      }));
  }, [workOrders]);

  const capacityLoadChartData = useMemo(() => {
    return loadBalancing.map((lb) => ({
      name: lb.workstation,
      Allocated: Math.round(lb.allocatedHours),
      Capacity: Math.round(lb.capacityHours),
      Utilization: Math.round(lb.utilizationRate),
    }));
  }, [loadBalancing]);

  const costComparisonData = useMemo(() => {
    return workOrders
      .filter((w) => w.standardCost && w.actualCost)
      .slice(0, 8)
      .map((w) => ({
        name: w.workOrderNumber,
        Standard: Number(w.standardCost),
        Actual: Number(w.actualCost),
      }));
  }, [workOrders]);

  const workOrderStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    workOrders.forEach((w) => {
      counts[w.status] = (counts[w.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [workOrders]);

  return (
    <RouteGuard permission="manufacturing.dashboard.read">
      <div className="ui-stack-6 ui-animate-in">
        <ModuleTabLayout
          tabs={MANUFACTURING_TABS}
          moduleId="manufacturing"
          moduleLabel="Manufacturing Operations"
          moduleIcon={Hammer}
          moduleDescription="Dispatch production runs, evaluate shifts capacity, execute maintenance, track tooling metrics, and subcontracting flows."
        >
          {loading ? (
            <div className="text-center p-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div>
              {/* TAB 0: DASHBOARD */}
              {activeTab === "dashboard" && (
                <div className="ui-stack-6">
                  <StatCardRow
                    stats={[
                      {
                        label: "Average Machine OEE",
                        value: `${averageOee}%`,
                        icon: <ShieldCheck size={16} />,
                        color: "var(--chart-2)",
                      },
                      {
                        label: "Active Work Orders",
                        value: workOrders.filter(
                          (w) => w.status === "IN_PROGRESS",
                        ).length,
                        icon: <Play size={16} />,
                        color: "var(--chart-1)",
                      },
                      {
                        label: "Production Scrap Qty",
                        value: totalScrap,
                        icon: <AlertTriangle size={16} />,
                        color: "var(--chart-4)",
                      },
                      {
                        label: "Cost Variance",
                        value: `$${totalCostVariance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        icon: <TrendingUp size={16} />,
                        color:
                          totalCostVariance > 0
                            ? "var(--chart-4)"
                            : "var(--chart-2)",
                      },
                    ]}
                  />

                  {/* Dashboard Charts */}
                  <div className={styles.p2}>
                    <DashboardChart
                      title="Finite Workstation Capacity"
                      subtitle="Allocated vs Total hours capacity"
                      data={capacityLoadChartData}
                      config={{
                        xAxisKey: "name",
                        series: [
                          {
                            dataKey: "Allocated",
                            name: "Allocated Hours",
                            color: "var(--color-primary)",
                          },
                          {
                            dataKey: "Capacity",
                            name: "Capacity Hours",
                            color: "var(--color-border)",
                          },
                        ],
                      }}
                      defaultChartType="bar"
                      allowedChartTypes={["bar", "stacked-bar", "line"]}
                      height={280}
                    />
                    <DashboardChart
                      title="OEE Score Trend"
                      subtitle="Overall Equipment Effectiveness across orders"
                      data={oeeTrendData}
                      config={{
                        xAxisKey: "name",
                        series: [
                          {
                            dataKey: "OEE",
                            name: "OEE %",
                            color: "var(--color-success)",
                          },
                        ],
                      }}
                      defaultChartType="line"
                      allowedChartTypes={["line", "area", "bar"]}
                      height={280}
                    />
                    <DashboardChart
                      title="Cost Variance Analysis"
                      subtitle="Standard vs Actual production costs"
                      data={costComparisonData}
                      config={{
                        xAxisKey: "name",
                        series: [
                          {
                            dataKey: "Standard",
                            name: "Standard Cost",
                            color: "var(--color-info-text)",
                          },
                          {
                            dataKey: "Actual",
                            name: "Actual Cost",
                            color: "var(--color-warning)",
                          },
                        ],
                      }}
                      defaultChartType="bar"
                      allowedChartTypes={["bar", "composed", "line"]}
                      height={280}
                    />
                    <DashboardChart
                      title="Work Order Status Breakout"
                      subtitle="Total work orders grouped by stage"
                      data={workOrderStatusData}
                      config={{
                        xAxisKey: "name",
                        series: [{ dataKey: "value", name: "Orders" }],
                        valueKey: "value",
                        nameKey: "name",
                      }}
                      defaultChartType="donut"
                      allowedChartTypes={["donut", "pie", "bar"]}
                      height={280}
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: WORK ORDERS */}
              {activeTab === "work-orders" && (
                <div className="ui-stack-4">
                  <div className="ui-flex-end">
                    <button
                      onClick={() => setIsWOModalOpen(true)}
                      className={styles.p3}
                    >
                      <Plus size={16} /> New Work Order
                    </button>
                  </div>

                  <div className="ui-stack-3">
                    {workOrders.map((wo) => (
                      <div key={wo.id} className={styles.p4}>
                        <div>
                          <p className="ui-heading-sm font-bold">
                            {wo.workOrderNumber}
                          </p>
                          <p className={styles.p5}>BOM: {wo.bom.name}</p>
                          {wo.workstation && (
                            <p className={styles.p6}>
                              Machine: {wo.workstation.name}
                            </p>
                          )}
                        </div>

                        <div>
                          <span
                            style={{
                              background:
                                wo.status === "COMPLETED"
                                  ? "var(--color-success-light)"
                                  : wo.status === "IN_PROGRESS"
                                    ? "var(--color-primary-light)"
                                    : "var(--color-bg-hover)",
                              color:
                                wo.status === "COMPLETED"
                                  ? "var(--color-success)"
                                  : wo.status === "IN_PROGRESS"
                                    ? "var(--color-primary)"
                                    : "var(--color-text-secondary)",
                            }}
                            className={styles.s2}
                          >
                            {wo.status}
                          </span>
                        </div>

                        <div>
                          <p className="ui-text-micro">QUANTITY</p>
                          <p className={styles.p7}>{Number(wo.quantity)}</p>
                        </div>

                        <div>
                          <p className="ui-text-micro">STANDARD COST</p>
                          <p className={styles.p8}>
                            {wo.standardCost
                              ? `$${Number(wo.standardCost).toFixed(2)}`
                              : "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="ui-text-micro">ACTUAL COST</p>
                          <p
                            style={{
                              color:
                                wo.costVariance && Number(wo.costVariance) > 0
                                  ? "var(--color-danger)"
                                  : "var(--color-text)",
                            }}
                            className={styles.s3}
                          >
                            {wo.actualCost
                              ? `$${Number(wo.actualCost).toFixed(2)}`
                              : "N/A"}
                          </p>
                        </div>

                        <div className="text-right">
                          {wo.status === "COMPLETED" ? (
                            <span className={styles.p9}>
                              <CheckCircle2 size={14} /> Completed
                            </span>
                          ) : (
                            <span className="ui-text-xs-muted">
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
              {activeTab === "capacity" && (
                <div className={styles.p10}>
                  {/* Load Balancing list */}
                  <div className={styles.p11}>
                    <h3 className="ui-heading-lg">
                      Finite Capacity Load Utilization
                    </h3>
                    <div className={styles.p12}>
                      {loadBalancing.map((load, idx) => (
                        <div key={idx} className={styles.p13}>
                          <div className="ui-flex-between">
                            <div>
                              <p className={styles.p14}>{load.workstation}</p>
                              <p className="ui-text-xs-muted">
                                Allocated: {load.allocatedHours.toFixed(1)} hrs
                                / Capacity: {load.capacityHours.toFixed(1)} hrs
                              </p>
                            </div>
                            <span
                              style={{
                                background:
                                  load.status === "OVERLOADED"
                                    ? "var(--color-danger-light)"
                                    : "var(--color-success-light)",
                                color:
                                  load.status === "OVERLOADED"
                                    ? "var(--color-danger)"
                                    : "var(--color-success)",
                              }}
                              className={styles.s4}
                            >
                              {load.status}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className={styles.p15}>
                            <div
                              style={{
                                width: `${Math.min(load.utilizationRate, 100)}%`,
                                background:
                                  load.utilizationRate > 90
                                    ? "var(--color-danger)"
                                    : "var(--color-primary)",
                              }}
                              className={styles.s5}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Workstation Shift Managers */}
                  <div className={styles.p16}>
                    <div className="ui-flex-between">
                      <h3 className="ui-heading-lg">
                        Workstation Shifts Roster
                      </h3>
                      <button
                        onClick={() => setIsShiftModalOpen(true)}
                        className={styles.p17}
                      >
                        + Add Shift
                      </button>
                    </div>
                    <div className={styles.p18}>
                      {shifts.map((s) => (
                        <div key={s.id} className={styles.p19}>
                          <div>
                            <p className={styles.p20}>{s.name}</p>
                            <p className="ui-text-micro ui-text-muted">
                              Station: {s.workstation.name}
                            </p>
                          </div>
                          <span className={styles.p21}>
                            {s.startTime} - {s.endTime}
                          </span>
                        </div>
                      ))}
                      {shifts.length === 0 && (
                        <div className={styles.p22}>
                          No shifts configured. Defaulting to 8-hour daily runs.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CMMS MAINTENANCE */}
              {activeTab === "cmms" && (
                <div className="ui-stack-4">
                  <div className="ui-flex-end">
                    <button
                      onClick={() => setIsCmmsModalOpen(true)}
                      className={styles.p23}
                    >
                      <Wrench size={16} /> Request Machine Maintenance
                    </button>
                  </div>

                  <div className="ui-stack-3">
                    {maintenance.map((req) => (
                      <div key={req.id} className={styles.p24}>
                        <div>
                          <p className={styles.p25}>{req.title}</p>
                          <p className={styles.p26}>
                            Machine: {req.workstation.name}
                          </p>
                        </div>
                        <div>
                          <span className={styles.p27}>{req.type}</span>
                        </div>
                        <div>
                          <span
                            style={{
                              background:
                                req.priority === "HIGH"
                                  ? "var(--color-danger-light)"
                                  : "var(--color-bg-hover)",
                              color:
                                req.priority === "HIGH"
                                  ? "var(--color-danger)"
                                  : "var(--color-text-secondary)",
                            }}
                            className={styles.s4}
                          >
                            {req.priority}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              background:
                                req.status === "COMPLETED"
                                  ? "var(--color-success-light)"
                                  : "var(--color-primary-light)",
                              color:
                                req.status === "COMPLETED"
                                  ? "var(--color-success)"
                                  : "var(--color-primary)",
                            }}
                            className={styles.s4}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="ui-text-xs-muted">
                          Tech: {req.assignedTo || "Unassigned"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SUBCONTRACTING */}
              {activeTab === "subcontracting" && (
                <div className="ui-stack-4">
                  <div className="ui-flex-end">
                    <button
                      onClick={() => setIsSubModalOpen(true)}
                      className={styles.p28}
                    >
                      <Truck size={16} /> New Subcontracting PO
                    </button>
                  </div>

                  <div className="ui-stack-3">
                    {subcontracting.map((sub) => (
                      <div key={sub.id} className={styles.p29}>
                        <div>
                          <p className={styles.p30}>{sub.product.name}</p>
                          <p className={styles.p31}>
                            Vendor: {sub.vendor.name}
                          </p>
                        </div>

                        <div>
                          <p className="ui-text-micro">QUANTITY</p>
                          <p className={styles.p32}>{Number(sub.quantity)}</p>
                        </div>

                        <div>
                          <p className="ui-text-micro">TOTAL COST</p>
                          <p className={styles.p33}>
                            ${Number(sub.totalCost).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <span
                            style={{
                              background:
                                sub.status === "MATERIALS_SHIPPED"
                                  ? "var(--color-success-light)"
                                  : "var(--color-primary-light)",
                              color:
                                sub.status === "MATERIALS_SHIPPED"
                                  ? "var(--color-success)"
                                  : "var(--color-primary)",
                            }}
                            className={styles.s4}
                          >
                            {sub.status}
                          </span>
                        </div>

                        <div className="text-right">
                          {sub.status === "SENT" && (
                            <button
                              onClick={() => handleOpenIssueModal(sub)}
                              className={styles.p34}
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
              {activeTab === "equipment" && (
                <div className={styles.p35}>
                  <h3 className="ui-heading-lg">
                    Equipment tools cycle limits
                  </h3>
                  <div className={styles.p36}>
                    {tools.map((t) => (
                      <div key={t.id} className={styles.p37}>
                        <div className="ui-flex-between">
                          <h4 className={styles.p38}>{t.name}</h4>
                          <span
                            style={{
                              background:
                                t.status === "OK"
                                  ? "var(--color-success-light)"
                                  : "var(--color-danger-light)",
                              color:
                                t.status === "OK"
                                  ? "var(--color-success)"
                                  : "var(--color-danger)",
                            }}
                            className={styles.s6}
                          >
                            {t.status}
                          </span>
                        </div>
                        <p className="ui-text-micro ui-text-muted">
                          Code: {t.code} | Station: {t.workstation.name}
                        </p>
                        <div className={styles.p39}>
                          <div className={styles.p40}>
                            <span>
                              Cycles Count: {t.currentCycles} / {t.maxCycles}
                            </span>
                            <span>
                              {Math.round(
                                (t.currentCycles / t.maxCycles) * 100,
                              )}
                              %
                            </span>
                          </div>
                          <div className={styles.p41}>
                            <div
                              style={{
                                width: `${Math.min((t.currentCycles / t.maxCycles) * 100, 100)}%`,
                                background:
                                  t.status !== "OK"
                                    ? "var(--color-danger)"
                                    : "var(--color-primary)",
                              }}
                              className={styles.s7}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModuleTabLayout>

        {/* WO Dispatch Modal */}
        {isWOModalOpen && (
          <div className={styles.p42}>
            <form onSubmit={handleCreateWorkOrder} className={styles.p43}>
              <h3 className="ui-heading-lg">Dispatch Work Order</h3>

              <div>
                <label className="ui-text-xs-label">Select Formula (BOM)</label>
                <select
                  required
                  value={newWO.bomId}
                  onChange={(e) =>
                    setNewWO({ ...newWO, bomId: e.target.value })
                  }
                  className={styles.p44}
                >
                  <option value="">Select BOM...</option>
                  {boms.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="ui-text-xs-label">Allocate Workstation</label>
                <select
                  required
                  value={newWO.workstationId}
                  onChange={(e) =>
                    setNewWO({ ...newWO, workstationId: e.target.value })
                  }
                  className={styles.p45}
                >
                  <option value="">Select Machine Workstation...</option>
                  {workstations.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="ui-text-xs-label">Work Order Number</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. WO-2026-101"
                  value={newWO.workOrderNumber}
                  onChange={(e) =>
                    setNewWO({ ...newWO, workOrderNumber: e.target.value })
                  }
                  className={styles.p46}
                />
              </div>

              <div className="ui-grid-2 ui-gap-3">
                <div>
                  <label className="ui-text-xs-label">Quantity</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={newWO.quantity}
                    onChange={(e) =>
                      setNewWO({ ...newWO, quantity: e.target.value })
                    }
                    className={styles.p47}
                  />
                </div>
                <div>
                  <label className="ui-text-xs-label">Start Date</label>
                  <input
                    type="date"
                    value={newWO.startDate}
                    onChange={(e) =>
                      setNewWO({ ...newWO, startDate: e.target.value })
                    }
                    className={styles.p48}
                  />
                </div>
              </div>

              <div className="ui-flex-end ui-gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsWOModalOpen(false)}
                  className={styles.p49}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.p50}>
                  Save & Dispatch
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CMMS Request Modal */}
        {isCmmsModalOpen && (
          <div className={styles.p51}>
            <form onSubmit={handleCreateCmmsRequest} className={styles.p52}>
              <h3 className="ui-heading-lg">Request Machine Maintenance</h3>

              <div>
                <label className="ui-text-xs-label">Target Workstation</label>
                <select
                  required
                  value={newCmms.workstationId}
                  onChange={(e) =>
                    setNewCmms({ ...newCmms, workstationId: e.target.value })
                  }
                  className={styles.p53}
                >
                  <option value="">Select Workstation...</option>
                  {workstations.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ui-grid-2 ui-gap-3">
                <div>
                  <label className="ui-text-xs-label">Type</label>
                  <select
                    value={newCmms.type}
                    onChange={(e) =>
                      setNewCmms({ ...newCmms, type: e.target.value })
                    }
                    className={styles.p54}
                  >
                    <option value="PREVENTIVE">PREVENTIVE</option>
                    <option value="CORRECTIVE">CORRECTIVE</option>
                  </select>
                </div>
                <div>
                  <label className="ui-text-xs-label">Priority</label>
                  <select
                    value={newCmms.priority}
                    onChange={(e) =>
                      setNewCmms({ ...newCmms, priority: e.target.value })
                    }
                    className={styles.p55}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="ui-text-xs-label">Request Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Clean main calibration dial"
                  value={newCmms.title}
                  onChange={(e) =>
                    setNewCmms({ ...newCmms, title: e.target.value })
                  }
                  className={styles.p56}
                />
              </div>

              <div>
                <label className="ui-text-xs-label">Detailed Description</label>
                <textarea
                  value={newCmms.description}
                  onChange={(e) =>
                    setNewCmms({ ...newCmms, description: e.target.value })
                  }
                  className={styles.p57}
                />
              </div>

              <div className="ui-flex-end ui-gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCmmsModalOpen(false)}
                  className={styles.p58}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.p59}>
                  Log Request
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subcontracting Modal */}
        {isSubModalOpen && (
          <div className={styles.p60}>
            <form onSubmit={handleCreateSubcontracting} className={styles.p61}>
              <h3 className="ui-heading-lg">Issue Subcontracting Order</h3>

              <div>
                <label className="ui-text-xs-label">
                  Select Subcontractor Vendor
                </label>
                <select
                  required
                  value={newSub.vendorId}
                  onChange={(e) =>
                    setNewSub({ ...newSub, vendorId: e.target.value })
                  }
                  className={styles.p62}
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="ui-text-xs-label">
                  Select Material Product
                </label>
                <select
                  required
                  value={newSub.productId}
                  onChange={(e) =>
                    setNewSub({ ...newSub, productId: e.target.value })
                  }
                  className={styles.p63}
                >
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ui-grid-2 ui-gap-3">
                <div>
                  <label className="ui-text-xs-label">Quantity</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={newSub.quantity}
                    onChange={(e) =>
                      setNewSub({ ...newSub, quantity: e.target.value })
                    }
                    className={styles.p64}
                  />
                </div>
                <div>
                  <label className="ui-text-xs-label">Unit Cost</label>
                  <input
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={newSub.unitCost}
                    onChange={(e) =>
                      setNewSub({ ...newSub, unitCost: e.target.value })
                    }
                    className={styles.p65}
                  />
                </div>
              </div>

              <div>
                <label className="ui-text-xs-label">Target Delivery Date</label>
                <input
                  type="date"
                  value={newSub.deliveryDate}
                  onChange={(e) =>
                    setNewSub({ ...newSub, deliveryDate: e.target.value })
                  }
                  className={styles.p66}
                />
              </div>

              <div className="ui-flex-end ui-gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className={styles.p67}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.p68}>
                  Issue Subcontract PO
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Issue Materials Modal */}
        {isIssueModalOpen && issueSubOrder && (
          <div className={styles.p69}>
            <form onSubmit={handleIssueMaterials} className={styles.p70}>
              <h3 className="ui-heading-lg">
                Issue Materials to Subcontractor
              </h3>
              <p className="ui-text-xs-muted">
                Transfer raw material components for product{" "}
                <strong>{issueSubOrder.product.name}</strong> to the
                subcontractor vendor warehouse.
              </p>

              <div>
                <label className="ui-text-xs-label">
                  Source Stock Warehouse
                </label>
                <select
                  value={issueForm.warehouseId}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, warehouseId: e.target.value })
                  }
                  className={styles.p71}
                >
                  <option value="WH-MAIN">WH-MAIN (Main Store)</option>
                </select>
              </div>

              <div>
                <label className="ui-text-xs-label">Transfer Quantity</label>
                <input
                  required
                  type="number"
                  value={issueForm.quantity}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, quantity: e.target.value })
                  }
                  className={styles.p72}
                />
              </div>

              <div className="ui-flex-end ui-gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className={styles.p73}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.p74}>
                  Issue materials
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Shift Modal */}
        {isShiftModalOpen && (
          <div className={styles.p75}>
            <form onSubmit={handleCreateShift} className={styles.p76}>
              <h3 className="ui-heading-lg">Add Workstation Shift</h3>

              <div>
                <label className="ui-text-xs-label">Workstation</label>
                <select
                  required
                  value={newShift.workstationId}
                  onChange={(e) =>
                    setNewShift({ ...newShift, workstationId: e.target.value })
                  }
                  className={styles.p77}
                >
                  <option value="">Select workstation...</option>
                  {workstations.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="ui-text-xs-label">Shift Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Morning Shift"
                  value={newShift.name}
                  onChange={(e) =>
                    setNewShift({ ...newShift, name: e.target.value })
                  }
                  className={styles.p78}
                />
              </div>

              <div className="ui-grid-2 ui-gap-3">
                <div>
                  <label className="ui-text-xs-label">Start Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:00"
                    value={newShift.startTime}
                    onChange={(e) =>
                      setNewShift({ ...newShift, startTime: e.target.value })
                    }
                    className={styles.p79}
                  />
                </div>
                <div>
                  <label className="ui-text-xs-label">End Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 16:00"
                    value={newShift.endTime}
                    onChange={(e) =>
                      setNewShift({ ...newShift, endTime: e.target.value })
                    }
                    className={styles.p80}
                  />
                </div>
              </div>

              <div className="ui-flex-end ui-gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className={styles.p81}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.p82}>
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
