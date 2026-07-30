// @ts-nocheck
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
  Phone,
  PhoneIncoming,
  PhoneMissed,
  Voicemail,
  BarChart3,
  Mic,
} from "lucide-react";

interface Call {
  id: string;
  callerName: string;
  callerNumber: string;
  calleeNumber: string;
  direction: string;
  status: string;
  durationSecs: number;
  startedAt: string;
}
interface Dashboard {
  activeCalls: number;
  totalCallsToday: number;
  unreadVoicemails: number;
  ivrMenuCount: number;
}

export default function VoipPage() {
  const client = useApiClient();
  const [calls, setCalls] = useState<Call[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calls");

  useEffect(() => {
    (async () => {
      try {
        const [clls, dash] = await Promise.all([
          client.get<any>("/communication/voip/calls"),
          client.get<Dashboard>("/communication/voip/dashboard"),
        ]);
        setCalls(clls.data || []);
        setDashboard(dash);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      RINGING: "warning",
      IN_PROGRESS: "success",
      COMPLETED: "default",
      MISSED: "danger",
      FAILED: "danger",
      VOICEMAIL: "info",
    };
    return <Badge variant={m[s] as any}>{s}</Badge>;
  };

  const columns: Column<Call>[] = [
    {
      key: "callerName",
      header: "Caller",
      render: (r) => (
        <div>
          <span className="font-medium">{r.callerName}</span>
          <div className="text-xs text-muted">{r.callerNumber}</div>
        </div>
      ),
    },
    {
      key: "direction",
      header: "Direction",
      render: (r) => (
        <Badge variant={r.direction === "INBOUND" ? "info" : "default"}>
          {r.direction === "INBOUND" ? (
            <PhoneIncoming size={14} />
          ) : (
            <Phone size={14} />
          )}{" "}
          {r.direction}
        </Badge>
      ),
    },
    { key: "status", header: "Status", render: (r) => statusBadge(r.status) },
    {
      key: "durationSecs",
      header: "Duration",
      render: (r) => {
        const m = Math.floor(r.durationSecs / 60);
        const s = r.durationSecs % 60;
        return `${m}m ${s}s`;
      },
    },
    {
      key: "startedAt",
      header: "Time",
      render: (r) => new Date(r.startedAt).toLocaleString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <Button variant="ghost" size="sm">
          <Phone size={14} />
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
    <RouteGuard permission="communication.voip.read">
      <div className="ui-page">
        <PageHeader
          title="VoIP & Telephony"
          description={dashboard ? `${dashboard.activeCalls} active calls` : ""}
          breadcrumbs={[
            { label: "Communication", href: "/communication" },
            { label: "VoIP" },
          ]}
          actions={
            <Button>
              <Phone size={14} /> New Call
            </Button>
          }
        />
        {dashboard && (
          <div className="ui-grid-auto mb-6">
            <KPICard
              title="Active Calls"
              value={dashboard.activeCalls}
              icon={<Phone size={18} />}
              color="var(--color-success)"
            />
            <KPICard
              title="Today's Calls"
              value={dashboard.totalCallsToday}
              icon={<BarChart3 size={18} />}
              color="var(--color-info)"
            />
            <KPICard
              title="Unread Voicemails"
              value={dashboard.unreadVoicemails}
              icon={<Voicemail size={18} />}
              color="var(--color-danger)"
            />
            <KPICard
              title="IVR Menus"
              value={dashboard.ivrMenuCount}
              icon={<Mic size={18} />}
              color="var(--color-primary)"
            />
          </div>
        )}
        <Tabs
          tabs={[
            { key: "calls", label: "Calls" },
            { key: "ivr", label: "IVR" },
            { key: "voicemail", label: "Voicemail" },
            { key: "analytics", label: "Analytics" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "calls" && (
          <Card className="mt-4">
            <DataTable
              columns={columns}
              data={calls}
              rowKey={(r) => r.id}
              emptyTitle="No calls"
              emptyIcon={<Phone size={48} />}
            />
          </Card>
        )}
        {activeTab === "ivr" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">IVR menu builder and configuration</p>
          </Card>
        )}
        {activeTab === "voicemail" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Voicemail inbox</p>
          </Card>
        )}
        {activeTab === "analytics" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Call analytics dashboard</p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
