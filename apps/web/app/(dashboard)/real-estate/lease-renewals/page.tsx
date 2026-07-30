// @ts-nocheck
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
  KPICard,
  useToast,
  Select,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { FileText, Plus, CheckCircle, XCircle, TrendingUp } from "lucide-react";

interface LeaseRenewal {
  id: string;
  leaseId: string;
  propertyId: string;
  tenantName: string;
  tenantEmail?: string;
  currentRent: number;
  proposedRent: number;
  rentChangePercent: number;
  renewalTermMonths: number;
  currentEndDate: string;
  proposedStartDate: string;
  proposedEndDate: string;
  escalationRate: number;
  status: string;
  notes?: string;
  createdAt: string;
  lease?: {
    id: string;
    tenantName: string;
    rentAmount: number;
    status: string;
  };
  property?: { id: string; name: string };
}

interface RentEscalation {
  id: string;
  leaseId: string;
  propertyId: string;
  scheduleName: string;
  escalationType: string;
  escalationRate: number;
  frequencyMonths: number;
  nextEscalationDate?: string;
  lastEscalationDate?: string;
  baseRent: number;
  currentRent: number;
  status: string;
  lease?: { id: string; tenantName: string };
  property?: { id: string; name: string };
}

export default function LeaseRenewalsPage() {
  const client = useApiClient();
  const { error: notifyError, success } = useToast();
  const [renewals, setRenewals] = useState<LeaseRenewal[]>([]);
  const [escalations, setEscalations] = useState<RentEscalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"renewals" | "escalations">("renewals");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    leaseId: "",
    propertyId: "",
    tenantName: "",
    currentRent: "0",
    proposedRent: "0",
    renewalTermMonths: "12",
    currentEndDate: "",
    proposedStartDate: "",
    proposedEndDate: "",
    escalationRate: "0",
    notes: "",
  });

  const loadData = async () => {
    try {
      const r = await client.get<{ data?: LeaseRenewal[] }>(
        "/ext/real-estate/lease-renewals?limit=100",
      );
      setRenewals(Array.isArray(r) ? r : r.data || []);
      const e = await client.get<RentEscalation[]>(
        "/ext/real-estate/rent-escalations",
      );
      setEscalations(Array.isArray(e) ? e : []);
    } catch (err) {
      notifyError(
        "Failed to load data",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client, notifyError]);

  const handleCreate = async () => {
    if (!form.leaseId || !form.propertyId || !form.tenantName) return;
    setCreating(true);
    try {
      await client.post("/ext/real-estate/lease-renewals", {
        ...form,
        currentRent: parseFloat(form.currentRent),
        proposedRent: parseFloat(form.proposedRent),
        renewalTermMonths: parseInt(form.renewalTermMonths),
        escalationRate: parseFloat(form.escalationRate),
        rentChangePercent:
          ((parseFloat(form.proposedRent) - parseFloat(form.currentRent)) /
            parseFloat(form.currentRent)) *
          100,
        currentEndDate: new Date(form.currentEndDate).toISOString(),
        proposedStartDate: new Date(form.proposedStartDate).toISOString(),
        proposedEndDate: new Date(form.proposedEndDate).toISOString(),
      });
      setCreateOpen(false);
      setForm({
        leaseId: "",
        propertyId: "",
        tenantName: "",
        currentRent: "0",
        proposedRent: "0",
        renewalTermMonths: "12",
        currentEndDate: "",
        proposedStartDate: "",
        proposedEndDate: "",
        escalationRate: "0",
        notes: "",
      });
      await loadData();
    } catch (err) {
      notifyError(
        "Failed to create renewal",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await client.post(`/ext/real-estate/lease-renewals/${id}/approve`, {});
      success("Approved", "");
      await loadData();
    } catch {
      notifyError("Failed to approve", "");
    }
  };

  const handleExecute = async (id: string) => {
    try {
      await client.post(`/ext/real-estate/lease-renewals/${id}/execute`, {});
      success("Executed", "");
      await loadData();
    } catch {
      notifyError("Failed to execute", "");
    }
  };

  const handleApplyEscalation = async (id: string) => {
    try {
      await client.post(`/ext/real-estate/rent-escalations/${id}/apply`, {});
      success("Escalation applied", "");
      await loadData();
    } catch {
      notifyError("Failed to apply escalation", "");
    }
  };

  const renewalsCols: Column<LeaseRenewal>[] = [
    {
      key: "tenant",
      header: "Tenant",
      render: (r) => (
        <div>
          <span className="ui-heading-sm">{r.tenantName}</span>
          <div className="ui-text-xs-tertiary">
            {r.property?.name || r.propertyId.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: "rent",
      header: "Rent",
      render: (r) => (
        <span>
          ${Number(r.currentRent).toLocaleString()} → $
          {Number(r.proposedRent).toLocaleString()} (
          <Badge variant={r.rentChangePercent > 0 ? "warning" : "success"}>
            {r.rentChangePercent > 0 ? "+" : ""}
            {r.rentChangePercent.toFixed(1)}%
          </Badge>
          )
        </span>
      ),
    },
    {
      key: "term",
      header: "Term",
      render: (r) => <span>{r.renewalTermMonths} mo</span>,
    },
    {
      key: "dates",
      header: "Period",
      render: (r) => (
        <span className="text-xs">
          {new Date(r.proposedStartDate).toLocaleDateString()} -{" "}
          {new Date(r.proposedEndDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge
          variant={
            r.status === "EXECUTED"
              ? "success"
              : r.status === "APPROVED"
                ? "info"
                : r.status === "DECLINED"
                  ? "danger"
                  : r.status === "SENT" || r.status === "NEGOTIATING"
                    ? "warning"
                    : "default"
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
        <div className="flex gap-1">
          {r.status === "DRAFT" || r.status === "NEGOTIATING" ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleApprove(r.id)}
            >
              <CheckCircle size={14} /> Approve
            </Button>
          ) : null}
          {r.status === "APPROVED" ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleExecute(r.id)}
            >
              Execute
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const escalationCols: Column<RentEscalation>[] = [
    {
      key: "name",
      header: "Schedule",
      render: (r) => (
        <div>
          <span className="ui-heading-sm">{r.scheduleName}</span>
          <div className="ui-text-xs-tertiary">
            {r.lease?.tenantName || r.leaseId.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) => <Badge variant="info">{r.escalationType}</Badge>,
    },
    {
      key: "rate",
      header: "Rate",
      render: (r) => (
        <span>
          {r.escalationType === "PERCENTAGE"
            ? `${r.escalationRate}%`
            : `$${r.escalationRate}`}
        </span>
      ),
    },
    {
      key: "rent",
      header: "Rent",
      render: (r) => (
        <span>
          ${Number(r.baseRent).toLocaleString()} → $
          {Number(r.currentRent).toLocaleString()}
        </span>
      ),
    },
    {
      key: "next",
      header: "Next Escalation",
      render: (r) => (
        <span className="text-xs">
          {r.nextEscalationDate
            ? new Date(r.nextEscalationDate).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge
          variant={
            r.status === "ACTIVE"
              ? "success"
              : r.status === "PAUSED"
                ? "warning"
                : "default"
          }
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "ACTIVE" &&
        r.nextEscalationDate &&
        new Date(r.nextEscalationDate) <= new Date() ? (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleApplyEscalation(r.id)}
          >
            <TrendingUp size={14} /> Apply
          </Button>
        ) : null,
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  const pendingCount = renewals.filter(
    (r) => r.status === "DRAFT" || r.status === "NEGOTIATING",
  ).length;
  const activeEscalations = escalations.filter(
    (r) => r.status === "ACTIVE",
  ).length;

  return (
    <RouteGuard permission="real-estate.lease-renewal.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Lease Renewals"
          description="Lease renewal management and rent escalation schedules"
          breadcrumbs={[
            { label: "Real Estate", href: "/real-estate" },
            { label: "Lease Renewals" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-2" /> New Renewal
            </Button>
          }
        />
        <div className="ui-grid-auto">
          <KPICard
            title="Pending Renewals"
            value={pendingCount}
            icon={<FileText size={18} />}
            color="var(--color-warning)"
          />
          <KPICard
            title="Active Escalations"
            value={activeEscalations}
            icon={<TrendingUp size={18} />}
            color="var(--color-info)"
          />
          <KPICard
            title="Total Renewals"
            value={renewals.length}
            icon={<FileText size={18} />}
            color="var(--color-primary)"
          />
        </div>
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === "renewals" ? "primary" : "secondary"}
            onClick={() => setTab("renewals")}
          >
            Renewals
          </Button>
          <Button
            variant={tab === "escalations" ? "primary" : "secondary"}
            onClick={() => setTab("escalations")}
          >
            Rent Escalations
          </Button>
        </div>
        {tab === "renewals" ? (
          <Card padding="none">
            <DataTable
              columns={renewalsCols}
              data={renewals}
              rowKey={(r) => r.id}
              emptyTitle="No renewals"
              emptyMessage="Create lease renewals."
              emptyIcon={<FileText size={48} />}
            />
          </Card>
        ) : (
          <Card padding="none">
            <DataTable
              columns={escalationCols}
              data={escalations}
              rowKey={(r) => r.id}
              emptyTitle="No escalations"
              emptyMessage="Create rent escalation schedules."
              emptyIcon={<TrendingUp size={48} />}
            />
          </Card>
        )}
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Lease Renewal"
          size="lg"
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
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Lease ID"
                required
                value={form.leaseId}
                onChange={(e) => setForm({ ...form, leaseId: e.target.value })}
              />
              <TextField
                label="Property ID"
                required
                value={form.propertyId}
                onChange={(e) =>
                  setForm({ ...form, propertyId: e.target.value })
                }
              />
            </div>
            <TextField
              label="Tenant Name"
              required
              value={form.tenantName}
              onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
            />
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Current Rent ($)"
                type="number"
                value={form.currentRent}
                onChange={(e) =>
                  setForm({ ...form, currentRent: e.target.value })
                }
              />
              <TextField
                label="Proposed Rent ($)"
                type="number"
                value={form.proposedRent}
                onChange={(e) =>
                  setForm({ ...form, proposedRent: e.target.value })
                }
              />
            </div>
            <div className="ui-grid-3 ui-gap-3">
              <TextField
                label="Term (months)"
                type="number"
                value={form.renewalTermMonths}
                onChange={(e) =>
                  setForm({ ...form, renewalTermMonths: e.target.value })
                }
              />
              <TextField
                label="Escalation Rate (%)"
                type="number"
                value={form.escalationRate}
                onChange={(e) =>
                  setForm({ ...form, escalationRate: e.target.value })
                }
              />
            </div>
            <div className="ui-grid-3 ui-gap-3">
              <TextField
                label="Current End Date"
                type="date"
                value={form.currentEndDate}
                onChange={(e) =>
                  setForm({ ...form, currentEndDate: e.target.value })
                }
              />
              <TextField
                label="Proposed Start"
                type="date"
                value={form.proposedStartDate}
                onChange={(e) =>
                  setForm({ ...form, proposedStartDate: e.target.value })
                }
              />
              <TextField
                label="Proposed End"
                type="date"
                value={form.proposedEndDate}
                onChange={(e) =>
                  setForm({ ...form, proposedEndDate: e.target.value })
                }
              />
            </div>
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
