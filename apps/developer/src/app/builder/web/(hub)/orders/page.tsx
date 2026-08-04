"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  ConfirmDialog,
  StatCardRow,
  ListPageTemplate,
  type ListColumn,
} from "@unerp/ui";
import {
  ShoppingCart,
  Package,
  DollarSign,
  Clock,
  Trash2,
  Search,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#fef3c7", text: "#d97706" },
  PAID: { bg: "#dbeafe", text: "#2563eb" },
  FULFILLED: { bg: "#dcfce7", text: "#16a34a" },
  CANCELLED: { bg: "#fee2e2", text: "#dc2626" },
};
const STATUSES = ["PENDING", "PAID", "FULFILLED", "CANCELLED"];

export default function WebOrdersPage() {
  const client = useApiClient();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    pending: 0,
    fulfilled: 0,
    revenue: 0,
  });
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const qp = new URLSearchParams();
    if (filter !== "ALL") qp.set("status", filter);
    const [orderData, statsData] = await Promise.all([
      client.get<any[]>(`/builder/web-orders?${qp}`),
      client.get<any>("/builder/web-orders/stats"),
    ]);
    setOrders(orderData);
    setStats(statsData);
    setLoading(false);
  }, [filter, client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setStatus = async (id: string, status: string) => {
    await client.request(`/builder/web-orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    void fetchData();
    if (selected?.id === id) setSelected({ ...selected, status });
  };
  const executeDeleteOrder = async (id: string) => {
    await client.delete(`/builder/web-orders/${id}`);
    if (selected?.id === id) setSelected(null);
    void fetchData();
  };

  const filtered = orders.filter(
    (o) =>
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(o.customer).toLowerCase().includes(search.toLowerCase()),
  );

  const statCards = [
    {
      label: "Total Orders",
      value: stats.total,
      icon: ShoppingCart,
      color: "#3b82f6",
    },
    {
      label: "Revenue",
      value: `$${(stats.revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "#10b981",
    },
    { label: "Pending", value: stats.pending, icon: Clock, color: "#f59e0b" },
    {
      label: "Fulfilled",
      value: stats.fulfilled,
      icon: Package,
      color: "#8b5cf6",
    },
  ];

  return (
    <RouteGuard permission="builder.web-orders.read">
      <div className="p-6 ui-stack-5">
        <PageHeader
          title="Orders"
          description="Storefront orders placed from your public website"
          actions={
            <button
              className="ui-btn ui-btn-secondary"
              onClick={() => router.push("/builder/web")}
            >
              ← Web Studio
            </button>
          }
        />

        <StatCardRow
          stats={statCards.map((s) => ({
            label: s.label,
            value: loading ? "—" : String(s.value),
            color: s.color,
          }))}
        />

        <div className={styles.s1}>
          <div
            className={`ui-card ${styles.s2}`}
            style={{ flex: selected ? "0 0 56%" : 1 }}
          >
            <div className={styles.s3}>
              <div className={styles.s4}>
                <Search size={14} className={styles.s20} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders…"
                  className={styles.s5}
                />
              </div>
              {["ALL", ...STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    border:
                      filter === s
                        ? "1px solid var(--color-primary)"
                        : "1px solid var(--color-border)",
                    background:
                      filter === s ? "var(--color-primary-bg)" : "transparent",
                    color:
                      filter === s
                        ? "var(--color-primary)"
                        : "var(--color-text-secondary)",
                  }}
                  className={styles.s6}
                >
                  {s.toLowerCase()}
                </button>
              ))}
            </div>
            <ListPageTemplate
              title=""
              columns={
                [
                  {
                    key: "orderNumber",
                    header: "Order",
                    render: (v) => (
                      <span className={styles.s7}>{String(v)}</span>
                    ),
                  },
                  {
                    key: "customer",
                    header: "Customer",
                    render: (v) => (v as any)?.name || "—",
                  },
                  {
                    key: "total",
                    header: "Total",
                    render: (v) => <strong>${String(v)}</strong>,
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (v) => {
                      const c =
                        STATUS_COLORS[String(v)] || STATUS_COLORS.PENDING!;
                      return (
                        <span
                          style={{ background: c.bg, color: c.text }}
                          className={styles.s8}
                        >
                          {String(v)}
                        </span>
                      );
                    },
                  },
                  {
                    key: "createdAt",
                    header: "Date",
                    render: (v) => (
                      <span className="ui-text-xs-soft">
                        {new Date(String(v)).toLocaleDateString()}
                      </span>
                    ),
                  },
                ] as ListColumn[]
              }
              data={filtered as unknown as Record<string, unknown>[]}
              loading={loading}
              onRowClick={(row) =>
                setSelected(row as unknown as (typeof filtered)[0])
              }
              emptyTitle="No orders yet"
            />
          </div>

          {selected && (
            <div className={`ui-card ${styles.s9}`}>
              <div className="ui-flex-between mb-4">
                <div>
                  <h3 className={styles.s10}>{selected.orderNumber}</h3>
                  <span className="ui-text-xs-soft">
                    {new Date(selected.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className={styles.s11}
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <div className={styles.s12}>Customer</div>
                {Object.entries(selected.customer || {}).map(([k, v]) =>
                  v ? (
                    <div key={k} className={styles.s13}>
                      <span className={styles.s14}>{k}:</span> {String(v)}
                    </div>
                  ) : null,
                )}
              </div>

              <div className="mb-4">
                <div className={styles.s12}>Items</div>
                {(selected.items || []).map((it: any, i: number) => (
                  <div key={i} className={styles.s15}>
                    <span>
                      {it.name} × {it.qty}
                    </span>
                    <strong>${(it.price * it.qty).toFixed(2)}</strong>
                  </div>
                ))}
                <div className={styles.s16}>
                  <span>Total</span>
                  <span>${selected.total}</span>
                </div>
              </div>

              <div className={styles.s12}>Update Status</div>
              <div className={styles.s17}>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(selected.id, s)}
                    style={{
                      border:
                        selected.status === s
                          ? "1px solid var(--color-primary)"
                          : "1px solid var(--color-border)",
                      background:
                        selected.status === s
                          ? "var(--color-primary-bg)"
                          : "transparent",
                      color:
                        selected.status === s
                          ? "var(--color-primary)"
                          : "var(--color-text-secondary)",
                    }}
                    className={styles.s18}
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => setDeleteTarget(selected.id)}
                  className={`ui-btn ui-btn-secondary ${styles.s19}`}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) {
              executeDeleteOrder(deleteTarget);
              setDeleteTarget(null);
            }
          }}
          title="Delete Order"
          message="Are you sure you want to delete this order? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
        />
      </div>
    </RouteGuard>
  );
}
