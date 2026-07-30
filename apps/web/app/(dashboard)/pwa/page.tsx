// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  KPICard,
  Spinner,
  DataTable,
  Button,
  type Column,
} from "@unerp/ui";
import {
  Smartphone,
  Bell,
  Database,
  CloudOff,
  Settings,
  Eye,
} from "lucide-react";

interface CacheRule {
  id: string;
  name: string;
  urlPattern: string;
  cacheStrategy: string;
  maxAgeSeconds: number;
  priority: number;
  isActive: boolean;
}
interface PushSub {
  id: string;
  userId: string;
  deviceType: string;
  browser: string;
  status: string;
  createdAt: string;
}

export default function PwaPage() {
  const [cacheRules, setCacheRules] = useState<CacheRule[]>([]);
  const [pushSubs, setPushSubs] = useState<PushSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [manifest, setManifest] = useState<any>(null);
  const [sw, setSw] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/pwa/manifest")
        .then((r) => r.json())
        .then(setManifest)
        .catch(() => {}),
      fetch("/api/admin/pwa/service-worker")
        .then((r) => r.json())
        .then(setSw)
        .catch(() => {}),
      fetch("/api/admin/pwa/cache-rules")
        .then((r) => r.json())
        .then(setCacheRules)
        .catch(() => {}),
      fetch("/api/admin/pwa/push-subscriptions")
        .then((r) => r.json())
        .then(setPushSubs)
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );

  const cacheColumns: Column<CacheRule>[] = [
    { key: "name", header: "Name" },
    { key: "urlPattern", header: "URL Pattern" },
    { key: "cacheStrategy", header: "Strategy" },
    {
      key: "maxAgeSeconds",
      header: "TTL",
      render: (r) => `${Math.round(r.maxAgeSeconds / 60)}min`,
    },
    { key: "isActive", header: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>PWA Settings</h1>
      </div>
      <div className="ui-grid-4">
        <KPICard
          title="Manifest"
          value={manifest?.name || "UniERP"}
          icon={<Smartphone size={20} />}
        />
        <KPICard
          title="Service Worker"
          value={sw?.version || "N/A"}
          icon={<CloudOff size={20} />}
        />
        <KPICard
          title="Cache Rules"
          value={cacheRules.length}
          icon={<Database size={20} />}
        />
        <KPICard
          title="Push Subs"
          value={pushSubs.length}
          icon={<Bell size={20} />}
        />
      </div>
      <div className="ui-grid-2">
        <Card padding="sm">
          <div style={{ padding: 'var(--space-3)' }}>
            <div className="ui-flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h4 className="text-xs font-semibold m-0">Cache Rules</h4>
              <Button variant="primary" size="sm">
                <Settings size={14} /> Manage
              </Button>
            </div>
            <DataTable columns={cacheColumns} data={cacheRules.slice(0, 5)} />
          </div>
        </Card>
        <Card padding="sm">
          <div style={{ padding: 'var(--space-3)' }}>
            <div className="ui-flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h4 className="text-xs font-semibold m-0">Install Prompt</h4>
              <Button variant="primary" size="sm">
                <Settings size={14} /> Configure
              </Button>
            </div>
            {manifest && (
              <div className="p-4">
                <p>
                  <strong>Display:</strong> {manifest.display}
                </p>
                <p>
                  <strong>Theme Color:</strong> {manifest.themeColor}
                </p>
                <p>
                  <strong>Start URL:</strong> {manifest.startUrl}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
