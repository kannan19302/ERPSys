"use client";
import styles from "./page.module.css";
import React, { useState, useCallback } from "react";
import {
  BarChart3,
  PieChart,
  FileText,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp,
  Receipt,
  Filter,
  BookOpen,
  Clock,
} from "lucide-react";
import {
  Card,
  Button,
  StatusBadge,
  PageHeader,
  ListPageTemplate,
  type ListColumn,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

type ReportType =
  | "pnl"
  | "balance-sheet"
  | "cash-flow"
  | "trial-balance"
  | "aging";

interface ReportResponse {
  [key: string]: unknown;
}

interface AccountingBook {
  id: string;
  name: string;
  standard?: string;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
}

const reportMeta: Record<
  ReportType,
  { label: string; icon: React.ReactNode; description: string }
> = {
  pnl: {
    label: "Profit & Loss",
    icon: <BarChart3 className={styles.s1} />,
    description: "Revenue, expenses, and net profit for a period",
  },
  "balance-sheet": {
    label: "Balance Sheet",
    icon: <PieChart className={styles.s1} />,
    description: "Assets, liabilities, and equity as of a date",
  },
  "cash-flow": {
    label: "Cash Flow",
    icon: <TrendingUp className={styles.s1} />,
    description: "Operating, investing, and financing activities",
  },
  "trial-balance": {
    label: "Trial Balance",
    icon: <BookOpen className={styles.s1} />,
    description: "All accounts with debit/credit totals",
  },
  aging: {
    label: "AR/AP Aging",
    icon: <Clock className={styles.s1} />,
    description: "Overdue invoices/purchase orders by aging bucket",
  },
};

export default function AdvancedReportsPage() {
  const client = useApiClient();
  const [activeReport, setActiveReport] = useState<ReportType>("pnl");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);

  // Date/Filter state
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [agingType, setAgingType] = useState<"AR" | "AP">("AR");
  const [bookId, setBookId] = useState("");
  const [books, setBooks] = useState<AccountingBook[]>([]);

  // Fetch accounting books for filtering
  React.useEffect(() => {
    const fetchBooks = async () => {
      try {
        setBooks(
          await client.get<AccountingBook[]>(
            "/advanced-finance/accounting-books",
          ),
        );
      } catch {}
    };
    fetchBooks();
  }, [client]);

  const buildUrl = useCallback(() => {
    const base = "/advanced-finance/reports";
    const bookQuery = bookId ? `&bookId=${bookId}` : "";
    switch (activeReport) {
      case "pnl":
        return `${base}/pnl?startDate=${startDate}&endDate=${endDate}${bookQuery}`;
      case "balance-sheet":
        return `${base}/balance-sheet?asOfDate=${asOfDate}${bookQuery}`;
      case "cash-flow":
        return `${base}/cash-flow?startDate=${startDate}&endDate=${endDate}${bookQuery}`;
      case "trial-balance":
        return `${base}/trial-balance?asOfDate=${asOfDate}${bookQuery}`;
      case "aging":
        return `${base}/aging?type=${agingType}&asOfDate=${asOfDate}`;
      default:
        return "";
    }
  }, [activeReport, startDate, endDate, asOfDate, agingType, bookId]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const url = buildUrl();
      setReportData(await client.get<ReportResponse>(url));
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to generate report. API may be unavailable.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport}-report-${asOfDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render P&L Report
  const renderPnL = () => {
    if (!reportData) return null;
    const d = reportData as {
      revenue: number;
      revenueBreakdown: Array<{ name: string; code: string; amount: number }>;
      expenses: number;
      expenseBreakdown: Array<{ name: string; code: string; amount: number }>;
      netProfit: number;
      period: { startDate: string; endDate: string };
    };

    return (
      <div className="ui-stack-6">
        <div className={styles.s2}>
          <h2 className="text-2xl">Profit & Loss Statement</h2>
          <p className={styles.s3}>
            For period {new Date(d.period.startDate).toLocaleDateString()} —{" "}
            {new Date(d.period.endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Revenue Section */}
        <div>
          <h3 className={styles.s4}>Revenue</h3>
          <ListPageTemplate
            columns={
              [
                {
                  key: "name",
                  header: "Account",
                  render: (v, row) => (
                    <span>
                      {String(v)}{" "}
                      <span className={styles.s5}>({String(row.code)})</span>
                    </span>
                  ),
                },
                {
                  key: "amount",
                  header: "Amount",
                  render: (v) => formatCurrency(Number(v)),
                },
              ] as ListColumn[]
            }
            data={
              (d.revenueBreakdown || []) as unknown as Record<string, unknown>[]
            }
            loading={false}
            emptyTitle="No revenue"
            emptyDescription=""
          />
        </div>

        {/* Expenses Section */}
        <div>
          <h3 className={styles.s6}>Expenses</h3>
          <ListPageTemplate
            columns={
              [
                {
                  key: "name",
                  header: "Account",
                  render: (v, row) => (
                    <span>
                      {String(v)}{" "}
                      <span className={styles.s5}>({String(row.code)})</span>
                    </span>
                  ),
                },
                {
                  key: "amount",
                  header: "Amount",
                  render: (v) => formatCurrency(Number(v)),
                },
              ] as ListColumn[]
            }
            data={
              (d.expenseBreakdown || []) as unknown as Record<string, unknown>[]
            }
            loading={false}
            emptyTitle="No expenses"
            emptyDescription=""
          />
        </div>

        {/* Net Profit */}
        <div
          className={`rounded-xl p-5 ${d.netProfit >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
        >
          <div className="ui-flex-between">
            <span className="ui-heading-lg">
              Net {d.netProfit >= 0 ? "Profit" : "Loss"}
            </span>
            <span
              className={`text-2xl font-bold font-mono ${d.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(d.netProfit)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render Balance Sheet
  const renderBalanceSheet = () => {
    if (!reportData) return null;
    const d = reportData as {
      assets: {
        current: {
          total: number;
          accounts: Array<{ code: string; name: string; balance: number }>;
        };
        nonCurrent: {
          total: number;
          accounts: Array<{ code: string; name: string; balance: number }>;
        };
        total: number;
      };
      liabilities: {
        current: {
          total: number;
          accounts: Array<{ code: string; name: string; balance: number }>;
        };
        nonCurrent: {
          total: number;
          accounts: Array<{ code: string; name: string; balance: number }>;
        };
        total: number;
      };
      equity: {
        total: number;
        accounts: Array<{ code: string; name: string; balance: number }>;
      };
      totalLiabilitiesAndEquity: number;
      asOfDate: string;
    };

    return (
      <div className="ui-stack-6">
        <div className={styles.s2}>
          <h2 className="text-2xl">Balance Sheet</h2>
          <p className={styles.s3}>
            As of {new Date(d.asOfDate).toLocaleDateString()}
          </p>
        </div>

        {/* Assets */}
        <div>
          <h3 className={styles.s7}>Assets</h3>
          <ListPageTemplate
            columns={
              [
                {
                  key: "name",
                  header: "Account",
                  render: (v, row) => (
                    <span>
                      {String(v)}{" "}
                      <span className={styles.s5}>({String(row.code)})</span>
                    </span>
                  ),
                },
                {
                  key: "balance",
                  header: "Balance",
                  render: (v) => formatCurrency(Number(v)),
                },
              ] as ListColumn[]
            }
            data={
              [
                ...d.assets.current.accounts,
                ...d.assets.nonCurrent.accounts,
              ] as unknown as Record<string, unknown>[]
            }
            loading={false}
            emptyTitle="No accounts"
            emptyDescription=""
          />
        </div>

        {/* Liabilities */}
        <div>
          <h3 className={styles.s8}>Liabilities</h3>
          <ListPageTemplate
            columns={
              [
                {
                  key: "name",
                  header: "Account",
                  render: (v, row) => (
                    <span>
                      {String(v)}{" "}
                      <span className={styles.s5}>({String(row.code)})</span>
                    </span>
                  ),
                },
                {
                  key: "balance",
                  header: "Balance",
                  render: (v) => formatCurrency(Number(v)),
                },
              ] as ListColumn[]
            }
            data={
              [
                ...d.liabilities.current.accounts,
                ...d.liabilities.nonCurrent.accounts,
              ] as unknown as Record<string, unknown>[]
            }
            loading={false}
            emptyTitle="No accounts"
            emptyDescription=""
          />
        </div>

        {/* Equity */}
        <div>
          <h3 className={styles.s8}>Equity</h3>
          <ListPageTemplate
            columns={
              [
                {
                  key: "name",
                  header: "Account",
                  render: (v, row) => (
                    <span>
                      {String(v)}{" "}
                      <span className={styles.s5}>({String(row.code)})</span>
                    </span>
                  ),
                },
                {
                  key: "balance",
                  header: "Balance",
                  render: (v) => formatCurrency(Number(v)),
                },
              ] as ListColumn[]
            }
            data={d.equity.accounts as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No accounts"
            emptyDescription=""
          />
        </div>

        <div className={styles.s9}>
          <div className="ui-flex-between">
            <span className="ui-heading-lg">Total Liabilities & Equity</span>
            <span className={styles.s10}>
              {formatCurrency(d.totalLiabilitiesAndEquity)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render Cash Flow
  const renderCashFlow = () => {
    if (!reportData) return null;
    const d = reportData as {
      operatingActivities: {
        total: number;
        details: Array<{ accountName: string; amount: number }>;
      };
      investingActivities: {
        total: number;
        details: Array<{ accountName: string; amount: number }>;
      };
      financingActivities: {
        total: number;
        details: Array<{ accountName: string; amount: number }>;
      };
      netIncreaseInCash: number;
      period: { startDate: string; endDate: string };
    };

    const renderSection = (
      title: string,
      data: typeof d.operatingActivities,
      color: string,
    ) => (
      <div>
        <h3 className={`text-lg font-semibold ${color} mb-3`}>{title}</h3>
        <ListPageTemplate
          columns={
            [
              { key: "accountName", header: "Account" },
              {
                key: "amount",
                header: "Amount",
                render: (v) => formatCurrency(Number(v)),
              },
            ] as ListColumn[]
          }
          data={data.details as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No data"
          emptyDescription=""
        />
      </div>
    );

    return (
      <div className="ui-stack-6">
        <div className={styles.s2}>
          <h2 className="text-2xl">Statement of Cash Flows</h2>
          <p className={styles.s3}>
            For period {new Date(d.period.startDate).toLocaleDateString()} —{" "}
            {new Date(d.period.endDate).toLocaleDateString()}
          </p>
        </div>

        {renderSection(
          "Operating Activities",
          d.operatingActivities,
          "text-blue-600",
        )}
        {renderSection(
          "Investing Activities",
          d.investingActivities,
          "text-orange-600",
        )}
        {renderSection(
          "Financing Activities",
          d.financingActivities,
          "text-purple-600",
        )}

        <div
          className={`rounded-xl p-5 ${d.netIncreaseInCash >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
        >
          <div className="ui-flex-between">
            <span className="ui-heading-lg">Net Increase in Cash</span>
            <span
              className={`text-2xl font-bold font-mono ${d.netIncreaseInCash >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(d.netIncreaseInCash)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render Trial Balance
  const renderTrialBalance = () => {
    if (!reportData) return null;
    const d = reportData as {
      asOfDate: string;
      accounts: Array<{
        code: string;
        name: string;
        type: string;
        debitTotal: number;
        creditTotal: number;
        balance: number;
        entriesCount: number;
      }>;
      totalDebits: number;
      totalCredits: number;
      isBalanced: boolean;
    };

    return (
      <div className="ui-stack-6">
        <div className={styles.s2}>
          <h2 className="text-2xl">Trial Balance</h2>
          <p className={styles.s3}>
            As of {new Date(d.asOfDate).toLocaleDateString()}
          </p>
        </div>

        {d.isBalanced ? (
          <div className={styles.s11}>
            <AlertCircle className="h-4 w-4" /> Trial Balance is{" "}
            <strong>balanced</strong> (Debits: {formatCurrency(d.totalDebits)} =
            Credits: {formatCurrency(d.totalCredits)})
          </div>
        ) : (
          <div className={styles.s11}>
            <AlertCircle className="h-4 w-4" /> Trial Balance is{" "}
            <strong>NOT balanced</strong> (Debits:{" "}
            {formatCurrency(d.totalDebits)} ≠ Credits:{" "}
            {formatCurrency(d.totalCredits)})
          </div>
        )}

        <ListPageTemplate
          columns={
            [
              {
                key: "code",
                header: "Code",
                render: (v) => <span className="text-xs">{String(v)}</span>,
              },
              { key: "name", header: "Account" },
              {
                key: "type",
                header: "Type",
                render: (v) => <StatusBadge status={String(v)} />,
              },
              {
                key: "debitTotal",
                header: "Debit Total",
                render: (v) => formatCurrency(Number(v)),
              },
              {
                key: "creditTotal",
                header: "Credit Total",
                render: (v) => formatCurrency(Number(v)),
              },
              {
                key: "balance",
                header: "Balance",
                render: (v) => formatCurrency(Number(v)),
              },
              { key: "entriesCount", header: "Entries" },
            ] as ListColumn[]
          }
          data={d.accounts as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No accounts"
          emptyDescription=""
        />
      </div>
    );
  };

  // Render Aging Report
  const renderAging = () => {
    if (!reportData) return null;
    const d = reportData as {
      type: string;
      asOfDate: string;
      totalOutstanding: number;
      totalItems: number;
      buckets: Record<
        string,
        Array<{
          partyName: string;
          documentNumber: string;
          totalAmount: number;
          outstanding: number;
          dueDate: string;
          daysOverdue: number;
          ageBucket: string;
        }>
      >;
      bucketTotals: Record<string, { count: number; totalOutstanding: number }>;
    };

    const bucketColors: Record<string, string> = {
      "0-30": "bg-green-50 border-green-200 text-green-700",
      "31-60": "bg-yellow-50 border-yellow-200 text-yellow-700",
      "61-90": "bg-orange-50 border-orange-200 text-orange-700",
      "90+": "bg-red-50 border-red-200 text-red-700",
    };

    return (
      <div className="ui-stack-6">
        <div className={styles.s2}>
          <h2 className="text-2xl">
            {d.type === "AR" ? "Accounts Receivable" : "Accounts Payable"} Aging
            Report
          </h2>
          <p className={styles.s3}>
            As of {new Date(d.asOfDate).toLocaleDateString()}
          </p>
        </div>

        {/* Summary Cards */}
        <div className={styles.s12}>
          {Object.entries(d.bucketTotals).map(([bucket, data]) => (
            <div
              key={bucket}
              className={`rounded-lg p-4 border ${bucketColors[bucket] || "bg-gray-50 border-gray-200"}`}
            >
              <div className={styles.s13}>{bucket} days</div>
              <div className="ui-heading-lg">{data.count} items</div>
              <div className="text-sm">
                {formatCurrency(data.totalOutstanding)}
              </div>
            </div>
          ))}
          <div className={styles.s14}>
            <div className={styles.s13}>Total</div>
            <div className="ui-heading-lg">{d.totalItems} items</div>
            <div className="text-sm">{formatCurrency(d.totalOutstanding)}</div>
          </div>
        </div>

        {/* Bucket Details */}
        {Object.entries(d.buckets).map(([bucket, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={bucket}>
              <h3
                className={`text-md font-semibold mb-2 ${bucket === "90+" ? "text-red-600" : bucket === "61-90" ? "text-orange-600" : bucket === "31-60" ? "text-yellow-600" : "text-green-600"}`}
              >
                {bucket} Days Overdue ({items.length} items)
              </h3>
              <ListPageTemplate
                columns={
                  [
                    { key: "partyName", header: "Party" },
                    {
                      key: "documentNumber",
                      header: "Document",
                      render: (v) => (
                        <span className="text-xs">{String(v)}</span>
                      ),
                    },
                    {
                      key: "totalAmount",
                      header: "Total",
                      render: (v) => formatCurrency(Number(v)),
                    },
                    {
                      key: "outstanding",
                      header: "Outstanding",
                      render: (v) => formatCurrency(Number(v)),
                    },
                    { key: "daysOverdue", header: "Days Overdue" },
                  ] as ListColumn[]
                }
                data={items as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No items"
                emptyDescription=""
              />
            </div>
          );
        })}

        {d.totalItems === 0 && (
          <div className={styles.s15}>
            <Receipt className={styles.s16} />
            <p>No overdue items found for this period.</p>
          </div>
        )}
      </div>
    );
  };

  const renderReport = () => {
    if (!reportData && !loading && !error) return null;

    if (loading) {
      return (
        <div className={styles.s17}>
          <div className={styles.s18}>
            <Loader2
              className={`h-10 w-10 animate-spin mx-auto ${styles.s19}`}
            />
            <p className="ui-text-muted">Generating report...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.s17}>
          <div className={styles.s18}>
            <AlertCircle className="mb-4" />
            <h3 className={styles.s20}>Report Generation Failed</h3>
            <p className={styles.s21}>{error}</p>
            <Button variant="outline" onClick={generateReport}>
              Retry
            </Button>
          </div>
        </div>
      );
    }

    if (!reportData) return null;

    return (
      <div className="animate-in fade-in duration-300">
        {activeReport === "pnl" && renderPnL()}
        {activeReport === "balance-sheet" && renderBalanceSheet()}
        {activeReport === "cash-flow" && renderCashFlow()}
        {activeReport === "trial-balance" && renderTrialBalance()}
        {activeReport === "aging" && renderAging()}
      </div>
    );
  };

  return (
    <RouteGuard permission="finance.reports.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Financial Reports"
          description="Generate dynamic P&L, Balance Sheet, Cash Flow, Trial Balance, and Aging reports."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Finance", href: "/finance" },
            { label: "Reports" },
          ]}
          actions={
            <div className="ui-flex ui-gap-2">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={!reportData}
              >
                <Download className="mr-2" /> Export
              </Button>
            </div>
          }
        />

        <div className={styles.s22}>
          {/* Left Sidebar — Report Selector */}
          <div className="ui-stack-2">
            {(
              Object.entries(reportMeta) as [
                ReportType,
                (typeof reportMeta)[ReportType],
              ][]
            ).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveReport(key);
                  setReportData(null);
                  setError(null);
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  activeReport === key
                    ? "bg-primary/5 border-primary text-primary font-medium shadow-sm"
                    : "bg-card hover:bg-muted/50 border-transparent"
                }`}
              >
                {meta.icon}
                <div className={styles.s23}>
                  <div className="ui-heading-sm">{meta.label}</div>
                  <div className="ui-text-xs-muted">{meta.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Right Panel — Report View */}
          <div className="md:col-span-3">
            <Card className="ui-flex-col">
              {/* Toolbar */}
              <div className={styles.s24}>
                <div className={styles.s25}>
                  {/* Date filters change based on report type */}
                  {(activeReport === "pnl" || activeReport === "cash-flow") && (
                    <>
                      <div className={styles.s26}>
                        <Calendar className="ui-text-muted" />
                        <input
                          type="date"
                          className={styles.s27}
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="ui-text-muted">—</span>
                        <input
                          type="date"
                          className={styles.s27}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  {(activeReport === "balance-sheet" ||
                    activeReport === "trial-balance") && (
                    <div className={styles.s26}>
                      <Calendar className="ui-text-muted" />
                      <span className="ui-text-muted">As of:</span>
                      <input
                        type="date"
                        className={styles.s27}
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                      />
                    </div>
                  )}
                  {activeReport === "aging" && (
                    <>
                      <div className={styles.s26}>
                        <Filter className="ui-text-muted" />
                        <select
                          className={styles.s27}
                          value={agingType}
                          onChange={(e) =>
                            setAgingType(e.target.value as "AR" | "AP")
                          }
                        >
                          <option value="AR">Accounts Receivable</option>
                          <option value="AP">Accounts Payable</option>
                        </select>
                      </div>
                      <div className={styles.s26}>
                        <Calendar className="ui-text-muted" />
                        <span className="ui-text-muted">As of:</span>
                        <input
                          type="date"
                          className={styles.s27}
                          value={asOfDate}
                          onChange={(e) => setAsOfDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  {activeReport !== "aging" && books.length > 0 && (
                    <div className={styles.s26}>
                      <BookOpen className={styles.s28} />
                      <span className="ui-text-muted">Book:</span>
                      <select
                        className={styles.s29}
                        value={bookId}
                        onChange={(e) => setBookId(e.target.value)}
                      >
                        <option value="">Primary Book (Default)</option>
                        {books.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.standard})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <Button onClick={generateReport} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="mr-2" />
                  )}
                  Generate Report
                </Button>
              </div>

              {/* Report Content */}
              <div className={styles.s30}>
                {!reportData && !loading && !error && (
                  <div className={styles.s31}>
                    <FileText className="mb-4" />
                    <p className={styles.s32}>
                      Select a report and click Generate
                    </p>
                    <p className={styles.s33}>
                      Choose from the left panel and set date filters
                    </p>
                  </div>
                )}
                {renderReport()}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
