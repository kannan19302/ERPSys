"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, PageHeader, DataTable, DashboardKPICard } from "@unerp/ui";
import {
  CreditCard,
  FileText,
  DollarSign,
  AlertTriangle,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  X,
  Clock,
  Ban,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  currency: string;
  status: "PAID" | "PENDING" | "OVERDUE" | "CANCELLED";
  lineItems: Array<{ description: string; amount: number }>;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
}

export default function SaasBillingPage() {
  const client = useApiClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, pmRes, txRes] = await Promise.all([
        client.get<any>("/saas/billing/invoices").catch(() => []),
        client.get<any>("/saas/billing/payment-methods").catch(() => []),
        client.get<any>("/saas/billing/transactions").catch(() => []),
      ]);
      setInvoices(Array.isArray(invRes) ? invRes : invRes?.items || []);
      setPaymentMethods(Array.isArray(pmRes) ? pmRes : []);
      setTransactions(Array.isArray(txRes) ? txRes : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => {
    const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
    const totalPending = invoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);
    const totalOverdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.amount, 0);
    return { totalPaid, totalPending, totalOverdue };
  }, [invoices]);

  const handleSetDefault = async (id: string) => {
    try {
      await client.post(`/saas/billing/payment-methods/${id}/default`);
      loadData();
    } catch {}
  };

  const handleRemoveCard = async (id: string) => {
    try {
      await client.delete(`/saas/billing/payment-methods/${id}`);
      loadData();
    } catch {}
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/saas/billing/payment-methods", {
        cardNumber: cardNumber.replace(/\s/g, ""),
        expiry: cardExpiry,
        cvc: cardCvc,
      });
      setShowAddCard(false);
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
      loadData();
    } catch {}
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const blob = await client.request(`/saas/billing/invoices/${invoiceId}/download`, {}, "blob");
      const url = URL.createObjectURL(blob as any);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const statusBadge = (status: string) => {
    const cls = status === "PAID" ? "ui-badge-success" :
      status === "PENDING" ? "ui-badge-warning" :
      status === "OVERDUE" ? "ui-badge-danger" : "ui-badge-neutral";
    return <span className={`ui-badge ${cls}`}>{status}</span>;
  };

  return (
    <RouteGuard permission="saas.billing.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Billing Management"
          description="View invoices, manage payment methods, and track transaction history."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Billing" },
          ]}
        />

        <div className="ui-stats-row">
          <DashboardKPICard
            title="Total Paid"
            value={`$${stats.totalPaid.toLocaleString()}`}
            icon={<DollarSign size={18} />}
            color="var(--color-success)"
          />
          <DashboardKPICard
            title="Pending"
            value={`$${stats.totalPending.toLocaleString()}`}
            icon={<Clock size={18} />}
            color="var(--color-warning)"
          />
          <DashboardKPICard
            title="Overdue"
            value={`$${stats.totalOverdue.toLocaleString()}`}
            icon={<AlertTriangle size={18} />}
            color="var(--color-danger)"
          />
          <DashboardKPICard
            title="Payment Methods"
            value={String(paymentMethods.length)}
            icon={<CreditCard size={18} />}
            color="var(--color-primary)"
          />
        </div>

        <Card padding="lg">
          <div className="ui-flex-between ui-mb-4">
            <h3 className="ui-heading-base">Invoices</h3>
          </div>
          <DataTable
            columns={[
              { key: "number", header: "Invoice#" },
              { key: "date", header: "Date", sortable: true },
              { key: "amount", header: "Amount", sortable: true },
              { key: "status", header: "Status" },
              { key: "actions", header: "" },
            ]}
            data={invoices.map((inv) => ({
              ...inv,
              amount: `$${inv.amount.toFixed(2)}`,
              date: new Date(inv.date).toLocaleDateString(),
              status: statusBadge(inv.status),
              actions: (
                <div className="ui-table-actions">
                  <button
                    className="ui-table-action-btn"
                    onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }}
                    title="View details"
                  >
                    <FileText size={14} />
                  </button>
                  <button
                    className="ui-table-action-btn"
                    onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(inv.id); }}
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ),
            })) as unknown as Record<string, unknown>[]}
            onRowClick={(row) => setSelectedInvoice(invoices.find((i) => i.id === (row as any).id) || null)}
            emptyTitle="No invoices"
            emptyMessage="Invoices will appear here once generated."
          />
        </Card>

        <div className="ui-grid-2">
          <Card padding="lg">
            <div className="ui-flex-between ui-mb-4">
              <h3 className="ui-heading-base">Payment Methods</h3>
              <button className="ui-btn ui-btn-primary" onClick={() => setShowAddCard(true)}>
                <Plus size={14} /> Add Card
              </button>
            </div>
            {paymentMethods.length === 0 && !loading && (
              <p className="ui-text-xs-muted">No payment methods on file.</p>
            )}
            <div className="ui-stack-3">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="ui-flex-between ui-py-2 ui-border-b ui-border-border/30">
                  <div className="ui-hstack-3">
                    <CreditCard size={16} className="ui-text-muted" />
                    <div>
                      <span className="font-medium">
                        {pm.brand} **** {pm.last4}
                      </span>
                      <span className="ui-text-xs-muted ui-ml-2">
                        Expires {pm.expMonth}/{pm.expYear}
                      </span>
                      {pm.isDefault && (
                        <span className="ui-badge ui-badge-success ui-ml-2">Default</span>
                      )}
                    </div>
                  </div>
                  <div className="ui-hstack-2">
                    {!pm.isDefault && (
                      <button className="ui-btn ui-btn-secondary" onClick={() => handleSetDefault(pm.id)}>
                        <CheckCircle size={12} /> Set Default
                      </button>
                    )}
                    <button className="ui-btn-icon ui-table-action-btn-danger" onClick={() => handleRemoveCard(pm.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="ui-heading-base ui-mb-4">Recent Transactions</h3>
            <DataTable
              columns={[
                { key: "date", header: "Date" },
                { key: "description", header: "Description" },
                { key: "amount", header: "Amount" },
                { key: "status", header: "Status" },
              ]}
              data={transactions.map((tx) => ({
                ...tx,
                date: new Date(tx.date).toLocaleDateString(),
                amount: `${tx.currency === "USD" ? "$" : ""}${tx.amount.toFixed(2)}`,
                status: statusBadge(tx.status),
              })) as unknown as Record<string, unknown>[]}
              emptyTitle="No transactions"
              emptyMessage="Transaction history will appear here."
            />
          </Card>
        </div>

        {selectedInvoice && (
          <div className="ui-modal-overlay" onClick={() => setSelectedInvoice(null)}>
            <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ui-modal-header">
                <span>Invoice {selectedInvoice.number}</span>
                <button className="ui-btn-icon" onClick={() => setSelectedInvoice(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="ui-modal-body ui-stack-4">
                <div className="ui-grid-2">
                  <div className="ui-kv-pair">
                    <span className="ui-kv-label">Invoice#</span>
                    <span className="ui-kv-value">{selectedInvoice.number}</span>
                  </div>
                  <div className="ui-kv-pair">
                    <span className="ui-kv-label">Date</span>
                    <span className="ui-kv-value">{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                  </div>
                  <div className="ui-kv-pair">
                    <span className="ui-kv-label">Status</span>
                    <span className="ui-kv-value">{statusBadge(selectedInvoice.status)}</span>
                  </div>
                  <div className="ui-kv-pair">
                    <span className="ui-kv-label">Total</span>
                    <span className="ui-kv-value">${selectedInvoice.amount.toFixed(2)} {selectedInvoice.currency}</span>
                  </div>
                </div>
                <hr className="ui-divider" />
                <h4 className="ui-heading-sm">Line Items</h4>
                {selectedInvoice.lineItems.map((item, idx) => (
                  <div key={idx} className="ui-flex-between ui-py-1">
                    <span className="text-sm">{item.description}</span>
                    <span className="font-mono text-sm">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="ui-modal-footer">
                <button className="ui-btn ui-btn-secondary" onClick={() => setSelectedInvoice(null)}>
                  Close
                </button>
                <button className="ui-btn ui-btn-primary" onClick={() => handleDownloadInvoice(selectedInvoice.id)}>
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddCard && (
          <div className="ui-modal-overlay" onClick={() => setShowAddCard(false)}>
            <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ui-modal-header">
                <span>Add Payment Method</span>
                <button className="ui-btn-icon" onClick={() => setShowAddCard(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleAddCard}>
                <div className="ui-modal-body ui-stack-4">
                  <div className="ui-form-group">
                    <label className="ui-label">Card Number</label>
                    <input className="ui-input" required placeholder="4242 4242 4242 4242" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                  </div>
                  <div className="ui-grid-2">
                    <div className="ui-form-group">
                      <label className="ui-label">Expiry</label>
                      <input className="ui-input" required placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">CVC</label>
                      <input className="ui-input" required placeholder="123" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="ui-modal-footer">
                  <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setShowAddCard(false)}>Cancel</button>
                  <button type="submit" className="ui-btn ui-btn-primary">Add Card</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
