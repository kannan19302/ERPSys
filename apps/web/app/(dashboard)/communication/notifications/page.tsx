"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useApiClient } from "@unerp/framework";
import {
  PageHeader,
  Card,
  DataTable,
  Button,
  Badge,
  Spinner,
  type Column,
} from "@unerp/ui";
import { Bell, CheckCircle, Archive, RefreshCw } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  link: string | null;
  createdAt: string;
}

export default function NotificationListPage() {
  const client = useApiClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.get<Notification[]>(
        "/communication/notifications",
      );
      setNotifications(data);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await client.put(`/communication/notifications/${id}/status`, {
        status: "READ",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n)),
      );
    } catch {
      /* empty */
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await client.put(`/communication/notifications/${id}/status`, {
        status: "ARCHIVED",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "ARCHIVED" } : n)),
      );
    } catch {
      /* empty */
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      UNREAD: "warning",
      READ: "info",
      ARCHIVED: "default",
    };
    return <Badge variant={map[status] as any}>{status}</Badge>;
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      SYSTEM: "System",
      WORKFLOW: "Workflow",
      CHAT: "Chat",
    };
    return map[type] || type;
  };

  const columns: Column<Notification>[] = [
    {
      key: "title",
      header: "Title",
      render: (r) => (
        <div>
          <div className={r.status === "UNREAD" ? "font-semibold" : ""}>
            {r.title}
          </div>
          <div className="ui-text-micro ui-text-muted">
            {r.content.length > 80 ? `${r.content.slice(0, 80)}...` : r.content}
          </div>
        </div>
      ),
    },
    { key: "type", header: "Type", render: (r) => typeLabel(r.type) },
    {
      key: "status",
      header: "Status",
      render: (r) => statusBadge(r.status),
    },
    {
      key: "createdAt",
      header: "Received",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="ui-flex ui-gap-1">
          {r.status === "UNREAD" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: any) => {
                e.stopPropagation();
                handleMarkRead(r.id);
              }}
            >
              <CheckCircle size={14} />
            </Button>
          )}
          {r.status !== "ARCHIVED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: any) => {
                e.stopPropagation();
                handleArchive(r.id);
              }}
            >
              <Archive size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="ui-page">
        <PageHeader title="Notifications" />
        <div className="ui-flex ui-justify-center" style={{ padding: "4rem" }}>
          <Spinner />
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => n.status === "UNREAD").length;

  return (
    <div className="ui-page">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread`}
        breadcrumbs={[
          { label: "Communication", href: "/communication" },
          { label: "Notifications" },
        ]}
        actions={
          <Button variant="ghost" onClick={fetchNotifications}>
            <RefreshCw size={14} /> Refresh
          </Button>
        }
      />
      <Card>
        <DataTable
          columns={columns}
          data={notifications}
          rowKey={(r) => r.id}
          emptyTitle="No notifications"
          emptyIcon={<Bell size={48} />}
        />
      </Card>
    </div>
  );
}
