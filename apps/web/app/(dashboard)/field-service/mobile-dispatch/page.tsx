"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  Badge,
  DataTable,
  type Column,
  KPICard,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import {
  Smartphone,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface TechnicianStatus {
  id: string;
  name: string;
  currentStatus: string;
  locationLat?: number;
  locationLng?: number;
  completedJobs: number;
  rating: number;
}

interface DashboardRecord {
  id: string;
  technicianId: string;
  totalJobs: number;
  completedJobs: number;
  totalRevenue: number;
  rating: number;
  onTimeRate: number;
}

interface TodayJob {
  id: string;
  ticketId: string;
  scheduledStart: string;
  status: string;
  ticket?: {
    id: string;
    title: string;
    customerName: string;
    priority: string;
    status: string;
    location: string;
  };
}

export default function MobileDispatchPage() {
  const client = useApiClient();
  const [statuses, setStatuses] = useState<TechnicianStatus[]>([]);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardRecord | null>(null);
  const [todayJobs, setTodayJobs] = useState<TodayJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await client.get<TechnicianStatus[]>(
          "/ext/field-service/technician-statuses",
        );
        setStatuses(Array.isArray(s) ? s : []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  useEffect(() => {
    if (!selectedTech) return;
    (async () => {
      try {
        const d = await client.get<any>(
          `/ext/field-service/mobile-dashboard/${selectedTech}`,
        );
        setDashboard(d.dashboard);
        setTodayJobs(
          Array.isArray(d.technician?.dispatches)
            ? d.technician.dispatches
            : [],
        );
      } catch {
        /* ignore */
      }
    })();
  }, [client, selectedTech]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await client.patch(`/ext/field-service/technician-statuses/${id}`, {
        status,
      });
      const s = await client.get<TechnicianStatus[]>(
        "/ext/field-service/technician-statuses",
      );
      setStatuses(Array.isArray(s) ? s : []);
    } catch {
      /* ignore */
    }
  };

  const statusColumns: Column<TechnicianStatus>[] = [
    {
      key: "name",
      header: "Technician",
      render: (r) => <span className="ui-heading-sm">{r.name}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const v: Record<string, "success" | "warning" | "info" | "default"> = {
          AVAILABLE: "success",
          BUSY: "warning",
          ON_BREAK: "info",
          OFFLINE: "default",
          ON_LEAVE: "default",
        };
        return (
          <Badge variant={v[r.currentStatus] || "default"}>
            {r.currentStatus}
          </Badge>
        );
      },
    },
    {
      key: "rating",
      header: "Rating",
      render: (r) => (
        <span className="flex items-center gap-1">
          <Star size={14} />
          {r.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={selectedTech === r.id ? "primary" : "secondary"}
            onClick={() => setSelectedTech(r.id)}
          >
            View
          </Button>
          <select
            className="ui-input-sm"
            value={r.currentStatus}
            onChange={(e) => handleStatusChange(r.id, e.target.value)}
          >
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">Busy</option>
            <option value="ON_BREAK">On Break</option>
            <option value="OFFLINE">Offline</option>
          </select>
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
    <RouteGuard permission="field-service.mobile-dashboard.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Mobile Dispatch"
          description="Technician mobile dashboard and live status"
          breadcrumbs={[
            { label: "Field Service", href: "/field-service" },
            { label: "Mobile Dispatch" },
          ]}
        />
        <Card title="Technician Statuses" padding="none">
          <DataTable
            columns={statusColumns}
            data={statuses}
            rowKey={(r) => r.id}
            emptyTitle="No technicians"
            emptyMessage="Add technicians to see their status."
            emptyIcon={<Smartphone size={48} />}
          />
        </Card>
        {selectedTech && (
          <>
            {dashboard && (
              <div className="ui-grid-auto">
                <KPICard
                  title="Total Jobs"
                  value={dashboard.totalJobs}
                  icon={<CheckCircle size={18} />}
                  color="var(--color-primary)"
                />
                <KPICard
                  title="Completed"
                  value={dashboard.completedJobs}
                  icon={<CheckCircle size={18} />}
                  color="var(--color-success)"
                />
                <KPICard
                  title="Rating"
                  value={dashboard.rating.toFixed(1)}
                  icon={<Star size={18} />}
                  color="var(--color-warning)"
                />
                <KPICard
                  title="On-Time Rate"
                  value={`${dashboard.onTimeRate}%`}
                  icon={<Clock size={18} />}
                  color="var(--color-info)"
                />
              </div>
            )}
            <Card title="Today's Jobs" padding="none">
              <DataTable
                columns={[
                  {
                    key: "title",
                    header: "Job",
                    render: (r) => (
                      <div>
                        <span className="ui-heading-sm">
                          {r.ticket?.title || "N/A"}
                        </span>
                        <div className="ui-text-xs-tertiary">
                          {r.ticket?.customerName}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "priority",
                    header: "Priority",
                    render: (r) => (
                      <Badge
                        variant={
                          r.ticket?.priority === "HIGH" ||
                          r.ticket?.priority === "URGENT"
                            ? "warning"
                            : "info"
                        }
                      >
                        {r.ticket?.priority || "MEDIUM"}
                      </Badge>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (r) => (
                      <Badge
                        variant={
                          r.status === "COMPLETED"
                            ? "success"
                            : r.status === "IN_PROGRESS"
                              ? "warning"
                              : "info"
                        }
                      >
                        {r.status}
                      </Badge>
                    ),
                  },
                  {
                    key: "location",
                    header: "Location",
                    render: (r) => (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {r.ticket?.location || "—"}
                      </span>
                    ),
                  },
                ]}
                data={todayJobs}
                rowKey={(r) => r.id}
                emptyTitle="No jobs today"
                emptyMessage="No assignments for today."
                emptyIcon={<AlertTriangle size={48} />}
              />
            </Card>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
