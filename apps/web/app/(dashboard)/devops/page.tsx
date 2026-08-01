"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  KPICard,
  Spinner,
  DataTable,
  Button,
  type Column,
} from "@unerp/ui";
import {
  Server,
  Globe,
  GitBranch,
  Activity,
  Plus,
  Eye,
  RotateCcw,
} from "lucide-react";

interface Deployment {
  id: string;
  name: string;
  application: string;
  version: string;
  status: string;
  strategy: string;
  environmentId: string;
  deployedBy: string;
  createdAt: string;
}
interface Environment {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
}
interface Release {
  id: string;
  name: string;
  version: string;
  application: string;
  status: string;
  releaseType: string;
}

export default function DevopsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/devops/deployments")
        .then((r) => r.json())
        .then((d) => setDeployments(d.items || []))
        .catch(() => {}),
      fetch("/api/devops/environments")
        .then((r) => r.json())
        .then(setEnvironments)
        .catch(() => {}),
      fetch("/api/devops/releases")
        .then((r) => r.json())
        .then((d) => setReleases(d.items || []))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );

  const depColumns: Column<Deployment>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "application", header: "App" },
    { key: "version", header: "Version" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={`ui-badge ui-badge-${r.status === "SUCCESS" ? "success" : r.status === "FAILED" ? "danger" : "warning"}`}
        >
          {r.status}
        </span>
      ),
    },
    { key: "strategy", header: "Strategy" },
    { key: "deployedBy", header: "By" },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>DevOps Pipeline</h1>
      </div>
      <div className="ui-grid-4">
        <KPICard
          title="Environments"
          value={environments.length}
          icon={<Globe size={20} />}
        />
        <KPICard
          title="Active Deployments"
          value={deployments.filter((d) => d.status === "IN_PROGRESS").length}
          icon={<Activity size={20} />}
        />
        <KPICard
          title="Total Deployments"
          value={deployments.length}
          icon={<Server size={20} />}
        />
        <KPICard
          title="Releases"
          value={releases.length}
          icon={<GitBranch size={20} />}
        />
      </div>
      <div className="ui-card" style={{ padding: "var(--space-4)" }}>
        <div
          className="ui-flex"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-4)",
          }}
        >
          <h3 className="text-sm font-semibold m-0">Recent Deployments</h3>
          <Button variant="primary" size="sm">
            <Plus size={14} /> New Deployment
          </Button>
        </div>
        <DataTable columns={depColumns} data={deployments.slice(0, 10)} />
      </div>
    </div>
  );
}
