"use client";

import { useState } from "react";
import {
  Badge,
  Card,
  PageHeader,
  Button,
  useToast,
  DataTable,
  Input,
  type Column,
} from "@unerp/ui";
import { Calculator, BarChart3, History, Layers } from "lucide-react";

export default function CpqQuoteAnalysisPage() {
  const { addToast } = useToast();
  const [quotationId, setQuotationId] = useState("");
  const [margin, setMargin] = useState<Record<string, unknown> | null>(null);
  const [versions, setVersions] = useState<Array<Record<string, unknown>>>([]);
  const [history, setHistory] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [diff, setDiff] = useState<Record<string, unknown> | null>(null);

  const fetchMargin = async () => {
    if (!quotationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/cpq/quote-margin/${quotationId}`);
      if (res.ok) setMargin(await res.json());
      else addToast("No margin found for this quote", "warning");
    } catch {
      addToast("Failed to fetch margin", "error");
    }
    setLoading(false);
  };

  const fetchVersions = async () => {
    if (!quotationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/cpq/quote-versions/${quotationId}`);
      if (res.ok) setVersions(await res.json());
      else addToast("No versions found", "warning");
    } catch {
      addToast("Failed to fetch versions", "error");
    }
    setLoading(false);
  };

  const fetchHistory = async () => {
    if (!quotationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/cpq/quote-history/${quotationId}`);
      if (res.ok) setHistory(await res.json());
      else addToast("No history found", "warning");
    } catch {
      addToast("Failed to fetch history", "error");
    }
    setLoading(false);
  };

  const compareVersions = async () => {
    if (!quotationId || !compareA || !compareB) return;
    try {
      const res = await fetch(
        `/api/crm/cpq/quote-versions/${quotationId}/compare/${compareA}/${compareB}`,
      );
      if (res.ok) setDiff(await res.json());
      else addToast("Failed to compare versions", "error");
    } catch {
      addToast("Comparison failed", "error");
    }
  };

  const versionColumns: Column[] = [
    { key: "versionNumber", label: "Version" },
    {
      key: "subtotal",
      label: "Subtotal",
      render: (v: unknown) => `$${Number(v).toFixed(2)}`,
    },
    {
      key: "totalDiscount",
      label: "Discount",
      render: (v: unknown) => `$${Number(v).toFixed(2)}`,
    },
    {
      key: "grandTotal",
      label: "Grand Total",
      render: (v: unknown) => `$${Number(v).toFixed(2)}`,
    },
    { key: "changeNote", label: "Change Note" },
    {
      key: "createdAt",
      label: "Created",
      render: (v: unknown) =>
        v ? new Date(v as string).toLocaleDateString() : "-",
    },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Quote Analysis"
        description="Analyze quote margins, compare versions, and view quote history"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "CPQ & Quoting", href: "/crm/cpq" },
          { label: "Quote Analysis" },
        ]}
      />

      <Card>
        <div className="ui-card-header">
          <h3 className="ui-text-md ui-font-semibold">Quotation ID Lookup</h3>
        </div>
        <div className="ui-flex-row ui-gap-2" style={{ padding: "1rem" }}>
          <Input
            placeholder="Enter quotation ID..."
            value={quotationId}
            onChange={(e) => setQuotationId(e.target.value)}
            className="ui-input"
            style={{ flex: 1 }}
          />
          <Button
            size="sm"
            onClick={fetchMargin}
            disabled={loading || !quotationId}
          >
            <Calculator size={14} /> Margin
          </Button>
          <Button
            size="sm"
            onClick={fetchVersions}
            disabled={loading || !quotationId}
          >
            <Layers size={14} /> Versions
          </Button>
          <Button
            size="sm"
            onClick={fetchHistory}
            disabled={loading || !quotationId}
          >
            <History size={14} /> History
          </Button>
        </div>
      </Card>

      {margin && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-text-md ui-font-semibold">
              Quote Margin <BarChart3 size={16} />
            </h3>
          </div>
          <div className="ui-grid-3" style={{ padding: "1rem" }}>
            <div>
              <strong>Total Cost:</strong> $
              {Number(margin.totalCost).toFixed(2)}
            </div>
            <div>
              <strong>Total Price:</strong> $
              {Number(margin.totalPrice).toFixed(2)}
            </div>
            <div>
              <strong>Margin:</strong> ${Number(margin.marginAmount).toFixed(2)}{" "}
              ({Number(margin.marginPct).toFixed(1)}%)
            </div>
          </div>
        </Card>
      )}

      {versions.length > 0 && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-text-md ui-font-semibold">Quote Versions</h3>
          </div>
          <DataTable columns={versionColumns} data={versions} />

          <div className="ui-card-header" style={{ marginTop: "1rem" }}>
            <h3 className="ui-text-md ui-font-semibold">Compare Versions</h3>
          </div>
          <div className="ui-flex-row ui-gap-2" style={{ padding: "1rem" }}>
            <Input
              placeholder="Version A ID"
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
              className="ui-input"
            />
            <Input
              placeholder="Version B ID"
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
              className="ui-input"
            />
            <Button
              size="sm"
              onClick={compareVersions}
              disabled={!compareA || !compareB}
            >
              Compare
            </Button>
          </div>

          {diff && (
            <div className="ui-stack-2" style={{ padding: "1rem" }}>
              <div>
                <strong>Has Changes:</strong>{" "}
                {(diff as Record<string, unknown>).hasChanges ? (
                  <Badge variant="warning">Yes</Badge>
                ) : (
                  <Badge variant="success">No</Badge>
                )}
              </div>
              {(
                (diff as Record<string, unknown>).differences as Array<{
                  field: string;
                  from: number;
                  to: number;
                }>
              )?.map(
                (d: { field: string; from: number; to: number }, i: number) => (
                  <div key={i} className="ui-text-sm">
                    <strong>{d.field}:</strong> ${Number(d.from).toFixed(2)} → $
                    {Number(d.to).toFixed(2)}
                  </div>
                ),
              )}
            </div>
          )}
        </Card>
      )}

      {history && (
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-text-md ui-font-semibold">
              Quote History Summary
            </h3>
          </div>
          <div className="ui-grid-2" style={{ padding: "1rem" }}>
            <div>
              <strong>Versions:</strong>{" "}
              {(history as Record<string, unknown>).versionCount as number}
            </div>
            <div>
              <strong>Margin Calculations:</strong>{" "}
              {(history as Record<string, unknown>).marginCount as number}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
