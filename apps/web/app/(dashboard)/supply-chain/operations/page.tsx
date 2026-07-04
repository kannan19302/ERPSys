'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { Package, MapPin, Truck, Route as RouteIcon } from 'lucide-react';
import ShipmentsTab from './ShipmentsTab';
import TrackingTab from './TrackingTab';
import CarriersTab from './CarriersTab';
import RoutesTab from './RoutesTab';

const TAB_KEYS = ['shipments', 'tracking', 'carriers', 'routes'] as const;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
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
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'shipments' ? 'block' : 'none' }}>
        {visited.has('shipments') && <ShipmentsTab />}
      </div>
      <div style={{ display: activeTab === 'tracking' ? 'block' : 'none' }}>
        {visited.has('tracking') && <TrackingTab />}
      </div>
      <div style={{ display: activeTab === 'carriers' ? 'block' : 'none' }}>
        {visited.has('carriers') && <CarriersTab />}
      </div>
      <div style={{ display: activeTab === 'routes' ? 'block' : 'none' }}>
        {visited.has('routes') && <RoutesTab />}
      </div>
    </div>
  );
}

export default function OperationsHubPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    }>
      <OperationsHubContent />
    </Suspense>
  );
}
