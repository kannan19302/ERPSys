"use client";
import { CreditCard } from "lucide-react";
import {
  SubscriptionsTabLayout,
  SUBSCRIPTIONS_TABS,
} from "@/components/subscriptions/SubscriptionsTabLayout";

export default function SubscriptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionsTabLayout
      tabs={SUBSCRIPTIONS_TABS}
      moduleId="subscriptions"
      moduleLabel="Subscriptions"
      moduleIcon={CreditCard}
      moduleDescription="Subscription billing, plans, and lifecycle management"
    >
      {children}
    </SubscriptionsTabLayout>
  );
}
