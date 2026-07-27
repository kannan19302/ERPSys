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
  Modal,
  TextField,
  Select,
  useToast,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { Calendar, Plus, Clock, MapPin } from "lucide-react";

interface ScheduleEntry {
  id: string;
  technicianId: string;
  title: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  durationMin: number;
  location?: string;
  status: string;
  notes?: string;
  technician?: { id: string; name: string };
  ticket?: { id: string; title: string };
}

interface CalendarEvent {
  id: string;
  technicianId: string;
  title: string;
  eventType: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color?: string;
  location?: string;
  status: string;
  technician?: { id: string; name: string };
}

export default function SchedulingPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"schedules" | "calendar">("schedules");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    technicianId: "",
    title: "",
    scheduledDate: "",
    startTime: "",
    endTime: "",
    durationMin: "60",
    location: "",
    notes: "",
    status: "SCHEDULED",
  });

  const loadData = async () => {
    try {
      const s = await client.get<{ data?: ScheduleEntry[] }>(
        "/ext/field-service/schedules?limit=100",
      );
      setSchedules(Array.isArray(s) ? s : s.data || []);
      const e = await client.get<CalendarEvent[]>(
        "/ext/field-service/calendar-events",
      );
      setEvents(Array.isArray(e) ? e : []);
    } catch (err) {
      notifyError(
        "Failed to load data",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client, notifyError]);

  const handleCreate = async () => {
    if (!form.technicianId || !form.title) return;
    setCreating(true);
    try {
      const payload = {
        ...form,
        durationMin: parseInt(form.durationMin),
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        startTime: form.startTime
          ? new Date(form.startTime).toISOString()
          : null,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
      };
      await client.post("/ext/field-service/schedules", payload);
      setCreateOpen(false);
      setForm({
        technicianId: "",
        title: "",
        scheduledDate: "",
        startTime: "",
        endTime: "",
        durationMin: "60",
        location: "",
        notes: "",
        status: "SCHEDULED",
      });
      await loadData();
    } catch (err) {
      notifyError(
        "Failed to create schedule",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await client.put(`/ext/field-service/schedules/${id}`, { status });
      await loadData();
    } catch {
      notifyError("Failed to update status", "");
    }
  };

  const scheduleColumns: Column<ScheduleEntry>[] = [
    {
      key: "title",
      header: "Title",
      render: (r) => (
        <div>
          <span className="ui-heading-sm">{r.title}</span>
          <div className="ui-text-xs-tertiary">
            {r.technician?.name || r.technicianId.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <span className="text-sm">
          {new Date(r.scheduledDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "time",
      header: "Time",
      render: (r) => (
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {r.startTime
            ? new Date(r.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (r) => <span>{r.durationMin} min</span>,
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
      key: "actions",
      header: "Actions",
      render: (r) => (
        <select
          className="ui-input-sm"
          value={r.status}
          onChange={(e) => handleStatusChange(r.id, e.target.value)}
        >
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      ),
    },
  ];

  const eventColumns: Column<CalendarEvent>[] = [
    {
      key: "title",
      header: "Event",
      render: (r) => (
        <div>
          <span
            className="ui-heading-sm"
            style={r.color ? { color: r.color } : {}}
          >
            {r.title}
          </span>
          <div className="ui-text-xs-tertiary">{r.technician?.name}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) => <Badge variant="info">{r.eventType}</Badge>,
    },
    {
      key: "start",
      header: "Start",
      render: (r) => (
        <span className="text-sm">
          {new Date(r.startTime).toLocaleString()}
        </span>
      ),
    },
    {
      key: "end",
      header: "End",
      render: (r) => (
        <span className="text-sm">{new Date(r.endTime).toLocaleString()}</span>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (r) => (
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {r.location || "—"}
        </span>
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
    <RouteGuard permission="field-service.schedule.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Scheduling"
          description="Technician schedules and calendar events"
          breadcrumbs={[
            { label: "Field Service", href: "/field-service" },
            { label: "Scheduling" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-2" /> New Schedule
            </Button>
          }
        />
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === "schedules" ? "primary" : "secondary"}
            onClick={() => setTab("schedules")}
          >
            Schedules
          </Button>
          <Button
            variant={tab === "calendar" ? "primary" : "secondary"}
            onClick={() => setTab("calendar")}
          >
            Calendar Events
          </Button>
        </div>
        {tab === "schedules" ? (
          <Card padding="none">
            <DataTable
              columns={scheduleColumns}
              data={schedules}
              rowKey={(r) => r.id}
              emptyTitle="No schedules"
              emptyMessage="Create a schedule entry."
              emptyIcon={<Calendar size={48} />}
            />
          </Card>
        ) : (
          <Card padding="none">
            <DataTable
              columns={eventColumns}
              data={events}
              rowKey={(r) => r.id}
              emptyTitle="No events"
              emptyMessage="No calendar events found."
              emptyIcon={<Calendar size={48} />}
            />
          </Card>
        )}
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Schedule"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Saving..." : "Create"}
              </Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField
              label="Technician ID"
              required
              value={form.technicianId}
              onChange={(e) =>
                setForm({ ...form, technicianId: e.target.value })
              }
            />
            <TextField
              label="Title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              label="Scheduled Date"
              type="date"
              required
              value={form.scheduledDate}
              onChange={(e) =>
                setForm({ ...form, scheduledDate: e.target.value })
              }
            />
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Start Time"
                type="datetime-local"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
              <TextField
                label="End Time"
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
            <TextField
              label="Duration (min)"
              type="number"
              value={form.durationMin}
              onChange={(e) =>
                setForm({ ...form, durationMin: e.target.value })
              }
            />
            <TextField
              label="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
