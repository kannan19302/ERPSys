"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Card, Badge, Button } from "@unerp/ui";

import { api } from "@/lib/api";

interface DemoStatus {
  loaded: boolean;
  totalRecords: number;
  entityCounts: Record<string, number>;
  module: string;
}

export function FinanceDemoDataCard() {
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api<DemoStatus>("/finance/demo-data/status");
      setStatus(data);
    } catch {
      // Fallback if endpoint unreachable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleLoadDemoData = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const data = await api<{ success: boolean; message: string }>(
        "/finance/demo-data/load",
        {
          method: "POST",
        },
      );
      setMessage({
        type: "success",
        text: data.message || "Finance demo data loaded successfully!",
      });
      await fetchStatus();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to load demo data.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnloadDemoData = async () => {
    if (
      !window.confirm(
        "Are you sure you want to unload Finance demo data? This will remove all sample invoices and payments.",
      )
    ) {
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const data = await api<{ success: boolean; message: string }>(
        "/finance/demo-data/unload",
        {
          method: "POST",
        },
      );
      setMessage({
        type: "success",
        text: data.message || "Finance demo data unloaded successfully.",
      });
      await fetchStatus();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to unload demo data.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card padding="lg" style={{ marginTop: "var(--space-4)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--space-3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <Database size={20} className="ui-text-primary" />
          <h3 className="ui-heading-sm" style={{ margin: 0 }}>
            Finance Demo Data Settings
          </h3>
        </div>
        {status && (
          <Badge variant={status.loaded ? "success" : "default"}>
            {status.loaded ? "Demo Data Active" : "Clean State / Production"}
          </Badge>
        )}
      </div>

      <p
        className="ui-text-xs-muted"
        style={{ marginBottom: "var(--space-4)" }}
      >
        Manage sample invoices, payments, and financial records exclusively for
        the <strong>Finance Module</strong>. Loading demo data allows you to
        explore features without affecting other modules. Unloading will safely
        remove only the Finance demo records.
      </p>

      {message && (
        <div
          style={{
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-3)",
            fontSize: "var(--text-xs)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            backgroundColor:
              message.type === "success"
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
            color:
              message.type === "success"
                ? "var(--color-success)"
                : "var(--color-danger)",
            border: `1px solid ${message.type === "success" ? "var(--color-success)" : "var(--color-danger)"}`,
          }}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {status?.loaded && status.entityCounts && (
        <div
          style={{
            marginBottom: "var(--space-4)",
            padding: "var(--space-3)",
            background: "var(--color-bg-secondary)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              marginBottom: "var(--space-2)",
            }}
          >
            Tracked Demo Entities ({status.totalRecords} total):
          </div>
          <div
            style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}
          >
            {Object.entries(status.entityCounts).map(([entity, count]) => (
              <div key={entity} style={{ fontSize: "var(--text-xs)" }}>
                <span
                  style={{
                    textTransform: "capitalize",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {entity}s:{" "}
                </span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}
      >
        <Button
          variant="primary"
          onClick={handleLoadDemoData}
          disabled={loading || actionLoading || (status?.loaded ?? false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <Sparkles size={16} />
          {actionLoading ? "Processing..." : "Load Finance Demo Data"}
        </Button>

        <Button
          variant="danger"
          onClick={handleUnloadDemoData}
          disabled={loading || actionLoading || !(status?.loaded ?? false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <Trash2 size={16} />
          {actionLoading ? "Processing..." : "Unload Finance Demo Data"}
        </Button>

        <Button
          variant="secondary"
          onClick={fetchStatus}
          disabled={loading || actionLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
    </Card>
  );
}
