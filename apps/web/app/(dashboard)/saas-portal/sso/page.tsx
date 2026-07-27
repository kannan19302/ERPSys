"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { KeyRound, Shield, CheckCircle, Lock } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function SaasPortalSsoPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [ssoConfigs, setSsoConfigs] = useState<any[]>([]);
  const toast = useToast();

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/saas-portal/sso-saml-deep/configs",
      );
      setSsoConfigs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load SSO configurations",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
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
        title="Enterprise Single Sign-On (SSO / SAML 2.0)"
        description="Configure Okta, Azure AD, OneLogin, or custom SAML 2.0 / OIDC identity providers for strict corporate authentication."
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
            Configured Identity Providers
          </span>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "4px" }}
          >
            {ssoConfigs.length}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Enforce Mandatory SSO
          </span>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#10b981",
              marginTop: "4px",
            }}
          >
            ACTIVE
          </div>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Identity Providers Directory
        </h3>
        {ssoConfigs.length === 0 ? (
          <p
            style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}
          >
            No SSO configurations active.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {ssoConfigs.map((cfg) => (
              <div
                key={cfg.id}
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
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <KeyRound size={18} color="#3b82f6" /> {cfg.provider}{" "}
                    Integration
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      marginTop: "4px",
                    }}
                  >
                    Issuer URL: <code>{cfg.issuerUrl}</code>
                  </div>
                </div>
                <Badge variant={cfg.isEnabled ? "success" : "warning"}>
                  {cfg.isEnabled ? "Active" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
