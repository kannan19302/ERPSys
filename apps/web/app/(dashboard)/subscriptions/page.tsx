// @ts-nocheck
"use client";
import React from "react";
import Link from "next/link";
import { PageHeader, Button, Card } from "@unerp/ui";
import {
  CreditCard,
  Layers,
  TicketPercent,
  AlertTriangle,
  FileText,
  Activity,
  ArrowUpDown,
} from "lucide-react";

const sections = [
  {
    name: "Plans",
    href: "/subscriptions/plans",
    icon: Layers,
    desc: "Manage subscription plans",
  },
  {
    name: "Tiers",
    href: "/subscriptions/tiers",
    icon: CreditCard,
    desc: "Pricing tiers",
  },
  {
    name: "Coupons",
    href: "/subscriptions/coupons",
    icon: TicketPercent,
    desc: "Coupon management",
  },
  {
    name: "Dunning",
    href: "/subscriptions/dunning",
    icon: AlertTriangle,
    desc: "Dunning processes",
  },
  {
    name: "Credit Notes",
    href: "/subscriptions/credit-notes",
    icon: FileText,
    desc: "Credit notes",
  },
  {
    name: "Usage",
    href: "/subscriptions/usage",
    icon: Activity,
    desc: "Usage tracking",
  },
  {
    name: "Migrations",
    href: "/subscriptions/migrations",
    icon: ArrowUpDown,
    desc: "Plan migrations",
  },
];

export default function SubscriptionsHomePage() {
  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Subscription billing and lifecycle management"
      />
      <div className="ui-grid-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.name} href={s.href}>
              <Card
                className="ui-card"
                style={{ padding: "var(--space-4)", cursor: "pointer" }}
              >
                <div
                  className="ui-flex"
                  style={{
                    alignItems: "center",
                    gap: "var(--space-3)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  <Icon size={20} />
                  <h3>{s.name}</h3>
                </div>
                <p
                  style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-muted)",
                  }}
                >
                  {s.desc}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
