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
  Pagination,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { Plus, Search, Eye, Edit, FileText, DollarSign } from "lucide-react";

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  contractType: string;
  carrier?: { id: string; name: string } | null;
  status: string;
  totalValue: number;
  startDate: string;
  endDate: string;
}
interface Dashboard {
  totalContracts: number;
  activeContracts: number;
  pendingNegotiations: number;
  totalValue: number;
  complianceScore: number;
}

const fmtCurrency = (n: number) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function CarrierContractsPage() {
  const client = useApiClient();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    carrierId: "",
    contractNumber: "",
    contractType: "FTL",
    title: "",
    totalValue: 0,
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get(
        `/supply-chain/carrier-contracts?page=${page}&limit=20`,
      ) as Promise<any>,
      client.get("/supply-chain/carrier-contracts/dashboard") as Promise<any>,
    ])
      .then(([list, dash]) => {
        setContracts(list.data ?? []);
        setPageCount(list.totalPages ?? 1);
        setDashboard(dash);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const columns: Column<Contract>[] = [
    {
      key: "contractNumber",
      header: "Contract #",
      sortable: true,
      render: (r) => <span className="ui-link">{r.contractNumber}</span>,
    },
    { key: "title", header: "Title" },
    {
      key: "carrier",
      header: "Carrier",
      render: (r) => r.carrier?.name ?? "—",
    },
    {
      key: "contractType",
      header: "Type",
      render: (r) => <Badge variant="info">{r.contractType}</Badge>,
    },
    {
      key: "totalValue",
      header: "Value",
      render: (r) => fmtCurrency(r.totalValue),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "startDate",
      header: "Start",
      render: (r) => new Date(r.startDate).toLocaleDateString(),
    },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post("/supply-chain/carrier-contracts", form);
      setCreateOpen(false);
      setPage(1);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <RouteGuard permission="supply-chain.carrier-contracts.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Carrier Contracts"
          description="Manage carrier agreements, rate cards, and spot quotes"
          breadcrumbs={[
            { label: "Supply Chain", href: "/supply-chain" },
            { label: "Carrier Contracts" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> New Contract
            </Button>
          }
        />

        {dashboard && (
          <div className="ui-grid-5 ui-gap-4">
            <Card>
              <div className="ui-stat">
                <span className="ui-stat-label">Total</span>
                <span className="ui-stat-value">
                  {dashboard.totalContracts}
                </span>
              </div>
            </Card>
            <Card>
              <div className="ui-stat">
                <span className="ui-stat-label">Active</span>
                <span className="ui-stat-value">
                  {dashboard.activeContracts}
                </span>
              </div>
            </Card>
            <Card>
              <div className="ui-stat">
                <span className="ui-stat-label">Pending</span>
                <span className="ui-stat-value">
                  {dashboard.pendingNegotiations}
                </span>
              </div>
            </Card>
            <Card>
              <div className="ui-stat">
                <span className="ui-stat-label">Total Value</span>
                <span className="ui-stat-value">
                  {fmtCurrency(dashboard.totalValue)}
                </span>
              </div>
            </Card>
            <Card>
              <div className="ui-stat">
                <span className="ui-stat-label">Compliance</span>
                <span className="ui-stat-value">
                  {dashboard.complianceScore}%
                </span>
              </div>
            </Card>
          </div>
        )}

        <Card padding="none">
          <DataTable
            columns={columns}
            data={contracts}
            loading={loading}
            rowKey={(r) => r.id}
            emptyTitle="No contracts"
            emptyMessage="Create your first carrier contract."
            emptyIcon={<FileText size={48} />}
          />
        </Card>

        {pageCount > 1 && (
          <div className="ui-flex ui-justify-center">
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </div>
        )}

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Carrier Contract"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate as any}
                disabled={saving}
              >
                {saving ? "Saving..." : "Create"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreate} className="ui-stack-4">
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Contract #"
                required
                placeholder="CCT-2026-001"
                value={form.contractNumber}
                onChange={(e) =>
                  setForm({ ...form, contractNumber: e.target.value })
                }
              />
              <TextField
                label="Title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Carrier ID"
                required
                value={form.carrierId}
                onChange={(e) =>
                  setForm({ ...form, carrierId: e.target.value })
                }
              />
              <FormField label="Contract Type">
                <Select
                  value={form.contractType}
                  onChange={(e) =>
                    setForm({ ...form, contractType: e.target.value })
                  }
                >
                  <option value="FTL">Full Truckload</option>
                  <option value="LTL">Less Than Truckload</option>
                  <option value="INTERMODAL">Intermodal</option>
                  <option value="AIR">Air Freight</option>
                  <option value="OCEAN">Ocean Freight</option>
                </Select>
              </FormField>
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
              <TextField
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <TextField
              label="Total Value ($)"
              type="number"
              min={0}
              value={form.totalValue || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  totalValue: parseFloat(e.target.value) || 0,
                })
              }
            />
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
