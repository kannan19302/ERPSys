// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge } from "@unerp/ui";
import { Server, Cpu, Database, Network } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function ClusterRoutingPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState<any[]>([]);
  const [routing, setRouting] = useState<any>(null);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [clustersData, routingData] = await Promise.all([
        client.get<any[]>("/saas/cluster-routing-deep/clusters"),
        client.get<any>("/saas/cluster-routing-deep/routing"),
      ]);
      setClusters(Array.isArray(clustersData) ? clustersData : []);
      setRouting(routingData);
    } catch (err) {
      toast.error(
        "Failed to load SaaS Cluster Topology",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Multi-Tenant Cluster & Node Routing"
        description="Region-aware database isolation, dedicated worker node groups, and cluster topology management."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          margin: "24px 0",
        }}
      >
        <Card style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Active Clusters
          </span>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "4px" }}
          >
            {clusters.length}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Tenant Isolation Mode
          </span>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#3b82f6",
              marginTop: "4px",
            }}
          >
            {routing?.isDedicated ? "Dedicated DB" : "Shared Multi-Tenant"}
          </div>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Multi-Tenant Server Clusters
        </h3>
        {clusters.length === 0 ? (
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No multi-tenant clusters provisioned.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px 16px" }}>Cluster Name</th>
                <th style={{ padding: "12px 16px" }}>Region</th>
                <th style={{ padding: "12px 16px" }}>Provider</th>
                <th style={{ padding: "12px 16px" }}>Capacity</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                    {c.clusterName}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{c.region}</td>
                  <td style={{ padding: "12px 16px" }}>{c.provider}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {c.activeTenants} / {c.maxTenants} tenants
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      variant={c.status === "HEALTHY" ? "success" : "danger"}
                    >
                      {c.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
