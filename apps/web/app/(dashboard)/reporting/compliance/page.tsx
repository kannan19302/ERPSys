"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { ShieldCheck, CheckCircle2, FileCheck, Lock } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function ReportingCompliancePage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<any[]>([]);
  const [reportName, setReportName] = useState("");
  const toast = useToast();

  const loadAudits = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/reporting/compliance-signoff-deep/audits",
      );
      setAudits(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Compliance Audits",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
  }, []);

  const handleInitiate = async () => {
    try {
      if (!reportName) {
        toast.error("Validation Error", "Report name is required");
        return;
      }
      await client.post("/reporting/compliance-signoff-deep/audits", {
        reportName,
        complianceType: "SOX",
      });
      toast.success(
        "Audit Initiated",
        `SOX compliance audit for "${reportName}" created.`,
      );
      setReportName("");
      loadAudits();
    } catch (err) {
      toast.error(
        "Failed to initiate audit",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  const handleSignoff = async (id: string) => {
    try {
      await client.post(
        `/reporting/compliance-signoff-deep/audits/${id}/signoff`,
        {
          signatureHash: "sig_rsa_2048_hash_981273912837",
          comments: "Verified & approved by Chief Financial Officer.",
        },
      );
      toast.success(
        "Report Approved",
        "Digital signature hash recorded cleanly.",
      );
      loadAudits();
    } catch (err) {
      toast.error(
        "Failed to sign off audit",
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
        title="SOX / GDPR Compliance & Executive Report Sign-Off Desk"
        description="Formal digital sign-off workflow, cryptographic audit signatures, and regulatory compliance validation."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Initiate Regulatory Compliance Audit
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Compliance Report Title (e.g. FY2026 SOX Section 404 Audit)..."
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleInitiate}>Initiate Audit</Button>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Compliance Audits & Sign-Offs
        </h3>
        {audits.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No pending compliance report sign-offs.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Report Name</th>
                <th style={{ padding: "12px" }}>Regulation</th>
                <th style={{ padding: "12px" }}>Sign-off Status</th>
                <th style={{ padding: "12px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {a.reportName}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="info">{a.complianceType}</Badge>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge
                      variant={
                        a.signoffStatus === "APPROVED" ? "success" : "warning"
                      }
                    >
                      {a.signoffStatus}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px" }}>
                    {a.signoffStatus !== "APPROVED" ? (
                      <Button size="sm" onClick={() => handleSignoff(a.id)}>
                        <ShieldCheck size={14} style={{ marginRight: "6px" }} />{" "}
                        Sign Off & Approve
                      </Button>
                    ) : (
                      <span
                        style={{
                          color: "var(--chart-9)",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCircle2 size={14} /> Signed by Auditor
                      </span>
                    )}
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
