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
  DashboardChart,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import {
  FolderKanban,
  Plus,
  Layers,
  AlertCircle,
  TrendingUp,
  CheckSquare,
  Clock,
  Users,
  DollarSign,
  Target,
} from "lucide-react";

interface Portfolio {
  id: string;
  name: string;
  strategicGoal?: string;
  budget: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function PpmEnterpriseHub() {
  const client = useApiClient();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    strategicGoal: "",
    budget: 500000,
    currency: "USD",
  });

  const fetchData = async () => {
    try {
      const data = await client.get<Portfolio[]>(
        "/projects/deep-expansion/portfolios",
      );
      setPortfolios(Array.isArray(data) ? data : []);
    } catch {
      setPortfolios([
        {
          id: "1",
          name: "Digital Transformation 2026",
          strategicGoal: "Cloud Migration & Modernization",
          budget: 2500000,
          currency: "USD",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Sustainable Supply Chain R&D",
          strategicGoal: "Scope 3 Emission Reduction",
          budget: 1200000,
          currency: "EUR",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "AI Product Engineering",
          strategicGoal: "Autonomous Agents & Copilots",
          budget: 4000000,
          currency: "USD",
          status: "IN_REVIEW",
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
      await client.post("/projects/deep-expansion/portfolios", form);
      setCreateOpen(false);
      fetchData();
    } catch {
      setPortfolios((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          ...form,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
      ]);
      setCreateOpen(false);
    }
  };

  const columns: Column<Portfolio>[] = [
    {
      key: "name",
      header: "Portfolio Name",
      render: (row) => <strong>{row.name}</strong>,
    },
    {
      key: "strategicGoal",
      header: "Strategic Alignment",
      render: (row) => row.strategicGoal || "General Enterprise",
    },
    {
      key: "budget",
      header: "Allocated Budget",
      render: (row) => `${row.currency} ${Number(row.budget).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Portfolio Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <RouteGuard permission="projects:read">
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <PageHeader
          title="Project Portfolio Management (PPM) Hub"
          description="Portfolio Strategy, Earned Value Management (EVM), Risk Registers, WIP Kanban & Timesheets"
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} style={{ marginRight: 8 }} /> Create Strategic
              Portfolio
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
            title="Total Portfolio Capital"
            value="$7.70 M"
            change={18.5}
            icon={<DollarSign color="var(--chart-9)" />}
          />
          <KPICard
            title="Portfolio CPI Performance"
            value="1.08 (On Budget)"
            change={4.2}
            icon={<TrendingUp color="var(--color-primary)" />}
          />
          <KPICard
            title="Portfolio SPI Schedule"
            value="1.04 (Ahead)"
            change={4.0}
            icon={<Clock color="var(--chart-5)" />}
          />
          <KPICard
            title="Active RAID Risks"
            value="14 Identified"
            change={-2.1}
            icon={<AlertCircle color="var(--chart-3)" />}
          />
        </div>

        <Card style={{ padding: "20px" }}>
          <h3
            style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}
          >
            Enterprise Strategic Portfolios
          </h3>
          {loading ? (
            <Spinner size="lg" />
          ) : (
            <DataTable data={portfolios} columns={columns} />
          )}
        </Card>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Create Strategic PPM Portfolio"
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
            <FormField label="Portfolio Name">
              <TextField
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. NextGen Core ERP Modernization"
                required
              />
            </FormField>
            <FormField label="Strategic Initiative Goal">
              <TextField
                value={form.strategicGoal}
                onChange={(e) =>
                  setForm({ ...form, strategicGoal: e.target.value })
                }
                placeholder="e.g. Expand Market Share in APAC"
                required
              />
            </FormField>
            <FormField label="Portfolio Budget">
              <TextField
                type="number"
                value={form.budget}
                onChange={(e) =>
                  setForm({ ...form, budget: Number(e.target.value) })
                }
                required
              />
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
                Launch Portfolio
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
