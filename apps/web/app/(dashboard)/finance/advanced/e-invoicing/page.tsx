"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import {
  FileText,
  Loader2,
  FileCheck2,
  X,
  Copy,
  ShieldCheck,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  totalAmount: number | string;
  customer?: { name: string } | null;
  customerName?: string | null;
}

interface EInvoice {
  id: string;
  invoiceId: string;
  format: string;
  status: string;
  irn: string | null;
  qrPayload: string | null;
  documentXml: string;
  createdAt: string;
}

const ADV = "/advanced-finance";
const FIN = "/finance";
const FORMATS = ["UBL", "PEPPOL", "GST_IRN"];

export default function EInvoicingPage() {
  const client = useApiClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [docs, setDocs] = useState<EInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [format, setFormat] = useState("UBL");
  const [viewDoc, setViewDoc] = useState<EInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [invRes, docRes] = await Promise.all([
        client.get<Invoice[] | { data?: Invoice[] }>(
          `${FIN}/invoices?limit=100`,
        ),
        client.get<EInvoice[]>(`${ADV}/e-invoices`),
      ]);
      setInvoices(Array.isArray(invRes) ? invRes : invRes.data || []);
      setDocs(docRes);
    } catch {
      setError("Could not reach the finance service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const generate = async (invoiceId: string) => {
    setGeneratingId(invoiceId);
    setError(null);
    try {
      const doc = await client.post<EInvoice>(`${ADV}/e-invoices/generate`, {
        invoiceId,
        format,
      });
      setViewDoc(doc);
      await fetchData();
    } catch {
      setError("Could not reach the finance service.");
    } finally {
      setGeneratingId(null);
    }
  };

  const docFor = (invoiceId: string) =>
    docs.filter((d) => d.invoiceId === invoiceId);
  const money = (v: number | string) =>
    Number(v).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (loading)
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );

  return (
    <RouteGuard permission="finance.e-invoicing.read">
      <div className="p-8 ui-stack-6">
        <div className={styles.s1}>
          <div>
            <h1 className="text-3xl">E-Invoicing</h1>
            <p className="ui-text-muted mt-1">
              Generate standards-compliant legal e-invoices (UBL 2.1 / PEPPOL
              BIS / India GST IRN).
            </p>
          </div>
          <div className={styles.s2}>
            <div className="space-y-1">
              <label className={styles.s3}>Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={`h-10 w-44 border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring ${styles.s4}`}
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f === "GST_IRN" ? "India GST (IRN)" : f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div
            className={`border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 ${styles.s5}`}
          >
            {error}
          </div>
        )}

        <Card>
          <div className="p-6">
            <h3 className={styles.s6}>Invoices</h3>
          </div>
          <div className={styles.s7}>
            {(() => {
              const invoiceColumns: ListColumn[] = [
                {
                  key: "invoiceNumber",
                  header: "Invoice #",
                  render: (v) => (
                    <span className="font-medium">{v as string}</span>
                  ),
                },
                {
                  key: "customer",
                  header: "Customer",
                  render: (_v, row) => {
                    const inv = row as unknown as Invoice;
                    return (
                      <span>
                        {inv.customer?.name || inv.customerName || "—"}
                      </span>
                    );
                  },
                },
                {
                  key: "status",
                  header: "Status",
                  render: (v) => (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(v as string) === "DRAFT" ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}
                    >
                      {v as string}
                    </span>
                  ),
                },
                {
                  key: "totalAmount",
                  header: "Total",
                  render: (v, row) => (
                    <span className={styles.s8}>
                      {(row as unknown as Invoice).currency}{" "}
                      {money(v as number | string)}
                    </span>
                  ),
                },
                {
                  key: "id",
                  header: "E-Invoices",
                  render: (v) => (
                    <div className={styles.s9}>
                      {docFor(v as string).map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setViewDoc(d)}
                          className={`py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 ${styles.s10}`}
                        >
                          <FileCheck2 className="h-3 w-3" /> {d.format}
                        </button>
                      ))}
                      {docFor(v as string).length === 0 && (
                        <span className="ui-text-xs-muted">none</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: "id",
                  header: "Action",
                  render: (v, row) => {
                    const inv = row as unknown as Invoice;
                    return (
                      <div className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            generatingId === (v as string) ||
                            inv.status === "DRAFT"
                          }
                          onClick={() => generate(v as string)}
                        >
                          {generatingId === (v as string) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <FileText className="mr-1 h-4 w-4" /> Generate
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  },
                },
              ];
              return (
                <ListPageTemplate
                  columns={invoiceColumns}
                  data={invoices as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No Invoices"
                  emptyDescription="No invoices found."
                  searchable
                />
              );
            })()}
          </div>
        </Card>

        {/* Document viewer */}
        {viewDoc && (
          <div className={styles.s11} onClick={() => setViewDoc(null)}>
            <div className={styles.s12} onClick={(e) => e.stopPropagation()}>
              <div className={styles.s13}>
                <div className="ui-hstack-2">
                  <ShieldCheck className={styles.s14} />
                  <h3 className="font-semibold">{viewDoc.format} E-Invoice</h3>
                  <span className={styles.s15}>{viewDoc.status}</span>
                </div>
                <button
                  onClick={() => setViewDoc(null)}
                  className="hover:text-foreground ui-text-muted"
                >
                  <X className={styles.s16} />
                </button>
              </div>
              <div className="p-5 ui-stack-4">
                {viewDoc.irn && (
                  <div>
                    <div className={styles.s17}>
                      IRN (Invoice Reference Number)
                    </div>
                    <div className={styles.s18}>{viewDoc.irn}</div>
                  </div>
                )}
                {viewDoc.qrPayload && (
                  <div>
                    <div className={styles.s17}>Signed QR Payload</div>
                    <div className={styles.s18}>{viewDoc.qrPayload}</div>
                  </div>
                )}
                <div>
                  <div className={styles.s19}>
                    <div className={styles.s3}>Structured Document</div>
                    <button
                      onClick={() =>
                        navigator.clipboard?.writeText(viewDoc.documentXml)
                      }
                      className={`hover:underline ${styles.s20}`}
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <pre className={styles.s21}>{viewDoc.documentXml}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
