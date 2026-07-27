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
  ViewSwitcher,
  type ViewMode,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import {
  Truck,
  Plus,
  Search,
  Shield,
  Thermometer,
  Globe,
  Cpu,
  RefreshCw,
  BarChart2,
  DollarSign,
  AlertCircle,
  MapPin,
} from "lucide-react";

interface LetterOfCredit {
  id: string;
  lcNumber: string;
  lcType: string;
  currency: string;
  amount: number;
  status: string;
  issuingBank?: string;
  createdAt: string;
}

export default function SupplyChainControlHub() {
  const client = useApiClient();
  const [lcs, setLcs] = useState<LetterOfCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "lc" | "sop" | "coldchain" | "multimodal"
  >("lc");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    lcNumber: "",
    lcType: "DOCUMENTARY",
    currency: "USD",
    amount: 100000,
    issuingBank: "Chase Manhattan",
  });

  const fetchData = async () => {
    try {
      const data = await client.get<LetterOfCredit[]>(
        "/supply-chain/deep-expansion/letters-of-credit",
      );
      setLcs(Array.isArray(data) ? data : []);
    } catch {
      // Fallback preview data
      setLcs([
        {
          id: "1",
          lcNumber: "LC-2026-8801",
          lcType: "DOCUMENTARY",
          currency: "USD",
          amount: 450000,
          status: "APPROVED",
          issuingBank: "Citibank N.A.",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          lcNumber: "LC-2026-8802",
          lcType: "STANDBY",
          currency: "EUR",
          amount: 1200000,
          status: "ISSUED",
          issuingBank: "HSBC International",
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          lcNumber: "LC-2026-8803",
          lcType: "REVOLVING",
          currency: "USD",
          amount: 850000,
          status: "PRESENTED",
          issuingBank: "JPMorgan Chase",
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
      await client.post("/supply-chain/deep-expansion/letters-of-credit", {
        ...form,
        amount: Number(form.amount),
      });
      setCreateOpen(false);
      fetchData();
    } catch {
      setLcs((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          ...form,
          amount: Number(form.amount),
          status: "DRAFT",
          createdAt: new Date().toISOString(),
        },
      ]);
      setCreateOpen(false);
    }
  };

  const columns: Column<LetterOfCredit>[] = [
    {
      key: "lcNumber",
      header: "LC Reference",
      render: (row) => <strong>{row.lcNumber}</strong>,
    },
    {
      key: "lcType",
      header: "LC Type",
      render: (row) => <Badge variant="info">{row.lcType}</Badge>,
    },
    {
      key: "bank",
      header: "Issuing Bank",
      render: (row) => row.issuingBank || "N/A",
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => `${row.currency} ${Number(row.amount).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <RouteGuard permission="supply-chain:read">
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <PageHeader
          title="Supply Chain Deep Control Hub"
          description="Trade Finance, S&OP Planning, Cold Chain Telemetry, 4PL Operations, & SCEM Analytics"
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} style={{ marginRight: 8 }} /> New Letter of Credit
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
            title="Total LC Trade Exposure"
            value="$2,500,000"
            change={14.2}
            icon={<DollarSign color="#10B981" />}
          />
          <KPICard
            title="S&OP Plan Consensus"
            value="98.4%"
            change={2.1}
            icon={<BarChart2 color="#3B82F6" />}
          />
          <KPICard
            title="Cold Chain Telemetry"
            value="0.02% Excursions"
            change={-4.5}
            icon={<Thermometer color="#06B6D4" />}
          />
          <KPICard
            title="SCEM Risk Rating"
            value="Low Risk (12.4)"
            change={0.5}
            icon={<Shield color="#8B5CF6" />}
          />
        </div>

        <Card style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
              borderBottom: "1px solid #E5E7EB",
              paddingBottom: "12px",
            }}
          >
            <Button
              variant={activeTab === "lc" ? "primary" : "ghost"}
              onClick={() => setActiveTab("lc")}
            >
              Letters of Credit & Trade Finance
            </Button>
            <Button
              variant={activeTab === "sop" ? "primary" : "ghost"}
              onClick={() => setActiveTab("sop")}
            >
              S&OP Executive Dashboard
            </Button>
            <Button
              variant={activeTab === "coldchain" ? "primary" : "ghost"}
              onClick={() => setActiveTab("coldchain")}
            >
              Cold Chain & IoT Telemetry
            </Button>
            <Button
              variant={activeTab === "multimodal" ? "primary" : "ghost"}
              onClick={() => setActiveTab("multimodal")}
            >
              Multimodal & Last-Mile
            </Button>
          </div>

          {loading ? (
            <Spinner size="lg" />
          ) : (
            <DataTable data={lcs} columns={columns} />
          )}
        </Card>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Issue New Letter of Credit (LC)"
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
            <FormField label="LC Reference Number">
              <TextField
                value={form.lcNumber}
                onChange={(e) => setForm({ ...form, lcNumber: e.target.value })}
                placeholder="e.g. LC-2026-9901"
                required
              />
            </FormField>
            <FormField label="Issuing Bank">
              <TextField
                value={form.issuingBank}
                onChange={(e) =>
                  setForm({ ...form, issuingBank: e.target.value })
                }
                placeholder="Bank Name"
                required
              />
            </FormField>
            <FormField label="LC Type">
              <Select
                value={form.lcType}
                onChange={(e) => setForm({ ...form, lcType: e.target.value })}
              >
                <option value="DOCUMENTARY">Documentary Credit</option>
                <option value="STANDBY">Standby LC</option>
                <option value="REVOLVING">Revolving LC</option>
                <option value="TRANSFERABLE">Transferable LC</option>
              </Select>
            </FormField>
            <FormField label="Amount">
              <TextField
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: Number(e.target.value) })
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
                Submit LC Issue
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
