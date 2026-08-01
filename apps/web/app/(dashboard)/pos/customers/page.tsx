"use client";

import styles from "./page.module.css";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  Users,
  Gift,
  CreditCard,
  Search,
  Award,
  TrendingUp,
} from "lucide-react";

export default function POSCustomersPage() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "customers") as
    | "customers"
    | "loyalty"
    | "gift-cards";
  const [search, setSearch] = useState("");

  const tabs: SubTab[] = [
    {
      id: "customers",
      label: "Customer Directory",
      href: "/pos/customers?subtab=customers",
      icon: Users,
    },
    {
      id: "loyalty",
      label: "Loyalty Program",
      href: "/pos/customers?subtab=loyalty",
      icon: Gift,
    },
    {
      id: "gift-cards",
      label: "Gift Cards",
      href: "/pos/customers?subtab=gift-cards",
      icon: CreditCard,
    },
  ];

  return (
    <div className="ui-stack-6">
      <div>
        <h1 className="text-2xl ui-hstack-2">
          <Users className="ui-text-primary" />
          POS Customers & Loyalty
        </h1>
        <p className="ui-text-sm-muted">
          Manage customer profiles, loyalty programs, and gift cards.
        </p>
      </div>

      <SubTabBar tabs={tabs} />

      {activeTab === "customers" && (
        <div>
          <div className={styles.p3}>
            <div className={styles.p4}>
              <Search size={16} className={styles.p5} />
              <input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.p6}
              />
            </div>
          </div>
          <div className={styles.p7}>
            Search customers by name, email, or phone to manage their profiles,
            loyalty points, and store credits.
          </div>
        </div>
      )}

      {activeTab === "loyalty" && (
        <div>
          <div className={styles.p8}>
            {["BRONZE", "SILVER", "GOLD", "PLATINUM"].map((tier) => (
              <div key={tier} className={styles.p9}>
                <Award size={24} className={styles.p10} />
                <div className="ui-heading-lg">{tier}</div>
                <div className="ui-text-xs-muted">Tier</div>
              </div>
            ))}
          </div>
          <p className="ui-text-sm-muted">
            Configure loyalty programs, points per purchase, redeem rates, and
            tier thresholds via the API.
          </p>
        </div>
      )}

      {activeTab === "gift-cards" && (
        <div>
          <div className="ui-card p-5">
            <h3 className="ui-section-header">Issue Gift Card</h3>
            <p className="ui-text-sm-muted">
              Issue and manage gift cards. Gift cards can be used at checkout as
              a payment method.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
