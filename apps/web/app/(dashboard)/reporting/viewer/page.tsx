"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { Share2, Eye, Filter, Layers } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function ReportingViewerPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [reportTitle, setReportTitle] = useState("");
  const toast = useToast();

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/reporting/interactive-viewer-deep/sessions",
      );
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load viewer sessions",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCreateSession = async () => {
    try {
      if (!reportTitle) {
        toast.error("Validation Error", "Report title is required");
        return;
      }
      const res = await client.post<any>(
        "/reporting/interactive-viewer-deep/sessions",
        {
          reportTitle,
          interactiveMode: "DRILL_DOWN",
        },
      );
      toast.success("Session Created", `Shareable link: ${res.shareableLink}`);
      setReportTitle("");
      loadSessions();
    } catch (err) {
      toast.error(
        "Failed to create session",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading)
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

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Interactive Report Viewer & Shareable Link Generator"
        description="Launch drill-down interactive report sessions, generate encrypted shareable URLs for stakeholders."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Create Shareable Report Session
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Report Title (e.g. Board Q3 Quarterly Business Review)..."
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleCreateSession}>
            <Share2 size={14} style={{ marginRight: "6px" }} /> Generate Link
          </Button>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Active Viewer Sessions
        </h3>
        {sessions.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No active interactive sessions.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Report Title</th>
                <th style={{ padding: "12px" }}>Mode</th>
                <th style={{ padding: "12px" }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {s.reportTitle}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="info">{s.interactiveMode}</Badge>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
