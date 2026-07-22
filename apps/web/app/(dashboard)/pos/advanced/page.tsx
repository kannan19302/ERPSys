"use client";

import styles from "./page.module.css";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  Store,
  RotateCcw,
  Gift,
  Monitor,
  WifiOff,
  Plus,
  Percent,
  Clock,
  Award,
  ShoppingCart,
  ArrowLeft,
  Zap,
} from "lucide-react";

interface ReturnItem {
  id: string;
  originalOrderNo: string;
  productName: string;
  qty: number;
  refundAmount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REFUNDED" | "REJECTED";
  createdAt: string;
}

interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  points: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  totalSpent: number;
  lastVisit: string;
}

interface Promotion {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED" | "BOGO" | "BUNDLE";
  value: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "SCHEDULED" | "EXPIRED";
  appliedCount: number;
}

interface Terminal {
  id: string;
  name: string;
  code: string;
  store: string;
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE";
  currentCashier: string | null;
  lastSync: string;
  registerStatus: "OPEN" | "CLOSED";
}

export default function POSAdvancedPage() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "returns") as
    | "returns"
    | "loyalty"
    | "promotions"
    | "terminals"
    | "offline";

  const [returns] = useState<ReturnItem[]>([
    {
      id: "ret-1",
      originalOrderNo: "POS-2026-0842",
      productName: "Wireless Mouse Pro",
      qty: 1,
      refundAmount: 45.99,
      reason: "Defective",
      status: "PENDING",
      createdAt: "2026-06-14",
    },
    {
      id: "ret-2",
      originalOrderNo: "POS-2026-0838",
      productName: "USB-C Hub 7-port",
      qty: 2,
      refundAmount: 79.98,
      reason: "Wrong item shipped",
      status: "APPROVED",
      createdAt: "2026-06-13",
    },
    {
      id: "ret-3",
      originalOrderNo: "POS-2026-0830",
      productName: "Ergonomic Keyboard",
      qty: 1,
      refundAmount: 129.99,
      reason: "Customer changed mind",
      status: "REFUNDED",
      createdAt: "2026-06-12",
    },
    {
      id: "ret-4",
      originalOrderNo: "POS-2026-0825",
      productName: "Monitor Stand",
      qty: 1,
      refundAmount: 34.99,
      reason: "Damaged in transit",
      status: "REJECTED",
      createdAt: "2026-06-11",
    },
  ]);

  const [loyaltyMembers] = useState<LoyaltyMember[]>([
    {
      id: "lm-1",
      name: "Alice Thompson",
      email: "alice@example.com",
      points: 12500,
      tier: "PLATINUM",
      totalSpent: 8750,
      lastVisit: "2026-06-14",
    },
    {
      id: "lm-2",
      name: "Bob Martinez",
      email: "bob@example.com",
      points: 7200,
      tier: "GOLD",
      totalSpent: 5400,
      lastVisit: "2026-06-12",
    },
    {
      id: "lm-3",
      name: "Carol Davis",
      email: "carol@example.com",
      points: 3800,
      tier: "SILVER",
      totalSpent: 2650,
      lastVisit: "2026-06-10",
    },
    {
      id: "lm-4",
      name: "David Kim",
      email: "david@example.com",
      points: 1200,
      tier: "BRONZE",
      totalSpent: 890,
      lastVisit: "2026-06-08",
    },
    {
      id: "lm-5",
      name: "Eva Chen",
      email: "eva@example.com",
      points: 9500,
      tier: "GOLD",
      totalSpent: 6200,
      lastVisit: "2026-06-13",
    },
  ]);

  const [promotions] = useState<Promotion[]>([
    {
      id: "promo-1",
      name: "Summer Flash Sale",
      type: "PERCENTAGE",
      value: 20,
      startDate: "2026-06-15",
      endDate: "2026-06-30",
      status: "SCHEDULED",
      appliedCount: 0,
    },
    {
      id: "promo-2",
      name: "Buy 2 Get 1 Free",
      type: "BOGO",
      value: 0,
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      status: "ACTIVE",
      appliedCount: 156,
    },
    {
      id: "promo-3",
      name: "$10 Off Orders Over $50",
      type: "FIXED",
      value: 10,
      startDate: "2026-06-01",
      endDate: "2026-06-14",
      status: "ACTIVE",
      appliedCount: 89,
    },
    {
      id: "promo-4",
      name: "Tech Bundle Discount",
      type: "BUNDLE",
      value: 15,
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      status: "EXPIRED",
      appliedCount: 234,
    },
  ]);

  const [terminals] = useState<Terminal[]>([
    {
      id: "term-1",
      name: "Checkout 1",
      code: "POS-CHK-01",
      store: "Main Store",
      status: "ONLINE",
      currentCashier: "Sarah M.",
      lastSync: "2026-06-14 14:32",
      registerStatus: "OPEN",
    },
    {
      id: "term-2",
      name: "Checkout 2",
      code: "POS-CHK-02",
      store: "Main Store",
      status: "ONLINE",
      currentCashier: "James P.",
      lastSync: "2026-06-14 14:31",
      registerStatus: "OPEN",
    },
    {
      id: "term-3",
      name: "Self-Service Kiosk",
      code: "POS-SSK-01",
      store: "Main Store",
      status: "ONLINE",
      currentCashier: null,
      lastSync: "2026-06-14 14:30",
      registerStatus: "CLOSED",
    },
    {
      id: "term-4",
      name: "Warehouse POS",
      code: "POS-WH-01",
      store: "Warehouse",
      status: "OFFLINE",
      currentCashier: null,
      lastSync: "2026-06-14 10:15",
      registerStatus: "CLOSED",
    },
    {
      id: "term-5",
      name: "Mobile Cart",
      code: "POS-MOB-01",
      store: "Pop-up",
      status: "MAINTENANCE",
      currentCashier: null,
      lastSync: "2026-06-13 18:00",
      registerStatus: "CLOSED",
    },
  ]);

  const tierColor = (tier: string) => {
    const colors: Record<string, string> = {
      BRONZE: "hsl(30, 60%, 50%)",
      SILVER: "hsl(0, 0%, 60%)",
      GOLD: "hsl(45, 80%, 50%)",
      PLATINUM: "hsl(260, 60%, 55%)",
    };
    return colors[tier] || "var(--color-text-secondary)";
  };

  const statusStyles = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
      PENDING: {
        color: "var(--color-warning)",
        bg: "var(--color-warning-light)",
      },
      APPROVED: {
        color: "var(--color-primary)",
        bg: "var(--color-primary-light)",
      },
      REFUNDED: {
        color: "var(--color-success)",
        bg: "var(--color-success-light)",
      },
      REJECTED: { color: "var(--color-error)", bg: "var(--color-error-light)" },
      ACTIVE: {
        color: "var(--color-success)",
        bg: "var(--color-success-light)",
      },
      SCHEDULED: {
        color: "var(--color-primary)",
        bg: "var(--color-primary-light)",
      },
      EXPIRED: { color: "var(--color-text-tertiary)", bg: "var(--color-bg)" },
      ONLINE: {
        color: "var(--color-success)",
        bg: "var(--color-success-light)",
      },
      OFFLINE: { color: "var(--color-error)", bg: "var(--color-error-light)" },
      MAINTENANCE: {
        color: "var(--color-warning)",
        bg: "var(--color-warning-light)",
      },
    };
    return map[status] || { color: "var(--color-text)", bg: "var(--color-bg)" };
  };

  const tabs: SubTab[] = [
    {
      id: "returns",
      label: "Returns & Refunds",
      href: "/pos/advanced?subtab=returns",
      icon: RotateCcw,
    },
    {
      id: "loyalty",
      label: "Loyalty Program",
      href: "/pos/advanced?subtab=loyalty",
      icon: Gift,
    },
    {
      id: "promotions",
      label: "Promotions Engine",
      href: "/pos/advanced?subtab=promotions",
      icon: Percent,
    },
    {
      id: "terminals",
      label: "Multi-Terminal",
      href: "/pos/advanced?subtab=terminals",
      icon: Monitor,
    },
    {
      id: "offline",
      label: "Offline Mode",
      href: "/pos/advanced?subtab=offline",
      icon: WifiOff,
    },
  ];

  return (
    <div className="ui-stack-6">
      <div>
        <h1 className="text-2xl ui-hstack-2">
          <Store className="ui-text-primary" />
          POS Advanced Features
        </h1>
        <p className="ui-text-sm-muted">
          Returns & credit notes, customer loyalty, promotions engine,
          multi-terminal management, and offline sync.
        </p>
      </div>

      <SubTabBar tabs={tabs} />

      {/* Returns & Refunds */}
      {activeTab === "returns" && (
        <div className="ui-stack-4">
          <div className="ui-flex-between">
            <h3 className={styles.p3}>Return Requests</h3>
            <button className={styles.p4}>
              <ArrowLeft size={14} /> Process Return
            </button>
          </div>
          <div className={styles.p5}>
            <table className={styles.p6}>
              <thead>
                <tr className={styles.p7}>
                  {[
                    "Order #",
                    "Product",
                    "Qty",
                    "Refund",
                    "Reason",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className={styles.p8}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className={styles.p9}>{r.originalOrderNo}</td>
                    <td className="py-3 px-4">{r.productName}</td>
                    <td className="py-3 px-4">{r.qty}</td>
                    <td className={styles.p10}>${r.refundAmount.toFixed(2)}</td>
                    <td className={styles.p11}>{r.reason}</td>
                    <td className="py-3 px-4">
                      <span style={{ ...statusStyles(r.status) }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {r.status === "PENDING" && (
                        <div className="ui-flex ui-gap-1">
                          <button className={styles.p13}>Approve</button>
                          <button className={styles.p14}>Reject</button>
                        </div>
                      )}
                      {r.status === "APPROVED" && (
                        <button className={styles.p15}>Issue Refund</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loyalty Program */}
      {activeTab === "loyalty" && (
        <div className="ui-stack-4">
          <div className={styles.p16}>
            {["BRONZE", "SILVER", "GOLD", "PLATINUM"].map((tier) => {
              const count = loyaltyMembers.filter(
                (m) => m.tier === tier,
              ).length;
              return (
                <div key={tier} className={styles.p17}>
                  <Award size={24} style={{ color: tierColor(tier) }} />
                  <div style={{ color: tierColor(tier) }}>{count}</div>
                  <div className="ui-text-xs-muted">{tier}</div>
                </div>
              );
            })}
          </div>
          <div className={styles.p20}>
            <table className={styles.p21}>
              <thead>
                <tr className={styles.p22}>
                  {[
                    "Member",
                    "Tier",
                    "Points",
                    "Total Spent",
                    "Last Visit",
                  ].map((h) => (
                    <th key={h} className={styles.p23}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loyaltyMembers.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="py-3 px-4">
                      <div className="font-semibold">{m.name}</div>
                      <div className="ui-text-micro">{m.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ color: tierColor(m.tier) }}>{m.tier}</span>
                    </td>
                    <td className={styles.p25}>
                      {m.points.toLocaleString()} pts
                    </td>
                    <td className="py-3 px-4">
                      ${m.totalSpent.toLocaleString()}
                    </td>
                    <td className={styles.p26}>{m.lastVisit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promotions Engine */}
      {activeTab === "promotions" && (
        <div className="ui-stack-4">
          <div className="ui-flex-between">
            <h3 className={styles.p27}>Active & Scheduled Promotions</h3>
            <button className={styles.p28}>
              <Plus size={14} /> Create Promotion
            </button>
          </div>
          <div className={styles.p29}>
            {promotions.map((p) => (
              <div key={p.id} className={styles.p30}>
                <div className="ui-flex-between ui-items-start">
                  <div>
                    <div className="ui-heading-sm font-bold">{p.name}</div>
                    <span className="ui-text-micro">
                      {p.type.replace("_", " ")}
                    </span>
                  </div>
                  <span style={{ ...statusStyles(p.status) }}>{p.status}</span>
                </div>
                <div className={styles.p32}>
                  <div>
                    <div className="ui-text-micro">Value</div>
                    <div className="ui-heading-sm">
                      {p.type === "PERCENTAGE"
                        ? `${p.value}%`
                        : p.type === "FIXED"
                          ? `$${p.value}`
                          : p.type === "BOGO"
                            ? "Buy 2 Get 1"
                            : `${p.value}% bundle`}
                    </div>
                  </div>
                  <div>
                    <div className="ui-text-micro">Used</div>
                    <div className="ui-heading-sm">{p.appliedCount} times</div>
                  </div>
                </div>
                <div className="ui-text-micro ui-text-muted">
                  <Clock size={10} className={styles.p33} />
                  {p.startDate} → {p.endDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Terminal Management */}
      {activeTab === "terminals" && (
        <div className="ui-stack-4">
          <div className={styles.p34}>
            {terminals.map((t) => (
              <div key={t.id} className={styles.p35}>
                <div className="ui-flex-between">
                  <div className="ui-hstack-2">
                    <Monitor
                      size={20}
                      style={{ color: statusStyles(t.status).color }}
                    />
                    <div>
                      <div className="ui-heading-sm font-bold">{t.name}</div>
                      <div className="ui-text-micro">
                        {t.code} • {t.store}
                      </div>
                    </div>
                  </div>
                  <span style={{ ...statusStyles(t.status) }}>{t.status}</span>
                </div>
                <div className={styles.p37}>
                  <div>
                    <div className="ui-text-micro">Cashier</div>
                    <div className="text-sm">{t.currentCashier || "—"}</div>
                  </div>
                  <div>
                    <div className="ui-text-micro">Register</div>
                    <div className="text-sm">{t.registerStatus}</div>
                  </div>
                </div>
                <div className="ui-text-micro">Last sync: {t.lastSync}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Mode */}
      {activeTab === "offline" && (
        <div className="ui-stack-4">
          <div className={styles.p38}>
            <div className={styles.p39}>
              <WifiOff size={28} className={styles.p40} />
              <div className={styles.p41}>Ready</div>
              <div className="ui-text-xs-muted">Offline Mode Status</div>
            </div>
            <div className={styles.p42}>
              <ShoppingCart size={28} className={styles.p43} />
              <div className={styles.p44}>0</div>
              <div className="ui-text-xs-muted">Queued Transactions</div>
            </div>
            <div className={styles.p45}>
              <Zap size={28} className={styles.p46} />
              <div className={styles.p47}>2.4 MB</div>
              <div className="ui-text-xs-muted">Cached Product Data</div>
            </div>
          </div>

          <div className="ui-card p-5">
            <h3 className="ui-section-header">Offline Configuration</h3>
            <div className="ui-stack-3">
              {[
                {
                  label: "Enable Offline POS Transactions",
                  desc: "Queue sales when internet is unavailable",
                  enabled: true,
                },
                {
                  label: "Auto-Sync on Reconnect",
                  desc: "Automatically reconcile queued transactions when back online",
                  enabled: true,
                },
                {
                  label: "Cache Product Catalog",
                  desc: "Store full product catalog in IndexedDB for offline product lookup",
                  enabled: true,
                },
                {
                  label: "Offline Payment Capture",
                  desc: "Capture card details offline for later processing (PCI compliant)",
                  enabled: false,
                },
                {
                  label: "Conflict Resolution",
                  desc: "Auto-resolve stock level conflicts using server-wins strategy",
                  enabled: true,
                },
              ].map((opt, i) => (
                <div key={i} className={styles.p48}>
                  <div>
                    <div className="ui-heading-sm">{opt.label}</div>
                    <div className="ui-text-caption">{opt.desc}</div>
                  </div>
                  <div
                    style={{
                      background: opt.enabled
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    }}
                  >
                    <div style={{ left: opt.enabled ? "20px" : "2px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ui-card p-5">
            <h3 className="ui-section-header">Sync History</h3>
            {[
              {
                time: "2026-06-14 14:30",
                direction: "UP",
                count: 12,
                status: "SUCCESS",
              },
              {
                time: "2026-06-14 10:15",
                direction: "UP",
                count: 8,
                status: "SUCCESS",
              },
              {
                time: "2026-06-14 09:00",
                direction: "DOWN",
                count: 450,
                status: "SUCCESS",
              },
              {
                time: "2026-06-13 18:30",
                direction: "UP",
                count: 23,
                status: "PARTIAL",
              },
            ].map((sync, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i < 3 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <div className="text-sm">
                  <span className="font-semibold">{sync.time}</span>
                  <span className={styles.p52}>
                    {sync.direction === "UP" ? "↑ Upload" : "↓ Download"} (
                    {sync.count} records)
                  </span>
                </div>
                <span
                  style={{
                    color:
                      sync.status === "SUCCESS"
                        ? "var(--color-success)"
                        : "var(--color-warning)",
                    background:
                      sync.status === "SUCCESS"
                        ? "var(--color-success-light)"
                        : "var(--color-warning-light)",
                  }}
                >
                  {sync.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
