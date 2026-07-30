// @ts-nocheck
"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, Tabs, Card, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  Database,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Play,
  BarChart3,
  GitBranch,
} from "lucide-react";

export default function EtlPage() {
  const client = useApiClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sources");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "sources") {
        const d = await client.get<any>("/builder/etl/data-sources");
        setData(Array.isArray(d) ? d : []);
      } else if (activeTab === "pipelines") {
        const params = search ? `?search=${search}` : "";
        const d = await client.get<any>(`/builder/etl/pipelines${params}`);
        setData(Array.isArray(d) ? d : d.data || []);
      } else {
        setData([]);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab, search]);

  const TABS = [
    { key: "sources", label: "Sources", icon: <Database size={16} /> },
    { key: "pipelines", label: "Pipelines", icon: <GitBranch size={16} /> },
    { key: "jobs", label: "Jobs", icon: <Play size={16} /> },
    { key: "monitoring", label: "Monitoring", icon: <BarChart3 size={16} /> },
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="ETL & Data Transformation"
        description="Data source connections, transformation pipelines, mapping rules, scheduled jobs"
        actions={
          activeTab === "sources" ? (
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => router.push("/builder/manage/etl/new-source")}
            >
              <PlusCircle size={15} />
              <span>New Data Source</span>
            </button>
          ) : activeTab === "pipelines" ? (
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => router.push("/builder/manage/etl/new-pipeline")}
            >
              <PlusCircle size={15} />
              <span>New Pipeline</span>
            </button>
          ) : null
        }
      />
      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />
      {activeTab === "sources" && (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (row: any) => (
                <div className="ui-hstack-2">
                  <Database size={16} className="ui-text-primary" />
                  <span className="font-medium">{row.name}</span>
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (row: any) => <Badge variant="info">{row.type}</Badge>,
            },
            {
              key: "status",
              header: "Status",
              render: (row: any) => (
                <Badge variant={row.status === "ACTIVE" ? "success" : "danger"}>
                  {row.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              width: "100px",
              render: (row: any) => (
                <div
                  className="ui-flex ui-gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={`ui-btn ui-btn-secondary ${styles.s1}`}
                    title="Edit"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button className={`ui-btn ${styles.s2}`} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              ),
            },
          ]}
          data={data}
          loading={loading}
          rowKey={(r: any) => r.id}
          emptyTitle="No data sources yet"
          emptyMessage="Connect CSV, REST API, PostgreSQL, MySQL, or S3 data sources."
        />
      )}
      {activeTab === "pipelines" && (
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
                placeholder="Search pipelines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Name",
                render: (row: any) => (
                  <div className="ui-hstack-2">
                    <GitBranch size={16} className="ui-text-primary" />
                    <span className="font-medium">{row.name}</span>
                  </div>
                ),
              },
              {
                key: "schedule",
                header: "Schedule",
                render: (row: any) => <code>{row.schedule || "Manual"}</code>,
              },
              {
                key: "lastRunStatus",
                header: "Last Run",
                render: (row: any) =>
                  row.lastRunStatus ? (
                    <Badge
                      variant={
                        row.lastRunStatus === "COMPLETED" ? "success" : "danger"
                      }
                    >
                      {row.lastRunStatus}
                    </Badge>
                  ) : (
                    <span className="ui-text-muted">Never</span>
                  ),
              },
              {
                key: "status",
                header: "Status",
                render: (row: any) => (
                  <Badge
                    variant={row.status === "ACTIVE" ? "success" : "warning"}
                  >
                    {row.status}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                width: "120px",
                render: (row: any) => (
                  <div
                    className="ui-flex ui-gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`ui-btn ui-btn-secondary ${styles.s1}`}
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className={`ui-btn ui-btn-secondary ${styles.s1}`}
                      title="Execute"
                    >
                      <Play size={13} />
                    </button>
                    <button className={`ui-btn ${styles.s2}`} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              },
            ]}
            data={data}
            loading={loading}
            rowKey={(r: any) => r.id}
            emptyTitle="No pipelines yet"
            emptyMessage="Build transformation pipelines with mapping rules and transforms."
          />
        </>
      )}
      {activeTab === "jobs" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              ETL job run history showing input rows, output rows, errors, and
              duration.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "monitoring" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Pipeline monitoring dashboard with success rates, error trends,
              and performance metrics.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
