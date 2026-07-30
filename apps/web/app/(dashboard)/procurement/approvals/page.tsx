// @ts-nocheck
"use client";

import styles from "./page.module.css";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  PageHeader,
  Badge,
  Button,
  DataTable,
  Spinner,
  Modal,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  UserPlus,
  FileText,
  ShoppingCart,
  Filter,
  RefreshCw,
} from "lucide-react";

interface RequisitionItem {
  id: string;
  title?: string;
  status: string;
  createdAt: string;
  totalAmount?: number;
  currency?: string;
  department?: { name: string } | null;
  _count?: { lineItems: number };
}

interface PurchaseOrderItem {
  id: string;
  poNumber?: string;
  status: string;
  createdAt: string;
  totalAmount?: number;
  currency?: string;
  vendor?: { name: string } | null;
}

interface StatsData {
  requisitions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    approvalRate?: number;
    avgApprovalDays?: number;
  };
  purchaseOrders: {
    total: number;
    pending: number;
    approved: number;
    approvalRate?: number;
  };
}

interface ApprovalPolicy {
  requiresApproval: boolean;
  approverRoles: string[];
  minAmount?: number;
  maxAmount?: number;
}

interface HistoryItem {
  id: string;
  type: "requisition" | "purchase-order";
  title?: string;
  poNumber?: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  department?: { name: string } | null;
  vendor?: { name: string } | null;
  totalAmount?: number;
  currency?: string;
}

export default function ProcurementApprovalsPage() {
  const client = useApiClient();

  const [activeTab, setActiveTab] = useState<
    "pending" | "my-approvals" | "history" | "settings"
  >("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingRequisitions, setPendingRequisitions] = useState<
    RequisitionItem[]
  >([]);
  const [pendingPurchaseOrders, setPendingPurchaseOrders] = useState<
    PurchaseOrderItem[]
  >([]);
  const [pendingTotal, setPendingTotal] = useState(0);

  const [myRequisitions, setMyRequisitions] = useState<RequisitionItem[]>([]);
  const [myPurchaseOrders, setMyPurchaseOrders] = useState<PurchaseOrderItem[]>(
    [],
  );
  const [myTotal, setMyTotal] = useState(0);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyType, setHistoryType] = useState<string>("");

  const [stats, setStats] = useState<StatsData | null>(null);
  const [policy, setPolicy] = useState<ApprovalPolicy | null>(null);
  const [policyMinAmount, setPolicyMinAmount] = useState("");
  const [policyMaxAmount, setPolicyMaxAmount] = useState("");
  const [policyRequiresApproval, setPolicyRequiresApproval] = useState(true);
  const [policyApproverRoles, setPolicyApproverRoles] = useState("");

  const [delegateUserId, setDelegateUserId] = useState("");
  const [delegateFrom, setDelegateFrom] = useState("");
  const [delegateTo, setDelegateTo] = useState("");
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{
    type: string;
    id: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const apiPrefix = "/procurement/scheduling";

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingRes, myRes, statsRes, policyRes] = await Promise.all([
        client.get<{
          requisitions: RequisitionItem[];
          purchaseOrders: PurchaseOrderItem[];
          total: number;
        }>(`${apiPrefix}/approvals/pending`),
        client.get<{
          requisitions: RequisitionItem[];
          purchaseOrders: PurchaseOrderItem[];
          total: number;
        }>(`${apiPrefix}/approvals/my-pending`),
        client.get<StatsData>(`${apiPrefix}/approvals/statistics`),
        client.get<ApprovalPolicy>(`${apiPrefix}/approvals/policy`),
      ]);

      setPendingRequisitions(pendingRes.requisitions || []);
      setPendingPurchaseOrders(pendingRes.purchaseOrders || []);
      setPendingTotal(pendingRes.total || 0);

      setMyRequisitions(myRes.requisitions || []);
      setMyPurchaseOrders(myRes.purchaseOrders || []);
      setMyTotal(myRes.total || 0);

      setStats(statsRes);
      setPolicy(policyRes);
      setPolicyRequiresApproval(policyRes?.requiresApproval ?? true);
      setPolicyApproverRoles((policyRes?.approverRoles || []).join(", "));
      setPolicyMinAmount(policyRes?.minAmount?.toString() ?? "");
      setPolicyMaxAmount(policyRes?.maxAmount?.toString() ?? "");
    } catch {
      setError("Could not load approval data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  const loadHistory = useCallback(
    async (page: number, type: string) => {
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");
        if (type) params.set("type", type);
        const res = await client.get<{ data: HistoryItem[]; total: number }>(
          `${apiPrefix}/approvals/history?${params.toString()}`,
        );
        setHistoryItems(res.data || []);
        setHistoryTotal(res.total || 0);
      } catch {
        setHistoryItems([]);
      }
    },
    [client],
  );

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory(historyPage, historyType);
    }
  }, [activeTab, historyPage, historyType, loadHistory]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      if (rejectTarget.type === "requisition") {
        await client.post(
          `${apiPrefix}/approvals/requisition/${rejectTarget.id}/reject`,
          { reason: rejectReason },
        );
      } else {
        await client.post(
          `${apiPrefix}/approvals/purchase-order/${rejectTarget.id}/reject`,
          { reason: rejectReason },
        );
      }
      setShowRejectModal(false);
      setRejectReason("");
      setRejectTarget(null);
      await loadAll();
    } catch {
      setError("Failed to reject. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (type: string, id: string) => {
    setActionLoading(true);
    try {
      if (type === "requisition") {
        await client.post(
          `${apiPrefix}/approvals/requisition/${id}/approve`,
          {},
        );
      } else {
        await client.post(
          `${apiPrefix}/approvals/purchase-order/${id}/approve`,
          {},
        );
      }
      await loadAll();
    } catch {
      setError("Failed to approve. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    setActionLoading(true);
    try {
      const roles = policyApproverRoles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      await client.post(`${apiPrefix}/approvals/policy`, {
        requiresApproval: policyRequiresApproval,
        approverRoles: roles,
        minAmount: policyMinAmount ? parseFloat(policyMinAmount) : undefined,
        maxAmount: policyMaxAmount ? parseFloat(policyMaxAmount) : undefined,
      });
      setPolicy({
        requiresApproval: policyRequiresApproval,
        approverRoles: roles,
        minAmount: policyMinAmount ? parseFloat(policyMinAmount) : undefined,
        maxAmount: policyMaxAmount ? parseFloat(policyMaxAmount) : undefined,
      });
      setError(null);
    } catch {
      setError("Failed to save policy.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelegate = async () => {
    setActionLoading(true);
    try {
      await client.post(`${apiPrefix}/approvals/delegate`, {
        delegateToUserId: delegateUserId,
        fromDate: delegateFrom,
        toDate: delegateTo,
      });
      setShowDelegateModal(false);
      setDelegateUserId("");
      setDelegateFrom("");
      setDelegateTo("");
    } catch {
      setError("Failed to delegate approval authority.");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingReqColumns = [
    {
      key: "title",
      header: "Requisition",
      sortable: true,
      render: (row: RequisitionItem) => (
        <span className={styles.p22}>
          {row.title || `Requisition ${row.id.slice(0, 8)}`}
        </span>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (row: RequisitionItem) => (
        <span className={styles.p23}>{row.department?.name || "N/A"}</span>
      ),
    },
    {
      key: "_count",
      header: "Items",
      align: "center" as const,
      render: (row: RequisitionItem) => (
        <Badge variant="default">{row._count?.lineItems ?? 0}</Badge>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      align: "right" as const,
      render: (row: RequisitionItem) =>
        `${row.currency || "$"}${Number(row.totalAmount || 0).toLocaleString()}`,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row: RequisitionItem) =>
        new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (row: RequisitionItem) => (
        <div className={styles.p9}>
          <Button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleApprove("requisition", row.id);
            }}
            variant="primary"
            size="sm"
            disabled={actionLoading}
          >
            <CheckCircle size={14} /> Approve
          </Button>
          <Button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setRejectTarget({ type: "requisition", id: row.id });
              setShowRejectModal(true);
            }}
            variant="danger"
            size="sm"
            disabled={actionLoading}
          >
            <XCircle size={14} /> Reject
          </Button>
        </div>
      ),
    },
  ];

  const pendingPoColumns = [
    {
      key: "poNumber",
      header: "PO Number",
      sortable: true,
      render: (row: PurchaseOrderItem) => (
        <span className={styles.p22}>
          {row.poNumber || `PO ${row.id.slice(0, 8)}`}
        </span>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (row: PurchaseOrderItem) => (
        <span className={styles.p23}>{row.vendor?.name || "N/A"}</span>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      align: "right" as const,
      render: (row: PurchaseOrderItem) =>
        `${row.currency || "$"}${Number(row.totalAmount || 0).toLocaleString()}`,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row: PurchaseOrderItem) =>
        new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (row: PurchaseOrderItem) => (
        <div className={styles.p9}>
          <Button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleApprove("purchase-order", row.id);
            }}
            variant="primary"
            size="sm"
            disabled={actionLoading}
          >
            <CheckCircle size={14} /> Approve
          </Button>
          <Button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setRejectTarget({ type: "purchase-order", id: row.id });
              setShowRejectModal(true);
            }}
            variant="danger"
            size="sm"
            disabled={actionLoading}
          >
            <XCircle size={14} /> Reject
          </Button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      key: "type",
      header: "Type",
      render: (row: HistoryItem) => (
        <div className={styles.p15}>
          {row.type === "requisition" ? (
            <FileText size={14} />
          ) : (
            <ShoppingCart size={14} />
          )}
          <Badge variant={row.type === "requisition" ? "info" : "primary"}>
            {row.type === "requisition" ? "Requisition" : "Purchase Order"}
          </Badge>
        </div>
      ),
    },
    {
      key: "title",
      header: "Reference",
      render: (row: HistoryItem) => (
        <span className={styles.p22}>
          {row.title || row.poNumber || row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "department",
      header: "Department / Vendor",
      render: (row: HistoryItem) => (
        <span className={styles.p23}>
          {row.department?.name || row.vendor?.name || "N/A"}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      align: "right" as const,
      render: (row: HistoryItem) =>
        `${row.currency || "$"}${Number(row.totalAmount || 0).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row: HistoryItem) => {
        const v: Record<string, "success" | "danger" | "warning" | "default"> =
          { APPROVED: "success", REJECTED: "danger", CANCELLED: "danger" };
        return <Badge variant={v[row.status] || "default"}>{row.status}</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row: HistoryItem) =>
        new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  if (loading && !stats) {
    return (
      <RouteGuard permission="procurement.approval.read">
        <div className={styles.p1}>
          <Spinner size="lg" />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="procurement.approval.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Approvals"
          description="Manage purchase requisition and purchase order approvals"
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Procurement", href: "/procurement" },
            { label: "Approvals" },
          ]}
        />

        {error && (
          <div className={styles.p12}>
            <AlertTriangle size={16} />
            <span>{error}</span>
            <Button size="sm" variant="ghost" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        <div className={styles.p6}>
          <Card className="ui-card">
            <div className={styles.p7}>
              <div className={styles.p15}>
                <Clock size={16} className={styles.p36} />
                <span className={styles.p13}>Pending</span>
              </div>
              <div className={styles.p14}>
                {stats?.requisitions.pending !== undefined
                  ? stats.requisitions.pending +
                    (stats?.purchaseOrders.pending ?? 0)
                  : pendingTotal}
              </div>
            </div>
          </Card>
          <Card className="ui-card">
            <div className={styles.p7}>
              <div className={styles.p15}>
                <CheckCircle size={16} className={styles.p33} />
                <span className={styles.p13}>Approved</span>
              </div>
              <div className={styles.p14}>
                {(stats?.requisitions.approved ?? 0) +
                  (stats?.purchaseOrders.approved ?? 0)}
              </div>
            </div>
          </Card>
          <Card className="ui-card">
            <div className={styles.p7}>
              <div className={styles.p15}>
                <XCircle size={16} className={styles.p34} />
                <span className={styles.p13}>Rejected</span>
              </div>
              <div className={styles.p14}>
                {stats?.requisitions.rejected ?? 0}
              </div>
            </div>
          </Card>
          <Card className="ui-card">
            <div className={styles.p7}>
              <div className={styles.p15}>
                <FileText size={16} className={styles.p35} />
                <span className={styles.p13}>Approval Rate</span>
              </div>
              <div className={styles.p14}>
                {stats?.requisitions.approvalRate ?? 0}%
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.p3}>
          <button
            onClick={() => setActiveTab("pending")}
            className={styles.p4}
            style={{
              fontWeight:
                activeTab === "pending" ? "var(--weight-bold)" : "normal",
              color:
                activeTab === "pending"
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
              borderBottom:
                activeTab === "pending"
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
            }}
          >
            <Clock size={14} /> Pending ({pendingTotal})
          </button>
          <button
            onClick={() => setActiveTab("my-approvals")}
            className={styles.p4}
            style={{
              fontWeight:
                activeTab === "my-approvals" ? "var(--weight-bold)" : "normal",
              color:
                activeTab === "my-approvals"
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
              borderBottom:
                activeTab === "my-approvals"
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
            }}
          >
            <CheckSquare size={14} /> My Approvals ({myTotal})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={styles.p4}
            style={{
              fontWeight:
                activeTab === "history" ? "var(--weight-bold)" : "normal",
              color:
                activeTab === "history"
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
              borderBottom:
                activeTab === "history"
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
            }}
          >
            <Clock size={14} /> History
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={styles.p4}
            style={{
              fontWeight:
                activeTab === "settings" ? "var(--weight-bold)" : "normal",
              color:
                activeTab === "settings"
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
              borderBottom:
                activeTab === "settings"
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
            }}
          >
            <Settings size={14} /> Settings
          </button>
        </div>

        {activeTab === "pending" && (
          <div className={styles.p5}>
            {loading ? (
              <div className={styles.p1}>
                <Spinner />
              </div>
            ) : (
              <>
                <Card className="ui-card">
                  <div className={styles.p10}>
                    <div className={styles.p8}>
                      <ShoppingCart size={18} />
                      <h3 className={styles.p38}>Purchase Requisitions</h3>
                      <Badge variant="warning">
                        {pendingRequisitions.length}
                      </Badge>
                    </div>
                  </div>
                  <DataTable
                    columns={pendingReqColumns}
                    data={pendingRequisitions}
                    rowKey={(r) => r.id}
                    emptyTitle="No pending requisitions"
                    emptyMessage="All requisitions have been reviewed."
                  />
                </Card>

                <Card className="ui-card">
                  <div className={styles.p10}>
                    <div className={styles.p8}>
                      <ShoppingCart size={18} />
                      <h3 className={styles.p38}>Purchase Orders</h3>
                      <Badge variant="warning">
                        {pendingPurchaseOrders.length}
                      </Badge>
                    </div>
                  </div>
                  <DataTable
                    columns={pendingPoColumns}
                    data={pendingPurchaseOrders}
                    rowKey={(r) => r.id}
                    emptyTitle="No pending purchase orders"
                    emptyMessage="All purchase orders have been reviewed."
                  />
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === "my-approvals" && (
          <div className={styles.p5}>
            {loading ? (
              <div className={styles.p1}>
                <Spinner />
              </div>
            ) : (
              <>
                <Card className="ui-card">
                  <div className={styles.p10}>
                    <div className={styles.p8}>
                      <FileText size={18} />
                      <h3 className={styles.p38}>My Pending Requisitions</h3>
                      <Badge variant="warning">{myRequisitions.length}</Badge>
                    </div>
                  </div>
                  <DataTable
                    columns={pendingReqColumns}
                    data={myRequisitions}
                    rowKey={(r) => r.id}
                    emptyTitle="No pending requisitions assigned to you"
                    emptyMessage="You have no items awaiting your approval."
                  />
                </Card>

                <Card className="ui-card">
                  <div className={styles.p10}>
                    <div className={styles.p8}>
                      <ShoppingCart size={18} />
                      <h3 className={styles.p38}>My Pending Purchase Orders</h3>
                      <Badge variant="warning">{myPurchaseOrders.length}</Badge>
                    </div>
                  </div>
                  <DataTable
                    columns={pendingPoColumns}
                    data={myPurchaseOrders}
                    rowKey={(r) => r.id}
                    emptyTitle="No pending purchase orders assigned to you"
                    emptyMessage="You have no purchase orders awaiting your approval."
                  />
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <Card className="ui-card">
            <div className={styles.p10}>
              <div className={styles.p11}>
                <Filter size={16} />
                <select
                  value={historyType}
                  onChange={(e) => {
                    setHistoryType(e.target.value);
                    setHistoryPage(1);
                  }}
                  style={{
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                    background: "var(--color-bg)",
                  }}
                >
                  <option value="">All Types</option>
                  <option value="requisition">Requisitions</option>
                  <option value="purchase-order">Purchase Orders</option>
                </select>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => loadHistory(historyPage, historyType)}
              >
                <RefreshCw size={14} /> Refresh
              </Button>
            </div>
            <DataTable
              columns={historyColumns}
              data={historyItems}
              rowKey={(r) => r.id}
              emptyTitle="No approval history"
              emptyMessage="Completed approvals will appear here."
            />
            {historyTotal > 20 && (
              <div
                className={styles.p20}
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  borderTop: "1px solid var(--color-border)",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className={styles.p13}>Page {historyPage}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={historyPage * 20 >= historyTotal}
                  onClick={() => setHistoryPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        )}

        {activeTab === "settings" && (
          <div className={styles.p5}>
            <div className={styles.p10}>
              <Card className="ui-card" style={{ flex: 1 }}>
                <div className={styles.p18}>
                  <div className={styles.p37}>
                    <h3 className={styles.p38}>Approval Policy</h3>
                  </div>

                  <div className={styles.p16}>
                    <div className={styles.p17}>
                      <label className={styles.p13}>Requires Approval</label>
                      <select
                        value={policyRequiresApproval ? "true" : "false"}
                        onChange={(e) =>
                          setPolicyRequiresApproval(e.target.value === "true")
                        }
                        style={{
                          padding: "var(--space-2)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--color-border)",
                          fontSize: "var(--text-sm)",
                          background: "var(--color-bg)",
                        }}
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    <div className={styles.p17}>
                      <label className={styles.p13}>
                        Approver Roles (comma-separated)
                      </label>
                      <input
                        value={policyApproverRoles}
                        onChange={(e) => setPolicyApproverRoles(e.target.value)}
                        placeholder="e.g. procurement_manager, finance_manager"
                        style={{
                          padding: "var(--space-2)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--color-border)",
                          fontSize: "var(--text-sm)",
                          background: "var(--color-bg)",
                          width: "100%",
                        }}
                      />
                    </div>

                    <div className="ui-grid-2">
                      <div className={styles.p17}>
                        <label className={styles.p13}>
                          Min Amount (optional)
                        </label>
                        <input
                          type="number"
                          value={policyMinAmount}
                          onChange={(e) => setPolicyMinAmount(e.target.value)}
                          placeholder="0"
                          style={{
                            padding: "var(--space-2)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)",
                            fontSize: "var(--text-sm)",
                            background: "var(--color-bg)",
                            width: "100%",
                          }}
                        />
                      </div>
                      <div className={styles.p17}>
                        <label className={styles.p13}>
                          Max Amount (optional)
                        </label>
                        <input
                          type="number"
                          value={policyMaxAmount}
                          onChange={(e) => setPolicyMaxAmount(e.target.value)}
                          placeholder="100000"
                          style={{
                            padding: "var(--space-2)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)",
                            fontSize: "var(--text-sm)",
                            background: "var(--color-bg)",
                            width: "100%",
                          }}
                        />
                      </div>
                    </div>

                    <Button onClick={handleSavePolicy} disabled={actionLoading}>
                      <CheckCircle size={14} /> Save Policy
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="ui-card" style={{ flex: 1 }}>
                <div className={styles.p18}>
                  <div className={styles.p37}>
                    <h3 className={styles.p38}>Delegation</h3>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowDelegateModal(true)}
                    >
                      <UserPlus size={14} /> Delegate
                    </Button>
                  </div>
                  <div className={styles.p31}>
                    Delegate your approval authority to another user for a
                    specified period. This is useful during absences or workload
                    sharing.
                  </div>
                </div>
              </Card>
            </div>

            {policy && policy.approverRoles.length > 0 && (
              <Card className="ui-card">
                <div className={styles.p18}>
                  <h3 className={styles.p38}>Current Policy Summary</h3>
                  <div className={styles.p25}>
                    <div className={styles.p24}>
                      <div>
                        <div className={styles.p26}>Approval Required</div>
                        <div className={styles.p27}>
                          {policy.requiresApproval ? "Yes" : "No"}
                        </div>
                      </div>
                      <div>
                        <div className={styles.p26}>Approver Roles</div>
                        <div className={styles.p27}>
                          {policy.approverRoles.join(", ") || "None configured"}
                        </div>
                      </div>
                      <div>
                        <div className={styles.p26}>Amount Range</div>
                        <div className={styles.p27}>
                          {policy.minAmount ? `$${policy.minAmount}` : "$0"} —{" "}
                          {policy.maxAmount
                            ? `$${policy.maxAmount}`
                            : "No limit"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <Modal
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason("");
          setRejectTarget(null);
        }}
        title="Reject Approval"
      >
        <div className={styles.p16}>
          <p className={styles.p13}>
            Please provide a reason for rejecting this{" "}
            {rejectTarget?.type === "requisition"
              ? "requisition"
              : "purchase order"}
            .
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={3}
            style={{
              padding: "var(--space-2)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              width: "100%",
              resize: "vertical",
            }}
          />
          <div className={styles.p9}>
            <Button
              variant="ghost"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
                setRejectTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              <XCircle size={14} /> Reject
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showDelegateModal}
        onClose={() => setShowDelegateModal(false)}
        title="Delegate Approval Authority"
      >
        <div className={styles.p16}>
          <div className={styles.p17}>
            <label className={styles.p13}>Delegate To (User ID)</label>
            <input
              value={delegateUserId}
              onChange={(e) => setDelegateUserId(e.target.value)}
              placeholder="Enter user ID"
              style={{
                padding: "var(--space-2)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                fontSize: "var(--text-sm)",
                width: "100%",
              }}
            />
          </div>
          <div className="ui-grid-2">
            <div className={styles.p17}>
              <label className={styles.p13}>From Date</label>
              <input
                type="date"
                value={delegateFrom}
                onChange={(e) => setDelegateFrom(e.target.value)}
                style={{
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-sm)",
                  width: "100%",
                }}
              />
            </div>
            <div className={styles.p17}>
              <label className={styles.p13}>To Date</label>
              <input
                type="date"
                value={delegateTo}
                onChange={(e) => setDelegateTo(e.target.value)}
                style={{
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-sm)",
                  width: "100%",
                }}
              />
            </div>
          </div>
          <div className={styles.p9}>
            <Button variant="ghost" onClick={() => setShowDelegateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelegate}
              disabled={
                actionLoading || !delegateUserId || !delegateFrom || !delegateTo
              }
            >
              <UserPlus size={14} /> Delegate
            </Button>
          </div>
        </div>
      </Modal>
    </RouteGuard>
  );
}
