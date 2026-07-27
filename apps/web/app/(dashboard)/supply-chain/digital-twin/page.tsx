"use client";

import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  type Column,
  Modal,
  FormField,
  TextField,
  Select,
  Spinner,
  Pagination,
  StatusBadge,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { Cpu, GitCompare, BarChart3, Plus } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "twins",
    label: "Digital Twins",
    href: "/supply-chain/digital-twin?tab=twins",
  },
  {
    id: "simulations",
    label: "Simulations",
    href: "/supply-chain/digital-twin?tab=simulations",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/supply-chain/digital-twin?tab=dashboard",
  },
];

interface DigitalTwin {
  id: string;
  twinName: string;
  twinType: string;
  description?: string;
  status: string;
  _count?: { simulations: number };
  createdAt: string;
}
interface Simulation {
  id: string;
  scenarioName: string;
  scenarioType: string;
  status: string;
  results?: any;
  twin?: { twinName: string };
  createdAt: string;
}
interface Dashboard {
  totalTwins: number;
  activeTwins: number;
  totalSimulations: number;
  healthScore: number;
}

export default function DigitalTwinPage() {
  const client = useApiClient();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "twins";

  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    twinName: "",
    twinType: "SUPPLY_CHAIN",
    description: "",
  });
  const [simForm, setSimForm] = useState({
    twinId: "",
    scenarioName: "",
    scenarioType: "DEMAND_SURGE",
    parameters: {},
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get<any>(`/supply-chain/digital-twin?page=${page}&limit=20`),
      client.get<any>("/supply-chain/digital-twin/simulations?limit=20"),
      client.get<Dashboard>("/supply-chain/digital-twin/dashboard"),
    ])
      .then(([list, simList, dash]) => {
        setTwins(list.data ?? []);
        setPageCount(list.totalPages ?? 1);
        setSimulations(simList.data ?? []);
        setDashboard(dash);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const twinColumns: Column<DigitalTwin>[] = [
    {
      key: "twinName",
      header: "Twin Name",
      render: (r) => <span className="ui-link">{r.twinName}</span>,
    },
    {
      key: "twinType",
      header: "Type",
      render: (r) => <Badge variant="info">{r.twinType}</Badge>,
    },
    {
      key: "simulations",
      header: "Simulations",
      render: (r) => r._count?.simulations ?? 0,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post("/supply-chain/digital-twin", form);
      setCreateOpen(false);
      setPage(1);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="supply-chain.control-tower.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Digital Twin / Control Tower Simulation"
          description="Supply chain digital twin, what-if simulation, scenario comparison"
          breadcrumbs={[
            { label: "Supply Chain", href: "/supply-chain" },
            { label: "Digital Twin" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> New Twin
            </Button>
          }
        />

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "twins" && (
          <Card padding="none">
            <DataTable
              columns={twinColumns}
              data={twins}
              loading={loading}
              rowKey={(r) => r.id}
              emptyTitle="No digital twins"
              emptyMessage="Create your first supply chain digital twin."
              emptyIcon={<Cpu size={48} />}
            />
          </Card>
        )}

        {activeTab === "simulations" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Run what-if scenario simulations on digital twin models.
            </p>
          </Card>
        )}

        {activeTab === "dashboard" && dashboard && (
          <div className="ui-grid-4 ui-gap-4">
            <Card>
              <div className="ui-stat">
                <span className="ui-stat-label">Total Twins</span>
                <span className="ui-stat-value">{dashboard.totalTwins}</span>
              </div>
            </Card>
            <Card>
              <div className="ui-stat">
                <span className="ui-stat-label">Active</span>
                <span className="ui-stat-value">{dashboard.activeTwins}</span>
              </div>
            </Card>
            <Card>
              <div className="ui-stat">
                <span className="ui-stat-label">Simulations</span>
                <span className="ui-stat-value">
                  {dashboard.totalSimulations}
                </span>
              </div>
            </Card>
            <Card>
              <div className="ui-stat">
                <span className="ui-stat-label">Health Score</span>
                <span className="ui-stat-value">{dashboard.healthScore}%</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
