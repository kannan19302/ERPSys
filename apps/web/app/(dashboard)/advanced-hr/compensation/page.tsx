"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { DollarSign, Layers, Shield } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AdvancedHrCompensationPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [bands, setBands] = useState<any[]>([]);
  const [bandName, setBandName] = useState("");
  const [jobLevel, setJobLevel] = useState("IC4");
  const toast = useToast();

  const loadBands = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/advanced-hr/compensation-bands-deep/bands",
      );
      setBands(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load compensation bands",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBands();
  }, []);

  const handleCreate = async () => {
    try {
      if (!bandName) {
        toast.error("Validation", "Band name required");
        return;
      }
      await client.post("/advanced-hr/compensation-bands-deep/bands", {
        bandName,
        jobLevel,
        minSalary: 100000,
        midSalary: 130000,
        maxSalary: 160000,
        effectiveDate: "2026-01-01",
      });
      toast.success("Band Created", `Compensation band "${bandName}" saved.`);
      setBandName("");
      loadBands();
    } catch (err) {
      toast.error(
        "Failed to create band",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading)
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

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Pay Equity Compensation Band Designer & Salary Range Manager"
        description="Define fair compensation ranges by job level, ensure pay equity, and benchmark salaries against market data."
      />
      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Band name (e.g. IC4 — Senior Engineer)"
            value={bandName}
            onChange={(e) => setBandName(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <select
            value={jobLevel}
            onChange={(e) => setJobLevel(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          >
            {[
              "IC2",
              "IC3",
              "IC4",
              "IC5",
              "IC6",
              "M1",
              "M2",
              "M3",
              "VP",
              "SVP",
            ].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <Button onClick={handleCreate}>Create Band</Button>
        </div>
      </Card>
      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Compensation Salary Bands
        </h3>
        {bands.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No compensation bands defined.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Band Name</th>
                <th style={{ padding: "12px" }}>Level</th>
                <th style={{ padding: "12px" }}>Min</th>
                <th style={{ padding: "12px" }}>Mid</th>
                <th style={{ padding: "12px" }}>Max</th>
              </tr>
            </thead>
            <tbody>
              {bands.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {b.bandName}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="info">{b.jobLevel}</Badge>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    ${Number(b.minSalary).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    ${Number(b.midSalary).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", color: "var(--chart-9)" }}>
                    ${Number(b.maxSalary).toLocaleString()}
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
