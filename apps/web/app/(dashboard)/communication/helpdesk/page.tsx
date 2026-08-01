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
  HeadphonesIcon,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  TrendingUp,
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  source: string;
  customerName: string;
  assignedTo: string | null;
  createdAt: string;
  sla?: { breached: boolean } | null;
}
interface Dashboard {
  openCount: number;
  pendingCount: number;
  resolvedCount: number;
  escalatedCount: number;
  avgResponseTime: number;
}

export default function HelpdeskPage() {
  const client = useApiClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets");

  useEffect(() => {
    (async () => {
      try {
        const [tix, dash] = await Promise.all([
          client.get<any>("/communication/helpdesk/tickets"),
          client.get<Dashboard>("/communication/helpdesk/dashboard"),
        ]);
        setTickets(tix.data || []);
        setDashboard(dash);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  const priorityBadge = (p: string) => {
    const m: Record<string, string> = {
      LOW: "default",
      MEDIUM: "info",
      HIGH: "warning",
      CRITICAL: "danger",
    };
    return <Badge variant={m[p] as any}>{p}</Badge>;
  };
  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      OPEN: "warning",
      PENDING: "info",
      RESOLVED: "success",
      CLOSED: "default",
      ESCALATED: "danger",
    };
    return <Badge variant={m[s] as any}>{s}</Badge>;
  };

  const columns: Column<Ticket>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (r) => (
        <div>
          <span className="font-medium">{r.subject}</span>
          <div className="text-xs text-muted">{r.customerName}</div>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => statusBadge(r.status) },
    {
      key: "priority",
      header: "Priority",
      render: (r) => priorityBadge(r.priority),
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
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="ui-flex ui-gap-1">
          <Button variant="ghost" size="sm">
            <AlertCircle size={14} />
          </Button>
          <Button variant="ghost" size="sm">
            <CheckCircle size={14} />
          </Button>
        </div>
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
    <RouteGuard permission="communication.helpdesk.read">
      <div className="ui-page">
        <PageHeader
          title="Help Desk"
          description={dashboard ? `${dashboard.openCount} open tickets` : ""}
          breadcrumbs={[
            { label: "Communication", href: "/communication" },
            { label: "Help Desk" },
          ]}
          actions={
            <Button>
              <Plus size={14} /> New Ticket
            </Button>
          }
        />
        {dashboard && (
          <div className="ui-grid-auto mb-6">
            <KPICard
              title="Open"
              value={dashboard.openCount}
              icon={<AlertCircle size={18} />}
              color="var(--color-danger)"
            />
            <KPICard
              title="Pending"
              value={dashboard.pendingCount}
              icon={<Clock size={18} />}
              color="var(--color-warning)"
            />
            <KPICard
              title="Resolved"
              value={dashboard.resolvedCount}
              icon={<CheckCircle size={18} />}
              color="var(--color-success)"
            />
            <KPICard
              title="Escalated"
              value={dashboard.escalatedCount}
              icon={<TrendingUp size={18} />}
              color="var(--color-danger)"
            />
          </div>
        )}
        <Tabs
          tabs={[
            { key: "tickets", label: "Tickets" },
            { key: "queues", label: "Queues" },
            { key: "sla", label: "SLA" },
            { key: "reports", label: "Reports" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "tickets" && (
          <Card className="mt-4">
            <DataTable
              columns={columns}
              data={tickets}
              rowKey={(r) => r.id}
              emptyTitle="No tickets"
              emptyIcon={<HeadphonesIcon size={48} />}
            />
          </Card>
        )}
        {activeTab === "queues" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Ticket queues management</p>
          </Card>
        )}
        {activeTab === "sla" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">SLA tracking dashboard</p>
          </Card>
        )}
        {activeTab === "reports" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Helpdesk reports and analytics</p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
