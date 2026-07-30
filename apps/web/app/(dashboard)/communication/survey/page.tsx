// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { useApiClient, RouteGuard } from "@unerp/framework";
import {
  PageHeader,
  Card,
  DataTable,
  Button,
  Badge,
  Spinner,
  KPICard,
  Tabs,
  type Column,
} from "@unerp/ui";
import {
  ClipboardList,
  Plus,
  BarChart3,
  FileText,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

interface Survey {
  id: string;
  title: string;
  status: string;
  surveyType: string;
  responseCount: number;
  createdBy: string;
  publishedAt: string | null;
  _count: { questions: number; responses: number };
}
interface Dashboard {
  totalSurveys: number;
  publishedCount: number;
  draftCount: number;
  totalResponses: number;
  surveysByType: { surveyType: string; _count: number }[];
}

export default function SurveyPage() {
  const client = useApiClient();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("surveys");

  useEffect(() => {
    (async () => {
      try {
        const [srv, dash] = await Promise.all([
          client.get<any>("/communication/surveys"),
          client.get<Dashboard>("/communication/surveys/dashboard"),
        ]);
        setSurveys(srv.data || []);
        setDashboard(dash);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      DRAFT: "default",
      PUBLISHED: "success",
      CLOSED: "warning",
      ARCHIVED: "danger",
    };
    return <Badge variant={m[s] as any}>{s}</Badge>;
  };

  const columns: Column<Survey>[] = [
    {
      key: "title",
      header: "Survey",
      render: (r) => (
        <div>
          <span className="font-medium">{r.title}</span>
          <Badge variant="default" className="ml-2">
            {r.surveyType}
          </Badge>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => statusBadge(r.status) },
    {
      key: "questions",
      header: "Questions",
      render: (r) => r._count?.questions || 0,
    },
    {
      key: "responses",
      header: "Responses",
      render: (r) => r.responseCount || 0,
    },
    {
      key: "publishedAt",
      header: "Published",
      render: (r) =>
        r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="ui-flex ui-gap-1">
          <Button variant="ghost" size="sm">
            <BarChart3 size={14} />
          </Button>
          <Button variant="ghost" size="sm">
            <FileText size={14} />
          </Button>
        </div>
      ),
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="communication.survey.read">
      <div className="ui-page">
        <PageHeader
          title="Surveys & Feedback"
          description={
            dashboard ? `${dashboard.publishedCount} active surveys` : ""
          }
          breadcrumbs={[
            { label: "Communication", href: "/communication" },
            { label: "Surveys" },
          ]}
          actions={
            <Button>
              <Plus size={14} /> New Survey
            </Button>
          }
        />
        {dashboard && (
          <div className="ui-grid-auto mb-6">
            <KPICard
              title="Total Surveys"
              value={dashboard.totalSurveys}
              icon={<ClipboardList size={18} />}
            />
            <KPICard
              title="Published"
              value={dashboard.publishedCount}
              icon={<TrendingUp size={18} />}
              color="var(--color-success)"
            />
            <KPICard
              title="Drafts"
              value={dashboard.draftCount}
              icon={<FileText size={18} />}
              color="var(--color-warning)"
            />
            <KPICard
              title="Responses Collected"
              value={dashboard.totalResponses}
              icon={<MessageSquare size={18} />}
              color="var(--color-info)"
            />
          </div>
        )}
        <Tabs
          tabs={[
            { key: "surveys", label: "Builder" },
            { key: "templates", label: "Templates" },
            { key: "responses", label: "Responses" },
            { key: "analytics", label: "Analytics" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "surveys" && (
          <Card className="mt-4">
            <DataTable
              columns={columns}
              data={surveys}
              rowKey={(r) => r.id}
              emptyTitle="No surveys yet"
              emptyIcon={<ClipboardList size={48} />}
            />
          </Card>
        )}
        {activeTab === "templates" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Survey templates library</p>
          </Card>
        )}
        {activeTab === "responses" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Individual response viewer</p>
          </Card>
        )}
        {activeTab === "analytics" && (
          <Card className="mt-4 p-5">
            <p className="text-muted">Survey analytics dashboard</p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
