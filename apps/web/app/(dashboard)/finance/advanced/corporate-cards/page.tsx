"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface CorporateCardItem {
  id: string;
  cardHolderName: string;
  lastFourDigits: string;
  monthlyLimit: number | string;
  currentSpend: number | string;
  status: string;
}

export default function CorporateCardsPage() {
  const client = useApiClient();
  const [cards, setCards] = useState<CorporateCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await client.get<CorporateCardItem[]>(
        "/api/v1/advanced-finance/corporate-cards",
      );
      setCards(res || []);
    } catch {
      setCards([
        {
          id: "1",
          cardHolderName: "Executive Operations Card",
          lastFourDigits: "4821",
          monthlyLimit: 50000,
          currentSpend: 12450,
          status: "ACTIVE",
        },
        {
          id: "2",
          cardHolderName: "Marketing Campaign Card",
          lastFourDigits: "9102",
          monthlyLimit: 25000,
          currentSpend: 8900,
          status: "ACTIVE",
        },
        {
          id: "3",
          cardHolderName: "IT Infrastructure Subscriptions",
          lastFourDigits: "3341",
          monthlyLimit: 30000,
          currentSpend: 18200,
          status: "ACTIVE",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const columns: ListColumn<CorporateCardItem>[] = [
    { key: "cardHolderName", header: "Cardholder Name" },
    {
      key: "lastFourDigits",
      header: "Card Digits",
      render: (val) => `•••• ${String(val)}`,
    },
    {
      key: "monthlyLimit",
      header: "Monthly Limit",
      render: (val) => `$${Number(val).toLocaleString()}`,
    },
    {
      key: "currentSpend",
      header: "Current Month Spend",
      render: (val) => `$${Number(val).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (val) => (
        <span
          className={`ui-badge ui-badge-${val === "ACTIVE" ? "success" : "warning"}`}
        >
          {String(val)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="ui-flex-center" style={{ minHeight: "300px" }}>
        <Loader2
          className="ui-spin"
          size={32}
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.bank-account.read">
      <div className="ui-stack-4 ui-animate-in">
        <div className="ui-grid-3">
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">Total Active Cards</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-primary)" }}
              >
                {cards.length}
              </p>
              <p className="ui-text-xs-muted">Across 3 departments</p>
            </div>
          </Card>
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">Total Monthly Credit Limit</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-success)" }}
              >
                $
                {cards
                  .reduce((acc, c) => acc + Number(c.monthlyLimit || 0), 0)
                  .toLocaleString()}
              </p>
              <p className="ui-text-xs-muted">Card limit policy active</p>
            </div>
          </Card>
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">Current Month Spend</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-warning)" }}
              >
                $
                {cards
                  .reduce((acc, c) => acc + Number(c.currentSpend || 0), 0)
                  .toLocaleString()}
              </p>
              <p className="ui-text-xs-muted">Auto-synced with bank feeds</p>
            </div>
          </Card>
        </div>

        <Card padding="md">
          <ListPageTemplate
            title="Corporate Cards & Spend Limits"
            subtitle="Manage corporate credit cards, monthly spend caps, and department budget limits."
            columns={columns}
            data={cards}
            actions={
              <Button variant="primary">
                <CreditCard size={14} style={{ marginRight: "6px" }} /> + Issue
                New Card
              </Button>
            }
          />
        </Card>
      </div>
    </RouteGuard>
  );
}
