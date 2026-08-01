"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge } from "@unerp/ui";
import { Users, DollarSign, Award, TrendingUp } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function ResellerChannelPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [resellers, setResellers] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [resellersData, commsData] = await Promise.all([
        client.get<any[]>("/saas/reseller-channel-deep/resellers"),
        client.get<any[]>("/saas/reseller-channel-deep/commissions"),
      ]);
      setResellers(Array.isArray(resellersData) ? resellersData : []);
      setCommissions(Array.isArray(commsData) ? commsData : []);
    } catch (err) {
      toast.error(
        "Failed to load Partner Reseller Channel data",
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
        title="Partner Reseller Channels & Commissions"
        description="Manage Tiered SaaS Reseller Partners, automated revenue split commissions, and tenant assignments."
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
            Active Reseller Partners
          </span>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "4px" }}
          >
            {resellers.length}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Total Commissions Tracked
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#10b981",
              marginTop: "4px",
            }}
          >
            $
            {commissions
              .reduce((sum, c) => sum + Number(c.earnedAmount || 0), 0)
              .toLocaleString()}
          </div>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Partner Reseller Directory
        </h3>
        {resellers.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No active reseller partners onboarded.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px 16px" }}>Partner Name</th>
                <th style={{ padding: "12px 16px" }}>Tier</th>
                <th style={{ padding: "12px 16px" }}>Commission Rate</th>
                <th style={{ padding: "12px 16px" }}>Managed Tenants</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {resellers.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                    {r.partnerName}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      variant={
                        r.tier === "GOLD" || r.tier === "PLATINUM"
                          ? "warning"
                          : "info"
                      }
                    >
                      {r.tier}
                    </Badge>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "#10b981",
                      fontWeight: 600,
                    }}
                  >
                    {r.commissionPct}%
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {r.managedTenants} tenants
                  </td>
                  <td style={{ padding: "12px 16px" }}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
