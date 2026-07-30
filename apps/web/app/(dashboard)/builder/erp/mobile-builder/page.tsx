// @ts-nocheck
"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, Tabs, Card, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  Smartphone,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Monitor,
  Bell,
  Upload,
} from "lucide-react";

export default function MobileBuilderPage() {
  const client = useApiClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("apps");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const d = await client.get<any>("/builder/mobile-apps");
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
    { key: "apps", label: "Apps", icon: <Smartphone size={16} /> },
    { key: "screens", label: "Screens", icon: <Monitor size={16} /> },
    { key: "push", label: "Push", icon: <Bell size={16} /> },
    { key: "deploy", label: "Deploy", icon: <Upload size={16} /> },
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Mobile App Builder"
        description="Create, configure, and deploy mobile apps with custom screens and push notifications"
        actions={
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => router.push("/builder/erp/mobile-builder/new")}
          >
            <PlusCircle size={15} />
            <span>New Mobile App</span>
          </button>
        }
      />
      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />
      {activeTab === "apps" && (
        <DataTable
          columns={[
            {
              key: "name",
              header: "App Name",
              render: (row: any) => (
                <div className="ui-hstack-2">
                  <Smartphone size={16} className="ui-text-primary" />
                  <span className="font-medium">{row.name}</span>
                </div>
              ),
            },
            {
              key: "platform",
              header: "Platform",
              render: (row: any) => (
                <Badge variant="info">{row.platform}</Badge>
              ),
            },
            { key: "version", header: "Version" },
            { key: "buildNumber", header: "Build" },
            {
              key: "status",
              header: "Status",
              render: (row: any) => (
                <Badge
                  variant={
                    row.status === "PUBLISHED"
                      ? "success"
                      : row.status === "BUILDING"
                        ? "info"
                        : "warning"
                  }
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
                    title="Deploy"
                  >
                    <Upload size={13} />
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
          emptyTitle="No mobile apps yet"
          emptyMessage="Create mobile apps with form screens, push notifications, and deployment."
        />
      )}
      {activeTab === "screens" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Design mobile screens with form, list, dashboard, and custom
              component types.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "push" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Configure push notification providers (FCM/APNS), templates, and
              topics.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "deploy" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Build and deploy mobile apps for iOS and Android platforms.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
