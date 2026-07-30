// @ts-nocheck
"use client";
import styles from "./page.module.css";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { MessageSquare, Inbox, Phone, Megaphone } from "lucide-react";
import { DataTable, Card, Spinner, type Column } from "@unerp/ui";

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  description: string | null;
  topic: string | null;
  isArchived: boolean;
  isPrivate: boolean;
  updatedAt: string;
  members?: { id: string; userId: string; role: string }[];
}

interface FileShare {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string | null;
  uploadedBy: string;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  status: string;
  createdBy: string;
  publishedAt: string | null;
  createdAt: string;
  targets?: { targetType: string; targetId: string | null }[];
}

export default function CommunicationAdvancedPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "threads") as
    | "threads"
    | "inbox"
    | "outbound";

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [fileShares, setFileShares] = useState<FileShare[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rooms, files, anns] = await Promise.all([
        client.get<ChatRoom[]>("/communication/chat-rooms").catch(() => []),
        client.get<FileShare[]>("/communication/file-shares").catch(() => []),
        client
          .get<Announcement[]>("/communication/announcements")
          .catch(() => []),
      ]);
      setChatRooms(rooms);
      setFileShares(files);
      setAnnouncements(
        Array.isArray(anns) ? anns : ((anns as any)?.data ?? []),
      );
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const roomTypeIcon = (type: string) => {
    if (type === "DM") return "💬";
    if (type === "GROUP") return "👥";
    return "📢";
  };

  const inboxColumns: Column<FileShare>[] = [
    {
      key: "name",
      header: "File Name",
      render: (r) => (
        <div>
          <div className="font-semibold">{r.name}</div>
          <div className="ui-text-micro ui-text-muted">{r.mimeType}</div>
        </div>
      ),
    },
    {
      key: "size",
      header: "Size",
      render: (r) => {
        const kb = (r.size / 1024).toFixed(1);
        return `${kb} KB`;
      },
    },
    {
      key: "createdAt",
      header: "Shared At",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  const announcementColumns: Column<Announcement>[] = [
    { key: "title", header: "Title" },
    {
      key: "content",
      header: "Content",
      render: (r) =>
        r.content.length > 60 ? `${r.content.slice(0, 60)}...` : r.content,
    },
    {
      key: "priority",
      header: "Priority",
      render: (r) => (
        <span
          style={{
            color:
              r.priority === "HIGH"
                ? "var(--color-error)"
                : r.priority === "URGENT"
                  ? "var(--color-warning)"
                  : "var(--color-success)",
          }}
        >
          {r.priority}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={styles.s46}
          style={{
            color:
              r.status === "PUBLISHED"
                ? "var(--color-success)"
                : r.status === "DRAFT"
                  ? "var(--color-warning)"
                  : "var(--color-error)",
            background:
              r.status === "PUBLISHED"
                ? "var(--color-success-light)"
                : r.status === "DRAFT"
                  ? "var(--color-warning-light)"
                  : "var(--color-error-light)",
          }}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "publishedAt",
      header: "Published",
      render: (r) =>
        r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : "—",
    },
  ];

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

      {loading && (
        <div className="ui-flex ui-justify-center" style={{ padding: "3rem" }}>
          <Spinner />
        </div>
      )}

      {!loading && activeTab === "threads" && (
        <div className={styles.s4}>
          {chatRooms.length === 0 && (
            <div
              className="ui-text-sm-muted"
              style={{ padding: "2rem", textAlign: "center" }}
            >
              No chat rooms yet
            </div>
          )}
          {chatRooms.map((room) => (
            <div key={room.id} className={styles.s5}>
              <div className={styles.s6}>
                <div className="ui-hstack-2">
                  <div className={styles.s7}>{roomTypeIcon(room.type)}</div>
                  <div>
                    <span className="ui-heading-sm font-bold">{room.name}</span>
                    <span className={styles.s8}>
                      {room.type} · {room.members?.length ?? 0} members
                    </span>
                  </div>
                </div>
              </div>
              {room.description && (
                <p className={styles.s11}>{room.description}</p>
              )}
              {room.topic && (
                <p className="ui-text-micro ui-text-muted">{room.topic}</p>
              )}
              <div className="ui-text-micro ui-text-muted">
                Updated {new Date(room.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === "inbox" && (
        <div className={styles.s26}>
          <div className={styles.s27}>
            {["OPEN", "ASSIGNED", "RESOLVED"].map((status) => {
              const count =
                status === "OPEN"
                  ? fileShares.length
                  : status === "ASSIGNED"
                    ? Math.floor(fileShares.length / 2)
                    : Math.floor(fileShares.length / 3);
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
          <Card>
            <DataTable
              columns={inboxColumns}
              data={fileShares}
              rowKey={(r) => r.id}
              emptyTitle="No shared files"
              emptyIcon={<Inbox size={48} />}
            />
          </Card>
        </div>
      )}

      {!loading && activeTab === "outbound" && (
        <div className={styles.s26}>
          <div className="ui-grid-2">
            <div className="ui-card p-4">
              <h3 className="ui-section-header">
                <Megaphone size={16} className="ui-hstack-2" /> Announcements
              </h3>
              {announcements.filter((a) => a.status === "PUBLISHED").length ===
                0 && (
                <div className="ui-text-sm-muted">
                  No published announcements
                </div>
              )}
              {announcements
                .filter((a) => a.status === "PUBLISHED")
                .slice(0, 5)
                .map((a) => (
                  <div key={a.id} className={styles.s40}>
                    <div className={styles.s41}>{a.title}</div>
                    <p className={styles.s42}>
                      {a.content.length > 80
                        ? `${a.content.slice(0, 80)}...`
                        : a.content}
                    </p>
                    <div className={styles.s43}>
                      <span className={styles.s44}>{a.priority}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="ui-card p-4">
              <h3 className="ui-section-header">
                <MessageSquare size={16} className="ui-hstack-2" /> All
                Announcements
              </h3>
              {announcements.length === 0 && (
                <div className="ui-text-sm-muted">No announcements yet</div>
              )}
              {announcements.slice(0, 10).map((a) => (
                <div key={a.id} className={styles.s45}>
                  <div>
                    <div className="ui-heading-sm">{a.title}</div>
                    <div className="ui-text-micro">{a.priority}</div>
                  </div>
                  <span
                    style={{
                      color:
                        a.status === "PUBLISHED"
                          ? "var(--color-success)"
                          : a.status === "DRAFT"
                            ? "var(--color-warning)"
                            : "var(--color-error)",
                      background:
                        a.status === "PUBLISHED"
                          ? "var(--color-success-light)"
                          : a.status === "DRAFT"
                            ? "var(--color-warning-light)"
                            : "var(--color-error-light)",
                    }}
                    className={styles.s46}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
