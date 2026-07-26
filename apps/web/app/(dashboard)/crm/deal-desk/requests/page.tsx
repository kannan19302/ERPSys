"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  PageHeader,
  Spinner,
  Badge,
  useToast,
  Button,
  Input,
} from "@unerp/ui";
import {
  ClipboardList,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUp,
} from "lucide-react";
import { apiGet } from "../../_components/api";

export default function DealDeskRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const toast = useToast();

  const loadData = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiGet<any>(`/crm/deal-desk/requests?${params}`);
      setRequests(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(
        "Could not load requests",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  if (loading)
    return (
      <div className="ui-page-loading">
        <Spinner />
      </div>
    );

  return (
    <div className="ui-page">
      <PageHeader
        title="Deal Desk Requests"
        description="View and manage discount, special terms, and pricing requests"
        breadcrumbs={[
          { label: "Deal Desk", href: "/crm/deal-desk" },
          { label: "Requests" },
        ]}
      />

      <Card>
        <div className="ui-form-row">
          <div className="ui-form-group">
            <label className="ui-label">Filter by Status</label>
            <select
              className="ui-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="MORE_INFO">More Info Needed</option>
            </select>
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Total: {total} requests</label>
          </div>
        </div>
      </Card>

      <Card>
        <div className="ui-table-wrapper">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Discount</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r: any) => (
                <tr key={r.id}>
                  <td
                    className="ui-text-link"
                    onClick={() =>
                      (window.location.href = `/crm/deal-desk/requests/${r.id}`)
                    }
                  >
                    {r.opportunity?.name || "N/A"}
                  </td>
                  <td>
                    <Badge variant="info">{r.requestType}</Badge>
                  </td>
                  <td>
                    ${Number(r.opportunity?.amount || 0).toLocaleString()}
                  </td>
                  <td>{r.discountRequest ? `${r.discountRequest}%` : "-"}</td>
                  <td>
                    <Badge
                      variant={
                        r.priority === "URGENT"
                          ? "danger"
                          : r.priority === "HIGH"
                            ? "warning"
                            : "default"
                      }
                    >
                      {r.priority}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      variant={
                        r.status === "APPROVED"
                          ? "success"
                          : r.status === "REJECTED"
                            ? "danger"
                            : r.status === "PENDING"
                              ? "warning"
                              : "info"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="ui-action-cell">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          (window.location.href = `/crm/deal-desk/requests/${r.id}`)
                        }
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={8} className="ui-text-center">
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {total > 50 && (
          <div className="ui-pagination">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {Math.ceil(total / 50)}
            </span>
            <Button
              variant="secondary"
              disabled={page >= Math.ceil(total / 50)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
