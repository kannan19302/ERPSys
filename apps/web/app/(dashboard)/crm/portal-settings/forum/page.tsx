// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import {
  MessageSquare,
  Plus,
  Lock,
  Trash2,
  CheckCircle,
  MessageCircle,
  Eye,
} from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

interface Topic {
  id: string;
  customerId: string;
  title: string;
  content: string;
  category?: string;
  status: string;
  viewCount: number;
  isPinned: boolean;
  createdBy: string;
  createdAt: string;
  _count?: { replies: number };
}

export default function PortalForumPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    title: "",
    content: "",
    category: "GENERAL",
  });
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet("/api/crm/portal/forum/topics?limit=50");
      setTopics(Array.isArray(res) ? res : (res as any)?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createTopic = async () => {
    await apiSend("/api/crm/portal/forum/topics", "POST", form);
    setShowForm(false);
    setForm({ customerId: "", title: "", content: "", category: "GENERAL" });
    load();
  };

  const closeTopic = async (id: string) => {
    await apiSend(`/api/crm/portal/forum/topics/${id}/close`, "POST");
    load();
  };

  const loadReplies = async (topicId: string) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
      return;
    }
    try {
      const res = await apiGet(
        `/api/crm/portal/forum/topics/${topicId}/replies`,
      );
      setReplies((prev) => ({
        ...prev,
        [topicId]: Array.isArray(res) ? res : (res as any)?.data || [],
      }));
      setExpandedTopic(topicId);
    } catch {
      setExpandedTopic(null);
    }
  };

  const markAnswer = async (replyId: string) => {
    await apiSend(
      `/api/crm/portal/forum/replies/${replyId}/mark-answer`,
      "POST",
    );
    if (expandedTopic) loadReplies(expandedTopic);
  };

  const statusBadge: Record<string, "success" | "warning" | "default"> = {
    OPEN: "warning",
    ANSWERED: "success",
    CLOSED: "default",
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Portal Forum"
        description="Manage community forum topics and replies"
        breadcrumbs={[
          { label: "Portal Settings", href: "/crm/portal-settings" },
          { label: "Forum" },
        ]}
      />
      <div className="ui-mb-4">
        <Button onClick={() => setShowForm(true)}>
          <Plus size={14} /> New Topic
        </Button>
      </div>

      {showForm && (
        <Card className="ui-mb-4">
          <div className="ui-card-body">
            <h3 className="ui-card-title">New Forum Topic</h3>
            <div className="ui-form-group">
              <label className="ui-label">Customer ID</label>
              <input
                className="ui-input"
                value={form.customerId}
                onChange={(e) =>
                  setForm({ ...form, customerId: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Title</label>
              <input
                className="ui-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Content</label>
              <textarea
                className="ui-input"
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Category</label>
              <select
                className="ui-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="GENERAL">General</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="BUG_REPORT">Bug Report</option>
                <option value="QUESTION">Question</option>
              </select>
            </div>
            <div className="ui-flex ui-gap-2">
              <Button onClick={createTopic}>Create</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="ui-card-body p-0">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Replies</th>
                  <th>Views</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr>
                      <td>
                        <strong>
                          {t.isPinned && "📌 "}
                          {t.title}
                        </strong>
                      </td>
                      <td className="ui-text-xs">
                        {t.customerId.substring(0, 8)}
                      </td>
                      <td>
                        <Badge>{t.category || "General"}</Badge>
                      </td>
                      <td>
                        <Badge variant={statusBadge[t.status] || "default"}>
                          {t.status}
                        </Badge>
                      </td>
                      <td>{t._count?.replies || 0}</td>
                      <td>
                        <Eye size={12} /> {t.viewCount}
                      </td>
                      <td>
                        <div className="ui-flex ui-gap-1">
                          <button
                            className="ui-btn-icon"
                            onClick={() => loadReplies(t.id)}
                            title="Replies"
                          >
                            <MessageCircle size={14} />
                          </button>
                          {t.status !== "CLOSED" && (
                            <button
                              className="ui-btn-icon"
                              onClick={() => closeTopic(t.id)}
                              title="Close"
                            >
                              <Lock size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedTopic === t.id && (
                      <tr>
                        <td colSpan={7}>
                          <div className="ui-p-2">
                            <p className="ui-text-sm">{t.content}</p>
                            {(replies[t.id] || []).map((r: any) => (
                              <div
                                key={r.id}
                                className="ui-flex ui-items-start ui-gap-2 ui-py-1 ui-border-b ui-ml-4"
                              >
                                <MessageSquare size={12} className="ui-mt-1" />
                                <div className="ui-flex-1">
                                  <p className="ui-text-sm">{r.content}</p>
                                  <p className="ui-text-xs text-muted">
                                    {r.authorRole} ·{" "}
                                    {new Date(r.createdAt).toLocaleDateString()}
                                    {r.isAnswer && (
                                      <Badge
                                        variant="success"
                                        className="ui-ml-1"
                                      >
                                        Answer
                                      </Badge>
                                    )}
                                  </p>
                                </div>
                                {!r.isAnswer && (
                                  <button
                                    className="ui-btn-icon"
                                    onClick={() => markAnswer(r.id)}
                                    title="Mark as answer"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
