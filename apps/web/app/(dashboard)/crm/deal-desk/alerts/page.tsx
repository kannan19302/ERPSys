"use client";

import React, { useState } from "react";
import {
  Card,
  PageHeader,
  Spinner,
  Badge,
  useToast,
  Button,
  Input,
} from "@unerp/ui";
import { AlertTriangle, Bell, CheckCircle } from "lucide-react";
import { apiGet, apiPost } from "../../_components/api";

export default function DealAlertsPage() {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [opportunityId, setOpportunityId] = useState("");
  const toast = useToast();

  const loadAlerts = async () => {
    if (!opportunityId) {
      toast.error("Validation", "Please enter an Opportunity ID");
      return;
    }
    setLoading(true);
    try {
      const data = await apiGet<any[]>(
        `/crm/deal-desk/alerts/${opportunityId}`,
      );
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Could not load alerts",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await apiPost(`/crm/deal-desk/alerts/${id}/acknowledge`, {});
      toast.success("Success", "Alert acknowledged.");
      loadAlerts();
    } catch (err) {
      toast.error(
        "Error",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Deal Alerts"
        description="View and manage alerts for deals requiring attention"
        breadcrumb={[
          { label: "Deal Desk", href: "/crm/deal-desk" },
          { label: "Alerts" },
        ]}
      />

      <Card>
        <div className="ui-form-row">
          <div className="ui-form-group" style={{ maxWidth: 400 }}>
            <label className="ui-label">Opportunity ID</label>
            <Input
              placeholder="Enter opportunity ID"
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
            />
          </div>
          <div className="ui-form-group" style={{ alignSelf: "flex-end" }}>
            <Button variant="primary" onClick={loadAlerts} disabled={loading}>
              <Bell size={16} /> Load Alerts
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="ui-page-loading">
          <Spinner />
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <Card title={`Alerts for ${opportunityId}`}>
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a: any) => (
                  <tr key={a.id}>
                    <td>
                      <Badge variant="info">{a.alertType}</Badge>
                    </td>
                    <td>
                      <Badge
                        variant={
                          a.severity === "CRITICAL"
                            ? "error"
                            : a.severity === "WARNING"
                              ? "warning"
                              : "info"
                        }
                      >
                        {a.severity}
                      </Badge>
                    </td>
                    <td>{a.message}</td>
                    <td>
                      <Badge
                        variant={a.status === "OPEN" ? "warning" : "success"}
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td>
                      {a.status === "OPEN" && (
                        <Button
                          variant="ghost"
                          onClick={() => handleAcknowledge(a.id)}
                        >
                          <CheckCircle size={16} /> Acknowledge
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && opportunityId && alerts.length === 0 && (
        <Card>
          <div className="ui-text-center">
            No alerts found for this opportunity.
          </div>
        </Card>
      )}
    </div>
  );
}
