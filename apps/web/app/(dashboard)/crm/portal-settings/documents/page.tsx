// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import { FileText, Download, Trash2, Plus, Search } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

interface PortalDoc {
  id: string;
  customerId: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category?: string;
  isShared: boolean;
  expiresAt?: string;
  createdAt: string;
}

export default function PortalDocumentsPage() {
  const [docs, setDocs] = useState<PortalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    fileUrl: "",
    fileType: "PDF",
    fileSize: 0,
    customerId: "",
  });

  const load = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await apiGet(`/api/crm/portal/documents/${customerId}`);
      setDocs(Array.isArray(res) ? res : (res as any)?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) load();
  }, [customerId]);

  const uploadDoc = async () => {
    await apiSend(
      `/api/crm/portal/documents/${uploadForm.customerId}`,
      "POST",
      {
        ...uploadForm,
        customerId: uploadForm.customerId,
      },
    );
    setShowUpload(false);
    setUploadForm({
      name: "",
      fileUrl: "",
      fileType: "PDF",
      fileSize: 0,
      customerId: "",
    });
    load();
  };

  const deleteDoc = async (id: string) => {
    await apiSend(`/api/crm/portal/documents/${id}`, "DELETE");
    load();
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Portal Documents"
        description="Manage documents shared with customers"
        breadcrumbs={[
          { label: "Portal Settings", href: "/crm/portal-settings" },
          { label: "Documents" },
        ]}
      />
      <div className="ui-flex ui-gap-2 ui-mb-4">
        <div className="ui-input-group" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={16} />
          <input
            className="ui-input"
            placeholder="Customer ID..."
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowUpload(true)} disabled={!customerId}>
          <Plus size={14} /> Upload
        </Button>
      </div>

      {showUpload && (
        <Card className="ui-mb-4">
          <div className="ui-card-body">
            <h3 className="ui-card-title">Upload Document</h3>
            <div className="ui-form-group">
              <label className="ui-label">Name</label>
              <input
                className="ui-input"
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, name: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">File URL</label>
              <input
                className="ui-input"
                value={uploadForm.fileUrl}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, fileUrl: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">File Type</label>
              <select
                className="ui-input"
                value={uploadForm.fileType}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, fileType: e.target.value })
                }
              >
                <option>PDF</option>
                <option>DOCX</option>
                <option>XLSX</option>
                <option>IMAGE</option>
                <option>OTHER</option>
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">File Size (bytes)</label>
              <input
                className="ui-input"
                type="number"
                value={uploadForm.fileSize}
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    fileSize: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="ui-flex ui-gap-2">
              <Button onClick={uploadDoc}>Upload</Button>
              <Button variant="ghost" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="ui-card-body p-0">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Customer</th>
                  <th>Shared</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <FileText size={14} /> {d.name}
                    </td>
                    <td>
                      <Badge>{d.fileType}</Badge>
                    </td>
                    <td className="ui-text-xs">
                      {(d.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="ui-text-xs">
                      {d.customerId.substring(0, 8)}
                    </td>
                    <td>{d.isShared ? "Yes" : "No"}</td>
                    <td>
                      <div className="ui-flex ui-gap-1">
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          className="ui-btn-icon"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          className="ui-btn-icon"
                          onClick={() => deleteDoc(d.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {docs.length === 0 && (
              <p className="ui-p-3 ui-text-sm text-muted">No documents found</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
