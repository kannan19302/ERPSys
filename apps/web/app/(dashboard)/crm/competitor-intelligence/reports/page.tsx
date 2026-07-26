"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { Plus, Eye, Edit3, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { apiGet, apiSend } from "../../_components/api";

export default function CompetitorReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ severity: "", reportType: "" });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    competitorId: "",
    title: "",
    content: "",
    reportType: "SWOT",
    source: "INTERNAL",
    severity: "INFO",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.severity) params.set("severity", filter.severity);
      if (filter.reportType) params.set("reportType", filter.reportType);
      const data = await apiGet(
        `/crm/competitor-intelligence/reports?${params}`,
      );
      setReports(Array.isArray(data) ? data : []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async () => {
    try {
      if (editId) {
        await apiSend(
          `/crm/competitor-intelligence/reports/${editId}`,
          "PUT",
          form,
        );
      } else {
        await apiSend("/crm/competitor-intelligence/reports", "POST", form);
      }
      setShowForm(false);
      setEditId(null);
      setForm({
        competitorId: "",
        title: "",
        content: "",
        reportType: "SWOT",
        source: "INTERNAL",
        severity: "INFO",
      });
      load();
    } catch (e) {
      console.error(e);
    }
  }, [form, editId, load]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await apiSend(`/crm/competitor-intelligence/reports/${id}`, "DELETE");
        load();
      } catch (e) {
        console.error(e);
      }
    },
    [load],
  );

  const markRead = useCallback(
    async (id: string) => {
      try {
        await apiSend(
          `/crm/competitor-intelligence/reports/${id}/read`,
          "POST",
        );
        load();
      } catch (e) {
        console.error(e);
      }
    },
    [load],
  );

  return (
    <div className="ui-page">
      <PageHeader
        title="Intelligence Reports"
        description="Competitor intelligence reports and analysis"
      />

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <Button
          onClick={() => {
            setShowForm(true);
            setEditId(null);
          }}
        >
          <Plus size={16} /> New Report
        </Button>
        <select
          className="ui-input"
          style={{ width: 150 }}
          value={filter.severity}
          onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
        >
          <option value="">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          className="ui-input"
          style={{ width: 180 }}
          value={filter.reportType}
          onChange={(e) => setFilter({ ...filter, reportType: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="SWOT">SWOT</option>
          <option value="PRICING">Pricing</option>
          <option value="PRODUCT_COMPARISON">Product Comparison</option>
          <option value="MARKET_UPDATE">Market Update</option>
          <option value="NEWS">News</option>
        </select>
      </div>

      {showForm && (
        <Card style={{ marginBottom: "1rem" }}>
          <div className="ui-card-header">
            <h3 className="ui-card-title">{editId ? "Edit" : "New"} Report</h3>
          </div>
          <div className="ui-card-body">
            <div className="ui-form-group">
              <label className="ui-label">Competitor ID</label>
              <input
                className="ui-input"
                value={form.competitorId}
                onChange={(e) =>
                  setForm({ ...form, competitorId: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Title</label>
              <input
                className="ui-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Content</label>
              <textarea
                className="ui-input"
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Type</label>
              <select
                className="ui-input"
                value={form.reportType}
                onChange={(e) =>
                  setForm({ ...form, reportType: e.target.value })
                }
              >
                <option value="SWOT">SWOT</option>
                <option value="PRICING">Pricing</option>
                <option value="PRODUCT_COMPARISON">Product Comparison</option>
                <option value="MARKET_UPDATE">Market Update</option>
                <option value="NEWS">News</option>
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Severity</label>
              <select
                className="ui-input"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button onClick={save}>Save</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading && <Spinner />}

      <Card>
        <div className="ui-card-header">
          <h3 className="ui-card-title">Reports ({reports.length})</h3>
        </div>
        <div className="ui-card-body">
          {reports.map((r: any) => (
            <div
              key={r.id}
              style={{ padding: "0.75rem 0", borderBottom: "1px solid #eee" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <strong>{r.title}</strong>
                    <Badge
                      variant={
                        r.severity === "CRITICAL"
                          ? "danger"
                          : r.severity === "WARNING"
                            ? "warning"
                            : "info"
                      }
                    >
                      {r.severity}
                    </Badge>
                    <Badge variant="info">
                      {r.reportType?.replace(/_/g, " ")}
                    </Badge>
                    {!r.isRead && (
                      <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      margin: "0.25rem 0 0",
                    }}
                  >
                    {r.competitor?.name} | Source: {r.source}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {!r.isRead && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => markRead(r.id)}
                    >
                      <Eye size={14} />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setForm({
                        competitorId: r.competitorId,
                        title: r.title,
                        content: r.content,
                        reportType: r.reportType,
                        source: r.source,
                        severity: r.severity,
                      });
                      setEditId(r.id);
                      setShowForm(true);
                    }}
                  >
                    <Edit3 size={14} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => remove(r.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!loading && reports.length === 0 && (
            <p style={{ color: "#666" }}>No reports found.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
