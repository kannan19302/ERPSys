"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { Upload, XCircle, FileText } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

interface ImportLog {
  id: string;
  importType: string;
  fileName: string;
  fileFormat: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  status: string;
  createdAt: string;
}

export default function ImportPage() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({
    importType: "CUSTOMER",
    fileName: "",
    fileFormat: "CSV" as const,
    totalRows: 0,
    fileData: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ data: ImportLog[] }>("/crm/data/imports");
      setLogs((data as any)?.data ?? []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startImport = async () => {
    await apiSend("/crm/data/import", "POST", form);
    setShowImport(false);
    setForm({
      importType: "CUSTOMER",
      fileName: "",
      fileFormat: "CSV",
      totalRows: 0,
      fileData: "",
    });
    load();
  };

  const cancelImport = async (id: string) => {
    if (confirm("Cancel this import?")) {
      await apiSend(`/crm/data/imports/${id}/cancel`, "POST");
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Data Imports"
        description="Import CRM data from CSV or JSON files"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowImport(true)}
          >
            <Upload className="w-4 h-4 mr-1" />
            Import Data
          </Button>
        }
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Data Management", href: "/crm/data-management" },
          { label: "Imports" },
        ]}
      />

      {showImport && (
        <Card className="p-4">
          <div className="ui-form-group space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Import Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={form.importType}
                onChange={(e) =>
                  setForm({ ...form, importType: e.target.value })
                }
              >
                <option value="CUSTOMER">Customers</option>
                <option value="LEAD">Leads</option>
                <option value="CONTACT">Contacts</option>
                <option value="OPPORTUNITY">Opportunities</option>
                <option value="PRODUCT">Products</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Name
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={form.fileName}
                onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                placeholder="customers.csv"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Rows
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={form.totalRows}
                onChange={(e) =>
                  setForm({ ...form, totalRows: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Data (CSV/JSON)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={5}
                value={form.fileData}
                onChange={(e) => setForm({ ...form, fileData: e.target.value })}
                placeholder="name,email&#10;test@test.com"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={startImport}>
                Start Import
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowImport(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400">No imports yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="pb-2">File</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Rows</th>
                <th className="pb-2">Success</th>
                <th className="pb-2">Errors</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    {log.fileName}
                  </td>
                  <td className="py-2">{log.importType}</td>
                  <td className="py-2">{log.totalRows}</td>
                  <td className="py-2 text-green-600">{log.successRows}</td>
                  <td className="py-2 text-red-600">{log.errorRows}</td>
                  <td className="py-2">
                    <Badge
                      variant={
                        log.status === "COMPLETED"
                          ? "success"
                          : log.status === "FAILED"
                            ? "error"
                            : "warning"
                      }
                    >
                      {log.status}
                    </Badge>
                  </td>
                  <td className="py-2">
                    {(log.status === "PENDING" ||
                      log.status === "PROCESSING") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelImport(log.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
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
