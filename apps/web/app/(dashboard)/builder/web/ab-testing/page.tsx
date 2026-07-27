"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DataTable, Tabs, Card, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  FlaskConical,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Play,
  BarChart3,
  Users,
  PieChart,
} from "lucide-react";

export default function AbTestingPage() {
  const client = useApiClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("tests");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "tests") {
        const params = search ? `?search=${search}` : "";
        const d = await client.get<any>(`/builder/ab-tests${params}`);
        setData(Array.isArray(d) ? d : d.data || []);
      } else if (activeTab === "segments") {
        const d = await client.get<any>("/builder/segments");
        setData(Array.isArray(d) ? d : []);
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
    { key: "tests", label: "Tests", icon: <FlaskConical size={16} /> },
    { key: "segments", label: "Segments", icon: <Users size={16} /> },
    { key: "variants", label: "Variants", icon: <PieChart size={16} /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="A/B Testing & Personalization"
        description="A/B test campaigns, audience segments, variant management, and statistical analysis"
        actions={
          activeTab === "tests" ? (
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => router.push("/builder/web/ab-testing/new")}
            >
              <PlusCircle size={15} />
              <span>New A/B Test</span>
            </button>
          ) : activeTab === "segments" ? (
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => router.push("/builder/web/ab-testing/new-segment")}
            >
              <PlusCircle size={15} />
              <span>New Segment</span>
            </button>
          ) : null
        }
      />
      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />
      {activeTab === "tests" && (
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
                placeholder="Search A/B tests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Test Name",
                render: (row: any) => (
                  <div className="ui-hstack-2">
                    <FlaskConical size={16} className="ui-text-primary" />
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
                key: "goalType",
                header: "Goal",
                render: (row: any) => <code>{row.goalType}</code>,
              },
              {
                key: "trafficAlloc",
                header: "Traffic %",
                render: (row: any) => <span>{row.trafficAlloc}%</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (row: any) => (
                  <Badge
                    variant={
                      row.status === "RUNNING"
                        ? "success"
                        : row.status === "DRAFT"
                          ? "warning"
                          : row.status === "COMPLETED"
                            ? "info"
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
                      title="Start"
                    >
                      <Play size={13} />
                    </button>
                    <button
                      className={`ui-btn ui-btn-secondary ${styles.s1}`}
                      title="Analyze"
                    >
                      <BarChart3 size={13} />
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
            emptyTitle="No A/B tests yet"
            emptyMessage="Create A/B tests with control and variant groups, traffic allocation, and goals."
          />
        </>
      )}
      {activeTab === "segments" && (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Segment Name",
              render: (row: any) => (
                <div className="ui-hstack-2">
                  <Users size={16} className="ui-text-primary" />
                  <span className="font-medium">{row.name}</span>
                </div>
              ),
            },
            { key: "memberCount", header: "Members" },
            {
              key: "status",
              header: "Status",
              render: (row: any) => (
                <Badge
                  variant={row.status === "ACTIVE" ? "success" : "default"}
                >
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
          emptyTitle="No segments yet"
          emptyMessage="Create audience segments with rule-based conditions for personalization."
        />
      )}
      {activeTab === "variants" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Manage A/B test variants with CSS/HTML changes, weight allocation,
              and conversion tracking.
            </p>
          </div>
        </Card>
      )}
      {activeTab === "analytics" && (
        <Card>
          <div className="p-4">
            <p className="ui-text-muted">
              Statistical analysis dashboard showing conversion rates, lift,
              significance, and recommendations.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
