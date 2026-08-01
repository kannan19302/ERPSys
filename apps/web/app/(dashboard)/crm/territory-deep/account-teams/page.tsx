"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  useToast,
  DataTable,
  type Column,
} from "@unerp/ui";
import { ArrowLeft } from "lucide-react";
import { useApiClient } from "@unerp/framework";
import Link from "next/link";

export default function AccountTeamsPage() {
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const toast = useToast();
  const client = useApiClient();

  const loadTeams = useCallback(
    async (cid: string) => {
      setLoading(true);
      try {
        const res = await client.get<any>(
          `/crm/territory-deep/account-teams/${cid}`,
        );
        setTeams(Array.isArray(res?.data) ? res.data : []);
        setSearched(true);
      } catch {
        toast.error("Could not load account teams");
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const memberCols: Column<any>[] = [
    { key: "userId", header: "User ID" },
    { key: "role", header: "Role" },
    {
      key: "isPrimary",
      header: "Primary",
      render: (v: boolean) => (v ? "Yes" : "No"),
    },
    {
      key: "createdAt",
      header: "Since",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
  ];

  return (
    <div className="ui-page">
      <PageHeader
        title="Account Teams"
        description="View account team members by customer"
        breadcrumbs={[
          { label: "Territory Management", href: "/crm/territory-deep" },
          { label: "Account Teams" },
        ]}
      />
      <Card title="Search Account" className="ui-card-sm">
        <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
          <input
            className="ui-input"
            placeholder="Enter Customer ID..."
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <Button
            onClick={() => customerId && loadTeams(customerId)}
            disabled={!customerId}
          >
            Search
          </Button>
        </div>
      </Card>
      {loading && <Spinner />}
      {!loading &&
        searched &&
        teams.length > 0 &&
        teams.map((team: any) => (
          <Card
            key={team.id}
            title={team.name}
            className="ui-card-full"
            style={{ marginTop: "var(--space-3)" }}
          >
            <p className="ui-text-muted">{team.description}</p>
            <DataTable columns={memberCols} data={team.members || []} />
          </Card>
        ))}
      {!loading && searched && teams.length === 0 && (
        <div className="ui-empty">No teams found for this customer</div>
      )}
    </div>
  );
}
