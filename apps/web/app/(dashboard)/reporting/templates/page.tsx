"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { FileText, Plus, Layout, Settings } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function ReportingTemplatesPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const toast = useToast();

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/reporting/templates-deep/templates",
      );
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Report Templates",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async () => {
    try {
      if (!title) {
        toast.error("Validation Error", "Template title is required");
        return;
      }
      await client.post("/reporting/templates-deep/templates", {
        title,
        category: "FINANCIAL",
        layoutHtml: "<div><h1>Custom Report Header</h1></div>",
      });
      toast.success(
        "Template Created",
        `Report template "${title}" created successfully.`,
      );
      setTitle("");
      loadTemplates();
    } catch (err) {
      toast.error(
        "Failed to create template",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Pixel-Perfect Enterprise Report Template Designer"
        description="Build custom HTML/PDF financial report templates, add multi-section SQL queries, and configure corporate styling."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Create New Report Template
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Report Template Title (e.g. Executive Balance Sheet & P&L)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleCreate}>Create Template</Button>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {templates.length === 0 ? (
          <Card
            style={{
              padding: "32px",
              gridColumn: "1 / -1",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--color-text-secondary)" }}>
              No custom report templates available.
            </p>
          </Card>
        ) : (
          templates.map((t) => (
            <Card key={t.id} style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <FileText size={18} color="var(--color-primary)" />
                  <h4 style={{ fontSize: "15px", fontWeight: 600 }}>
                    {t.title}
                  </h4>
                </div>
                <Badge variant="info">{t.category}</Badge>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  margin: "8px 0 16px 0",
                }}
              >
                Created on {new Date(t.createdAt).toLocaleDateString()}
              </p>
              <Button size="sm" variant="outline" style={{ width: "100%" }}>
                Design Layout
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
