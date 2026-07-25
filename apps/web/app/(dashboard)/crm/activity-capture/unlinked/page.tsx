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

  const columns: Column[] = [
    { key: "subject", label: "Subject", sortable: true },
    { key: "fromEmail", label: "From" },
    { key: "toEmail", label: "To" },
    {
      key: "receivedAt",
      label: "Received",
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      key: "id",
      label: "Actions",
      render: (v: string) => (
        <div className="ui-flex-h-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const eid = prompt("Entity ID:");
              if (eid) handleLink(v, "LEAD", eid);
            }}
          >
            <Link2 size={14} /> Link to Lead
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const eid = prompt("Entity ID:");
              if (eid) handleLink(v, "CONTACT", eid);
            }}
          >
            <Link2 size={14} /> Link to Contact
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
        <DataTable columns={columns} data={emails} pageSize={25} />
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
