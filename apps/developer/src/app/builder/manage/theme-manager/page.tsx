"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, Tabs, Card, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  Palette,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  Download,
  Camera,
} from "lucide-react";

export default function ThemeManagerPage() {
  const client = useApiClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("themes");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const d = await client.get<any>("/builder/themes");
      setData(Array.isArray(d) ? d : []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const TABS = [
    { key: "themes", label: "Themes", icon: <Palette size={16} /> },
    { key: "tokens", label: "Tokens", icon: <Camera size={16} /> },
    { key: "preview", label: "Preview", icon: <Eye size={16} /> },
    { key: "export", label: "Export", icon: <Download size={16} /> },
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Theme & Design System Manager"
        description="Create and manage design tokens, CSS variables, and theme configurations"
        actions={
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => router.push("/builder/manage/theme-manager/new")}
          >
            <PlusCircle size={15} />
            <span>New Theme</span>
          </button>
        }
      />
      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />
      {activeTab === "themes" && (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Theme Name",
              render: (row: any) => (
                <div className="ui-hstack-2">
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "var(--radius-sm)",
                      background:
                        (row.colors as any)?.primary || "var(--color-primary)",
                    }}
                  />
                  <span className="font-medium">{row.name}</span>
                  {row.isDefault && <Badge variant="info">Default</Badge>}
                </div>
              ),
            },
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
                    className={`ui-btn ui-btn-secondary ${styles.s1}`}
                    title="Edit"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    className={`ui-btn ui-btn-secondary ${styles.s1}`}
                    title="Preview"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    className={`ui-btn ui-btn-secondary ${styles.s1}`}
                    title="Export"
                  >
                    <Download size={13} />
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
          emptyTitle="No themes yet"
          emptyMessage="Create themes with custom design tokens, colors, typography, and spacing."
        />
      )}
      {activeTab === "tokens" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Manage design tokens across categories: color, spacing,
              typography, radius, shadow, and breakpoint.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "preview" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Preview theme CSS variables with live rendering of UI components.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "export" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Export themes as CSS files, JSON token bundles, or npm packages.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
