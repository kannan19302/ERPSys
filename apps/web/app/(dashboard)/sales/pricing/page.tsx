"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { DollarSign, Layers, Globe, Percent } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AdvancedPricingPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [ruleSets, setRuleSets] = useState<any[]>([]);
  const [testCalc, setTestCalc] = useState({ quantity: 100, basePrice: 150 });
  const [calcResult, setCalcResult] = useState<any>(null);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [currData, rulesData] = await Promise.all([
        client.get<any[]>("/sales/advanced-pricing-deep/currency-matrices"),
        client.get<any[]>("/sales/advanced-pricing-deep/rule-sets"),
      ]);
      setCurrencies(Array.isArray(currData) ? currData : []);
      setRuleSets(Array.isArray(rulesData) ? rulesData : []);
    } catch (err) {
      toast.error(
        "Failed to load Advanced Pricing Matrix",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculate = async () => {
    try {
      const res = await client.post<any>(
        "/sales/advanced-pricing-deep/volume-discount",
        {
          productId: "prod-101",
          quantity: testCalc.quantity,
          basePrice: testCalc.basePrice,
        },
      );
      setCalcResult(res);
    } catch (err) {
      toast.error(
        "Failed to calculate volume discount",
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
        title="Advanced Pricing & Volume Discount Matrix"
        description="Multi-currency price lists, automated volume tier discounting, and margin floor protection rules."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          margin: "24px 0",
        }}
      >
        <Card style={{ padding: "20px" }}>
          <h3
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}
          >
            Volume Discount Simulator
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                }}
              >
                Order Quantity
              </label>
              <input
                type="number"
                value={testCalc.quantity}
                onChange={(e) =>
                  setTestCalc({ ...testCalc, quantity: Number(e.target.value) })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  marginTop: "4px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                }}
              >
                Base Unit Price ($)
              </label>
              <input
                type="number"
                value={testCalc.basePrice}
                onChange={(e) =>
                  setTestCalc({
                    ...testCalc,
                    basePrice: Number(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  marginTop: "4px",
                }}
              />
            </div>
            <Button onClick={handleCalculate} style={{ marginTop: "8px" }}>
              Calculate Price
            </Button>
          </div>

          {calcResult && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                backgroundColor: "var(--color-bg-sunken)",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                }}
              >
                Applied Volume Discount:{" "}
                <strong style={{ color: "var(--chart-9)" }}>
                  {calcResult.appliedDiscountPct}% OFF
                </strong>
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginTop: "4px",
                }}
              >
                Unit Price: ${calcResult.unitPrice.toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  marginTop: "2px",
                }}
              >
                Total Amount: ${calcResult.totalPrice.toFixed(2)} (Saved $
                {calcResult.savingsAmount.toFixed(2)})
              </div>
            </div>
          )}
        </Card>

        <Card style={{ padding: "20px" }}>
          <h3
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}
          >
            Multi-Currency Exchange Matrix
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "10px" }}>Currency</th>
                <th style={{ padding: "10px" }}>Symbol</th>
                <th style={{ padding: "10px" }}>Base Rate</th>
                <th style={{ padding: "10px" }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((c) => (
                <tr
                  key={c.currency}
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <td style={{ padding: "10px", fontWeight: 600 }}>
                    {c.currency}
                  </td>
                  <td style={{ padding: "10px" }}>{c.symbol}</td>
                  <td style={{ padding: "10px" }}>{c.rate}</td>
                  <td style={{ padding: "10px" }}>
                    <Badge variant={c.isBase ? "info" : "default"}>
                      {c.isBase ? "BASE" : "CONVERTED"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
