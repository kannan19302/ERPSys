// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Spinner,
  DataTable,
  type Column,
  StatCardRow,
  Button,
} from "@unerp/ui";
import { apiGet } from "@/lib/api";
import {
  Shield,
  Database,
  AlertTriangle,
  Camera,
  HardDrive,
  RefreshCw,
} from "lucide-react";

export default function StorageAdvancedPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Storage Advanced"
        description="Encryption, backups, snapshots, alerts, syncs, compliance"
      />
      <div className="ui-grid-4" style={{ marginTop: "var(--space-6)" }}>
        <a
          href="/storage/encryption"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <Shield size={24} /> <span>Encryption</span>
        </a>
        <a
          href="/storage/backups"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <Database size={24} /> <span>Backups</span>
        </a>
        <a
          href="/storage/snapshots"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <Camera size={24} /> <span>Snapshots</span>
        </a>
        <a
          href="/storage/alerts"
          className="ui-card"
          style={{
            padding: "var(--space-5)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <AlertTriangle size={24} /> <span>Alerts</span>
        </a>
      </div>
    </div>
  );
}
