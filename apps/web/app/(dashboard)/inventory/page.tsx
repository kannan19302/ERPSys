"use client";
import styles from "./inventory.module.css";
import React, { useState, useMemo } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  StatusBadge,
  DashboardChart,
  ViewSwitcher,
  type ViewMode,
  Modal,
  StatCardRow,
  ListPageTemplate,
  DetailPageTemplate,
  type ListColumn,
  TextField,
  FormField,
  Input,
} from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import {
  useProducts,
  useWarehouses,
  useStockLevels,
  useStockEntries,
} from "../../../src/lib/hooks/useModuleData";
import { apiPost } from "../../../src/lib/api";
import {
  Package,
  Warehouse,
  AlertTriangle,
  TrendingDown,
  CheckCircle,
} from "lucide-react";
import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";

export default function InventoryPage() {
  const {
    data: productsData,
    isLoading: loadingProducts,
    refetch: refetchProducts,
  } = useProducts();
  const {
    data: warehousesRaw = [],
    isLoading: loadingWarehouses,
    refetch: refetchWarehouses,
  } = useWarehouses();
  const {
    data: stockLevelsRaw,
    isLoading: loadingStock,
    refetch: refetchStock,
  } = useStockLevels();
  const { data: stockEntriesRaw = [], isLoading: loadingEntries } =
    useStockEntries();
  const loading =
    loadingProducts || loadingWarehouses || loadingStock || loadingEntries;

  const products = Array.isArray(productsData)
    ? productsData
    : (productsData as Record<string, unknown>)?.data
      ? ((productsData as Record<string, unknown>).data as Record<
          string,
          unknown
        >[])
      : [];
  const warehouses = Array.isArray(warehousesRaw)
    ? warehousesRaw
    : (warehousesRaw as Record<string, unknown>)?.data
      ? ((warehousesRaw as Record<string, unknown>).data as Record<
          string,
          unknown
        >[])
      : [];
  const stockLevels = Array.isArray(stockLevelsRaw)
    ? stockLevelsRaw
    : (stockLevelsRaw as Record<string, unknown>)?.data
      ? ((stockLevelsRaw as Record<string, unknown>).data as Record<
          string,
          unknown
        >[])
      : [];
  const stockEntries = Array.isArray(stockEntriesRaw) ? stockEntriesRaw : [];

  const [activeView, setActiveView] = useState<ViewMode>("chart");

  // Create Product Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // KPI values
  const totalProducts = products.length;
  const totalWarehouses = warehouses.length;
  const lowStockCount = stockLevels.filter(
    (sl: Record<string, unknown>) =>
      Number(sl.currentQty || 0) <= Number(sl.reorderPoint || 0),
  ).length;
  const totalStockValue = stockLevels.reduce(
    (sum: number, sl: Record<string, unknown>) => {
      const qty = Number(sl.currentQty || 0);
      const cost = Number(sl.valuationRate || sl.costPrice || 0);
      return sum + qty * cost;
    },
    0,
  );

  // Chart data
  const stockByWarehouseData = useMemo(() => {
    const whMap: Record<string, number> = {};
    stockLevels.forEach((sl: Record<string, unknown>) => {
      const whName = String(
        (sl.warehouse as Record<string, unknown>)?.name ||
          sl.warehouseId ||
          "Unknown",
      );
      whMap[whName] = (whMap[whName] || 0) + Number(sl.currentQty || 0);
    });
    return Object.entries(whMap).map(([name, quantity]) => ({
      name,
      quantity,
    }));
  }, [stockLevels]);

  const lowStockData = useMemo(() => {
    return stockLevels
      .filter(
        (sl: Record<string, unknown>) =>
          Number(sl.currentQty || 0) <= Number(sl.reorderPoint || 0),
      )
      .slice(0, 8)
      .map((sl: Record<string, unknown>) => ({
        name: String(
          (sl.product as Record<string, unknown>)?.name ||
            sl.productId ||
            "Unknown",
        ).substring(0, 15),
        current: Number(sl.currentQty || 0),
        reorderPoint: Number(sl.reorderPoint || 0),
      }));
  }, [stockLevels]);

  const entryTypeData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    stockEntries.forEach((e: Record<string, unknown>) => {
      const type = String(e.type || "Unknown");
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [stockEntries]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !sku) {
      setModalError("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      await apiPost("/inventory/products", {
        name: productName,
        sku,
        sellPrice,
        category: category || undefined,
      });
      setModalSuccess(true);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setProductName("");
        setSku("");
        setSellPrice(0);
        setCategory("");
        setModalSuccess(false);
        refetchProducts();
      }, 1500);
    } catch {
      setModalError("Failed to create product.");
    }
    setSubmitting(false);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setModalSuccess(false);
    setModalError(null);
  };
  const refetchAll = () => {
    refetchProducts();
    refetchWarehouses();
    refetchStock();
  };

  // Column definitions
  const productColumns: ListColumn[] = [
    { key: "name", header: "Name" },
    { key: "sku", header: "SKU" },
    {
      key: "sellPrice",
      header: "Price",
      render: (v) => `$${Number(v || 0).toFixed(2)}`,
    },
    {
      key: "status",
      header: "Status",
      render: (v) => <StatusBadge status={String(v || "ACTIVE")} />,
    },
  ];

  const warehouseColumns: ListColumn[] = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    { key: "location", header: "Location", render: (v) => String(v || "—") },
  ];

  const stockLevelColumns: ListColumn[] = [
    { key: "productName", header: "Product" },
    { key: "warehouseName", header: "Warehouse" },
    { key: "currentQty", header: "Qty" },
    {
      key: "reorderPoint",
      header: "Reorder Point",
      render: (v, row) => (
        <span
          className={
            Number((row as Record<string, unknown>).currentQty || 0) <=
            Number(v || 0)
              ? styles.dangerText
              : "ui-text-muted"
          }
        >
          {String(v || 0)}
        </span>
      ),
    },
  ];

  const flatStockLevels = stockLevels.map((sl: Record<string, unknown>) => ({
    ...sl,
    productName: String(
      (sl.product as Record<string, unknown>)?.name || sl.productId || "",
    ),
    warehouseName: String(
      (sl.warehouse as Record<string, unknown>)?.name || sl.warehouseId || "",
    ),
  }));

  const tabs = [
    {
      key: "products",
      label: "Products",
      count: products.length,
      content: (
        <ListPageTemplate
          title=""
          columns={productColumns}
          data={products as unknown as Record<string, unknown>[]}
          loading={loading}
          searchable
          searchPlaceholder="Search products…"
          above={<div />}
        />
      ),
    },
    {
      key: "warehouses",
      label: "Warehouses",
      count: warehouses.length,
      content: (
        <ListPageTemplate
          title=""
          columns={warehouseColumns}
          data={warehouses as unknown as Record<string, unknown>[]}
          loading={loading}
          searchable
          searchPlaceholder="Search warehouses…"
          above={<div />}
        />
      ),
    },
    {
      key: "stock-levels",
      label: "Stock Levels",
      count: stockLevels.length,
      content: (
        <ListPageTemplate
          title=""
          columns={stockLevelColumns}
          data={flatStockLevels as unknown as Record<string, unknown>[]}
          loading={loading}
          searchable
          searchPlaceholder="Search stock levels…"
          above={<div />}
        />
      ),
    },
  ];

  return (
    <RouteGuard permission="inventory.stock.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={Package}
        moduleDescription="Stock summary, warehouse KPIs, and inventory turnover analytics"
      >
        <div className="ui-stack-6 ui-animate-in">
          <PageHeader
            title="Inventory & Warehouse"
            description="Manage products, warehouses, stock levels, and movement entries."
            breadcrumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Inventory" },
            ]}
            actions={
              <div className="ui-hstack-3">
                <ViewSwitcher
                  activeView={activeView}
                  onViewChange={setActiveView}
                  availableViews={["list", "chart"]}
                />
                <Button
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="ui-hstack-2"
                >
                  <Package size={16} /> Add Product
                </Button>
              </div>
            }
          />

          <StatCardRow
            stats={[
              {
                label: "Total Products",
                value: totalProducts,
                icon: <Package size={16} />,
                color: "var(--chart-1)",
                loading,
              },
              {
                label: "Warehouses",
                value: totalWarehouses,
                icon: <Warehouse size={16} />,
                color: "var(--chart-2)",
                loading,
              },
              {
                label: "Low Stock Items",
                value: lowStockCount,
                icon: <AlertTriangle size={16} />,
                color: "var(--chart-4)",
                loading,
              },
              {
                label: "Total Stock Value",
                value: `$${totalStockValue.toLocaleString()}`,
                icon: <TrendingDown size={16} />,
                color: "var(--chart-5)",
                loading,
              },
            ]}
          />

          {activeView === "chart" && (
            <div className={styles.chartGrid}>
              <DashboardChart
                title="Stock by Warehouse"
                subtitle="Total quantity across warehouses"
                data={stockByWarehouseData}
                config={{
                  xAxisKey: "name",
                  series: [
                    {
                      dataKey: "quantity",
                      name: "Quantity",
                      color: "var(--chart-1)",
                    },
                  ],
                }}
                defaultChartType="bar"
                allowedChartTypes={["bar", "pie", "donut"]}
                height={280}
                loading={loading}
              />
              <DashboardChart
                title="Low Stock Alerts"
                subtitle="Items at or below reorder point"
                data={lowStockData}
                config={{
                  xAxisKey: "name",
                  series: [
                    {
                      dataKey: "current",
                      name: "Current Qty",
                      color: "var(--chart-4)",
                    },
                    {
                      dataKey: "reorderPoint",
                      name: "Reorder Point",
                      color: "var(--chart-3)",
                    },
                  ],
                }}
                defaultChartType="bar"
                allowedChartTypes={["bar", "composed", "line"]}
                height={280}
                loading={loading}
              />
              <DashboardChart
                title="Stock Entry Types"
                subtitle="Breakdown of movement types"
                data={entryTypeData}
                config={{
                  xAxisKey: "name",
                  series: [{ dataKey: "value", name: "Entries" }],
                  valueKey: "value",
                  nameKey: "name",
                }}
                defaultChartType="donut"
                allowedChartTypes={["donut", "pie", "bar"]}
                height={280}
                loading={loading}
              />
            </div>
          )}

          {activeView === "list" && (
            <DetailPageTemplate title="" tabs={tabs} above={<div />} />
          )}

          <Modal
            open={isCreateModalOpen}
            onClose={closeModal}
            title="Add Product"
            footer={
              !modalSuccess ? (
                <>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    form="create-product-form"
                    disabled={submitting}
                  >
                    {submitting ? <Spinner size="sm" /> : "Create"}
                  </Button>
                </>
              ) : undefined
            }
          >
            {modalSuccess ? (
              <div className={styles.successModal}>
                <CheckCircle size={40} className="ui-text-success" />
                <p className={styles.successText}>Product Created!</p>
              </div>
            ) : (
              <form
                id="create-product-form"
                onSubmit={handleCreateProduct}
                className="ui-stack-4"
              >
                {modalError && (
                  <div className={styles.errorBox}>{modalError}</div>
                )}
                <TextField
                  label="Product Name"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
                <div className="ui-grid-2 ui-gap-3">
                  <TextField
                    label="SKU"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                  <FormField label="Sell Price">
                    <Input
                      type="number"
                      step="0.01"
                      value={sellPrice}
                      onChange={(e) =>
                        setSellPrice(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormField>
                </div>
                <TextField
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </form>
            )}
          </Modal>
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
