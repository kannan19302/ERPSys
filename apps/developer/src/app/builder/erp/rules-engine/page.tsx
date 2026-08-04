"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, Tabs, Card, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  Table2,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Play,
  BarChart3,
  GitBranch,
} from "lucide-react";

export default function RulesEnginePage() {
  const client = useApiClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("decision-tables");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : "";
      const d = await client.get<any>(`/builder/decision-tables${params}`);
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
    {
      key: "decision-tables",
      label: "Decision Tables",
      icon: <Table2 size={16} />,
    },
    { key: "rules", label: "Rules", icon: <GitBranch size={16} /> },
    { key: "evaluation", label: "Evaluation", icon: <Play size={16} /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Business Rules Engine"
        description="Decision tables, rule sets, rule evaluation, versioning, and analytics"
        actions={
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => router.push("/builder/erp/rules-engine/new")}
          >
            <PlusCircle size={15} />
            <span>New Decision Table</span>
          </button>
        }
      />
      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />
      {activeTab === "decision-tables" && (
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
                placeholder="Search decision tables..."
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
                    <Table2 size={16} className="ui-text-primary" />
                    <span className="font-medium">{row.name}</span>
                  </div>
                ),
              },
              {
                key: "hitPolicy",
                header: "Hit Policy",
                render: (row: any) => (
                  <Badge variant="info">{row.hitPolicy}</Badge>
                ),
              },
              { key: "version", header: "Version" },
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
                      title="Evaluate"
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
            emptyTitle="No decision tables yet"
            emptyMessage="Create decision tables with hit policies (FIRST, ANY, ALL, PRIORITY)."
          />
        </>
      )}
      {activeTab === "rules" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Rule sets with DSL-based conditions and actions. Supports
              versioning and evaluation logging.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "evaluation" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Test rule evaluation with sample inputs. View matched rules and
              output values.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "analytics" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Rule analytics: evaluation counts, match rates, performance
              metrics.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
