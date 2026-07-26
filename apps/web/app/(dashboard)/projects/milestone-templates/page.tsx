"use client";

import React, { useState, useEffect } from "react";
import { PageHeader, Spinner } from "@unerp/ui";
import { Edit3, Trash2 } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import styles from "./page.module.css";

interface MilestoneTemplate {
  id: string;
  name: string;
  description: string | null;
  sequenceOrder: number;
  defaultDurationDays: number | null;
  dependsOn: string | null;
}

export default function MilestoneTemplatesPage() {
  const client = useApiClient();
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, [client]);

  const fetchTemplates = async () => {
    try {
      const data = await client.get<
        MilestoneTemplate[] | { data?: MilestoneTemplate[] }
      >("/projects/milestone-templates");
      setTemplates(Array.isArray(data) ? data : data?.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <RouteGuard permission="projects.milestone-templates.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Milestone Templates"
          description="Define milestone templates for project phases"
          breadcrumbs={[
            { label: "Projects", href: "/projects" },
            { label: "Milestone Templates" },
          ]}
        />
        <div className={styles.grid}>
          {templates.map((t) => (
            <div key={t.id} className={styles.card}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.badge}>#{t.sequenceOrder}</span>{" "}
                  {t.name}
                </h3>
              </div>
              <p className={styles.cardDesc}>
                {t.description || "No description"}
              </p>
              <div className={styles.cardMeta}>
                {t.defaultDurationDays && (
                  <span>{t.defaultDurationDays} days</span>
                )}
                {t.dependsOn && <span>Depends on: {t.dependsOn}</span>}
              </div>
              <div className={styles.cardActions}>
                <button className={styles.editBtn}>
                  <Edit3 size={14} /> Edit
                </button>
                <button className={styles.deleteBtn}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && !loading && (
            <div
              className="ui-text-muted"
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
              }}
            >
              No milestone templates yet. Create one to define project phases.
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
