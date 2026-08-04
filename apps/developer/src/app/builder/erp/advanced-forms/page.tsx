"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, Tabs, Card, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  FileCode2,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  Copy,
  Layers,
  BarChart3,
  GitBranch,
} from "lucide-react";

export default function AdvancedFormsPage() {
  const client = useApiClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("forms");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : "";
      const d = await client.get<any>(`/builder/advanced-forms${params}`);
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
    { key: "forms", label: "Forms", icon: <FileCode2 size={16} /> },
    { key: "conditions", label: "Conditions", icon: <Layers size={16} /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
    { key: "versions", label: "Versions", icon: <GitBranch size={16} /> },
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Advanced Form Builder"
        description="Conditional logic, calculated fields, multi-page forms, analytics, and versioning"
        actions={
          <div className="ui-flex ui-gap-2">
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => router.push("/builder/erp/advanced-forms/new")}
            >
              <PlusCircle size={15} />
              <span>New Advanced Form</span>
            </button>
          </div>
        }
      />

      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

      {activeTab === "forms" && (
        <>
          <div className={styles.s7}>
            <div className={styles.s8}>
              <Search size={15} className="ui-input-icon-abs" />
              <input
                className={`ui-input ${styles.s9}`}
                type="text"
                placeholder="Search advanced forms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={[
              {
                key: "name",
                header: "Form Name",
                render: (row: any) => (
                  <div className="ui-hstack-2">
                    <div className={styles.s12}>
                      <FileCode2 size={13} className="ui-text-primary" />
                    </div>
                    <span className="font-medium">{row.name}</span>
                  </div>
                ),
              },
              {
                key: "formType",
                header: "Type",
                render: (row: any) => (
                  <Badge variant="info">{row.formType}</Badge>
                ),
              },
              { key: "version", header: "Version" },
              {
                key: "status",
                header: "Status",
                render: (row: any) => (
                  <Badge
                    variant={row.status === "PUBLISHED" ? "success" : "warning"}
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
                      className={`ui-btn ui-btn-secondary ${styles.s16}`}
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className={`ui-btn ui-btn-secondary ${styles.s16}`}
                      title="Preview"
                    >
                      <Eye size={13} />
                    </button>
                    <button className={`ui-btn ${styles.s17}`} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              },
            ]}
            data={data}
            loading={loading}
            rowKey={(r: any) => r.id}
            onRowClick={(r: any) =>
              router.push(`/builder/erp/advanced-forms/${r.id}`)
            }
            emptyTitle="No advanced forms yet"
            emptyMessage="Create conditional, multi-page forms with calculated fields."
          />
        </>
      )}

      {activeTab === "conditions" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Conditional logic engine. Configure show/hide, enable/disable, and
              value-set rules per field.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "analytics" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Form analytics dashboard showing views, starts, completions,
              drop-off rates, and field-level stats.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "versions" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Version history for this form. Compare, restore, or diff previous
              versions.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
