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
import { RotateCcw, Eye } from "lucide-react";

interface DeadLetter {
  id: string;
  eventName: string;
  destination: string;
  failureReason?: string;
  deadLetterAt: string;
  action?: string;
  actionedBy?: string;
}

export default function DeadLettersPage() {
  const [items, setItems] = useState<DeadLetter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/outbox/dead-letters")
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

  const columns: Column<DeadLetter>[] = [
    { key: "eventName", header: "Event", sortable: true },
    { key: "destination", header: "Destination" },
    {
      key: "failureReason",
      header: "Reason",
      render: (r) =>
        r.failureReason ? r.failureReason.slice(0, 50) + "..." : "-",
    },
    {
      key: "action",
      header: "Action",
      render: (r) =>
        r.action ? <Badge variant="info">{r.action}</Badge> : "-",
    },
    { key: "actionedBy", header: "Actioned By", render: (r) => r.actionedBy || "-" },
    {
      key: "deadLetterAt",
      header: "Dead Since",
      render: (r) => new Date(r.deadLetterAt).toLocaleDateString(),
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
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Dead Letters</h1>
      </div>
      <Card>
        <DataTable columns={columns} data={items} />
      </Card>
    </div>
  );
}
