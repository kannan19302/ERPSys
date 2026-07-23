"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { FileText, Plus, X, File, Link, Download } from "lucide-react";
import { useApiClient } from "@unerp/framework";

interface ProjectDoc {
  id: string;
  projectId: string;
  name: string;
  type: string;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  description: string | null;
  createdAt: string;
}

export default function DocumentsPage() {
  const client = useApiClient();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [docs, setDocs] = useState<ProjectDoc[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    projectId: "",
    name: "",
    type: "FILE",
    fileUrl: "",
    description: "",
  });

  useEffect(() => {
    fetchProjects();
  }, [client]);
  useEffect(() => {
    if (selectedProject) fetchDocs();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const data = await client.get<
        | { id: string; name: string }[]
        | { data?: { id: string; name: string }[] }
      >("/projects");
      const list = Array.isArray(data) ? data : data?.data || [];
      setProjects(list);
      if (list.length > 0) setSelectedProject(list[0]!.id);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchDocs = async () => {
    try {
      const data = await client.get<ProjectDoc[] | { data?: ProjectDoc[] }>(
        `/projects/${selectedProject}/documents`,
      );
      setDocs(Array.isArray(data) ? data : data?.data || []);
    } catch {
      /* ignore */
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/projects/documents", { ...newDoc });
      setIsModalOpen(false);
      setNewDoc({
        projectId: selectedProject,
        name: "",
        type: "FILE",
        fileUrl: "",
        description: "",
      });
      fetchDocs();
      alert("Document added!");
    } catch {
      alert("Failed to add document");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await client.delete(`/projects/documents/${id}`);
      fetchDocs();
    } catch {
      alert("Failed to delete");
    }
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "LINK":
        return <Link size={16} />;
      case "NOTE":
        return <FileText size={16} />;
      default:
        return <File size={16} />;
    }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <FileText size={28} className="ui-text-primary" /> Project Documents
          </h1>
          <p className={styles.p2}>
            Manage files, links, and notes per project
          </p>
        </div>
        <button
          onClick={() => {
            setNewDoc((p) => ({ ...p, projectId: selectedProject }));
            setIsModalOpen(true);
          }}
          className={styles.addBtn}
        >
          <Plus size={18} /> Add Document
        </button>
      </div>
      <div className="ui-form-group">
        <label className="ui-label">Project</label>
        <select
          className="ui-input"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.grid}>
        {docs.map((d) => (
          <div key={d.id} className={styles.card}>
            <div className={styles.cardIcon}>{iconForType(d.type)}</div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{d.name}</h3>
              <p className={styles.cardMeta}>
                {d.type}{" "}
                {d.fileSize ? `· ${(d.fileSize / 1024).toFixed(0)} KB` : ""}
              </p>
              {d.description && (
                <p className={styles.cardDesc}>{d.description}</p>
              )}
              <p className={styles.cardDate}>
                {new Date(d.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className={styles.cardActions}>
              {d.fileUrl && (
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.actionBtn}
                >
                  <Download size={14} />
                </a>
              )}
              <button
                onClick={() => handleDelete(d.id)}
                className={styles.actionBtn}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {docs.length === 0 && !loading && (
          <div className="ui-text-muted">No documents yet.</div>
        )}
      </div>
      {isModalOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className="ui-flex-between">
              <h3>Add Document</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="ui-stack-3">
              <div className="ui-form-group">
                <label className="ui-label">Name</label>
                <input
                  className="ui-input"
                  value={newDoc.name}
                  onChange={(e) =>
                    setNewDoc((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Type</label>
                <select
                  className="ui-input"
                  value={newDoc.type}
                  onChange={(e) =>
                    setNewDoc((p) => ({ ...p, type: e.target.value }))
                  }
                >
                  <option value="FILE">File</option>
                  <option value="LINK">Link</option>
                  <option value="NOTE">Note</option>
                </select>
              </div>
              {newDoc.type !== "NOTE" && (
                <div className="ui-form-group">
                  <label className="ui-label">
                    {newDoc.type === "LINK" ? "URL" : "File URL"}
                  </label>
                  <input
                    className="ui-input"
                    value={newDoc.fileUrl}
                    onChange={(e) =>
                      setNewDoc((p) => ({ ...p, fileUrl: e.target.value }))
                    }
                  />
                </div>
              )}
              <div className="ui-form-group">
                <label className="ui-label">Description</label>
                <textarea
                  className="ui-input"
                  value={newDoc.description}
                  onChange={(e) =>
                    setNewDoc((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Add
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
