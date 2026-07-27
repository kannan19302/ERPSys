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
    { header: "Name", accessor: "name" },
    { header: "URL Pattern", accessor: "urlPattern" },
    { header: "Strategy", accessor: "cacheStrategy" },
    {
      header: "TTL",
      accessor: (r) => `${Math.round(r.maxAgeSeconds / 60)}min`,
    },
    { header: "Active", accessor: (r) => (r.isActive ? "Yes" : "No") },
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
          subtitle="App Name"
          icon={<Smartphone size={20} />}
        />
        <KPICard
          title="Service Worker"
          value={sw?.version || "N/A"}
          subtitle="Version"
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
        <Card
          title="Cache Rules"
          action={
            <Button variant="primary" size="sm">
              <Settings size={14} /> Manage
            </Button>
          }
        >
          <DataTable columns={cacheColumns} data={cacheRules.slice(0, 5)} />
        </Card>
        <Card
          title="Install Prompt"
          action={
            <Button variant="primary" size="sm">
              <Settings size={14} /> Configure
            </Button>
          }
        >
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
        </Card>
      </div>
    </div>
  );
}
