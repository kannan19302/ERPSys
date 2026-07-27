"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import {
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
} from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function ReportingExportsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [exportsList, setExportsList] = useState<any[]>([]);
  const [reportType, setReportType] = useState("FINANCIAL_AUDIT");
  const toast = useToast();

  const loadExports = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>("/reporting/exports-deep/jobs");
      setExportsList(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Export Jobs",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExports();
  }, []);

  const handleRequestExport = async (format: string) => {
    try {
      await client.post("/reporting/exports-deep/jobs", {
        reportType,
        exportFormat: format,
      });
      toast.success("Export Ready", `Instant ${format} export generated.`);
      loadExports();
    } catch (err) {
      toast.error(
        "Failed to generate export",
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
        title="High-Volume Multi-Format Report Export Hub"
        description="Generate on-demand exports in PDF, Excel XLSX, CSV, and XML formats with secure download URLs."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Request Instant On-Demand Export
        </h3>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          >
            <option value="FINANCIAL_AUDIT">Financial Audit Trail</option>
            <option value="INVENTORY_VALUATION">
              Inventory Valuation Report
            </option>
            <option value="HR_PAYROLL_SUMMARY">HR Payroll Summary</option>
            <option value="TAX_COMPLIANCE">Tax Compliance Summary</option>
          </select>

          <Button onClick={() => handleRequestExport("PDF")}>Export PDF</Button>
          <Button
            variant="outline"
            onClick={() => handleRequestExport("EXCEL")}
          >
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleRequestExport("CSV")}>
            Export CSV
          </Button>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Export Download History
        </h3>
        {exportsList.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No report exports generated.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Report Type</th>
                <th style={{ padding: "12px" }}>Format</th>
                <th style={{ padding: "12px" }}>Status</th>
                <th style={{ padding: "12px" }}>Download</th>
              </tr>
            </thead>
            <tbody>
              {exportsList.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {e.reportType}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="info">{e.exportFormat}</Badge>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="success">{e.status}</Badge>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Button size="sm" variant="ghost">
                      <Download size={14} style={{ marginRight: "6px" }} />{" "}
                      Download File
                    </Button>
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
