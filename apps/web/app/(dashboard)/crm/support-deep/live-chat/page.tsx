// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { MessageSquare, Clock, User, Phone, Globe } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

interface ChatSession {
  id: string;
  visitorId: string;
  customerId?: string;
  assignedAgentId?: string;
  status: string;
  source: string;
  pageUrl?: string;
  rating?: number;
  durationSec?: number;
  startedAt: string;
  endedAt?: string;
  tags?: string[];
}

export default function LiveChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet<ChatSession[] | { data: ChatSession[] }>(
        `/api/crm/support/live-chat${filter ? `?status=${filter}` : ""}`,
      );
      setSessions(Array.isArray(res) ? res : res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const endSession = async (id: string) => {
    await apiSend(`/api/crm/support/live-chat/${id}/end`, "POST");
    load();
  };

  const statusBadge: Record<string, "success" | "warning" | "default"> = {
    ACTIVE: "success",
    WAITING: "warning",
    CLOSED: "default",
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Live Chat Sessions"
        description="Monitor and manage active chat sessions"
        breadcrumbs={[
          { label: "Support", href: "/crm/support-deep" },
          { label: "Live Chat" },
        ]}
      />
      <div className="ui-flex ui-gap-2 ui-mb-4 ui-flex-wrap">
        <Button
          variant={!filter ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter(undefined)}
        >
          All
        </Button>
        <Button
          variant={filter === "ACTIVE" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("ACTIVE")}
        >
          Active
        </Button>
        <Button
          variant={filter === "WAITING" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("WAITING")}
        >
          Waiting
        </Button>
        <Button
          variant={filter === "CLOSED" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("CLOSED")}
        >
          Closed
        </Button>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="ui-card-body p-0">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Agent</th>
                  <th>Duration</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <User size={12} /> {s.visitorId.substring(0, 8)}
                    </td>
                    <td>
                      <Badge variant={statusBadge[s.status] || "default"}>
                        {s.status}
                      </Badge>
                    </td>
                    <td>
                      <Globe size={12} /> {s.source}
                    </td>
                    <td className="ui-text-xs">
                      {s.assignedAgentId
                        ? s.assignedAgentId.substring(0, 8)
                        : "-"}
                    </td>
                    <td className="ui-text-xs">
                      {s.durationSec ? (
                        `${Math.round(s.durationSec / 60)}m`
                      ) : (
                        <Clock size={12} />
                      )}
                    </td>
                    <td>{s.rating ? `${s.rating}/5` : "-"}</td>
                    <td>
                      {s.status !== "CLOSED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => endSession(s.id)}
                        >
                          End
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length === 0 && (
              <p className="ui-p-3 ui-text-sm text-muted">
                No chat sessions found
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
