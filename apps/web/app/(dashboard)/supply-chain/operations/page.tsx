'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { RouteGuard } from '@unerp/framework';
import { Package, MapPin, Truck, Route as RouteIcon, ClipboardList, ArrowLeftRight } from 'lucide-react';
import ShipmentsTab from './ShipmentsTab';
import TrackingTab from './TrackingTab';
import CarriersTab from './CarriersTab';
import RoutesTab from './RoutesTab';
import AsnsTab from './AsnsTab';
import VendorReturnsTab from './VendorReturnsTab';

const TAB_KEYS = ['shipments', 'tracking', 'carriers', 'routes', 'asns', 'vendor-returns'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function OperationsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'shipments';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([initialTab]));

  const handleChange = (key: string) => {
    if (!isTabKey(key)) return;
    setActiveTab(key);
    setVisited((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    router.replace(`/supply-chain/operations?tab=${key}`, { scroll: false });
  };

  return (
    <RouteGuard permission="supply-chain.shipment.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Operations"
          description="Day-to-day shipment operations: view shipments, track deliveries, manage carriers, and optimize routes"
          breadcrumbs={[
            { label: 'Supply Chain', href: '/supply-chain' },
            { label: 'Operations' },
          ]}
        />

        <Tabs
          tabs={[
            { key: 'shipments', label: 'Shipments', icon: <Package size={14} /> },
            { key: 'tracking', label: 'Shipment Tracking', icon: <MapPin size={14} /> },
            { key: 'carriers', label: 'Carrier Management', icon: <Truck size={14} /> },
            { key: 'routes', label: 'Route Optimization', icon: <RouteIcon size={14} /> },
            { key: 'asns', label: 'Advance Shipping Notices (ASN)', icon: <ClipboardList size={14} /> },
            { key: 'vendor-returns', label: 'Vendor Returns', icon: <ArrowLeftRight size={14} /> },
          ]}
          value={activeTab}
          onChange={handleChange}
        />

        <div className={activeTab === 'shipments' ? '' : 'hidden'}>
          {visited.has('shipments') && <ShipmentsTab />}
        </div>
        <div className={activeTab === 'tracking' ? '' : 'hidden'}>
          {visited.has('tracking') && <TrackingTab />}
        </div>
        <div className={activeTab === 'carriers' ? '' : 'hidden'}>
          {visited.has('carriers') && <CarriersTab />}
        </div>
        <div className={activeTab === 'routes' ? '' : 'hidden'}>
          {visited.has('routes') && <RoutesTab />}
        </div>
        <div className={activeTab === 'asns' ? '' : 'hidden'}>
          {visited.has('asns') && <AsnsTab />}
        </div>
        <div className={activeTab === 'vendor-returns' ? '' : 'hidden'}>
          {visited.has('vendor-returns') && <VendorReturnsTab />}
        </div>
      </div>
    </RouteGuard>
  );
}

export default function OperationsHubPage() {
  return (
    <Suspense fallback={
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    }>
      <OperationsHubContent />
    </Suspense>
  );
}
