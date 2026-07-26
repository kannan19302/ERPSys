"use client";

import React, { useState, useEffect } from "react";
import { PageHeader, Card, Spinner, Badge, DataTable } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import type { Column } from "@unerp/ui";

function EmailTrackingPage() {
  const client = useApiClient();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client
      .get("/crm/activity-capture/email-tracking")
      .then((res: any) => {
        setEvents(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load tracking events");
        setLoading(false);
      });
  }, []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "recipient", header: "Recipient", sortable: true },
    {
      key: "eventType",
      header: "Event",
      sortable: true,
      render: (row) => {
        const v = (row as any).eventType as string;
        return (
          <Badge
            variant={
              v === "OPENED"
                ? "info"
                : v === "CLICKED"
                  ? "success"
                  : v === "BOUNCED"
                    ? "danger"
                    : "warning"
            }
          >
            {v}
          </Badge>
        );
      },
    },
    {
      key: "linkUrl",
      header: "Link",
      render: (row) => {
        const v = (row as any).linkUrl as string | undefined;
        return v ? (
          <span className="ui-text-truncate" style={{ maxWidth: 200 }}>
            {v}
          </span>
        ) : (
          "-"
        );
      },
    },
    {
      key: "occurredAt",
      header: "Time",
      sortable: true,
      render: (row) =>
        new Date((row as any).occurredAt as string).toLocaleString(),
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  if (error)
    return (
      <div className="ui-center-pad">
        <p className="ui-text-danger">{error}</p>
      </div>
    );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Email Tracking"
        description="Real-time email open, click, and bounce tracking events"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Activity Capture", href: "/crm/activity-capture" },
          { label: "Email Tracking" },
        ]}
      />
      <Card>
        <DataTable columns={columns} data={events} />
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <RouteGuard permission="crm.activity-capture.email-tracking.read">
      <EmailTrackingPage />
    </RouteGuard>
  );
}
