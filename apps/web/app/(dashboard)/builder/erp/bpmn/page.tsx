// @ts-nocheck
"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, Tabs, Card, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  Workflow,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Play,
  Activity,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function BpmnPage() {
  const client = useApiClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("processes");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : "";
      const d = await client.get<any>(`/builder/bpmn/processes${params}`);
      setData(Array.isArray(d) ? d : d.data || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const TABS = [
    { key: "processes", label: "Processes", icon: <Workflow size={16} /> },
    { key: "instances", label: "Instances", icon: <Play size={16} /> },
    { key: "monitoring", label: "Monitoring", icon: <Activity size={16} /> },
    { key: "sla", label: "SLA", icon: <Clock size={16} /> },
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="BPMN Workflow Engine"
        description="BPMN 2.0 compliant process designer with gateways, timer events, escalations, and SLA tracking"
        actions={
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => router.push("/builder/erp/bpmn/new")}
          >
            <PlusCircle size={15} />
            <span>New Process</span>
          </button>
        }
      />
      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />
      {activeTab === "processes" && (
        <>
          <div
            className="ui-flex ui-gap-3"
            style={{ marginBottom: "var(--space-4)" }}
          >
            <div style={{ flex: 1, maxWidth: "28rem", position: "relative" }}>
              <Search size={15} className="ui-input-icon-abs" />
              <input
                className="ui-input"
                style={{ paddingLeft: "var(--space-8)" }}
                type="text"
                placeholder="Search processes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Process Name",
                render: (row: any) => (
                  <div className="ui-hstack-2">
                    <Workflow size={16} className="ui-text-primary" />
                    <span className="font-medium">{row.name}</span>
                  </div>
                ),
              },
              { key: "key", header: "Key" },
              { key: "version", header: "Version" },
              {
                key: "status",
                header: "Status",
                render: (row: any) => (
                  <Badge
                    variant={
                      row.status === "ACTIVE"
                        ? "success"
                        : row.status === "DRAFT"
                          ? "warning"
                          : "default"
                    }
                  >
                    {row.status}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                width: "140px",
                render: (row: any) => (
                  <div
                    className="ui-flex ui-gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`ui-btn ui-btn-secondary ${styles.s8}`}
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className={`ui-btn ui-btn-secondary ${styles.s8}`}
                      title="Execute"
                    >
                      <Play size={13} />
                    </button>
                    <button className={`ui-btn ${styles.s9}`} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              },
            ]}
            data={data}
            loading={loading}
            rowKey={(r: any) => r.id}
            emptyTitle="No BPMN processes yet"
            emptyMessage="Design BPMN 2.0 workflows with gateways, timers, and SLA rules."
          />
        </>
      )}
      {activeTab === "instances" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Active and completed process instances. Track execution state,
              variables, and activity history.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "monitoring" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Real-time process monitoring dashboard with throughput, error
              rates, and bottleneck analysis.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "sla" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              SLA tracking dashboard showing breached, at-risk, and on-track
              processes with escalation rules.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
