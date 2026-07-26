"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Badge } from "@unerp/ui";
import {
  BarChart3,
  Users,
  Star,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { apiGet } from "../../_components/api";

interface AgentPerf {
  agentId: string;
  agentName: string;
  casesResolved: number;
  avgResolutionHours: number;
  csatScore: number;
  firstResponseMins: number;
  slaBreachCount: number;
  chatsHandled: number;
}

interface Dashboard {
  period: string;
  totalAgents: number;
  totalCasesResolved: number;
  totalChatsHandled: number;
  averageCsat: number;
  agents: AgentPerf[];
}

export default function AgentPerformancePage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [period, setPeriod] = useState("2026-07");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet(
        `/api/crm/support/agent-performance/dashboard/${period}`,
      );
      setDashboard(
        res &&
          typeof res === "object" &&
          !Array.isArray(res) &&
          Object.keys(res).length > 0
          ? (res as Dashboard)
          : null,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period]);

  return (
    <div className="ui-page">
      <PageHeader
        title="Agent Performance"
        description="Support team KPIs by period"
        breadcrumbs={[
          { label: "Support", href: "/crm/support-deep" },
          { label: "Agent Performance" },
        ]}
      />
      <div className="ui-mb-4">
        <label className="ui-label">Period</label>
        <select
          className="ui-input"
          style={{ maxWidth: 200 }}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="2026-07">July 2026</option>
          <option value="2026-06">June 2026</option>
          <option value="2026-Q2">Q2 2026</option>
          <option value="2026-Q1">Q1 2026</option>
        </select>
      </div>
      {loading ? (
        <Spinner />
      ) : dashboard ? (
        <>
          <div className="ui-grid-4 ui-mb-4">
            <Card>
              <div className="ui-card-body">
                <p className="ui-text-xs text-muted">Agents</p>
                <p className="ui-text-2xl ui-font-bold">
                  {dashboard.totalAgents}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card-body">
                <p className="ui-text-xs text-muted">Cases Resolved</p>
                <p className="ui-text-2xl ui-font-bold">
                  {dashboard.totalCasesResolved}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card-body">
                <p className="ui-text-xs text-muted">Chats Handled</p>
                <p className="ui-text-2xl ui-font-bold">
                  {dashboard.totalChatsHandled}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card-body">
                <p className="ui-text-xs text-muted">Avg CSAT</p>
                <p className="ui-text-2xl ui-font-bold">
                  {dashboard.averageCsat.toFixed(2)}
                </p>
              </div>
            </Card>
          </div>
          <Card>
            <div className="ui-card-body p-0">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Resolved</th>
                    <th>Avg Resolution (h)</th>
                    <th>CSAT</th>
                    <th>First Response (min)</th>
                    <th>SLA Breaches</th>
                    <th>Chats</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.agents.map((a) => (
                    <tr key={a.agentId}>
                      <td>
                        <strong>{a.agentName}</strong>
                      </td>
                      <td>
                        <Badge variant="success">{a.casesResolved}</Badge>
                      </td>
                      <td>{a.avgResolutionHours.toFixed(1)}h</td>
                      <td>
                        <Star size={12} /> {a.csatScore.toFixed(1)}
                      </td>
                      <td>{a.firstResponseMins.toFixed(0)}m</td>
                      <td>{a.slaBreachCount}</td>
                      <td>{a.chatsHandled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <p className="text-muted">No performance data for this period</p>
      )}
    </div>
  );
}
