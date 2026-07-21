"use client";

import { useState } from "react";
import { Percent, CheckCircle2, XCircle } from "lucide-react";
import { Card, PageHeader, Button, Badge, Spinner } from "@unerp/ui";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: "Sales" | "Purchase" | "Withholding" | "VAT" | "GST";
  jurisdiction: string;
  isDefault: boolean;
  status: "active" | "inactive";
}

const SAMPLE_RATES: TaxRate[] = [
  {
    id: "TR01",
    name: "Standard VAT",
    rate: 20,
    type: "VAT",
    jurisdiction: "United Kingdom",
    isDefault: true,
    status: "active",
  },
  {
    id: "TR02",
    name: "Reduced VAT",
    rate: 5,
    type: "VAT",
    jurisdiction: "United Kingdom",
    isDefault: false,
    status: "active",
  },
  {
    id: "TR03",
    name: "Zero Rate VAT",
    rate: 0,
    type: "VAT",
    jurisdiction: "United Kingdom",
    isDefault: false,
    status: "active",
  },
  {
    id: "TR04",
    name: "Sales Tax - CA",
    rate: 8.25,
    type: "Sales",
    jurisdiction: "California, US",
    isDefault: false,
    status: "active",
  },
  {
    id: "TR05",
    name: "Sales Tax - NY",
    rate: 8.875,
    type: "Sales",
    jurisdiction: "New York, US",
    isDefault: false,
    status: "active",
  },
  {
    id: "TR06",
    name: "GST Standard",
    rate: 10,
    type: "GST",
    jurisdiction: "Australia",
    isDefault: false,
    status: "active",
  },
  {
    id: "TR07",
    name: "GST Reduced",
    rate: 5,
    type: "GST",
    jurisdiction: "Australia",
    isDefault: false,
    status: "active",
  },
  {
    id: "TR08",
    name: "Withholding Tax",
    rate: 15,
    type: "Withholding",
    jurisdiction: "Federal",
    isDefault: false,
    status: "active",
  },
  {
    id: "TR09",
    name: "Old Sales Tax",
    rate: 6,
    type: "Sales",
    jurisdiction: "Texas, US",
    isDefault: false,
    status: "inactive",
  },
];

export default function TaxRatesPage() {
  const [rates] = useState<TaxRate[]>(SAMPLE_RATES);
  const [loading] = useState(false);

  if (loading) return <Spinner />;

  const activeRates = rates.filter((r) => r.status === "active");
  const defaultRate = rates.find((r) => r.isDefault);

  return (
    <div className="ui-stack-6">
      <div
        className="ui-hstack-4"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <PageHeader
          title="Tax Rates"
          description="Manage tax rates, types, and jurisdictions"
        />
        <Button variant="primary">Add Tax Rate</Button>
      </div>
      <div className="ui-grid-3">
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Total Rates</p>
          <p className="ui-heading-sm">{rates.length}</p>
        </Card>
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Default Rate</p>
          <p className="ui-heading-sm">
            {defaultRate ? `${defaultRate.rate}%` : "—"}
          </p>
          {defaultRate && (
            <p className="ui-text-xs-muted">{defaultRate.name}</p>
          )}
        </Card>
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Active</p>
          <p className="ui-heading-sm ui-text-success">{activeRates.length}</p>
        </Card>
      </div>
      <Card padding="lg" className="ui-stack-3">
        <h3 className="ui-heading-sm">All Tax Rates</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="ui-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Rate</th>
                <th>Type</th>
                <th>Jurisdiction</th>
                <th>Default</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id}>
                  <td style={{ fontWeight: 600 }}>{rate.name}</td>
                  <td>{rate.rate}%</td>
                  <td>
                    <Badge variant="info">{rate.type}</Badge>
                  </td>
                  <td>{rate.jurisdiction}</td>
                  <td>
                    {rate.isDefault ? (
                      <CheckCircle2 size={16} className="ui-text-success" />
                    ) : (
                      <XCircle size={16} className="ui-text-muted" />
                    )}
                  </td>
                  <td>
                    <Badge
                      variant={rate.status === "active" ? "success" : "default"}
                    >
                      {rate.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="ui-hstack-2">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
