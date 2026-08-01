"use client";

import styles from "./page.module.css";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  ChangeHistory,
} from "@unerp/ui";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  DollarSign,
  ArrowLeft,
  Building,
  Calendar,
  Clock,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  reference?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  notes?: string;
  lineItems?: InvoiceLineItem[];
  purchaseOrderId?: string;
}

interface ThreeWayMatchReport {
  purchaseOrderId: string;
  poNumber: string;
  status: "MATCHED" | "DISCREPANCY" | "PENDING";
  overallMatch: boolean;
}

export default function InvoiceDetailPage() {
  const client = useApiClient();
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [matchReport, setMatchReport] = useState<ThreeWayMatchReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "items" | "payments" | "audit"
  >("details");

  const balanceDue = invoice
    ? Math.max(0, invoice.totalAmount - invoice.paidAmount)
    : 0;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, payRes] = await Promise.all([
        client.get<Invoice>(`/finance/invoices/${invoiceId}`),
        client.get<PaymentRecord[]>(`/finance/invoices/${invoiceId}/payments`),
      ]);

      setInvoice(invRes);
      setPayments(payRes || []);

      if ((invRes as any).purchaseOrderId) {
        try {
          const matchRes = await client.get<ThreeWayMatchReport>(
            `/procurement/purchase-orders/${(invRes as any).purchaseOrderId}/three-way-match`,
          );
          setMatchReport(matchRes);
        } catch {
          setMatchReport(null);
        }
      }
    } catch {
      setError("Could not load data. Please try again.");

      setInvoice({
        id: invoiceId,
        invoiceNumber: "INV-2026-001",
        status: "PARTIALLY_PAID",
        issueDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
        customerId: "cust-1",
        customerName: "Acme Corp",
        subtotal: 10000,
        taxAmount: 1000,
        discountAmount: 500,
        totalAmount: 10500,
        paidAmount: 5000,
        currency: "USD",
        notes: "Net 30 payment terms.",
        purchaseOrderId: "po-1",
        lineItems: [
          {
            id: "li-1",
            description: "Consulting Services - Q3",
            quantity: 40,
            unitPrice: 200,
            totalAmount: 8000,
          },
          {
            id: "li-2",
            description: "Software License - Annual",
            quantity: 2,
            unitPrice: 1000,
            totalAmount: 2000,
          },
        ],
      });

      setPayments([
        {
          id: "pay-1",
          amount: 5000,
          method: "Bank Transfer",
          paidAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
          reference: "TRX-001",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      loadData();
    }
  }, [invoiceId, client]);

  if (loading) {
    return (
      <div className={styles.spinnerWrap}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className={styles.notFound}>
        <AlertCircle size={48} className={styles.notFoundIcon} />
        <h3 className={styles.notFoundTitle}>Invoice Not Found</h3>
        <Button
          onClick={() => router.push("/finance")}
          className={["ui-btn ui-btn-secondary", styles.notFoundBtn].join(" ")}
        >
          Back to Finance
        </Button>
      </div>
    );
  }

  const getStatusVariant = (
    status: string,
  ):
    | "default"
    | "primary"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | undefined => {
    switch (status) {
      case "PAID":
        return "success";
      case "PARTIALLY_PAID":
        return "warning";
      case "OVERDUE":
        return "danger";
      case "SENT":
        return "info";
      case "DRAFT":
        return "default";
      case "VOID":
        return "default";
      default:
        return "default";
    }
  };

  const getMatchVariant = (
    status: string,
  ):
    | "default"
    | "primary"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | undefined => {
    switch (status) {
      case "MATCHED":
        return "success";
      case "DISCREPANCY":
        return "danger";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  const paidPct =
    invoice.totalAmount > 0
      ? Math.round((invoice.paidAmount / invoice.totalAmount) * 100)
      : 0;

  return (
    <RouteGuard permission="finance.invoice.read">
      <div className="ui-stack-6 ui-animate-in">
        <div className="ui-hstack-2">
          <button
            onClick={() => router.push("/finance")}
            className={styles.backBtn}
          >
            <ArrowLeft size={18} />
          </button>
          <PageHeader
            title={`Invoice: ${invoice.invoiceNumber}`}
            description={`Details & status for ${invoice.invoiceNumber}`}
            breadcrumbs={[
              { label: "Apps", href: "/apps" },
              { label: "Finance", href: "/finance" },
              { label: "Invoices", href: "/finance" },
              { label: invoice.invoiceNumber },
            ]}
          />
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>Note: {error}</span>
          </div>
        )}

        <div className="ui-grid-3">
          <Card className={["ui-card", styles.mainCard].join(" ")}>
            <div className={styles.headerRow}>
              <div className={styles.customerInfo}>
                <Building size={20} className="ui-text-muted" />
                <div>
                  <div className="ui-text-xs-muted">Customer</div>
                  <div className={styles.customerName}>
                    {invoice.customerName}
                  </div>
                </div>
              </div>
              <div className={styles.badgeGroup}>
                <Badge variant={getStatusVariant(invoice.status)}>
                  {invoice.status === "PARTIALLY_PAID"
                    ? "Partially Paid"
                    : invoice.status}
                </Badge>
                {matchReport && (
                  <Badge variant={getMatchVariant(matchReport.status)}>
                    3-Way: {matchReport.status}
                  </Badge>
                )}
              </div>
            </div>

            <div className={styles.amountsGrid}>
              <div>
                <div className={styles.amountLabel}>
                  <Calendar size={12} /> Issue Date
                </div>
                <div className={styles.amountValue}>
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <Calendar size={12} /> Due Date
                </div>
                <div className={styles.amountValue}>
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <DollarSign size={12} /> Total Amount
                </div>
                <div className={styles.amountValue}>
                  ${Number(invoice.totalAmount).toLocaleString()}{" "}
                  {invoice.currency}
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <DollarSign size={12} /> Subtotal
                </div>
                <div className={styles.amountValue}>
                  ${Number(invoice.subtotal).toLocaleString()}
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <DollarSign size={12} /> Tax
                </div>
                <div className={styles.amountValue}>
                  ${Number(invoice.taxAmount).toLocaleString()}
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <DollarSign size={12} /> Discount
                </div>
                <div className={styles.amountValue}>
                  ${Number(invoice.discountAmount).toLocaleString()}
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <CheckCircle size={12} /> Paid
                </div>
                <div className={styles.amountValue}>
                  ${Number(invoice.paidAmount).toLocaleString()} ({paidPct}%)
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <Clock size={12} /> Balance Due
                </div>
                <div className={styles.balanceDueValue}>
                  ${Number(balanceDue).toLocaleString()} {invoice.currency}
                </div>
              </div>
            </div>

            <div className={styles.tabsRow}>
              <button
                onClick={() => setActiveTab("details")}
                style={{
                  fontWeight: activeTab === "details" ? "bold" : "normal",
                  color:
                    activeTab === "details"
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                  borderBottom:
                    activeTab === "details"
                      ? "2px solid var(--color-primary)"
                      : "none",
                }}
                className={styles.tabBtn}
              >
                <FileText size={14} /> Details
              </button>
              <button
                onClick={() => setActiveTab("items")}
                style={{
                  fontWeight: activeTab === "items" ? "bold" : "normal",
                  color:
                    activeTab === "items"
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                  borderBottom:
                    activeTab === "items"
                      ? "2px solid var(--color-primary)"
                      : "none",
                }}
                className={styles.tabBtn}
              >
                <DollarSign size={14} /> Line Items
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                style={{
                  fontWeight: activeTab === "payments" ? "bold" : "normal",
                  color:
                    activeTab === "payments"
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                  borderBottom:
                    activeTab === "payments"
                      ? "2px solid var(--color-primary)"
                      : "none",
                }}
                className={styles.tabBtn}
              >
                <DollarSign size={14} /> Payments{" "}
                {payments.length > 0 && `(${payments.length})`}
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                style={{
                  fontWeight: activeTab === "audit" ? "bold" : "normal",
                  color:
                    activeTab === "audit"
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                  borderBottom:
                    activeTab === "audit"
                      ? "2px solid var(--color-primary)"
                      : "none",
                }}
                className={styles.tabBtn}
              >
                <AlertCircle size={14} /> Audit
              </button>
            </div>

            {activeTab === "details" && (
              <div className="ui-stack-3">
                <div className={styles.infoCardBody}>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>Invoice #</span>
                    <span className={styles.infoListItemValue}>
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>Customer</span>
                    <span className={styles.infoListItemValue}>
                      {invoice.customerName}
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>Issue Date</span>
                    <span className={styles.infoListItemValue}>
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>Due Date</span>
                    <span className={styles.infoListItemValue}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>Status</span>
                    <span className={styles.infoListItemValue}>
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status === "PARTIALLY_PAID"
                          ? "Partially Paid"
                          : invoice.status}
                      </Badge>
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>
                      Total Amount
                    </span>
                    <span className={styles.infoListItemValue}>
                      ${Number(invoice.totalAmount).toLocaleString()}{" "}
                      {invoice.currency}
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>
                      Paid Amount
                    </span>
                    <span className={styles.infoListItemValue}>
                      ${Number(invoice.paidAmount).toLocaleString()} ({paidPct}
                      %)
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>
                      Balance Due
                    </span>
                    <span className={styles.infoListItemValue}>
                      ${Number(balanceDue).toLocaleString()} {invoice.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "items" && (
              <div className="builder-table-wrapper">
                <table className={styles.itemsTable}>
                  <thead>
                    <tr className={styles.itemsTableHead}>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody className={styles.itemsTableBody}>
                    {invoice.lineItems?.map((item) => (
                      <tr key={item.id}>
                        <td>{item.description}</td>
                        <td>{Number(item.quantity)}</td>
                        <td>${Number(item.unitPrice).toLocaleString()}</td>
                        <td>${Number(item.totalAmount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className={styles.totalsPanel}>
                  <div className="ui-text-xs-muted">
                    Subtotal:{" "}
                    <strong>
                      ${Number(invoice.subtotal).toLocaleString()}
                    </strong>
                  </div>
                  <div className="ui-text-xs-muted">
                    Tax:{" "}
                    <strong>
                      ${Number(invoice.taxAmount).toLocaleString()}
                    </strong>
                  </div>
                  {invoice.discountAmount > 0 && (
                    <div className="ui-text-xs-muted">
                      Discount:{" "}
                      <strong>
                        -${Number(invoice.discountAmount).toLocaleString()}
                      </strong>
                    </div>
                  )}
                  <div className={styles.grandTotal}>
                    Total Amount: $
                    {Number(invoice.totalAmount).toLocaleString()}{" "}
                    {invoice.currency}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className={styles.paymentsSection}>
                {payments.length === 0 ? (
                  <div
                    className="ui-text-xs-muted"
                    style={{ padding: "var(--space-6)", textAlign: "center" }}
                  >
                    No payments recorded yet.
                  </div>
                ) : (
                  payments.map((payment) => (
                    <div key={payment.id} className={styles.paymentRow}>
                      <div className={styles.paymentInfo}>
                        <span className={styles.paymentDate}>
                          {new Date(payment.paidAt).toLocaleDateString()}
                        </span>
                        <span className={styles.paymentMethod}>
                          {payment.method}
                          {payment.reference ? ` — ${payment.reference}` : ""}
                        </span>
                      </div>
                      <div className={styles.paymentAmount}>
                        ${Number(payment.amount).toLocaleString()}{" "}
                        {invoice.currency}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "audit" && (
              <div className="ui-stack-4">
                {matchReport ? (
                  <>
                    <div
                      className={styles.matchBanner}
                      style={{
                        background: matchReport.overallMatch
                          ? "var(--color-success-light)"
                          : "var(--color-warning-light)",
                        border: `1px solid ${matchReport.overallMatch ? "var(--color-success)" : "var(--color-warning)"}`,
                        color: matchReport.overallMatch
                          ? "var(--color-success-text)"
                          : "var(--color-warning-text)",
                      }}
                    >
                      {matchReport.overallMatch ? (
                        <CheckCircle size={20} className={styles.matchIcon} />
                      ) : (
                        <AlertCircle size={20} className={styles.matchIcon} />
                      )}
                      <div>
                        <div className={styles.matchTitle}>
                          {matchReport.overallMatch
                            ? "3-Way Match Passed"
                            : "3-Way Match Exception"}
                        </div>
                        <div className={styles.matchDesc}>
                          {matchReport.overallMatch
                            ? "The purchase order, goods receipt, and this invoice match exactly."
                            : "A discrepancy exists between the purchase order, goods receipt, and invoice."}
                        </div>
                      </div>
                    </div>
                    <div className={styles.infoListItem}>
                      <span className={styles.infoListItemLabel}>
                        Linked PO
                      </span>
                      <span className={styles.infoListItemValue}>
                        {matchReport.poNumber}
                      </span>
                    </div>
                    <div className={styles.infoListItem}>
                      <span className={styles.infoListItemLabel}>
                        Match Status
                      </span>
                      <span className={styles.infoListItemValue}>
                        <Badge variant={getMatchVariant(matchReport.status)}>
                          {matchReport.status}
                        </Badge>
                      </span>
                    </div>
                  </>
                ) : (
                  <div
                    className="ui-text-xs-muted"
                    style={{ padding: "var(--space-6)", textAlign: "center" }}
                  >
                    {invoice.purchaseOrderId
                      ? "3-way match report could not be loaded."
                      : "This invoice is not linked to a purchase order. 3-way match is not applicable."}
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="ui-stack-4">
            <Card className="ui-card">
              <div className={styles.infoCard}>
                <h4>Payment Summary</h4>
                <div className={styles.infoCardBody}>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>Total</span>
                    <span className={styles.infoListItemValue}>
                      ${Number(invoice.totalAmount).toLocaleString()}{" "}
                      {invoice.currency}
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>Paid</span>
                    <span className={styles.infoListItemValue}>
                      ${Number(invoice.paidAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>
                      Balance Due
                    </span>
                    <span className={styles.infoListItemValue}>
                      ${Number(balanceDue).toLocaleString()} {invoice.currency}
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>
                      Payment Status
                    </span>
                    <span className={styles.infoListItemValue}>
                      {balanceDue <= 0 ? (
                        <Badge variant="success">Paid in Full</Badge>
                      ) : invoice.paidAmount > 0 ? (
                        <Badge variant="warning">Partial Payment</Badge>
                      ) : (
                        <Badge variant="info">Unpaid</Badge>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {invoice.notes && (
              <Card className="ui-card">
                <div className={styles.infoCard}>
                  <h4>Notes</h4>
                  <p className={styles.notesText}>{invoice.notes}</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8">
          <ChangeHistory entityType="Invoice" entityId={invoiceId} />
        </div>
      </div>
    </RouteGuard>
  );
}
