"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, PageHeader, DataTable } from "@unerp/ui";
import {
  MessageSquare,
  Plus,
  X,
  Send,
  Paperclip,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface TicketMessage {
  id: string;
  author: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  isStaff: boolean;
  attachments: Array<{ name: string; url: string }>;
}

interface Ticket {
  id: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  description: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export default function SaasSupportPage() {
  const client = useApiClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createSubject, setCreateSubject] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createCategory, setCreateCategory] = useState("technical");
  const [createPriority, setCreatePriority] = useState("MEDIUM");
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await client.get<Ticket[]>("/saas/support/tickets").catch(() => []);
      setTickets(res || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => ({
    open: tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    urgent: tickets.filter((t) => t.priority === "URGENT").length,
    total: tickets.length,
  }), [tickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post("/saas/support/tickets", {
        subject: createSubject,
        description: createDescription,
        category: createCategory,
        priority: createPriority,
      });
      setShowCreate(false);
      setCreateSubject("");
      setCreateDescription("");
      loadData();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await client.post(`/saas/support/tickets/${selectedTicket.id}/messages`, {
        content: replyText.trim(),
      });
      setReplyText("");
      const updated = await client.get<Ticket>(`/saas/support/tickets/${selectedTicket.id}`).catch(() => null);
      if (updated) {
        setSelectedTicket(updated);
        setTickets((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      } else {
        loadData();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await client.patch(`/saas/support/tickets/${ticketId}`, { status });
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => prev ? { ...prev, status: status as any } : null);
      }
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: status as any } : t));
    } catch {}
  };

  const priorityBadge = (p: string) => {
    const cls = p === "URGENT" ? "ui-badge-danger" :
      p === "HIGH" ? "ui-badge-warning" :
      p === "MEDIUM" ? "ui-badge-info" : "ui-badge-neutral";
    return <span className={`ui-badge ${cls}`}>{p}</span>;
  };

  const statusBadge = (s: string) => {
    const cls = s === "OPEN" ? "ui-badge-info" :
      s === "IN_PROGRESS" ? "ui-badge-warning" :
      s === "RESOLVED" ? "ui-badge-success" : "ui-badge-neutral";
    return <span className={`ui-badge ${cls}`}>{s.replace("_", " ")}</span>;
  };

  return (
    <RouteGuard permission="saas.support.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Support Tickets"
          description="Create and manage support requests for your workspace."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Support" },
          ]}
        />

        <div className="ui-stats-row">
          <Card padding="lg">
            <div className="ui-stat-value">{stats.open}</div>
            <div className="ui-stat-label">Open</div>
          </Card>
          <Card padding="lg">
            <div className="ui-stat-value">{stats.resolved}</div>
            <div className="ui-stat-label">Resolved</div>
          </Card>
          <Card padding="lg">
            <div className="ui-stat-value">{stats.urgent}</div>
            <div className="ui-stat-label">Urgent</div>
          </Card>
          <Card padding="lg">
            <div className="ui-stat-value">{stats.total}</div>
            <div className="ui-stat-label">Total</div>
          </Card>
        </div>

        <div className="ui-list-toolbar">
          <div></div>
          <button className="ui-btn ui-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Ticket
          </button>
        </div>

        <Card padding="lg">
          <DataTable
            columns={[
              { key: "subject", header: "Subject", sortable: true },
              { key: "status", header: "Status" },
              { key: "priority", header: "Priority" },
              { key: "category", header: "Category" },
              { key: "created", header: "Created", sortable: true },
              { key: "updated", header: "Updated", sortable: true },
            ]}
            data={tickets.map((t) => ({
              ...t,
              status: statusBadge(t.status),
              priority: priorityBadge(t.priority),
              created: new Date(t.createdAt).toLocaleDateString(),
              updated: new Date(t.updatedAt).toLocaleDateString(),
            })) as unknown as Record<string, unknown>[]}
            onRowClick={(row) => {
              const ticket = tickets.find((t) => t.id === (row as any).id);
              if (ticket) setSelectedTicket(ticket);
            }}
            emptyTitle="No support tickets"
            emptyMessage="Create a ticket and our team will get back to you."
          />
        </Card>

        {showCreate && (
          <div className="ui-modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="ui-modal ui-modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="ui-modal-header">
                <span>Create Support Ticket</span>
                <button className="ui-btn-icon" onClick={() => setShowCreate(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateTicket}>
                <div className="ui-modal-body ui-stack-4">
                  <div className="ui-form-group">
                    <label className="ui-label">Subject</label>
                    <input className="ui-input" required placeholder="Brief description of the issue" value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} />
                  </div>
                  <div className="ui-grid-2">
                    <div className="ui-form-group">
                      <label className="ui-label">Category</label>
                      <select className="ui-select" value={createCategory} onChange={(e) => setCreateCategory(e.target.value)}>
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing</option>
                        <option value="account">Account</option>
                        <option value="feature">Feature Request</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Priority</label>
                      <select className="ui-select" value={createPriority} onChange={(e) => setCreatePriority(e.target.value)}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Description</label>
                    <textarea className="ui-textarea" required rows={5} placeholder="Describe your issue in detail..." value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} />
                  </div>
                </div>
                <div className="ui-modal-footer">
                  <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="ui-btn ui-btn-primary" disabled={submitting}>
                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                    {submitting ? "Creating..." : "Create Ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedTicket && (
          <div className="ui-modal-overlay" onClick={() => setSelectedTicket(null)}>
            <div className="ui-modal ui-modal-xl" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh" }}>
              <div className="ui-modal-header">
                <div className="ui-stack-1">
                  <span className="font-semibold">{selectedTicket.subject}</span>
                  <div className="ui-hstack-2">
                    {statusBadge(selectedTicket.status)}
                    {priorityBadge(selectedTicket.priority)}
                    <span className="ui-text-xs-muted">{selectedTicket.category}</span>
                  </div>
                </div>
                <button className="ui-btn-icon" onClick={() => setSelectedTicket(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="ui-modal-body" style={{ overflowY: "auto", maxHeight: "60vh" }}>
                <p className="text-sm ui-mb-4">{selectedTicket.description}</p>

                <div className="ui-stack-4">
                  {selectedTicket.messages.map((msg) => (
                    <div key={msg.id} className={`ui-card ${msg.isStaff ? "" : ""}`} style={{
                      padding: "var(--space-3)",
                      marginLeft: msg.isStaff ? "0" : "var(--space-6)",
                      marginRight: msg.isStaff ? "var(--space-6)" : "0",
                      background: msg.isStaff ? "var(--color-bg-sunken)" : "var(--color-bg-elevated)",
                    }}>
                      <div className="ui-flex-between ui-mb-2">
                        <div className="ui-hstack-2">
                          <span className="font-semibold text-sm">{msg.author}</span>
                          {msg.isStaff && <span className="ui-badge ui-badge-primary">Staff</span>}
                        </div>
                        <span className="ui-text-xs-muted">{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                      {msg.attachments.length > 0 && (
                        <div className="ui-hstack-2 ui-mt-2">
                          {msg.attachments.map((att, idx) => (
                            <a key={idx} href={att.url} className="ui-chip" target="_blank" rel="noopener noreferrer">
                              <Paperclip size={12} /> {att.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== "CLOSED" && (
                  <form onSubmit={handleReply} className="ui-stack-3 ui-mt-6">
                    <textarea
                      className="ui-textarea"
                      rows={3}
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="ui-flex-end ui-hstack-2">
                      <button type="submit" className="ui-btn ui-btn-primary" disabled={submitting || !replyText.trim()}>
                        {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        Send Reply
                      </button>
                    </div>
                  </form>
                )}
              </div>
              <div className="ui-modal-footer ui-flex-between">
                <div className="ui-hstack-2">
                  {selectedTicket.status === "OPEN" && (
                    <button className="ui-btn ui-btn-secondary" onClick={() => handleStatusChange(selectedTicket.id, "IN_PROGRESS")}>
                      <ArrowUp size={14} /> Start Progress
                    </button>
                  )}
                  {selectedTicket.status === "IN_PROGRESS" && (
                    <button className="ui-btn ui-btn-secondary" onClick={() => handleStatusChange(selectedTicket.id, "RESOLVED")}>
                      <CheckCircle size={14} /> Mark Resolved
                    </button>
                  )}
                  {(selectedTicket.status === "OPEN" || selectedTicket.status === "IN_PROGRESS") && (
                    <button className="ui-btn ui-btn-danger" onClick={() => handleStatusChange(selectedTicket.id, "CLOSED")}>
                      <X size={14} /> Close
                    </button>
                  )}
                  {(selectedTicket.status === "RESOLVED" || selectedTicket.status === "CLOSED") && (
                    <button className="ui-btn ui-btn-secondary" onClick={() => handleStatusChange(selectedTicket.id, "OPEN")}>
                      <RefreshCw size={14} /> Reopen
                    </button>
                  )}
                </div>
                <button className="ui-btn ui-btn-secondary" onClick={() => setSelectedTicket(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
