"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, ConfirmDialog } from "@unerp/ui";
import {
  Inbox,
  Trash2,
  Mail,
  MailOpen,
  Archive,
  AlertOctagon,
  Search,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const STATUS_META: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "#3b82f6" },
  READ: { label: "Read", color: "#6b7280" },
  ARCHIVED: { label: "Archived", color: "#9ca3af" },
  SPAM: { label: "Spam", color: "#dc2626" },
};

export default function WebSubmissionsPage() {
  const client = useApiClient();
  const router = useRouter();
  const [subs, setSubs] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    const qp = new URLSearchParams();
    if (filter !== "ALL") qp.set("status", filter);
    setSubs(await client.get<any[]>(`/builder/web-form-submissions?${qp}`));
    setLoading(false);
  }, [filter, client]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const setStatus = async (id: string, status: string) => {
    await client.request(`/builder/web-form-submissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    void fetchSubs();
    if (selected?.id === id) setSelected({ ...selected, status });
  };
  const executeDeleteSub = async (id: string) => {
    await client.delete(`/builder/web-form-submissions/${id}`);
    if (selected?.id === id) setSelected(null);
    void fetchSubs();
  };
  const open = (s: any) => {
    setSelected(s);
    if (s.status === "NEW") setStatus(s.id, "READ");
  };

  const filtered = subs.filter(
    (s) =>
      !search ||
      JSON.stringify(s.data).toLowerCase().includes(search.toLowerCase()) ||
      s.formName.toLowerCase().includes(search.toLowerCase()),
  );
  const newCount = subs.filter((s) => s.status === "NEW").length;

  return (
    <RouteGuard permission="builder.web-submissions.read">
      <div className="p-6 ui-stack-5">
        <PageHeader
          title="Form Submissions"
          description="Leads, contacts and newsletter sign-ups captured from your public website"
          actions={
            <div className={styles.s1}>
              {newCount > 0 && (
                <span className={styles.s2}>{newCount} new</span>
              )}
              <button
                className="ui-btn ui-btn-secondary"
                onClick={() => router.push("/builder/web")}
              >
                ← Web Studio
              </button>
            </div>
          }
        />

        <div className={styles.s3}>
          <div
            className={`ui-card ${styles.s4}`}
            style={{ flex: selected ? "0 0 55%" : 1 }}
          >
            <div className={styles.s5}>
              <div className={styles.s6}>
                <Search size={14} className={styles.s26} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className={styles.s7}
                />
              </div>
              {["ALL", "NEW", "READ", "ARCHIVED", "SPAM"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    border:
                      filter === s
                        ? "1px solid var(--color-primary)"
                        : "1px solid var(--color-border)",
                    background:
                      filter === s ? "var(--color-primary-bg)" : "transparent",
                    color:
                      filter === s
                        ? "var(--color-primary)"
                        : "var(--color-text-secondary)",
                  }}
                  className={styles.s8}
                >
                  {s === "ALL" ? "All" : STATUS_META[s]?.label}
                </button>
              ))}
            </div>
            {loading ? (
              <div className={styles.s9}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div className={styles.s10}>
                <Inbox size={40} className={styles.s27} />
                <div>No submissions yet.</div>
              </div>
            ) : (
              <div className={styles.s11}>
                {filtered.map((s) => {
                  const meta = STATUS_META[s.status] || STATUS_META.NEW!;
                  const preview = Object.values(s.data || {})
                    .slice(0, 2)
                    .join(" · ");
                  return (
                    <div
                      key={s.id}
                      onClick={() => open(s)}
                      style={{
                        background:
                          selected?.id === s.id
                            ? "var(--color-primary-bg)"
                            : s.status === "NEW"
                              ? "var(--color-bg-subtle)"
                              : "transparent",
                      }}
                      className={styles.s12}
                    >
                      {s.status === "NEW" ? (
                        <Mail size={16} style={{ color: meta.color }} />
                      ) : s.status === "READ" ? (
                        <MailOpen size={16} style={{ color: meta.color }} />
                      ) : s.status === "ARCHIVED" ? (
                        <Archive size={16} style={{ color: meta.color }} />
                      ) : (
                        <AlertOctagon size={16} style={{ color: meta.color }} />
                      )}
                      <div className="flex-1 overflow-hidden">
                        <div className={styles.s13}>
                          <span
                            style={{
                              fontWeight: s.status === "NEW" ? 700 : 500,
                            }}
                            className={styles.s14}
                          >
                            {s.formName}
                          </span>
                          <span className={styles.s15}>
                            {new Date(s.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className={styles.s16}>{preview}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selected && (
            <div className={`ui-card ${styles.s17}`}>
              <div className="ui-flex-between mb-4">
                <div>
                  <h3 className={styles.s18}>{selected.formName}</h3>
                  <span className="ui-text-xs-soft">
                    {new Date(selected.createdAt).toLocaleString()}
                    {selected.pageSlug ? ` · from /${selected.pageSlug}` : ""}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className={styles.s19}
                >
                  ✕
                </button>
              </div>
              <div className={styles.s20}>
                {Object.entries(selected.data || {}).map(([k, v]) => (
                  <div key={k} className={styles.s21}>
                    <span className={styles.s22}>{k}</span>
                    <span className={styles.s23}>{String(v)}</span>
                  </div>
                ))}
              </div>
              <div className={styles.s24}>
                {(["READ", "ARCHIVED", "SPAM"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(selected.id, s)}
                    className="ui-btn ui-btn-secondary text-xs"
                  >
                    Mark {STATUS_META[s]!.label}
                  </button>
                ))}
                <button
                  onClick={() => setDeleteTarget(selected.id)}
                  className={`ui-btn ui-btn-secondary ${styles.s25}`}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) {
              executeDeleteSub(deleteTarget);
              setDeleteTarget(null);
            }
          }}
          title="Delete Submission"
          message="Are you sure you want to delete this submission?"
          confirmLabel="Delete"
          variant="danger"
        />
      </div>
    </RouteGuard>
  );
}
