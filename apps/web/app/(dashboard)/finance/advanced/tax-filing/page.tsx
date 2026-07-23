"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  CheckCircle,
  FileText,
  Send,
  Loader2,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface TaxFiling {
  id: string;
  filingType: string;
  periodStart: string;
  periodEnd: string;
  status: string;
}

export default function TaxFilingPage() {
  const client = useApiClient();
  const [filings, setFilings] = useState<TaxFiling[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFilingForm, setShowFilingForm] = useState(false);
  const [filingData, setFilingData] = useState({
    filingType: "",
    periodStart: "",
    periodEnd: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFilings(
        await client.get<TaxFiling[]>("/advanced-finance/tax-filings"),
      );
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFiling = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/advanced-finance/tax-filings", {
        filingType: filingData.filingType,
        periodStart: filingData.periodStart,
        periodEnd: filingData.periodEnd,
        status: "DRAFT",
      });
      {
        setShowFilingForm(false);
        setFilingData({ filingType: "", periodStart: "", periodEnd: "" });
        fetchData();
      }
    } catch {}
  };

  if (loading)
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );

  return (
    <RouteGuard permission="finance.tax-filing.read">
      <div className="p-8 ui-stack-6">
        <div className="ui-flex-between">
          <div>
            <h1 className="text-3xl">Tax Filings & Compliance</h1>
            <p className="ui-text-muted mt-1">
              Generate regulatory compliance payloads and file returns.
            </p>
          </div>
          <Button onClick={() => setShowFilingForm(!showFilingForm)}>
            <Send className="mr-2" />
            Prepare New Return
          </Button>
        </div>

        {showFilingForm && (
          <Card className="border-primary/20">
            <div className="p-6">
              <h3 className={styles.s1}>Prepare Statutory Return</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateFiling} className="ui-stack-4">
                <div className="ui-grid-3">
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Return Type</label>
                    <select
                      className="ui-field-line"
                      required
                      value={filingData.filingType}
                      onChange={(e) =>
                        setFilingData({
                          ...filingData,
                          filingType: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Return Type</option>
                      <option value="GST-3B">GST-3B Returns</option>
                      <option value="GSTR-1">GSTR-1 Sales</option>
                      <option value="VAT-Return">VAT Quarterly Return</option>
                      <option value="TDS-26Q">TDS Section 26Q</option>
                    </select>
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Period Start</label>
                    <input
                      className="ui-field-line"
                      type="date"
                      required
                      value={filingData.periodStart}
                      onChange={(e) =>
                        setFilingData({
                          ...filingData,
                          periodStart: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Period End</label>
                    <input
                      className="ui-field-line"
                      type="date"
                      required
                      value={filingData.periodEnd}
                      onChange={(e) =>
                        setFilingData({
                          ...filingData,
                          periodEnd: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilingForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Generate Return Draft</Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        <Card className="ui-flex-col">
          <div className={styles.s2}>
            <div className="ui-hstack-3">
              <div
                className={`bg-indigo-100 dark:bg-indigo-900/30 ${styles.s3}`}
              >
                <UploadCloud
                  className={`text-indigo-700 dark:text-indigo-400 ${styles.s4}`}
                />
              </div>
              <div>
                <h3 className="ui-heading-lg">Statutory Filing Register</h3>
                <p className="ui-text-sm-muted">
                  Historical and drafted compliance returns
                </p>
              </div>
            </div>
          </div>
          <div className={styles.s5}>
            {(() => {
              const filingColumns: ListColumn[] = [
                {
                  key: "filingType",
                  header: "Return Type",
                  render: (v) => (
                    <span className="font-bold">{v as string}</span>
                  ),
                },
                {
                  key: "periodStart",
                  header: "Period",
                  render: (v, row) => (
                    <span className="ui-text-muted">
                      {new Date(v as string).toLocaleDateString()} -{" "}
                      {new Date(
                        row["periodEnd"] as string,
                      ).toLocaleDateString()}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (v) =>
                    (v as string) === "FILED" ? (
                      <span
                        className={`dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-1 ${styles.s6}`}
                      >
                        <CheckCircle className="h-3 w-3" /> FILED
                      </span>
                    ) : (
                      <span
                        className={`text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 py-1 ${styles.s7}`}
                      >
                        {v as string}
                      </span>
                    ),
                },
                {
                  key: "id",
                  header: "Actions",
                  render: (_, row) => (
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alert(JSON.stringify(row, null, 2))}
                      >
                        View Payload
                      </Button>
                    </div>
                  ),
                },
              ];
              return (
                <ListPageTemplate
                  columns={filingColumns}
                  data={filings as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No Statutory Filings"
                  emptyDescription="No statutory filings found for this period."
                  searchable
                />
              );
            })()}
          </div>
        </Card>
      </div>
    </RouteGuard>
  );
}
