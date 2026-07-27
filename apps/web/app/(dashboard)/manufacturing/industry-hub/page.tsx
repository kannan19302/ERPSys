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
  Cpu,
  Activity,
  ShieldCheck,
  Wrench,
  Settings,
  Plus,
  BarChart2,
  Zap,
  AlertTriangle,
  Layers,
} from "lucide-react";

interface SpcChart {
  id: string;
  name: string;
  chartType: string;
  ucl: number;
  lcl: number;
  nominalValue: number;
  status: string;
  createdAt: string;
}

export default function ManufacturingIndustryHub() {
  const client = useApiClient();
  const [charts, setCharts] = useState<SpcChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    chartType: "X_BAR_R",
    ucl: 105.5,
    lcl: 94.5,
    nominalValue: 100.0,
  });

  const fetchData = async () => {
    try {
      const data = await client.get<SpcChart[]>(
        "/manufacturing/deep-expansion/spc/charts",
      );
      setCharts(Array.isArray(data) ? data : []);
    } catch {
      setCharts([
        {
          id: "1",
          name: "CNC Diameter Process Control (X-Bar)",
          chartType: "X_BAR_R",
          nominalValue: 50.0,
          ucl: 50.25,
          lcl: 49.75,
          status: "IN_CONTROL",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Injection Pressure Monitoring (P-Chart)",
          chartType: "P_CHART",
          nominalValue: 1200.0,
          ucl: 1250.0,
          lcl: 1150.0,
          status: "IN_CONTROL",
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Solder Paste Thickness (C-Chart)",
          chartType: "C_CHART",
          nominalValue: 150.0,
          ucl: 165.0,
          lcl: 135.0,
          status: "WARNING",
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
      await client.post("/manufacturing/deep-expansion/spc/charts", form);
      setCreateOpen(false);
      fetchData();
    } catch {
      setCharts((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          ...form,
          status: "IN_CONTROL",
          createdAt: new Date().toISOString(),
        },
      ]);
      setCreateOpen(false);
    }
  };

  const columns: Column<SpcChart>[] = [
    {
      key: "name",
      header: "Control Chart Name",
      render: (row) => <strong>{row.name}</strong>,
    },
    {
      key: "chartType",
      header: "SPC Chart Type",
      render: (row) => <Badge variant="info">{row.chartType}</Badge>,
    },
    {
      key: "nominalValue",
      header: "Nominal Target",
      render: (row) => row.nominalValue.toFixed(2),
    },
    {
      key: "limits",
      header: "Control Limits [LCL - UCL]",
      render: (row) => `${row.lcl.toFixed(2)} — ${row.ucl.toFixed(2)}`,
    },
    {
      key: "status",
      header: "Process Control Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <RouteGuard permission="manufacturing:read">
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <PageHeader
          title="Industry 4.0 & Smart Manufacturing Hub"
          description="Master Production Schedule, Statistical Process Control (SPC), FMEA, Job Costing & Machine OEE"
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} style={{ marginRight: 8 }} /> Create SPC Chart
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
            title="Plant OEE (Overall Efficiency)"
            value="89.4%"
            change={3.8}
            icon={<Cpu color="#10B981" />}
          />
          <KPICard
            title="SPC Cpk Capability"
            value="1.67 (Six Sigma)"
            change={1.2}
            icon={<Activity color="#3B82F6" />}
          />
          <KPICard
            title="First Pass Yield (FPY)"
            value="99.2%"
            change={0.5}
            icon={<ShieldCheck color="#8B5CF6" />}
          />
          <KPICard
            title="MTBF Machine Reliability"
            value="482 Hours"
            change={2.4}
            icon={<Wrench color="#F59E0B" />}
          />
        </div>

        <Card style={{ padding: "20px" }}>
          <h3
            style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}
          >
            Active SPC Control Charts & Real-time Telemetry
          </h3>
          {loading ? (
            <Spinner size="lg" />
          ) : (
            <DataTable data={charts} columns={columns} />
          )}
        </Card>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Create SPC Control Chart"
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
            <FormField label="Chart Name">
              <TextField
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Line 1 Pressure X-Bar Chart"
                required
              />
            </FormField>
            <FormField label="Chart Type">
              <Select
                value={form.chartType}
                onChange={(e) =>
                  setForm({ ...form, chartType: e.target.value })
                }
              >
                <option value="X_BAR_R">X-Bar & R Chart</option>
                <option value="X_BAR_S">X-Bar & S Chart</option>
                <option value="P_CHART">
                  P-Chart (Fraction Nonconforming)
                </option>
                <option value="C_CHART">C-Chart (Count of Defects)</option>
              </Select>
            </FormField>
            <FormField label="Nominal Value">
              <TextField
                type="number"
                step="0.01"
                value={form.nominalValue}
                onChange={(e) =>
                  setForm({ ...form, nominalValue: Number(e.target.value) })
                }
                required
              />
            </FormField>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <FormField label="Lower Control Limit (LCL)">
                <TextField
                  type="number"
                  step="0.01"
                  value={form.lcl}
                  onChange={(e) =>
                    setForm({ ...form, lcl: Number(e.target.value) })
                  }
                  required
                />
              </FormField>
              <FormField label="Upper Control Limit (UCL)">
                <TextField
                  type="number"
                  step="0.01"
                  value={form.ucl}
                  onChange={(e) =>
                    setForm({ ...form, ucl: Number(e.target.value) })
                  }
                  required
                />
              </FormField>
            </div>
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
                Deploy SPC Chart
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
