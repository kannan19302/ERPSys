"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  ListPageTemplate,
  type ListColumn,
  StatCardRow,
} from "@unerp/ui";
import {
  Loader2,
  RefreshCw,
  Zap,
  Link2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRightLeft,
  Info,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface Invoice {
  id: string;
  invoiceNumber: string;
  orgId: string;
  customerId: string;
  dueDate: string;
  totalAmount: number | string;
  currency: string;
  status: string;
}

interface PaymentSchedule {
  id: string;
  orgId: string;
  vendorId: string;
  dueDate: string;
  amount: number | string;
  status: string;
}

interface IntercompanyStats {
  totalTransactionsCount: number;
  eliminatedCount: number;
  matchedCount: number;
  pendingCount: number;
  totalNettedVolume: number;
  pendingNettingVolume: number;
  pendingMatchVolume: number;
}

const API_BASE = "/advanced-finance";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function IntercompanyNettingPage() {
  const client = useApiClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [stats, setStats] = useState<IntercompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  // Manual matching selection
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [matchDescription, setMatchDescription] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invoiceData, scheduleData, statsData] = await Promise.all([
        client.get<Invoice[] | { items?: Invoice[] }>("/finance/invoices"),
        client.get<PaymentSchedule[] | { items?: PaymentSchedule[] }>(
          `${API_BASE}/treasury/payment-schedules`,
        ),
        client.get<IntercompanyStats>(`${API_BASE}/intercompany/stats`),
      ]);
      const invoiceList = Array.isArray(invoiceData)
        ? invoiceData
        : invoiceData.items || [];
      const scheduleList = Array.isArray(scheduleData)
        ? scheduleData
        : scheduleData.items || [];
      setInvoices(invoiceList.filter((invoice) => invoice.status !== "PAID"));
      setSchedules(
        scheduleList.filter((schedule) => schedule.status !== "PAID"),
      );
      setStats(statsData);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAutoMatch = async () => {
    setMatching(true);
    try {
      const result = await client.post<{ matchCount: number }>(
        `${API_BASE}/intercompany/auto-match`,
      );
      alert(
        `Auto-matching completed successfully! Matched ${result.matchCount} pairs.`,
      );
      loadData();
    } catch {
      alert("Error running auto-match");
    } finally {
      setMatching(false);
    }
  };

  const handleManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !selectedScheduleId) {
      alert("Please select both an AR Invoice and an AP Schedule.");
      return;
    }
    setMatching(true);
    try {
      await client.post(`${API_BASE}/intercompany/manual-match`, {
        fromInvoiceId: selectedInvoiceId,
        toInvoiceId: selectedScheduleId,
        description: matchDescription,
      });
      alert("Transactions successfully matched.");
      setSelectedInvoiceId("");
      setSelectedScheduleId("");
      setMatchDescription("");
      loadData();
    } catch {
      alert("Error manual matching transactions");
    } finally {
      setMatching(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.intercompany.read">
      <div className="p-8 ui-stack-6">
        {/* Header */}
        <div className="ui-flex-between ui-items-start">
          <div>
            <h1 className="text-3xl">Intercompany AP/AR Netting Match</h1>
            <p className="ui-text-muted mt-1">
              Match internal sales (AR Receivables) in seller subsidiaries with
              internal purchases (AP Payables) in buyer subsidiaries.
            </p>
          </div>
          <div className="ui-flex ui-gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw size={16} />
            </Button>
            <Button
              variant="primary"
              onClick={handleAutoMatch}
              disabled={matching}
            >
              {matching ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Zap size={16} className="mr-2" />
              )}
              Run Auto-Net Match
            </Button>
          </div>
        </div>

        {stats && (
          <StatCardRow
            stats={[
              {
                label: "Unmatched AR Invoices",
                value: String(invoices.length),
                icon: <Info size={20} />,
                color: "#3b82f6",
              },
              {
                label: "Unmatched AP Schedules",
                value: String(schedules.length),
                icon: <ArrowRightLeft size={20} />,
                color: "#f59e0b",
              },
              {
                label: "Matched Pairs (Pending Netting)",
                value: String(stats.matchedCount),
                icon: <ShieldCheck size={20} />,
                color: "#22c55e",
              },
            ]}
          />
        )}

        {/* Manual matchmaking form panel */}
        <Card className="ui-card">
          <div className={styles.s1}>
            <h3 className="ui-heading-base">Manual Matchmaker Board</h3>
          </div>
          <form onSubmit={handleManualMatch} className="p-5 ui-stack-4">
            <div className="ui-grid-2 ui-gap-6">
              {/* Left selector */}
              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Select AR Invoice (Sales Side)
                </label>
                <select
                  className="ui-input"
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Invoice --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {fmt(Number(inv.totalAmount))} (
                      {inv.orgId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Right selector */}
              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Select AP Payment Schedule (Purchase Side)
                </label>
                <select
                  className="ui-input"
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Schedule --</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      Schedule ID: {s.id.substring(0, 8)} —{" "}
                      {fmt(Number(s.amount))} ({s.orgId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ui-form-group">
              <label className="ui-label ui-label">
                Matching Notes / Description
              </label>
              <input
                type="text"
                className="ui-input"
                value={matchDescription}
                onChange={(e) => setMatchDescription(e.target.value)}
                placeholder="e.g. Netting for intercompany service fee invoice"
              />
            </div>

            <div className={styles.s2}>
              <Button
                variant="primary"
                type="submit"
                disabled={matching || !selectedInvoiceId || !selectedScheduleId}
              >
                <Link2 size={16} className="mr-2" /> Link Pair
              </Button>
            </div>
          </form>
        </Card>

        {/* Datasets Listing columns */}
        <div className="ui-grid-2 ui-gap-6">
          {/* AR Receivables */}
          <Card className="ui-card">
            <div className={styles.s1}>
              <h4 className="font-bold">Open AR Sales Invoices</h4>
            </div>
            <div className={styles.s3}>
              {(() => {
                const invoiceColumns: ListColumn[] = [
                  {
                    key: "invoiceNumber",
                    header: "Invoice #",
                    render: (v) => (
                      <span className="font-semibold">{v as string}</span>
                    ),
                  },
                  { key: "orgId", header: "Subsidiary" },
                  {
                    key: "totalAmount",
                    header: "Amount",
                    render: (v) => (
                      <span className={styles.s4}>{fmt(Number(v))}</span>
                    ),
                  },
                  {
                    key: "dueDate",
                    header: "Due Date",
                    render: (v) => (
                      <span>{new Date(v as string).toLocaleDateString()}</span>
                    ),
                  },
                ];
                return (
                  <ListPageTemplate
                    columns={invoiceColumns}
                    data={invoices as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No Open Invoices"
                    emptyDescription="No open intercompany invoices."
                  />
                );
              })()}
            </div>
          </Card>

          {/* AP Payables */}
          <Card className="ui-card">
            <div className={styles.s1}>
              <h4 className="font-bold">Open AP Purchases Schedules</h4>
            </div>
            <div className={styles.s3}>
              {(() => {
                const scheduleColumns: ListColumn[] = [
                  {
                    key: "id",
                    header: "Schedule ID",
                    render: (v) => <span>{(v as string).substring(0, 8)}</span>,
                  },
                  { key: "orgId", header: "Subsidiary" },
                  {
                    key: "amount",
                    header: "Amount",
                    render: (v) => (
                      <span className={styles.s5}>{fmt(Number(v))}</span>
                    ),
                  },
                  {
                    key: "dueDate",
                    header: "Due Date",
                    render: (v) => (
                      <span>{new Date(v as string).toLocaleDateString()}</span>
                    ),
                  },
                ];
                return (
                  <ListPageTemplate
                    columns={scheduleColumns}
                    data={schedules as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No Open Schedules"
                    emptyDescription="No open payment schedules."
                    searchable
                  />
                );
              })()}
            </div>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}
