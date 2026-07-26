"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, Badge, useToast, Button } from "@unerp/ui";
import {
  ClipboardList,
  AlertTriangle,
  Settings,
  BarChart3,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { apiGet } from "../_components/api";

export default function DealDeskPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const toast = useToast();

  const loadData = async () => {
    try {
      const data = await apiGet<any>("/crm/deal-desk/dashboard");
      setDashboard(data);
    } catch (err) {
      toast.error(
        "Could not load deal desk dashboard",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading)
    return (
      <div className="ui-page-loading">
        <Spinner />
      </div>
    );

  const stats = dashboard?.stats || {};

  return (
    <div className="ui-page">
      <PageHeader
        title="Deal Desk"
        description="Manage deal approvals, special pricing, discount requests, and deal alerts"
      />

      <div className="ui-card-grid ui-grid-5">
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <ClipboardList size={24} />
          </div>
          <div className="ui-stat-value">{stats.pending || 0}</div>
          <div className="ui-stat-label">Pending</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="ui-stat-value">{stats.urgent || 0}</div>
          <div className="ui-stat-label">Urgent</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="ui-stat-value">{stats.approved || 0}</div>
          <div className="ui-stat-label">Approved</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <XCircle size={24} />
          </div>
          <div className="ui-stat-value">{stats.rejected || 0}</div>
          <div className="ui-stat-label">Rejected</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <Clock size={24} />
          </div>
          <div className="ui-stat-value">{stats.avgResponseHours || 0}h</div>
          <div className="ui-stat-label">Avg Response</div>
        </Card>
      </div>

      <div className="ui-grid-2">
        <Card title="Open Requests">
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.openRequests?.map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.requestType}</td>
                    <td>
                      <Badge
                        variant={r.status === "PENDING" ? "warning" : "info"}
                      >
                        {r.status}
                      </Badge>
                    </td>
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
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ui-card-actions">
            <Button
              variant="primary"
              onClick={() => (window.location.href = "/crm/deal-desk/requests")}
            >
              View All Requests
            </Button>
          </div>
        </Card>

        <Card title="Recent Activity">
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.recentActivity?.map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.opportunityName || "N/A"}</td>
                    <td>{r.requestType}</td>
                    <td>
                      <Badge
                        variant={
                          r.status === "APPROVED"
                            ? "success"
                            : r.status === "REJECTED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td>{new Date(r.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="ui-card-grid ui-grid-3">
        <Card className="ui-card-action">
          <Button
            variant="primary"
            className="ui-w-full"
            onClick={() => (window.location.href = "/crm/deal-desk/requests")}
          >
            <ClipboardList size={16} /> Deal Desk Requests
          </Button>
        </Card>
        <Card className="ui-card-action">
          <Button
            variant="secondary"
            className="ui-w-full"
            onClick={() => (window.location.href = "/crm/deal-desk/alerts")}
          >
            <AlertTriangle size={16} /> Deal Alerts
          </Button>
        </Card>
        <Card className="ui-card-action">
          <Button
            variant="secondary"
            className="ui-w-full"
            onClick={() => (window.location.href = "/crm/deal-desk/automation")}
          >
            <Settings size={16} /> Automation Rules
          </Button>
        </Card>
      </div>
    </div>
  );
}
