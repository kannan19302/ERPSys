// @ts-nocheck
"use client";
import styles from "./page.module.css";
import React, { useEffect, useState } from "react";
import { PageHeader, ConfirmDialog } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  Settings,
  FileText,
  Bot,
} from "lucide-react";
import Link from "next/link";

export default function SitesListPage() {
  const client = useApiClient();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setSites(await client.get("/builder/web-studio/sites"));
    } catch {
      setSites([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await client.post("/builder/web-studio/sites", { name: name.trim() });
      setName("");
      await load();
    } finally {
      setCreating(false);
    }
  };
  const executeRemove = async (id: string) => {
    await client.delete(`/builder/web-studio/sites/${id}`);
    await load();
  };

  return (
    <div className={styles.s1}>
      <PageHeader
        title="Sites"
        description="Build and manage multiple websites. Each site can have its own pages, blog, docs, collections, store, chatbot, and custom domain."
      />

      {/* Create */}
      <div className={styles.s2}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New site name…"
          className={styles.s3}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <button onClick={create} disabled={creating} className={styles.s4}>
          <Plus size={15} /> Create site
        </button>
      </div>

      {loading ? (
        <div className="ui-text-muted">Loading…</div>
      ) : sites.length === 0 ? (
        <div className={styles.s5}>
          No sites yet. Create your first site above.
        </div>
      ) : (
        <div className="ui-stack-3">
          {sites.map((site) => (
            <div key={site.id} className="ui-card p-4">
              <div className="ui-flex-between">
                <div>
                  <div className="ui-heading-base">{site.name}</div>
                  <div className={styles.s6}>
                    {site.domains?.length
                      ? site.domains.map((d: any) => d.host).join(", ")
                      : `/${site.slug}`}
                    {" · "}
                    {site._count?.pages ?? 0} page(s)
                  </div>
                </div>
                <div className="ui-flex ui-gap-2">
                  <Link
                    href={`/builder/web/sites/${site.id}`}
                    className={styles.s7}
                  >
                    <Settings size={14} /> Manage
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(site.id)}
                    className={styles.s8}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            executeRemove(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title="Delete Site"
        message="Are you sure you want to delete this site and all its pages? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
