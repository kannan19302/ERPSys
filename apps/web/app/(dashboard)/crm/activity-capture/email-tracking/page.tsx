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

  const columns: Column[] = [
    { key: "recipient", label: "Recipient", sortable: true },
    {
      key: "eventType",
      label: "Event",
      sortable: true,
      render: (v: string) => (
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
      ),
    },
    {
      key: "linkUrl",
      label: "Link",
      render: (v: string) =>
        v ? (
          <span className="ui-text-truncate" style={{ maxWidth: 200 }}>
            {v}
          </span>
        ) : (
          "-"
        ),
    },
    {
      key: "occurredAt",
      label: "Time",
      sortable: true,
      render: (v: string) => new Date(v).toLocaleString(),
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
        <DataTable columns={columns} data={events} pageSize={25} />
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
