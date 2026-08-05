"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";

export default function SalesDocumentsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [generations, setGenerations] = useState<any[]>([]);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [tmplData, genData] = await Promise.all([
        client.get<any[]>("/sales/documents-deep/templates"),
        client.get<any[]>("/sales/documents-deep/generations"),
      ]);
      setTemplates(Array.isArray(tmplData) ? tmplData : []);
      setGenerations(Array.isArray(genData) ? genData : []);
    } catch (err) {
      toast.error(
        "Failed to load Sales Documents",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        title="Proposal & Contract Document Engine"
        description="Dynamic document generation, proposal templates, and e-signature tracking."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "24px",
          margin: "24px 0",
        }}
      >
        <Card style={{ padding: "20px" }}>
          <h3
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}
          >
            Document Templates
          </h3>
          {templates.length === 0 ? (
            <p
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              No proposal templates configured.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  style={{
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>
                    {tmpl.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {tmpl.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: "20px" }}>
          <h3
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}
          >
            Generated Proposals & Contracts
          </h3>
          {generations.length === 0 ? (
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-secondary)",
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              No generated documents yet.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "10px 12px" }}>Document Title</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                  <th style={{ padding: "10px 12px" }}>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {generations.map((g) => (
                  <tr key={g.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                      {g.title}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Badge
                        variant={
                          g.status === "SIGNED"
                            ? "success"
                            : g.status === "SENT"
                              ? "info"
                              : "default"
                        }
                      >
                        {g.status}
                      </Badge>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {new Date(g.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
