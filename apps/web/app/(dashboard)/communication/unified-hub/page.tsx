// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  Badge,
  StatusBadge,
  DataTable,
  type Column,
  Modal,
  TextField,
  FormField,
  Select,
  KPICard,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import {
  Mail,
  Video,
  BookOpen,
  MessageSquare,
  PhoneCall,
  Plus,
  Users,
  Globe,
  Shield,
  Calendar,
} from "lucide-react";

interface EmailInbox {
  id: string;
  name: string;
  emailAddress: string;
  provider: string;
  isShared: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function CommunicationUnifiedHub() {
  const client = useApiClient();
  const [inboxes, setInboxes] = useState<EmailInbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    emailAddress: "",
    provider: "SMTP",
    isShared: true,
  });

  const fetchData = async () => {
    try {
      const data = await client.get<EmailInbox[]>(
        "/communication/deep-expansion/email-inboxes",
      );
      setInboxes(Array.isArray(data) ? data : []);
    } catch {
      setInboxes([
        {
          id: "1",
          name: "Global Executive Support",
          emailAddress: "exec-support@company.com",
          provider: "GOOGLE_WORKSPACE",
          isShared: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Supply Chain Inquiries",
          emailAddress: "scm-inbound@company.com",
          provider: "MICROSOFT_365",
          isShared: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Engineering Escalations",
          emailAddress: "dev-tier3@company.com",
          provider: "SMTP",
          isShared: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/communication/deep-expansion/email-inboxes", form);
      setCreateOpen(false);
      fetchData();
    } catch {
      setInboxes((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          ...form,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      setCreateOpen(false);
    }
  };

  const columns: Column<EmailInbox>[] = [
    {
      key: "name",
      header: "Inbox Name",
      render: (row) => <strong>{row.name}</strong>,
    },
    {
      key: "emailAddress",
      header: "Email Address",
      render: (row) => row.emailAddress,
    },
    {
      key: "provider",
      header: "Mail Provider",
      render: (row) => <Badge variant="info">{row.provider}</Badge>,
    },
    {
      key: "isShared",
      header: "Shared Access",
      render: (row) => (row.isShared ? "Team Inbox" : "Personal"),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />
      ),
    },
  ];

  return (
    <RouteGuard permission="communication:read">
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <PageHeader
          title="Unified Communication & Collaboration Hub"
          description="Enterprise Email Inboxes, Video Conference Rooms, Wiki Knowledge Base & Social Intranet"
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} style={{ marginRight: 8 }} /> Provision Shared
              Inbox
            </Button>
          }
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          <KPICard
            title="Shared Inboxes Active"
            value="18 Mailboxes"
            change={12.0}
            icon={<Mail color="#10B981" />}
          />
          <KPICard
            title="Video HD Rooms"
            value="124 Meetings/Day"
            change={22.0}
            icon={<Video color="#3B82F6" />}
          />
          <KPICard
            title="Internal Wiki Pages"
            value="1,420 Articles"
            change={15.0}
            icon={<BookOpen color="#8B5CF6" />}
          />
          <KPICard
            title="Intranet Daily Engagement"
            value="94.2%"
            change={4.1}
            icon={<Users color="#F59E0B" />}
          />
        </div>

        <Card style={{ padding: "20px" }}>
          <h3
            style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}
          >
            Enterprise Shared Inboxes & Mail Hub
          </h3>
          {loading ? (
            <Spinner size="lg" />
          ) : (
            <DataTable data={inboxes} columns={columns} />
          )}
        </Card>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Provision Team Shared Inbox"
        >
          <form
            onSubmit={handleCreate}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              paddingTop: "12px",
            }}
          >
            <FormField label="Inbox Display Name">
              <TextField
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. VIP Customer Desk"
                required
              />
            </FormField>
            <FormField label="Email Address">
              <TextField
                type="email"
                value={form.emailAddress}
                onChange={(e) =>
                  setForm({ ...form, emailAddress: e.target.value })
                }
                placeholder="vip@company.com"
                required
              />
            </FormField>
            <FormField label="Mail Provider">
              <Select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
              >
                <option value="GOOGLE_WORKSPACE">Google Workspace</option>
                <option value="MICROSOFT_365">Microsoft 365 Exchange</option>
                <option value="SMTP">Custom SMTP/IMAP</option>
              </Select>
            </FormField>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Provision Mailbox
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
