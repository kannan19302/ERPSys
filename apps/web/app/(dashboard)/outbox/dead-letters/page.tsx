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
    { header: "Event", accessor: "eventName", sortable: true },
    { header: "Destination", accessor: "destination" },
    {
      header: "Reason",
      accessor: (r) =>
        r.failureReason ? r.failureReason.slice(0, 50) + "..." : "-",
    },
    {
      header: "Action",
      accessor: (r) =>
        r.action ? <Badge variant="info">{r.action}</Badge> : "-",
    },
    { header: "Actioned By", accessor: (r) => r.actionedBy || "-" },
    {
      header: "Dead Since",
      accessor: (r) => new Date(r.deadLetterAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: (r) => (
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
        <DataTable columns={columns} data={items} sortable />
      </Card>
    </div>
  );
}
