"use client";
import React, { useState } from "react";
import { Card, PageHeader, Button } from "@unerp/ui";
import { Download } from "lucide-react";
import { apiSend } from "../../_components/api";

export default function ExportPage() {
  const [entityType, setEntityType] = useState("LEAD");
  const [format, setFormat] = useState("CSV");
  const [exportResult, setExportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runExport = async () => {
    setLoading(true);
    try {
      const result = await apiSend("/crm/data/export", "POST", {
        entityType,
        format,
      });
      setExportResult(result);
    } catch (e: any) {
      setExportResult({ error: e.message || "Export failed" });
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!exportResult?.data) return;
    const blob = new Blob([exportResult.data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      exportResult.filename || `${entityType.toLowerCase()}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Export Data"
        description="Export your CRM data to CSV or JSON format"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Data Management", href: "/crm/data-management" },
          { label: "Export" },
        ]}
      />

      <Card title="Export Configuration">
        <div className="ui-form-group space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="LEAD">Leads</option>
              <option value="CONTACT">Contacts</option>
              <option value="CUSTOMER">Customers</option>
              <option value="OPPORTUNITY">Opportunities</option>
              <option value="CASE">Cases</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="CSV">CSV</option>
              <option value="JSON">JSON</option>
            </select>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={runExport}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-1" />
            {loading ? "Exporting..." : "Export"}
          </Button>
        </div>
      </Card>

      {exportResult && !exportResult.error && (
        <Card>
          <p className="text-sm text-green-600 mb-2">
            Export ready ({exportResult.format})
          </p>
          {exportResult.format === "csv" ? (
            <Button variant="primary" size="sm" onClick={downloadCsv}>
              Download CSV
            </Button>
          ) : (
            <pre className="text-xs bg-gray-50 p-3 rounded max-h-60 overflow-auto">
              {JSON.stringify(exportResult.data, null, 2)}
            </pre>
          )}
        </Card>
      )}

      {exportResult?.error && (
        <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
          {exportResult.error}
        </div>
      )}
    </div>
  );
}
