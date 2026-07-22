"use client";
import styles from "./page.module.css";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  MessageSquare,
  Send,
  Pin,
  Smile,
  Reply,
  CheckSquare,
  Inbox,
  Clock,
  Phone,
  AtSign,
} from "lucide-react";

interface ThreadMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  reactions: { emoji: string; count: number; reacted: boolean }[];
  isPinned: boolean;
  replies: ThreadMessage[];
}

interface SharedInboxItem {
  id: string;
  from: string;
  subject: string;
  preview: string;
  receivedAt: string;
  assignedTo: string | null;
  status: "OPEN" | "ASSIGNED" | "RESOLVED";
  slaDeadline: string;
  channel: string;
}

export default function CommunicationAdvancedPage() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "threads") as
    | "threads"
    | "inbox"
    | "outbound";
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [messages, setMessages] = useState<ThreadMessage[]>([
    {
      id: "msg-1",
      author: "Sarah Chen",
      content:
        "The Q3 sales pipeline numbers are looking strong. We need to discuss resource allocation for the new accounts.",
      timestamp: "10:24 AM",
      reactions: [
        { emoji: "👍", count: 3, reacted: true },
        { emoji: "🎯", count: 1, reacted: false },
      ],
      isPinned: true,
      replies: [
        {
          id: "reply-1",
          author: "Mike Johnson",
          content:
            "Agreed! I have prepared a resource matrix. Let me share it in the meeting.",
          timestamp: "10:31 AM",
          reactions: [{ emoji: "✅", count: 2, reacted: false }],
          isPinned: false,
          replies: [],
        },
        {
          id: "reply-2",
          author: "Lisa Wang",
          content:
            "Can we also review the CRM lead scoring criteria? Some accounts seem misclassified.",
          timestamp: "10:35 AM",
          reactions: [],
          isPinned: false,
          replies: [],
        },
      ],
    },
    {
      id: "msg-2",
      author: "James Park",
      content:
        "Manufacturing line B is running at 87% OEE this week. We need to schedule maintenance before it dips below 80%.",
      timestamp: "11:02 AM",
      reactions: [{ emoji: "⚠️", count: 4, reacted: false }],
      isPinned: false,
      replies: [
        {
          id: "reply-3",
          author: "Ops Team",
          content:
            "CMMS ticket #4521 already created for preventive maintenance window next Tuesday.",
          timestamp: "11:15 AM",
          reactions: [{ emoji: "👍", count: 1, reacted: false }],
          isPinned: false,
          replies: [],
        },
      ],
    },
    {
      id: "msg-3",
      author: "HR Bot",
      content:
        "📢 Reminder: All timesheets for the current pay period must be submitted by Friday 5 PM. Late submissions will be processed in the next cycle.",
      timestamp: "9:00 AM",
      reactions: [
        { emoji: "📝", count: 8, reacted: true },
        { emoji: "👀", count: 5, reacted: false },
      ],
      isPinned: true,
      replies: [],
    },
  ]);

  const [inboxItems] = useState<SharedInboxItem[]>([
    {
      id: "inb-1",
      from: "customer@acmecorp.com",
      subject: "Invoice #2026-0184 Discrepancy",
      preview: "The total on our invoice does not match the PO amount...",
      receivedAt: "2026-06-14 08:30",
      assignedTo: null,
      status: "OPEN",
      slaDeadline: "2026-06-15 08:30",
      channel: "support@",
    },
    {
      id: "inb-2",
      from: "vendor@steelworks.com",
      subject: "Delivery Schedule Change",
      preview:
        "Due to supply chain constraints, we need to push the delivery...",
      receivedAt: "2026-06-14 07:45",
      assignedTo: "Mike J.",
      status: "ASSIGNED",
      slaDeadline: "2026-06-14 19:45",
      channel: "procurement@",
    },
    {
      id: "inb-3",
      from: "applicant@email.com",
      subject: "Application for Senior Engineer",
      preview: "I am writing to express my interest in the position...",
      receivedAt: "2026-06-13 16:20",
      assignedTo: "HR Team",
      status: "ASSIGNED",
      slaDeadline: "2026-06-16 16:20",
      channel: "careers@",
    },
    {
      id: "inb-4",
      from: "partner@logistics.com",
      subject: "Shipment ASN-8834 Status Update",
      preview:
        "Your shipment is currently in transit and expected to arrive...",
      receivedAt: "2026-06-13 14:10",
      assignedTo: "Ops Team",
      status: "RESOLVED",
      slaDeadline: "2026-06-14 14:10",
      channel: "support@",
    },
  ]);

  const addReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const existing = m.reactions.find((r) => r.emoji === emoji);
          if (existing) {
            return {
              ...m,
              reactions: m.reactions.map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.reacted ? r.count - 1 : r.count + 1,
                      reacted: !r.reacted,
                    }
                  : r,
              ),
            };
          }
          return {
            ...m,
            reactions: [...m.reactions, { emoji, count: 1, reacted: true }],
          };
        }
        return m;
      }),
    );
  };

  const togglePin = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isPinned: !m.isPinned } : m)),
    );
  };

  const addReply = (msgId: string) => {
    if (!replyText.trim()) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            replies: [
              ...m.replies,
              {
                id: `reply-${Date.now()}`,
                author: "You",
                content: replyText,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                reactions: [],
                isPinned: false,
                replies: [],
              },
            ],
          };
        }
        return m;
      }),
    );
    setReplyText("");
    setReplyingTo(null);
  };

  const convertToTask = (content: string) => {
    alert(
      `Task created: "${content.substring(0, 60)}..."\nAssigned to: Current User\nDue: Tomorrow`,
    );
  };

  const slaColor = (deadline: string) => {
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining < 0) return "var(--color-error)";
    if (remaining < 3600000 * 4) return "var(--color-warning)";
    return "var(--color-success)";
  };

  const tabs: SubTab[] = [
    {
      id: "threads",
      label: "Threaded Chat",
      href: "/communication/advanced?subtab=threads",
      icon: MessageSquare,
    },
    {
      id: "inbox",
      label: "Shared Inbox",
      href: "/communication/advanced?subtab=inbox",
      icon: Inbox,
    },
    {
      id: "outbound",
      label: "SMS / WhatsApp",
      href: "/communication/advanced?subtab=outbound",
      icon: Phone,
    },
  ];

  return (
    <div className={styles.s1}>
      <div>
        <h1 className="text-2xl ui-hstack-2">
          <MessageSquare className="ui-text-primary" />
          Advanced Communication
        </h1>
        <p className="ui-text-sm-muted">
          Threaded conversations with reactions and pins, shared team inboxes
          with SLA, and outbound messaging.
        </p>
      </div>

      <SubTabBar tabs={tabs} />

      {/* Threaded Chat */}
      {activeTab === "threads" && (
        <div className={styles.s4}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                borderLeft: msg.isPinned
                  ? "3px solid var(--color-primary)"
                  : "none",
              }}
              className={styles.s5}
            >
              <div className={styles.s6}>
                <div className="ui-hstack-2">
                  <div className={styles.s7}>
                    {msg.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <span className="ui-heading-sm font-bold">
                      {msg.author}
                    </span>
                    <span className={styles.s8}>{msg.timestamp}</span>
                  </div>
                </div>
                <div className="ui-flex ui-gap-1">
                  <button
                    onClick={() => togglePin(msg.id)}
                    style={{
                      color: msg.isPinned
                        ? "var(--color-primary)"
                        : "var(--color-text-tertiary)",
                    }}
                    className={styles.s9}
                    title="Pin"
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    onClick={() => convertToTask(msg.content)}
                    className={styles.s10}
                    title="Convert to Task"
                  >
                    <CheckSquare size={14} />
                  </button>
                  <button
                    onClick={() =>
                      setReplyingTo(replyingTo === msg.id ? null : msg.id)
                    }
                    className={styles.s10}
                    title="Reply"
                  >
                    <Reply size={14} />
                  </button>
                </div>
              </div>

              <p className={styles.s11}>{msg.content}</p>

              {/* Reactions */}
              <div
                style={{
                  marginBottom: msg.replies.length > 0 ? "var(--space-3)" : 0,
                }}
                className={styles.s12}
              >
                {msg.reactions.map((r) => (
                  <button
                    key={r.emoji}
                    onClick={() => addReaction(msg.id, r.emoji)}
                    style={{
                      background: r.reacted
                        ? "var(--color-primary-light)"
                        : "var(--color-bg)",
                      border: r.reacted
                        ? "1px solid var(--color-primary)"
                        : "1px solid var(--color-border)",
                    }}
                    className={styles.s13}
                  >
                    {r.emoji}{" "}
                    <span className="ui-text-micro ui-text-muted">
                      {r.count}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => addReaction(msg.id, "👍")}
                  className={styles.s14}
                >
                  <Smile size={12} />
                </button>
              </div>

              {/* Thread Replies */}
              {msg.replies.length > 0 && (
                <div className={styles.s15}>
                  <span className={styles.s16}>
                    {msg.replies.length}{" "}
                    {msg.replies.length === 1 ? "reply" : "replies"}
                  </span>
                  {msg.replies.map((r) => (
                    <div key={r.id} className={styles.s17}>
                      <div className={styles.s18}>
                        {r.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className={styles.s19}>
                          <span className={styles.s20}>{r.author}</span>
                          <span className={styles.s21}>{r.timestamp}</span>
                        </div>
                        <p className={styles.s22}>{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {replyingTo === msg.id && (
                <div className={styles.s23}>
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addReply(msg.id)}
                    placeholder="Write a reply..."
                    className={styles.s24}
                  />
                  <button
                    onClick={() => addReply(msg.id)}
                    className={styles.s25}
                  >
                    <Send size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Shared Inbox */}
      {activeTab === "inbox" && (
        <div className={styles.s26}>
          <div className={styles.s27}>
            {(["OPEN", "ASSIGNED", "RESOLVED"] as const).map((status) => {
              const count = inboxItems.filter(
                (i) => i.status === status,
              ).length;
              const colors: Record<string, string> = {
                OPEN: "var(--color-error)",
                ASSIGNED: "var(--color-warning)",
                RESOLVED: "var(--color-success)",
              };
              return (
                <div key={status} className={styles.s28}>
                  <div style={{ color: colors[status] }} className={styles.s29}>
                    {count}
                  </div>
                  <div className="ui-text-xs-muted">{status}</div>
                </div>
              );
            })}
          </div>

          <div className={styles.s30}>
            <table className={styles.s31}>
              <thead>
                <tr className={styles.s32}>
                  <th className={styles.s33}>Channel</th>
                  <th className={styles.s33}>From / Subject</th>
                  <th className={styles.s33}>Assigned</th>
                  <th className={styles.s33}>SLA</th>
                  <th className={styles.s33}>Status</th>
                </tr>
              </thead>
              <tbody>
                {inboxItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-4">
                      <span className={styles.s34}>
                        <AtSign size={10} className={styles.s35} />
                        {item.channel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{item.subject}</div>
                      <div className="ui-text-micro">From: {item.from}</div>
                    </td>
                    <td className={styles.s36}>
                      {item.assignedTo || (
                        <span className={styles.s37}>Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div
                        style={{ color: slaColor(item.slaDeadline) }}
                        className={styles.s38}
                      >
                        <Clock size={12} />
                        {new Date(item.slaDeadline).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        style={{
                          color:
                            item.status === "OPEN"
                              ? "var(--color-error)"
                              : item.status === "ASSIGNED"
                                ? "var(--color-warning)"
                                : "var(--color-success)",
                          background:
                            item.status === "OPEN"
                              ? "var(--color-error-light)"
                              : item.status === "ASSIGNED"
                                ? "var(--color-warning-light)"
                                : "var(--color-success-light)",
                        }}
                        className={styles.s39}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SMS / WhatsApp Outbound */}
      {activeTab === "outbound" && (
        <div className={styles.s26}>
          <div className="ui-grid-2">
            {/* SMS Templates */}
            <div className="ui-card p-4">
              <h3 className="ui-section-header">📱 SMS Templates</h3>
              {[
                {
                  name: "Order Confirmation",
                  vars: ["{{orderNumber}}", "{{total}}"],
                  preview:
                    "Your order #{{orderNumber}} for ${{total}} has been confirmed.",
                },
                {
                  name: "Delivery Update",
                  vars: ["{{trackingId}}", "{{eta}}"],
                  preview:
                    "Your shipment {{trackingId}} is on its way. ETA: {{eta}}.",
                },
                {
                  name: "Payment Reminder",
                  vars: ["{{invoiceNo}}", "{{dueDate}}"],
                  preview:
                    "Reminder: Invoice {{invoiceNo}} is due on {{dueDate}}.",
                },
              ].map((t, i) => (
                <div key={i} className={styles.s40}>
                  <div className={styles.s41}>{t.name}</div>
                  <p className={styles.s42}>{t.preview}</p>
                  <div className={styles.s43}>
                    {t.vars.map((v) => (
                      <span key={v} className={styles.s44}>
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp Business */}
            <div className="ui-card p-4">
              <h3 className="ui-section-header">
                💬 WhatsApp Business Templates
              </h3>
              {[
                {
                  name: "Welcome Message",
                  status: "APPROVED",
                  category: "Marketing",
                },
                {
                  name: "Appointment Reminder",
                  status: "APPROVED",
                  category: "Utility",
                },
                {
                  name: "Invoice Notification",
                  status: "PENDING",
                  category: "Utility",
                },
                {
                  name: "Feedback Request",
                  status: "REJECTED",
                  category: "Marketing",
                },
              ].map((t, i) => (
                <div key={i} className={styles.s45}>
                  <div>
                    <div className="ui-heading-sm">{t.name}</div>
                    <div className="ui-text-micro">{t.category}</div>
                  </div>
                  <span
                    style={{
                      color:
                        t.status === "APPROVED"
                          ? "var(--color-success)"
                          : t.status === "PENDING"
                            ? "var(--color-warning)"
                            : "var(--color-error)",
                      background:
                        t.status === "APPROVED"
                          ? "var(--color-success-light)"
                          : t.status === "PENDING"
                            ? "var(--color-warning-light)"
                            : "var(--color-error-light)",
                    }}
                    className={styles.s46}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Send */}
          <div className="ui-card p-4">
            <h3 className="ui-section-header">Quick Send Message</h3>
            <div className={styles.s47}>
              <div>
                <label className={styles.s48}>Channel</label>
                <select className={styles.s49}>
                  <option>SMS</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div>
                <label className={styles.s48}>Recipient</label>
                <input placeholder="+1 555 000 0000" className={styles.s49} />
              </div>
              <div>
                <label className={styles.s48}>Message</label>
                <input placeholder="Type message..." className={styles.s49} />
              </div>
              <button className={styles.s50}>
                <Send size={12} /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
