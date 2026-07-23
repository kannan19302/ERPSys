"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  Plus,
  RefreshCw,
  Layers,
  ArrowRight,
  Eye,
  Trash,
  Check,
  X,
  FileUp,
  Loader2,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface APInvoiceCapture {
  id: string;
  fileName: string;
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  totalAmount?: number;
  currency: string;
  confidenceScore: number;
  status: string;
  rawText?: string;
  matchingPurchaseOrderId?: string;
  notes?: string;
  createdAt: string;
  lines?: APInvoiceCaptureLine[];
  _count?: { lines: number };
}

interface APInvoiceCaptureLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  suggestedAccountId?: string;
  suggestedCostCenterId?: string;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorName: string;
  totalAmount: number;
  status: string;
}

const SIMULATED_INVOICES = [
  {
    name: "Globex Cloud Computing Invoice.pdf",
    text: `
      GLOBEX CORPORATION
      100 Enterprise Way, Silicon Valley, CA

      INVOICE TO:
      System Default Tenant

      INVOICE # : INV-GLO-2026-9872
      INVOICE DATE: 2026-07-01
      DUE DATE: 2026-07-31
      PO REFERENCE: PO-2026-0091

      LINE ITEMS:
      1. Cloud Subscription Services - Qty 1 - Unit Price $1500.00 - Total $1500.00

      TOTAL DUE: $1500.00
      CURRENCY: USD

      Thank you for your business!
    `,
  },
  {
    name: "Initech Office Supplies Inc.pdf",
    text: `
      INITECH OFFICE SUPPLIES
      4120 Freemont Blvd, Austin, TX

      BILL TO:
      System Default Tenant

      INVOICE NUMBER: INV-INI-8871
      DATE: 2026-07-03
      TERMS: Net 30

      DESCRIPTION:
      High-density office printers & ergonomic desks
      Total Amount: $840.50

      Please remit payment to account ending in x9821.
    `,
  },
];

export default function InvoiceCapturePage() {
  const client = useApiClient();
  const [captures, setCaptures] = useState<APInvoiceCapture[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [selectedCapture, setSelectedCapture] =
    useState<APInvoiceCapture | null>(null);
  const [lines, setLines] = useState<APInvoiceCaptureLine[]>([]);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Custom manual raw upload text input toggle
  const [showManualText, setShowManualText] = useState(false);
  const [manualText, setManualText] = useState("");
  const [manualFileName, setManualFileName] = useState("manual_invoice.txt");

  // Load baseline captures and options
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [captureData, accountData, purchaseOrderData] = await Promise.all([
        client.get<APInvoiceCapture[]>(
          "/advanced-finance/payables/invoices/capture",
        ),
        client.get<GLAccount[]>("/advanced-finance/accounts"),
        client.get<PurchaseOrder[]>("/procurement/purchase-orders"),
      ]);
      setCaptures(captureData);
      setAccounts(accountData);
      setPurchaseOrders(purchaseOrderData);
    } catch {
      setError("Failed to fetch invoice capture records");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load single capture detail
  const selectCapture = async (capture: APInvoiceCapture) => {
    setDetailLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await client.get<APInvoiceCapture>(
        `/advanced-finance/payables/invoices/capture/${capture.id}`,
      );
      setSelectedCapture(data);
      setLines(data.lines || []);
    } catch {
      setError("Failed to load invoice capture details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Upload/Simulate OCR Trigger
  const handleSimulateOCR = async (name: string, text: string) => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await client.post("/advanced-finance/payables/invoices/capture", {
        fileName: name,
        rawText: text,
      });
      setSuccess(`Successfully simulated OCR extraction for: ${name}`);
      setShowManualText(false);
      setManualText("");
      await fetchData();
    } catch {
      setError("Failed to simulate OCR capture");
    } finally {
      setActionLoading(false);
    }
  };

  // Update capture header field
  const handleUpdateHeader = async (field: string, value: string | number) => {
    if (!selectedCapture) return;
    try {
      const updated = await client.request<APInvoiceCapture>(
        `/advanced-finance/payables/invoices/capture/${selectedCapture.id}`,
        { method: "PATCH", body: JSON.stringify({ [field]: value }) },
      );
      setSelectedCapture(updated);
      setCaptures((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
      );
    } catch {
      setError("Failed to update field");
    }
  };

  // Update captured line cell
  const handleUpdateLine = async (
    lineId: string,
    updates: Partial<APInvoiceCaptureLine>,
  ) => {
    if (!selectedCapture) return;
    try {
      const updatedLine = await client.request<APInvoiceCaptureLine>(
        `/advanced-finance/payables/invoices/capture/${selectedCapture.id}/lines/${lineId}`,
        { method: "PATCH", body: JSON.stringify(updates) },
      );
      setLines((prev) => prev.map((l) => (l.id === lineId ? updatedLine : l)));
      const freshHeader = await client.get<APInvoiceCapture>(
        `/advanced-finance/payables/invoices/capture/${selectedCapture.id}`,
      );
      setSelectedCapture(freshHeader);
      setCaptures((prev) =>
        prev.map((c) =>
          c.id === freshHeader.id ? { ...c, ...freshHeader } : c,
        ),
      );
    } catch {
      setError("Failed to update line item");
    }
  };

  // Add line manually
  const handleAddLine = async () => {
    if (!selectedCapture) return;
    try {
      const newLine = await client.post<APInvoiceCaptureLine>(
        `/advanced-finance/payables/invoices/capture/${selectedCapture.id}/lines`,
        { description: "New Line Item", quantity: 1, unitPrice: 0 },
      );
      setLines((prev) => [...prev, newLine]);
      const freshHeader = await client.get<APInvoiceCapture>(
        `/advanced-finance/payables/invoices/capture/${selectedCapture.id}`,
      );
      setSelectedCapture(freshHeader);
      setCaptures((prev) =>
        prev.map((c) =>
          c.id === freshHeader.id ? { ...c, ...freshHeader } : c,
        ),
      );
    } catch {
      setError("Failed to add manual line item");
    }
  };

  // Delete line
  const handleDeleteLine = async (lineId: string) => {
    if (!selectedCapture) return;
    try {
      await client.delete(
        `/advanced-finance/payables/invoices/capture/${selectedCapture.id}/lines/${lineId}`,
      );
      setLines((prev) => prev.filter((l) => l.id !== lineId));
      const freshHeader = await client.get<APInvoiceCapture>(
        `/advanced-finance/payables/invoices/capture/${selectedCapture.id}`,
      );
      setSelectedCapture(freshHeader);
      setCaptures((prev) =>
        prev.map((c) =>
          c.id === freshHeader.id ? { ...c, ...freshHeader } : c,
        ),
      );
    } catch {
      setError("Failed to delete line item");
    }
  };

  // Auto-code Suggestions Trigger
  const handleAutoCode = async () => {
    if (!selectedCapture) return;
    setActionLoading(true);
    try {
      const fresh = await client.post<APInvoiceCapture>(
        `/advanced-finance/payables/invoices/capture/${selectedCapture.id}/auto-code`,
        {},
      );
      setSelectedCapture(fresh);
      setLines(fresh.lines || []);
      setSuccess(
        "Auto-coding suggestions generated successfully based on vendor transaction history!",
      );
    } catch {
      setError("Failed to query auto-code suggestions");
    } finally {
      setActionLoading(false);
    }
  };

  // Approve & Post
  const handleApprove = async () => {
    if (!selectedCapture) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await client.post(
        `/advanced-finance/payables/invoices/capture/${selectedCapture.id}/approve`,
        {},
      );
      setSuccess(
        "Invoice approved, double-entry GL journal posted, and status changed to PROCESSED successfully!",
      );
      setSelectedCapture(null);
      await fetchData();
    } catch {
      setError("Approval and ledger posting failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject
  const handleReject = async () => {
    if (!selectedCapture) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await client.post(
        `/advanced-finance/payables/invoices/capture/${selectedCapture.id}/reject`,
        {
          notes: selectedCapture.notes || "Rejected manually by AP specialist.",
        },
      );
      setSuccess("Invoice status set to REJECTED.");
      setSelectedCapture(null);
      await fetchData();
    } catch {
      setError("Reject request failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Capture
  const handleDeleteCapture = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm("Are you sure you want to delete this invoice capture record?")
    )
      return;
    setActionLoading(true);
    try {
      await client.delete(`/advanced-finance/payables/invoices/capture/${id}`);
      setSuccess("Capture record deleted successfully.");
      if (selectedCapture?.id === id) setSelectedCapture(null);
      await fetchData();
    } catch {
      setError("Deletion failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Stats computation
  const totalCount = captures.length;
  const reviewRequiredCount = captures.filter(
    (c) => c.status === "REVIEW_REQUIRED",
  ).length;
  const processedCount = captures.filter(
    (c) => c.status === "PROCESSED",
  ).length;
  const avgConfidence =
    captures.length > 0
      ? (
          (captures.reduce((s, c) => s + Number(c.confidenceScore), 0) /
            captures.length) *
          100
        ).toFixed(0)
      : "0";

  return (
    <RouteGuard permission="finance.invoice-capture.read">
      <div className="ui-content space-y-6">
        {/* Dynamic Page Header */}
        <div className="flex items-center justify-between border-b pb-4 border-gray-100">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              AI-Powered Invoice Capture
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Automated OCR parsing, PO matching, and intelligent double-entry
              GL auto-coding.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowManualText(!showManualText)}
              className="ui-btn flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              Paste Raw Invoice Text
            </Button>
            <Button
              variant="outline"
              onClick={fetchData}
              className="ui-btn p-2"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="ui-card p-5 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Scanned
            </span>
            <div className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              {totalCount}
            </div>
          </div>

          <div className="ui-card p-5 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Needs Review
            </span>
            <div className="text-2xl font-bold mt-2 flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              {reviewRequiredCount}
            </div>
          </div>

          <div className="ui-card p-5 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Auto-Billed / Posted
            </span>
            <div className="text-2xl font-bold mt-2 flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {processedCount}
            </div>
          </div>

          <div className="ui-card p-5 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Avg Confidence
            </span>
            <div className="text-2xl font-bold mt-2 flex items-center gap-2 text-indigo-600">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              {avgConfidence}%
            </div>
          </div>
        </div>

        {/* Alert banner */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 border border-red-200">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-3 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {/* Upload Simulations Dropzone */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 ui-card p-6 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-indigo-500" />
                OCR Document Upload Simulator
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Select one of the pre-loaded invoices below to simulate a real
                PDF document scanner extraction run:
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {SIMULATED_INVOICES.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSimulateOCR(item.name, item.text)}
                  className="p-4 border border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50/20 cursor-pointer transition flex flex-col justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-8 h-8 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-gray-800 line-clamp-1">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        Simulated raw PDF text stream
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center text-[10px] text-indigo-600 font-medium">
                    Trigger Scan Extraction
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Raw Text Area */}
          <div className="ui-card p-6 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Custom Manual Raw Text Parser
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter any free-form raw text block containing numbers, prices,
                and keywords.
              </p>
            </div>
            <div className="mt-3 flex-grow flex flex-col gap-2">
              <input
                type="text"
                value={manualFileName}
                onChange={(e) => setManualFileName(e.target.value)}
                placeholder="Filename (e.g. invoice.pdf)"
                className="ui-input text-xs w-full p-2 border rounded border-gray-300"
              />
              <textarea
                rows={4}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste raw OCR invoice text block here..."
                className="ui-input text-xs w-full flex-grow p-2 border rounded border-gray-300 resize-none font-mono"
              />
            </div>
            <div className="mt-3">
              <Button
                className="ui-btn w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 flex items-center justify-center gap-1.5"
                disabled={!manualText.trim()}
                onClick={() => handleSimulateOCR(manualFileName, manualText)}
              >
                Parse Text Block
              </Button>
            </div>
          </div>
        </div>

        {/* Main List Layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column: Scan Queue List */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800">
                Scan Queue & Capture Log
              </h3>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
                {captures.length} records
              </span>
            </div>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "fileName",
                    header: "File Name",
                    render: (v) => (
                      <span className="font-medium text-gray-900 max-w-[200px] truncate block">
                        {String(v)}
                      </span>
                    ),
                  },
                  {
                    key: "vendorName",
                    header: "Vendor / Invoice #",
                    render: (v, row) => (
                      <div>
                        <span className="block text-gray-800 font-medium">
                          {String(v || "Unknown Vendor")}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {String(row.invoiceNumber || "No invoice number")}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: "totalAmount",
                    header: "Total Amount",
                    render: (v, row) => (
                      <span className="font-semibold text-gray-900">
                        {v
                          ? `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "N/A"}{" "}
                        {String(row.currency || "")}
                      </span>
                    ),
                  },
                  {
                    key: "confidenceScore",
                    header: "Confidence",
                    render: (v) => {
                      const confidenceNum = Number(v) * 100;
                      const confidenceColor =
                        confidenceNum >= 90
                          ? "bg-emerald-500"
                          : confidenceNum >= 75
                            ? "bg-indigo-500"
                            : "bg-amber-500";
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${confidenceColor}`}
                              style={{ width: `${confidenceNum}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-700 text-[10px]">
                            {confidenceNum.toFixed(0)}%
                          </span>
                        </div>
                      );
                    },
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (v) => {
                      const statusClass =
                        v === "PROCESSED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : v === "REVIEW_REQUIRED"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : v === "REJECTED"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-gray-50 text-gray-600 border-gray-200";
                      return (
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${statusClass}`}
                        >
                          {String(v)}
                        </span>
                      );
                    },
                  },
                  {
                    key: "id",
                    header: "Actions",
                    render: (v, row) => (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectCapture(row as any);
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 border-none"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {row.status !== "PROCESSED" && (
                          <Button
                            variant="outline"
                            onClick={(e) => handleDeleteCapture(String(v), e)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100 border-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ] as ListColumn[]
              }
              data={captures as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No invoices captured"
              emptyDescription="No invoices captured yet. Use the simulator above to load test data."
            />
          </div>

          {/* Right Column: Detailed Review & Auto-Coding console */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-500" />
                Document Review Workspace
              </h3>
              {selectedCapture && (
                <span className="text-[10px] font-mono text-gray-400">
                  ID: {selectedCapture.id.slice(0, 8)}
                </span>
              )}
            </div>

            <div className="p-6 flex-grow overflow-y-auto space-y-6 max-h-[600px]">
              {!selectedCapture ? (
                <div className="text-center py-20 text-gray-400 text-xs">
                  Select an invoice from the queue list to load the workspace,
                  edit metadata, and approve posting.
                </div>
              ) : detailLoading ? (
                <div className="text-center py-20 text-gray-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  <span className="mt-2 block">
                    Fetching captured content...
                  </span>
                </div>
              ) : (
                <>
                  {/* Confidence banner */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
                      Number(selectedCapture.confidenceScore) >= 0.9
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : "bg-amber-50 border-amber-100 text-amber-800"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      OCR Confidence Rating:
                    </span>
                    <span className="font-bold">
                      {(Number(selectedCapture.confidenceScore) * 100).toFixed(
                        0,
                      )}
                      %
                    </span>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50 pb-1">
                      Captured Invoice Headers
                    </h4>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-gray-500 font-medium">
                          Vendor Name
                        </label>
                        <input
                          type="text"
                          value={selectedCapture.vendorName || ""}
                          onChange={(e) =>
                            handleUpdateHeader("vendorName", e.target.value)
                          }
                          className="w-full p-2 border border-gray-200 rounded focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-500 font-medium">
                          Invoice Number
                        </label>
                        <input
                          type="text"
                          value={selectedCapture.invoiceNumber || ""}
                          onChange={(e) =>
                            handleUpdateHeader("invoiceNumber", e.target.value)
                          }
                          className="w-full p-2 border border-gray-200 rounded focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-500 font-medium">
                          Invoice Date
                        </label>
                        <input
                          type="date"
                          value={
                            selectedCapture.invoiceDate
                              ? selectedCapture.invoiceDate.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdateHeader("invoiceDate", e.target.value)
                          }
                          className="w-full p-2 border border-gray-200 rounded focus:border-indigo-500 outline-none text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-500 font-medium">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={
                            selectedCapture.dueDate
                              ? selectedCapture.dueDate.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdateHeader("dueDate", e.target.value)
                          }
                          className="w-full p-2 border border-gray-200 rounded focus:border-indigo-500 outline-none text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-500 font-medium">
                          Total Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={selectedCapture.totalAmount || 0}
                          onChange={(e) =>
                            handleUpdateHeader(
                              "totalAmount",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-500 font-medium">
                          Purchase Order Match
                        </label>
                        <select
                          value={selectedCapture.matchingPurchaseOrderId || ""}
                          onChange={(e) =>
                            handleUpdateHeader(
                              "matchingPurchaseOrderId",
                              e.target.value,
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded focus:border-indigo-500 outline-none text-xs bg-white"
                        >
                          <option value="">-- Select PO Match --</option>
                          {purchaseOrders.map((po) => (
                            <option key={po.id} value={po.id}>
                              {po.orderNumber} ({po.vendorName} - $
                              {Number(po.totalAmount).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="text-gray-500 font-medium">
                        Review Audit Comments / Notes
                      </label>
                      <textarea
                        rows={2}
                        value={selectedCapture.notes || ""}
                        onChange={(e) =>
                          handleUpdateHeader("notes", e.target.value)
                        }
                        placeholder="Add compliance audit logs, approval comments, or exception notes..."
                        className="w-full p-2 border border-gray-200 rounded focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Line items list with Suggested Account Mapping dropdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-1">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Invoice Line Items & Accounts Mapping
                      </h4>
                      {selectedCapture.status !== "PROCESSED" && (
                        <Button
                          variant="outline"
                          onClick={handleAddLine}
                          className="p-1 border border-gray-200 text-indigo-600 hover:bg-indigo-50 text-[10px] flex items-center gap-1 font-medium"
                        >
                          <Plus className="w-3 h-3" />
                          Add Line
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {lines.map((line, idx) => (
                        <div
                          key={line.id}
                          className="p-3 border border-gray-150 rounded-lg bg-gray-50/50 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3 text-xs">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) =>
                                handleUpdateLine(line.id, {
                                  description: e.target.value,
                                })
                              }
                              disabled={selectedCapture.status === "PROCESSED"}
                              className="bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 font-medium text-gray-800 flex-grow py-0.5 outline-none"
                            />
                            {selectedCapture.status !== "PROCESSED" && (
                              <Button
                                variant="outline"
                                onClick={() => handleDeleteLine(line.id)}
                                className="p-1 border-none text-gray-400 hover:text-red-500 hover:bg-gray-100"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-[11px]">
                            <div className="space-y-0.5">
                              <span className="text-gray-400 font-medium">
                                Qty
                              </span>
                              <input
                                type="number"
                                value={line.quantity}
                                onChange={(e) =>
                                  handleUpdateLine(line.id, {
                                    quantity: parseFloat(e.target.value) || 0,
                                  })
                                }
                                disabled={
                                  selectedCapture.status === "PROCESSED"
                                }
                                className="w-full p-1 border rounded bg-white"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-gray-400 font-medium">
                                Price
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={line.unitPrice}
                                onChange={(e) =>
                                  handleUpdateLine(line.id, {
                                    unitPrice: parseFloat(e.target.value) || 0,
                                  })
                                }
                                disabled={
                                  selectedCapture.status === "PROCESSED"
                                }
                                className="w-full p-1 border rounded bg-white"
                              />
                            </div>
                            <div className="space-y-0.5 text-right pr-1">
                              <span className="text-gray-400 font-medium block">
                                Line Total
                              </span>
                              <span className="font-bold text-gray-800 block mt-1.5">
                                ${(line.quantity * line.unitPrice).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Suggested GL Account Select box */}
                          <div className="space-y-1 text-xs pt-1 border-t border-gray-100">
                            <label className="text-[10px] text-gray-500 font-medium flex items-center justify-between">
                              <span>Suggest Auto-Coded GL Account</span>
                              {!line.suggestedAccountId && (
                                <span className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5">
                                  <AlertCircle className="w-3 h-3" /> Required
                                </span>
                              )}
                            </label>
                            <select
                              value={line.suggestedAccountId || ""}
                              onChange={(e) =>
                                handleUpdateLine(line.id, {
                                  suggestedAccountId: e.target.value,
                                })
                              }
                              disabled={selectedCapture.status === "PROCESSED"}
                              className="w-full p-1.5 border border-gray-200 rounded text-xs bg-white"
                            >
                              <option value="">-- Choose Account --</option>
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  [{acc.code}] {acc.name} ({acc.type})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Raw text parser visual panel */}
                  {selectedCapture.rawText && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50 pb-1">
                        Raw Extracted OCR Payload
                      </h4>
                      <pre className="p-3 border border-gray-200 rounded-lg text-[10px] text-gray-600 bg-gray-50/50 max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
                        {selectedCapture.rawText}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action buttons footer */}
            {selectedCapture && selectedCapture.status !== "PROCESSED" && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="ui-btn text-red-600 border-red-200 hover:bg-red-50 flex-grow py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAutoCode}
                  disabled={actionLoading}
                  className="ui-btn border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <Sparkles className="w-4 h-4" />
                  Auto-Code GL
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="ui-btn bg-indigo-600 hover:bg-indigo-700 text-white flex-grow py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve & Post
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
