"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { RouteGuard } from "@unerp/framework";
import {
  Package,
  MapPin,
  Truck,
  Route as RouteIcon,
  ClipboardList,
  ArrowLeftRight,
} from "lucide-react";
import ShipmentsTab from "./ShipmentsTab";
import TrackingTab from "./TrackingTab";
import CarriersTab from "./CarriersTab";
import RoutesTab from "./RoutesTab";
import AsnsTab from "./AsnsTab";
import VendorReturnsTab from "./VendorReturnsTab";

const TAB_KEYS = [
  "shipments",
  "tracking",
  "carriers",
  "routes",
  "asns",
  "vendor-returns",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

const OPERATIONS_TABS: SubTab[] = [
  {
    id: "shipments",
    label: "Shipments",
    href: "/supply-chain/operations?tab=shipments",
    icon: Package,
  },
  {
    id: "tracking",
    label: "Shipment Tracking",
    href: "/supply-chain/operations?tab=tracking",
    icon: MapPin,
  },
  {
    id: "carriers",
    label: "Carrier Management",
    href: "/supply-chain/operations?tab=carriers",
    icon: Truck,
  },
  {
    id: "routes",
    label: "Route Optimization",
    href: "/supply-chain/operations?tab=routes",
    icon: RouteIcon,
  },
  {
    id: "asns",
    label: "Advance Shipping Notices (ASN)",
    href: "/supply-chain/operations?tab=asns",
    icon: ClipboardList,
  },
  {
    id: "vendor-returns",
    label: "Vendor Returns",
    href: "/supply-chain/operations?tab=vendor-returns",
    icon: ArrowLeftRight,
  },
];

function OperationsHubContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = isTabKey(searchParams.get("tab"))
    ? (searchParams.get("tab") as TabKey)
    : "shipments";
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  return (
    <RouteGuard permission="supply-chain.shipment.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Operations"
          description="Day-to-day shipment operations: view shipments, track deliveries, manage carriers, and optimize routes"
          breadcrumbs={[
            { label: "Supply Chain", href: "/supply-chain" },
            { label: "Operations" },
          ]}
        />

        <SubTabBar tabs={OPERATIONS_TABS} />

        <div className={activeTab === "shipments" ? "" : "hidden"}>
          {visited.has("shipments") && <ShipmentsTab />}
        </div>
        <div className={activeTab === "tracking" ? "" : "hidden"}>
          {visited.has("tracking") && <TrackingTab />}
        </div>
        <div className={activeTab === "carriers" ? "" : "hidden"}>
          {visited.has("carriers") && <CarriersTab />}
        </div>
        <div className={activeTab === "routes" ? "" : "hidden"}>
          {visited.has("routes") && <RoutesTab />}
        </div>
        <div className={activeTab === "asns" ? "" : "hidden"}>
          {visited.has("asns") && <AsnsTab />}
        </div>
        <div className={activeTab === "vendor-returns" ? "" : "hidden"}>
          {visited.has("vendor-returns") && <VendorReturnsTab />}
        </div>
      </div>
    </RouteGuard>
  );
}

export default function OperationsHubPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <OperationsHubContent />
    </Suspense>
  );
}
