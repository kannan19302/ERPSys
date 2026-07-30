// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  DataTable,
  Badge,
  Spinner,
  Button,
  type Column,
} from "@unerp/ui";
import { RotateCcw, Archive, Trash2, Eye } from "lucide-react";

interface DlqEntry {
  id: string;
  eventName: string;
  destination: string;
  payload: any;
  status: string;
  failedAttempts: number;
  requeueCount: number;
  maxRequeues: number;
  lastAttemptedAt?: string;
  createdAt: string;
}

export default function DlqPage() {
  const [items, setItems] = useState<DlqEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/outbox/dlq")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );

  const columns: Column<DlqEntry>[] = [
    { key: "eventName", header: "Event", sortable: true },
    { key: "destination", header: "Destination" },
    {
      key: "failedAttempts",
      header: "Attempts",
      render: (r) => `${r.failedAttempts}/${r.maxRequeues}`,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "PENDING_REVIEW" ? "warning" : "info"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <Archive size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Dead Letter Queue</h1>
      </div>
      <Card>
        <DataTable columns={columns} data={items} />
      </Card>
    </div>
  );
}
