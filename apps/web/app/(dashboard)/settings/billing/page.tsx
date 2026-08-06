"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { CreditCard, Download, ShieldCheck, DollarSign } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function SaasPortalBillingPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [profData, pmData] = await Promise.all([
        client.get<any>("/saas-portal/billing-self-service/profile"),
        client.get<any[]>("/saas-portal/billing-self-service/payment-methods"),
      ]);
      setProfile(profData);
      setPaymentMethods(Array.isArray(pmData) ? pmData : []);
    } catch (err) {
      toast.error(
        "Failed to load Self-Service Billing data",
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
        title="Customer Self-Service Billing & Payment Methods"
        description="Manage company tax profile, primary payment methods, and invoice download audit logs."
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
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            Account Company
          </span>
          <div
            style={{ fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}
          >
            {profile?.companyName || "Acme Corp"}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            Saved Payment Cards
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "var(--color-primary)",
              marginTop: "4px",
            }}
          >
            {paymentMethods.length}
          </div>
        </Card>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
      >
        <Card style={{ padding: "24px" }}>
          <h3
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
          >
            Saved Payment Methods
          </h3>
          {paymentMethods.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)" }}>
              No saved credit cards or payment methods.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <CreditCard size={24} color="var(--color-primary)" />
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {pm.brand} •••• {pm.last4}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        Expires {pm.expMonth}/{pm.expYear}
                      </div>
                    </div>
                  </div>
                  {pm.isDefault && <Badge variant="success">Default</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: "24px" }}>
          <h3
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
          >
            Billing Tax Profile
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "14px",
            }}
          >
            <div>
              <strong>Billing Email:</strong>{" "}
              {profile?.billingEmail || "billing@acme.com"}
            </div>
            <div>
              <strong>Technical Contact:</strong>{" "}
              {profile?.technicalEmail || "devops@acme.com"}
            </div>
            <div>
              <strong>Tax ID / VAT:</strong> {profile?.taxId || "US-99482019"}
            </div>
            <div>
              <strong>Country:</strong> {profile?.country || "United States"}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
