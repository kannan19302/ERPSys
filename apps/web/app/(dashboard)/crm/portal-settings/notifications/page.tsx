// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import {
  Bell,
  CheckCheck,
  Search,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

interface Notification {
  id: string;
  customerId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  readAt?: string;
  createdAt: string;
}

export default function PortalNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");

  const load = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await apiGet(`/api/crm/portal/notifications/${customerId}`);
      setNotifications(Array.isArray(res) ? res : (res as any)?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) load();
  }, [customerId]);

  const markAsRead = async (id: string) => {
    await apiSend(`/api/crm/portal/notifications/${id}/read`, "POST");
    load();
  };

  const typeIcon: Record<string, React.ReactNode> = {
    INFO: <Info size={16} />,
    WARNING: <AlertTriangle size={16} />,
    SUCCESS: <CheckCircle size={16} />,
    ERROR: <XCircle size={16} />,
  };

  const typeBadge: Record<
    string,
    "success" | "warning" | "default" | "danger"
  > = {
    INFO: "default",
    WARNING: "warning",
    SUCCESS: "success",
    ERROR: "danger",
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Portal Notifications"
        description="View and manage notifications sent to portal users"
        breadcrumbs={[
          { label: "Portal Settings", href: "/crm/portal-settings" },
          { label: "Notifications" },
        ]}
      />
      <div className="ui-input-group ui-mb-4" style={{ maxWidth: 400 }}>
        <Search size={16} />
        <input
          className="ui-input"
          placeholder="Customer ID..."
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="ui-card-body">
            {notifications.length === 0 ? (
              <p className="ui-text-sm text-muted">
                {customerId
                  ? "No notifications found"
                  : "Enter a Customer ID to view notifications"}
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="ui-flex ui-items-start ui-gap-3 ui-py-2 ui-border-b"
                >
                  <span className="ui-mt-1">
                    {typeIcon[n.type] || <Info size={16} />}
                  </span>
                  <div className="ui-flex-1">
                    <div className="ui-flex ui-items-center ui-gap-2">
                      <strong className="ui-text-sm">{n.title}</strong>
                      <Badge variant={typeBadge[n.type] || "default"}>
                        {n.type}
                      </Badge>
                      {n.readAt ? (
                        <span className="ui-text-xs text-muted">Read</span>
                      ) : (
                        <Badge variant="warning">New</Badge>
                      )}
                    </div>
                    <p className="ui-text-sm text-muted">{n.message}</p>
                    <p className="ui-text-xs text-muted">
                      {new Date(n.createdAt).toLocaleString()} ·{" "}
                      {n.customerId.substring(0, 8)}
                    </p>
                  </div>
                  {!n.readAt && (
                    <button
                      className="ui-btn-icon"
                      onClick={() => markAsRead(n.id)}
                      title="Mark as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
