"use client";
import React, { useEffect, useState } from "react";
import { useApiClient, RouteGuard } from "@unerp/framework";
import {
  PageHeader,
  Card,
  DataTable,
  Button,
  Badge,
  Spinner,
  KPICard,
  Tabs,
  type Column,
} from "@unerp/ui";
import {
  Radio,
  MessageSquare,
  Globe,
  UserCheck,
  BarChart3,
  Inbox,
} from "lucide-react";

interface Conversation {
  id: string;
  contactName: string;
  platform: string;
  status: string;
  assignedTo: string | null;
  tags: string[];
  lastMessageAt: string;
  messages?: any[];
}
interface Dashboard {
  activeConversations: number;
  closedConversations: number;
  totalMessages: number;
  unassignedCount: number;
}

export default function OmnichannelPage() {
  const client = useApiClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inbox");

  useEffect(() => {
    (async () => {
      try {
        const [inbox, dash] = await Promise.all([
          client.get<any>("/communication/omnichannel/inbox"),
          client.get<Dashboard>("/communication/omnichannel/dashboard"),
        ]);
        setConversations(inbox.data || []);
        setDashboard(dash);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  const platformIcon = (p: string) => {
    const m: Record<string, string> = {
      EMAIL: "✉️",
      SMS: "📱",
      CHAT: "💬",
      WHATSAPP: "💚",
      FACEBOOK: "👍",
      TWITTER: "🐦",
      INSTAGRAM: "📸",
      TELEGRAM: "✈️",
    };
    return m[p] || "💬";
  };

  const columns: Column<Conversation>[] = [
    {
      key: "contactName",
      header: "Contact",
      render: (r) => (
        <div>
          <span className="font-medium">{r.contactName}</span>
          {r.tags?.length > 0 && (
            <div className="flex gap-1 mt-1">
              {r.tags.slice(0, 3).map((t, i) => (
                <Badge key={i} variant="default" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "platform",
      header: "Channel",
      render: (r) => (
        <span>
          {platformIcon(r.platform)} {r.platform}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge
          variant={
            r.status === "ACTIVE"
              ? "success"
              : r.status === "PENDING"
                ? "warning"
                : "default"
          }
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned",
      render: (r) =>
        r.assignedTo ? (
          <div className="flex items-center gap-1">
            <UserCheck size={14} />
            {r.assignedTo}
          </div>
        ) : (
          <Badge variant="default">Unassigned</Badge>
        ),
    },
    {
      key: "lastMessageAt",
      header: "Last Activity",
      render: (r) => new Date(r.lastMessageAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <Button variant="ghost" size="sm">
          <MessageSquare size={14} />
        </Button>
      ),
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="communication.omnichannel.read">
      <div className="ui-page">
        <PageHeader
          title="Omnichannel Inbox"
          description={
            dashboard ? `${dashboard.activeConversations} active` : ""
          }
          breadcrumbs={[
            { label: "Communication", href: "/communication" },
            { label: "Omnichannel" },
          ]}
        />
        {dashboard && (
          <div className="ui-grid-auto mb-6">
            <KPICard
              title="Active"
              value={dashboard.activeConversations}
              icon={<Inbox size={18} />}
              color="var(--color-success)"
            />
            <KPICard
              title="Unassigned"
              value={dashboard.unassignedCount}
              icon={<UserCheck size={18} />}
              color="var(--color-danger)"
            />
            <KPICard
              title="Total Messages"
              value={dashboard.totalMessages}
              icon={<MessageSquare size={18} />}
              color="var(--color-info)"
            />
            <KPICard
              title="Closed"
              value={dashboard.closedConversations}
              icon={<BarChart3 size={18} />}
              color="var(--color-muted)"
            />
          </div>
        )}
        <Tabs
          tabs={[
            { key: "inbox", label: "Inbox" },
            { key: "channels", label: "Channels" },
            { key: "routing", label: "Routing Rules" },
            { key: "analytics", label: "Analytics" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "inbox" && (
          <Card className="mt-4">
            <DataTable
              columns={columns}
              data={conversations}
              rowKey={(r) => r.id}
              emptyTitle="No conversations"
              emptyIcon={<Radio size={48} />}
            />
          </Card>
        )}
        {activeTab === "channels" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Channel integrations management</p>
          </Card>
        )}
        {activeTab === "routing" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Auto-routing rules configuration</p>
          </Card>
        )}
        {activeTab === "analytics" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Omnichannel analytics dashboard</p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
