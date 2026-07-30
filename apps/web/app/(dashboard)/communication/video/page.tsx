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
import { Video, Monitor, Camera, BarChart3, Users, Radio } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  active: boolean;
  code: string;
  hostId: string;
  startedAt: string;
  _count: { participants: number; recordings: number };
}
interface Dashboard {
  activeMeetings: number;
  totalMeetings: number;
  totalParticipants: number;
  totalRecordings: number;
  meetingsToday: number;
}

export default function VideoPage() {
  const client = useApiClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("meetings");

  useEffect(() => {
    (async () => {
      try {
        const [meets, dash] = await Promise.all([
          client.get<any>("/communication/video/meetings"),
          client.get<Dashboard>("/communication/video/dashboard"),
        ]);
        setMeetings(meets.data || []);
        setDashboard(dash);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  const columns: Column<Meeting>[] = [
    {
      key: "title",
      header: "Meeting",
      render: (r) => (
        <div>
          <span className="font-medium">{r.title}</span>
          <div className="text-xs text-muted">{r.code}</div>
        </div>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (r) => (
        <Badge variant={r.active ? "success" : "default"}>
          {r.active ? "Live" : "Ended"}
        </Badge>
      ),
    },
    {
      key: "participants",
      header: "Participants",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Users size={14} />
          {r._count?.participants || 0}
        </div>
      ),
    },
    {
      key: "recordings",
      header: "Recordings",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Monitor size={14} />
          {r._count?.recordings || 0}
        </div>
      ),
    },
    {
      key: "startedAt",
      header: "Started",
      render: (r) => new Date(r.startedAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <Button variant="ghost" size="sm">
          <Video size={14} />
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
    <RouteGuard permission="communication.video.read">
      <div className="ui-page">
        <PageHeader
          title="Video Conferencing"
          description={
            dashboard ? `${dashboard.activeMeetings} active meetings` : ""
          }
          breadcrumbs={[
            { label: "Communication", href: "/communication" },
            { label: "Video" },
          ]}
          actions={
            <Button>
              <Video size={14} /> New Meeting
            </Button>
          }
        />
        {dashboard && (
          <div className="ui-grid-auto mb-6">
            <KPICard
              title="Active Meetings"
              value={dashboard.activeMeetings}
              icon={<Radio size={18} />}
              color="var(--color-success)"
            />
            <KPICard
              title="Today"
              value={dashboard.meetingsToday}
              icon={<Camera size={18} />}
              color="var(--color-info)"
            />
            <KPICard
              title="Total Participants"
              value={dashboard.totalParticipants}
              icon={<Users size={18} />}
              color="var(--color-primary)"
            />
            <KPICard
              title="Recordings"
              value={dashboard.totalRecordings}
              icon={<Monitor size={18} />}
              color="var(--color-warning)"
            />
          </div>
        )}
        <Tabs
          tabs={[
            { key: "meetings", label: "Meetings" },
            { key: "recordings", label: "Recordings" },
            { key: "rooms", label: "Breakout Rooms" },
            { key: "analytics", label: "Analytics" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "meetings" && (
          <Card className="mt-4">
            <DataTable
              columns={columns}
              data={meetings}
              rowKey={(r) => r.id}
              emptyTitle="No meetings"
              emptyIcon={<Video size={48} />}
            />
          </Card>
        )}
        {activeTab === "recordings" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Meeting recordings library</p>
          </Card>
        )}
        {activeTab === "rooms" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Breakout rooms management</p>
          </Card>
        )}
        {activeTab === "analytics" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Meeting analytics dashboard</p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
