// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader, Spinner } from "@unerp/ui";
import { Edit3, Trash2 } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import styles from "./page.module.css";

interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  estimatedDuration: number | null;
  taskCount: number;
  milestoneCount: number;
}

export default function TemplatesPage() {
  const client = useApiClient();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, [client]);

  const fetchTemplates = async () => {
    try {
      const data = await client.get<
        ProjectTemplate[] | { data?: ProjectTemplate[] }
      >("/projects/templates");
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
    <RouteGuard permission="projects.templates.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Project Templates"
          description="Manage project and milestone templates"
          breadcrumbs={[
            { label: "Projects", href: "/projects" },
            { label: "Templates" },
          ]}
        />
        <div className={styles.grid}>
          {templates.map((t) => (
            <div key={t.id} className={styles.card}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>{t.name}</h3>
                {t.category && (
                  <span className={styles.badge}>{t.category}</span>
                )}
              </div>
              <p className={styles.cardDesc}>
                {t.description || "No description"}
              </p>
              <div className={styles.cardMeta}>
                {t.taskCount > 0 && <span>{t.taskCount} tasks</span>}
                {t.milestoneCount > 0 && (
                  <span>{t.milestoneCount} milestones</span>
                )}
                {t.estimatedDuration && <span>{t.estimatedDuration} days</span>}
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
              No project templates yet. Create one to streamline project setup.
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
