"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import {
  Landmark,
  ArrowRightLeft,
  TrendingUp,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
}

interface Portfolio {
  id: string;
  name: string;
  assetClass: string;
  yieldRate: number | string;
  currentValue: number | string;
}

interface TreasuryTransaction {
  id: string;
  type: string;
  currency: string;
  date: string;
  amount: number | string;
  status: string;
}

export default function TreasuryPage() {
  const client = useApiClient();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [investmentData, setInvestmentData] = useState({
    name: "",
    assetClass: "EQUITY",
    yieldRate: "",
    currentValue: "",
  });
  const [transferData, setTransferData] = useState({
    type: "TRANSFER",
    amount: "",
    currency: "USD",
    bankAccountId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [portRes, transRes, bankRes] = await Promise.all([
        client.get<Portfolio[]>("/advanced-finance/investment-portfolios"),
        client.get<TreasuryTransaction[]>(
          "/advanced-finance/treasury-transactions",
        ),
        client.get<BankAccount[]>("/advanced-finance/bank-accounts"),
      ]);
      setPortfolios(portRes);
      setTransactions(transRes);
      setBankAccounts(bankRes);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/advanced-finance/investment-portfolios", {
        name: investmentData.name,
        assetClass: investmentData.assetClass,
        yieldRate: parseFloat(investmentData.yieldRate) || 0,
        currentValue: parseFloat(investmentData.currentValue) || 0,
      });
      {
        setShowInvestmentForm(false);
        setInvestmentData({
          name: "",
          assetClass: "EQUITY",
          yieldRate: "",
          currentValue: "",
        });
        fetchData();
      }
    } catch {}
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/advanced-finance/treasury-transactions", {
        type: transferData.type,
        amount: parseFloat(transferData.amount) || 0,
        currency: transferData.currency,
        bankAccountId: transferData.bankAccountId || undefined,
        status: "SETTLED",
        date: new Date().toISOString(),
      });
      {
        setShowTransferForm(false);
        setTransferData({
          type: "TRANSFER",
          amount: "",
          currency: "USD",
          bankAccountId: "",
        });
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
    <RouteGuard permission="finance.treasury.read">
      <div className="p-8 ui-stack-6">
        <div className="ui-flex-between">
          <div>
            <h1 className="text-3xl">Treasury & Investments</h1>
            <p className="ui-text-muted mt-1">
              Manage corporate cash flow, forex trades, and investment
              portfolios.
            </p>
          </div>
          <div className="ui-flex ui-gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTransferForm(!showTransferForm)}
            >
              <ArrowRightLeft className="mr-2" /> Transfer Funds
            </Button>
            <Button onClick={() => setShowInvestmentForm(!showInvestmentForm)}>
              <TrendingUp className="mr-2" /> New Investment
            </Button>
          </div>
        </div>

        {showInvestmentForm && (
          <Card className="border-primary/20">
            <div className="p-6">
              <h3 className={styles.s1}>New Corporate Investment</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateInvestment} className="ui-stack-4">
                <div className="ui-grid-4">
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Investment Name</label>
                    <input
                      className="ui-field-line"
                      required
                      placeholder="Treasury Bond B-2"
                      value={investmentData.name}
                      onChange={(e) =>
                        setInvestmentData({
                          ...investmentData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Asset Class</label>
                    <select
                      className="ui-field-line"
                      required
                      value={investmentData.assetClass}
                      onChange={(e) =>
                        setInvestmentData({
                          ...investmentData,
                          assetClass: e.target.value,
                        })
                      }
                    >
                      <option value="EQUITY">Equity (Stocks)</option>
                      <option value="FIXED_INCOME">Fixed Income (Bonds)</option>
                      <option value="CASH_EQUIVALENT">Cash Equivalents</option>
                      <option value="COMMODITY">Commodities</option>
                    </select>
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Yield Rate (%)</label>
                    <input
                      className="ui-field-line"
                      type="number"
                      required
                      placeholder="5.5"
                      value={investmentData.yieldRate}
                      onChange={(e) =>
                        setInvestmentData({
                          ...investmentData,
                          yieldRate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Initial Value</label>
                    <input
                      className="ui-field-line"
                      type="number"
                      required
                      placeholder="250000"
                      value={investmentData.currentValue}
                      onChange={(e) =>
                        setInvestmentData({
                          ...investmentData,
                          currentValue: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInvestmentForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Investment</Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {showTransferForm && (
          <Card className="border-primary/20">
            <div className="p-6">
              <h3 className={styles.s1}>
                Record Treasury Transaction / Transfer
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateTransfer} className="ui-stack-4">
                <div className="ui-grid-4">
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Transaction Type</label>
                    <select
                      className="ui-field-line"
                      required
                      value={transferData.type}
                      onChange={(e) =>
                        setTransferData({
                          ...transferData,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="TRANSFER">Inter-Account Transfer</option>
                      <option value="FOREX_BUY">Forex Purchase</option>
                      <option value="FOREX_SELL">Forex Sale</option>
                      <option value="INVESTMENT_BUY">
                        Investment Purchase
                      </option>
                      <option value="INVESTMENT_SELL">
                        Investment Redemption
                      </option>
                    </select>
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Amount</label>
                    <input
                      className="ui-field-line"
                      type="number"
                      required
                      placeholder="50000"
                      value={transferData.amount}
                      onChange={(e) =>
                        setTransferData({
                          ...transferData,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Currency</label>
                    <select
                      className="ui-field-line"
                      required
                      value={transferData.currency}
                      onChange={(e) =>
                        setTransferData({
                          ...transferData,
                          currency: e.target.value,
                        })
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="INR">INR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Bank Account</label>
                    <select
                      className="ui-field-line"
                      required
                      value={transferData.bankAccountId}
                      onChange={(e) =>
                        setTransferData({
                          ...transferData,
                          bankAccountId: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Account</option>
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTransferForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Record Transaction</Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        <div className="ui-grid-3">
          {/* Portfolios Main */}
          <div className="ui-stack-6">
            <Card className="border-primary/20">
              <div className={styles.s2}>
                <div className="ui-hstack-3">
                  <div
                    className={`p-2.5 bg-emerald-100 dark:bg-emerald-900/30 ${styles.s3}`}
                  >
                    <Landmark
                      className={`text-emerald-700 dark:text-emerald-400 ${styles.s4}`}
                    />
                  </div>
                  <h3 className="font-bold">Investment Portfolios</h3>
                </div>
              </div>
              {(() => {
                const portfolioColumns: ListColumn[] = [
                  {
                    key: "name",
                    header: "Portfolio Name",
                    render: (v) => (
                      <span className="font-bold">{v as string}</span>
                    ),
                  },
                  {
                    key: "assetClass",
                    header: "Asset Class",
                    render: (v) => (
                      <span className="ui-text-xs-muted">{v as string}</span>
                    ),
                  },
                  {
                    key: "yieldRate",
                    header: "Yield Rate",
                    render: (v) => (
                      <span className="font-medium">
                        +{Number(v).toFixed(2)}%
                      </span>
                    ),
                  },
                  {
                    key: "currentValue",
                    header: "Current Value",
                    render: (v) => (
                      <span className={styles.s5}>
                        ${Number(v).toLocaleString()}
                      </span>
                    ),
                  },
                ];
                return (
                  <ListPageTemplate
                    columns={portfolioColumns}
                    data={portfolios as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No Portfolios"
                    emptyDescription="No active investment portfolios found."
                  />
                );
              })()}
            </Card>

            <Card className="border-primary/20">
              <div className={styles.s2}>
                <div className="ui-hstack-3">
                  <div
                    className={`p-2.5 bg-blue-100 dark:bg-blue-900/30 ${styles.s3}`}
                  >
                    <ArrowRightLeft
                      className={`text-blue-700 dark:text-blue-400 ${styles.s4}`}
                    />
                  </div>
                  <h3 className="font-bold">Recent Treasury Transactions</h3>
                </div>
              </div>
              <div className="p-0">
                {transactions.length === 0 ? (
                  <div className={styles.s6}>
                    No recent treasury trades or transfers.
                  </div>
                ) : (
                  <div className="divide-y">
                    {transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className={`hover:bg-muted/30 ${styles.s7}`}
                      >
                        <div>
                          <p className="font-medium">
                            {tx.type}{" "}
                            <span className={styles.s8}>({tx.currency})</span>
                          </p>
                          <p className="ui-text-xs-muted mt-1">
                            {new Date(tx.date).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            ${Number(tx.amount).toLocaleString()}
                          </p>
                          <p className={styles.s9}>{tx.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Treasury Sidebar */}
          <div className="ui-stack-6">
            <Card className={styles.s10}>
              <div className={styles.s11}>
                <h3 className={styles.s12}>Total Cash Position</h3>
                <p className={styles.s13}>$0.00</p>
                <div className={styles.s14}>
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Sufficient liquidity for next 30 days
                </div>
              </div>
              <div className="p-6 ui-stack-4">
                <div>
                  <div className={styles.s15}>
                    <span className="ui-text-muted">Operating Cash</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className={styles.s16}>
                    <div className={styles.s17}></div>
                  </div>
                </div>
                <div>
                  <div className={styles.s15}>
                    <span className="ui-text-muted">Short-term Inv.</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className={styles.s16}>
                    <div className={styles.s17}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
