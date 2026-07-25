"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, Badge, useToast, Button } from "@unerp/ui";
import { CheckCircle, XCircle, ArrowUp, Info } from "lucide-react";
import { apiGet, apiPost } from "../../../_components/api";
import { useParams } from "next/navigation";

export default function DealDeskRequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    try {
      const res = await apiGet<any>(`/crm/deal-desk/requests?status=&limit=1`);
      if (res.data) {
        const found = res.data.find((r: any) => r.id === id);
        setRequest(found || { id });
      }
    } catch (err) {
      toast.error(
        "Could not load request",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/crm/deal-desk/requests/${id}/${action}`, {
        reviewNotes: "Processed via Deal Desk",
      });
      toast.success("Success", `Request ${action}ed successfully.`);
      loadData();
    } catch (err) {
      toast.error(
        "Error",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="ui-page-loading">
        <Spinner />
      </div>
    );

  return (
    <div className="ui-page">
      <PageHeader
        title="Request Detail"
        description={`Request ID: ${id}`}
        breadcrumb={[
          { label: "Deal Desk", href: "/crm/deal-desk" },
          { label: "Requests", href: "/crm/deal-desk/requests" },
          { label: id },
        ]}
      />

      <div className="ui-grid-2">
        <Card title="Request Information">
          <div className="ui-detail-grid">
            <div className="ui-detail-row">
              <span className="ui-detail-label">Request Type</span>
              <span className="ui-detail-value">
                <Badge variant="info">{request?.requestType || "N/A"}</Badge>
              </span>
            </div>
            <div className="ui-detail-row">
              <span className="ui-detail-label">Status</span>
              <span className="ui-detail-value">
                <Badge
                  variant={
                    request?.status === "APPROVED"
                      ? "success"
                      : request?.status === "REJECTED"
                        ? "error"
                        : "warning"
                  }
                >
                  {request?.status || "N/A"}
                </Badge>
              </span>
            </div>
            <div className="ui-detail-row">
              <span className="ui-detail-label">Priority</span>
              <span className="ui-detail-value">
                <Badge
                  variant={
                    request?.priority === "URGENT"
                      ? "error"
                      : request?.priority === "HIGH"
                        ? "warning"
                        : "default"
                  }
                >
                  {request?.priority || "N/A"}
                </Badge>
              </span>
            </div>
            <div className="ui-detail-row">
              <span className="ui-detail-label">Discount Requested</span>
              <span className="ui-detail-value">
                {request?.discountRequest
                  ? `${request.discountRequest}%`
                  : "N/A"}
              </span>
            </div>
            <div className="ui-detail-row">
              <span className="ui-detail-label">Justification</span>
              <span className="ui-detail-value">
                {request?.justification || "N/A"}
              </span>
            </div>
            <div className="ui-detail-row">
              <span className="ui-detail-label">Created</span>
              <span className="ui-detail-value">
                {request?.createdAt
                  ? new Date(request.createdAt).toLocaleString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Actions">
          <div className="ui-card-actions-vertical">
            {(request?.status === "PENDING" ||
              request?.status === "MORE_INFO") && (
              <>
                <Button
                  variant="primary"
                  onClick={() => handleAction("approve")}
                  disabled={actionLoading}
                >
                  <CheckCircle size={16} /> Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleAction("reject")}
                  disabled={actionLoading}
                >
                  <XCircle size={16} /> Reject
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleAction("more-info")}
                  disabled={actionLoading}
                >
                  <Info size={16} /> Request More Info
                </Button>
                <Button
                  variant="warning"
                  onClick={() => handleAction("escalate")}
                  disabled={actionLoading}
                >
                  <ArrowUp size={16} /> Escalate
                </Button>
              </>
            )}
            {request?.status === "APPROVED" && (
              <div className="ui-text-success">
                This request has been approved.
              </div>
            )}
            {request?.status === "REJECTED" && (
              <div className="ui-text-error">
                This request has been rejected.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
