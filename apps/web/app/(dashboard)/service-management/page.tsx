// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  DataTable,
  Badge,
  Card,
  Spinner,
  Input,
  type Column,
} from "@unerp/ui";

interface ServiceTicket {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: string;
}

export default function ServiceManagementPage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    type: "REQUEST",
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      // Stub: in a real app this hits /api/v1/service-management/tickets
      // Since we just built the backend, we would connect this to our TRPC or fetch client
      setTickets([
        {
          id: "1",
          number: "INC-00001",
          title: "Laptop not working",
          status: "OPEN",
          priority: "HIGH",
        },
        {
          id: "2",
          number: "INC-00002",
          title: "Need access to CRM",
          status: "NEW",
          priority: "MEDIUM",
        },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    // Stub implementation to connect with our newly created TicketController
    // await fetch("/api/v1/service-management/tickets", { method: "POST", body: JSON.stringify(newTicket) });
    setIsModalOpen(false);
    fetchTickets();
  };

  const columns: Column<ServiceTicket>[] = [
    { key: "number", header: "Ticket #" },
    { key: "title", header: "Title" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "OPEN" ? "warning" : "default"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <Badge variant={row.priority === "HIGH" ? "danger" : "default"}>
          {row.priority}
        </Badge>
      ),
    },
  ];

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Service Management</h1>
          <p className="text-muted-foreground">
            Manage your IT support, customer service, and ticketing.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>New Ticket</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="text-sm text-muted-foreground">Open Tickets</h3>
          <p className="text-2xl font-bold">12</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm text-muted-foreground">Unassigned</h3>
          <p className="text-2xl font-bold">4</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm text-muted-foreground">SLA Breached</h3>
          <p className="text-2xl font-bold text-red-500">1</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm text-muted-foreground">Avg Resolution Time</h3>
          <p className="text-2xl font-bold">4.2h</p>
        </Card>
      </div>

      <Card>
        <DataTable data={tickets} columns={columns} />
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] p-6 space-y-4">
            <h2 className="text-xl font-bold">Create Ticket</h2>
            <Input
              placeholder="Title"
              value={newTicket.title}
              onChange={(e) =>
                setNewTicket({ ...newTicket, title: e.target.value })
              }
            />
            <Input
              placeholder="Description"
              value={newTicket.description}
              onChange={(e) =>
                setNewTicket({ ...newTicket, description: e.target.value })
              }
            />
            <div className="flex gap-4">
              <select
                className="w-full p-2 border rounded"
                value={newTicket.priority}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, priority: e.target.value })
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Submit</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
