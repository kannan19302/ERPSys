"use client";

import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  DataTable,
  StatCardRow,
  type Column,
} from "@unerp/ui";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  FileSignature,
  Clock,
  Ban,
  DollarSign,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface SalesContract {
  id: string;
  contractNumber: string;
  title: string;
  customerName: string;
  status: string;
  value: number;
  currency: string;
  startDate: string;
  endDate: string;
}

const fmtCurrency = (v: number) =>
  `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function SalesContractsPage() {
  const client = useApiClient();
  const [contracts, setContracts] = useState<SalesContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.get<
        SalesContract[] | { data?: SalesContract[] }
      >("/sales/contracts");
      setContracts(Array.isArray(res) ? res : res.data || []);
    } catch {
      setError("Could not load contract data.");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contract?")) return;
    try {
      await client.delete(`/sales/contracts/${id}`);
      fetchData();
    } catch {
      alert("Failed to delete contract.");
    }
  };

  const now = new Date();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const active = contracts.filter((c) => c.status === "ACTIVE");
  const expiringSoon = contracts.filter(
    (c) =>
      c.status === "ACTIVE" &&
      c.endDate &&
      new Date(c.endDate).getTime() - now.getTime() < thirtyDays,
  );
  const expired = contracts.filter((c) => c.status === "EXPIRED");
  const totalValue = active.reduce((s, c) => s + c.value, 0);

  const columns: Column<SalesContract>[] = [
    { key: "contractNumber", header: "Contract No", sortable: true },
    { key: "title", header: "Title", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) =>
        row.status === "ACTIVE" ? (
          <Badge variant="success">Active</Badge>
        ) : row.status === "EXPIRED" ? (
          <Badge variant="danger">Expired</Badge>
        ) : row.status === "DRAFT" ? (
          <Badge variant="default">Draft</Badge>
        ) : (
          <Badge variant="warning">{row.status}</Badge>
        ),
    },
    {
      key: "value",
      header: "Value",
      sortable: true,
      render: (row) => <strong>{fmtCurrency(row.value)}</strong>,
    },
    {
      key: "startDate",
      header: "Start",
      render: (row) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      key: "endDate",
      header: "End",
      render: (row) => new Date(row.endDate).toLocaleDateString(),
    },
    {
      key: "id",
      header: "Actions",
      render: (row) => (
        <div className="ui-hstack-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              alert(`View ${row.contractNumber}`);
            }}
          >
            <Eye size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              alert(`Edit ${row.contractNumber}`);
            }}
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RouteGuard permission="sales.contract.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Sales Contracts"
          description="Manage customer contracts, renewals, and service agreements."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Sales", href: "/sales" },
            { label: "Contracts" },
          ]}
          actions={
            <Button variant="primary" onClick={() => alert("Create Contract")}>
              <Plus size={16} /> New Contract
            </Button>
          }
        />
        {loading ? (
          <div className="ui-center-pad">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <StatCardRow
              stats={[
                {
                  label: "Active Contracts",
                  value: active.length,
                  icon: React.createElement(FileSignature, { size: 16 }),
                  color: "green",
                },
                {
                  label: "Expiring Soon",
                  value: expiringSoon.length,
                  icon: React.createElement(Clock, { size: 16 }),
                  color: "amber",
                },
                {
                  label: "Expired",
                  value: expired.length,
                  icon: React.createElement(Ban, { size: 16 }),
                  color: "red",
                },
                {
                  label: "Total Value",
                  value: fmtCurrency(totalValue),
                  icon: React.createElement(DollarSign, { size: 16 }),
                  color: "blue",
                },
              ]}
            />
            <Card>
              <div className="p-6">
                <DataTable columns={columns} data={contracts} />
              </div>
            </Card>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
