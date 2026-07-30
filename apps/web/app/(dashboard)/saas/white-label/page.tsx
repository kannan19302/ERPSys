// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { Globe, Lock, CheckCircle, Clock } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function WhiteLabelPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const toast = useToast();

  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>("/saas/white-label-deep/domains");
      setDomains(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Custom Domains",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const handleAddDomain = async () => {
    try {
      if (!newDomain) {
        toast.error("Validation Error", "Custom domain URL is required");
        return;
      }
      await client.post("/saas/white-label-deep/domains", {
        customDomain: newDomain,
      });
      toast.success("Domain Added", "Follow DNS instructions to verify CNAME");
      setNewDomain("");
      loadDomains();
    } catch (err) {
      toast.error(
        "Failed to add custom domain",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await client.put(`/saas/white-label-deep/domains/${id}/verify`, {});
      toast.success("Domain Verified", "Custom domain and SSL are active!");
      loadDomains();
    } catch (err) {
      toast.error(
        "Verification failed",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

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
        title="White-Label & Custom Domains"
        description="Configure custom domain CNAME routing, automated Let's Encrypt SSL certificates, and custom tenant branding."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Add Custom Domain
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="erp.yourcompany.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleAddDomain}>Add Domain</Button>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Configured Custom Domains
        </h3>
        {domains.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No custom white-label domains configured yet.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {domains.map((dom) => (
              <div
                key={dom.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>
                    {dom.customDomain}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      marginTop: "2px",
                    }}
                  >
                    CNAME Target: <code>{dom.cnameTarget}</code> | Token:{" "}
                    <code>{dom.verificationToken}</code>
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Badge variant={dom.isVerified ? "success" : "warning"}>
                    {dom.status}
                  </Badge>
                  {!dom.isVerified && (
                    <Button size="sm" onClick={() => handleVerify(dom.id)}>
                      Verify DNS
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
