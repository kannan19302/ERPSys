// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader, Card, Spinner, Badge, Button, DataTable } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { Link2 } from "lucide-react";
import type { Column } from "@unerp/ui";

function UnlinkedEmailsPage() {
  const client = useApiClient();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await client.get("/crm/activity-capture/unlinked");
      setEmails(Array.isArray(res) ? res : []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleLink = async (
    emailId: string,
    entityType: string,
    entityId: string,
  ) => {
    await client.post("/crm/activity-capture/link", {
      emailId,
      entityType,
      entityId,
    });
    load();
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "subject", header: "Subject", sortable: true },
    { key: "fromEmail", header: "From" },
    { key: "toEmail", header: "To" },
    {
      key: "receivedAt",
      header: "Received",
      render: (row) =>
        new Date((row as any).receivedAt as string).toLocaleString(),
    },
    {
      key: "id",
      header: "Actions",
      render: (row) => {
        const id = (row as any).id;
        return (
          <div className="ui-flex-h-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const eid = prompt("Entity ID:");
                if (eid) handleLink(id, "LEAD", eid);
              }}
            >
              <Link2 size={14} /> Link to Lead
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const eid = prompt("Entity ID:");
                if (eid) handleLink(id, "CONTACT", eid);
              }}
            >
              <Link2 size={14} /> Link to Contact
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Unlinked Emails"
        description="Emails not yet linked to CRM records — manually link them to leads, contacts, or customers"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Activity Capture", href: "/crm/activity-capture" },
          { label: "Unlinked Emails" },
        ]}
      />
      <Card>
        <DataTable columns={columns} data={emails} />
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <RouteGuard permission="crm.activity-capture.read">
      <UnlinkedEmailsPage />
    </RouteGuard>
  );
}
