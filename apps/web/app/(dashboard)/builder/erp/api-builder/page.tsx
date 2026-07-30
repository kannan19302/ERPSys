// @ts-nocheck
"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, Tabs, Card, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  Code2,
  PlusCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  Play,
  FileText,
  BarChart3,
} from "lucide-react";

export default function ApiBuilderPage() {
  const client = useApiClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("endpoints");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : "";
      const d = await client.get<any>(`/builder/api-endpoints${params}`);
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
    { key: "endpoints", label: "Endpoints", icon: <Code2 size={16} /> },
    { key: "mappings", label: "Mappings", icon: <FileText size={16} /> },
    { key: "testing", label: "Testing", icon: <Play size={16} /> },
    { key: "docs", label: "Docs", icon: <FileText size={16} /> },
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Low-Code API Builder"
        description="Visual API endpoint builder with request/response mapping, testing, and auto-generated documentation"
        actions={
          <button className="ui-button ui-button-primary">
            <Plus className="w-4 h-4 mr-2 inline" /> New Endpoint
          </button>
        }
      />
      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />
      {activeTab === "endpoints" && (
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
                placeholder="Search endpoints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Endpoint",
                render: (row: any) => (
                  <div className="ui-hstack-2">
                    <Code2 size={16} className="ui-text-primary" />
                    <span className="font-medium">{row.name}</span>
                  </div>
                ),
              },
              {
                key: "method",
                header: "Method",
                render: (row: any) => (
                  <Badge
                    variant={
                      row.method === "GET"
                        ? "info"
                        : row.method === "POST"
                          ? "success"
                          : row.method === "DELETE"
                            ? "danger"
                            : "warning"
                    }
                  >
                    {row.method}
                  </Badge>
                ),
              },
              {
                key: "path",
                header: "Path",
                render: (row: any) => <code>{row.path}</code>,
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
                      className={`ui-btn ui-btn-secondary ${styles.s4}`}
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className={`ui-btn ui-btn-secondary ${styles.s4}`}
                      title="Test"
                    >
                      <Play size={13} />
                    </button>
                    <button className={`ui-btn ${styles.s5}`} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              },
            ]}
            data={data}
            loading={loading}
            rowKey={(r: any) => r.id}
            emptyTitle="No API endpoints yet"
            emptyMessage="Create REST API endpoints with visual mapping and testing."
          />
        </>
      )}
      {activeTab === "mappings" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Configure field-level request/response mappings with transforms
              and default values.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "testing" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Test API endpoints with custom request bodies, headers, and
              assertions.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "docs" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Auto-generated OpenAPI 3.0 documentation for all configured
              endpoints.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
