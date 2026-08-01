"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  PageHeader,
  Card,
  DataTable,
  type Column,
  Button,
  Modal,
  TextField,
  Select,
  FormField,
  Badge,
  StatusBadge,
  Tabs,
  Spinner,
} from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { Plus, Search, Globe } from "lucide-react";
import Link from "next/link";

interface HsCode {
  id: string;
  code: string;
  description: string;
  category: string | null;
  dutyRate: number | null;
}

interface ImportDeclaration {
  id: string;
  declarationNumber: string;
  status: string;
  supplierName: string | null;
  hsCode: string | null;
  countryOfOrigin: string | null;
  invoiceValue: number | null;
  totalLandedCost: number | null;
  portOfEntry: string | null;
  filedDate: string | null;
  clearanceDate: string | null;
  createdAt: string;
}

export default function GlobalTradePage() {
  const client = useApiClient();
  const [activeTab, setActiveTab] = useState("imports");
  const [imports, setImports] = useState<ImportDeclaration[]>([]);
  const [exports, setExports] = useState<any[]>([]);
  const [hsCodes, setHsCodes] = useState<HsCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<any>({
    declarationNumber: "",
    portOfEntry: "",
    supplierName: "",
    hsCode: "",
    countryOfOrigin: "",
    invoiceValue: 0,
    currency: "USD",
  });
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [imp, exp, hs] = await Promise.all([
        client
          .get<{
            data: ImportDeclaration[];
          }>("/supply-chain/import-declarations")
          .catch(() => ({ data: [] })),
        client
          .get<{ data: any[] }>("/supply-chain/export-declarations")
          .catch(() => ({ data: [] })),
        client
          .get<{ data: HsCode[] }>("/supply-chain/hs-codes")
          .catch(() => ({ data: [] })),
      ]);
      setImports(imp.data || []);
      setExports(exp.data || []);
      setHsCodes(hs.data || []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.declarationNumber) return;
    setCreating(true);
    try {
      const endpoint =
        activeTab === "imports"
          ? "/supply-chain/import-declarations"
          : "/supply-chain/export-declarations";
      await client.post(endpoint, form);
      setCreateOpen(false);
      fetchAll();
    } catch {
      /* empty */
    } finally {
      setCreating(false);
    }
  };

  const impColumns: Column<ImportDeclaration>[] = [
    {
      key: "declarationNumber",
      header: "Declaration #",
      render: (r) => <span className="ui-link">{r.declarationNumber}</span>,
    },
    { key: "supplierName", header: "Supplier" },
    { key: "portOfEntry", header: "Port of Entry" },
    { key: "countryOfOrigin", header: "Origin" },
    {
      key: "invoiceValue",
      header: "Invoice Value",
      render: (r) =>
        r.invoiceValue ? `$${Number(r.invoiceValue).toLocaleString()}` : "—",
    },
    {
      key: "totalLandedCost",
      header: "Landed Cost",
      render: (r) =>
        r.totalLandedCost
          ? `$${Number(r.totalLandedCost).toLocaleString()}`
          : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  if (loading)
    return (
      <div className="ui-page">
        <PageHeader title="Global Trade" />
        <div
          style={{ display: "flex", justifyContent: "center", padding: "4rem" }}
        >
          <Spinner />
        </div>
      </div>
    );

  return (
    <div className="ui-page">
      <PageHeader
        title="Global Trade"
        description="HS codes, import/export declarations, and trade compliance"
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> New Declaration
          </Button>
        }
      />
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: "imports", label: `Import Declarations (${imports.length})` },
          { key: "exports", label: `Export Declarations (${exports.length})` },
          { key: "hsCodes", label: `HS Codes (${hsCodes.length})` },
        ]}
      />
      <Card>
        {activeTab === "imports" && (
          <DataTable
            columns={impColumns}
            data={imports}
            rowKey={(r) => r.id}
            emptyTitle="No import declarations"
            emptyIcon={<Globe size={48} />}
          />
        )}
        {activeTab === "exports" && (
          <DataTable
            columns={impColumns}
            data={exports}
            rowKey={(r: any) => r.id}
            emptyTitle="No export declarations"
            emptyIcon={<Globe size={48} />}
          />
        )}
        {activeTab === "hsCodes" && (
          <DataTable
            columns={
              [
                { key: "code", header: "HS Code" },
                { key: "description", header: "Description" },
                { key: "category", header: "Category" },
                {
                  key: "dutyRate",
                  header: "Duty Rate %",
                  render: (r: HsCode) => (r.dutyRate ? `${r.dutyRate}%` : "—"),
                },
              ] as Column<HsCode>[]
            }
            data={hsCodes}
            rowKey={(r) => r.id}
            emptyTitle="No HS codes"
          />
        )}
      </Card>
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={
          activeTab === "imports"
            ? "Create Import Declaration"
            : "Create Export Declaration"
        }
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate as any}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="ui-stack-4">
          <TextField
            label="Declaration Number"
            required
            value={form.declarationNumber}
            onChange={(e) =>
              setForm({ ...form, declarationNumber: e.target.value })
            }
          />
          <div className="ui-grid-2">
            <TextField
              label="Port of Entry"
              value={form.portOfEntry}
              onChange={(e) =>
                setForm({ ...form, portOfEntry: e.target.value })
              }
            />
            <TextField
              label="Supplier Name"
              value={form.supplierName}
              onChange={(e) =>
                setForm({ ...form, supplierName: e.target.value })
              }
            />
          </div>
          <div className="ui-grid-2">
            <TextField
              label="HS Code"
              value={form.hsCode}
              onChange={(e) => setForm({ ...form, hsCode: e.target.value })}
            />
            <TextField
              label="Country of Origin"
              value={form.countryOfOrigin}
              onChange={(e) =>
                setForm({ ...form, countryOfOrigin: e.target.value })
              }
            />
          </div>
          <TextField
            label="Invoice Value"
            type="number"
            value={form.invoiceValue || ""}
            onChange={(e) =>
              setForm({
                ...form,
                invoiceValue: parseFloat(e.target.value) || 0,
              })
            }
          />
        </form>
      </Modal>
    </div>
  );
}
