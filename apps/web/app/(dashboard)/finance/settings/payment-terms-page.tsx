"use client";

import { useState } from "react";
import { Clock, Gift, CheckCircle2, XCircle } from "lucide-react";
import { Card, PageHeader, Button, Badge, Spinner } from "@unerp/ui";

interface PaymentTerm {
  id: string;
  name: string;
  dueDays: number;
  discountDays: number;
  discountPercent: number;
  isDefault: boolean;
  status: "active" | "inactive";
}

const SAMPLE_TERMS: PaymentTerm[] = [
  {
    id: "PT001",
    name: "Net 30",
    dueDays: 30,
    discountDays: 0,
    discountPercent: 0,
    isDefault: true,
    status: "active",
  },
  {
    id: "PT002",
    name: "Net 60",
    dueDays: 60,
    discountDays: 0,
    discountPercent: 0,
    isDefault: false,
    status: "active",
  },
  {
    id: "PT003",
    name: "Net 15",
    dueDays: 15,
    discountDays: 0,
    discountPercent: 0,
    isDefault: false,
    status: "active",
  },
  {
    id: "PT004",
    name: "2/10 Net 30",
    dueDays: 30,
    discountDays: 10,
    discountPercent: 2,
    isDefault: false,
    status: "active",
  },
  {
    id: "PT005",
    name: "1/15 Net 45",
    dueDays: 45,
    discountDays: 15,
    discountPercent: 1,
    isDefault: false,
    status: "active",
  },
  {
    id: "PT006",
    name: "Due on Receipt",
    dueDays: 0,
    discountDays: 0,
    discountPercent: 0,
    isDefault: false,
    status: "active",
  },
  {
    id: "PT007",
    name: "COD",
    dueDays: 0,
    discountDays: 0,
    discountPercent: 0,
    isDefault: false,
    status: "inactive",
  },
];

export default function PaymentTermsPage() {
  const [terms] = useState<PaymentTerm[]>(SAMPLE_TERMS);
  const [loading] = useState(false);

  if (loading) return <Spinner />;

  return (
    <div className="ui-stack-6">
      <div
        className="ui-hstack-4"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <PageHeader
          title="Payment Terms"
          description="Configure payment schedules, due day intervals, and early payment discounts"
        />
        <Button variant="primary">Add Payment Term</Button>
      </div>
      <div className="ui-grid-3">
        {terms.map((term) => (
          <Card key={term.id} padding="lg" className="ui-stack-3">
            <div
              className="ui-hstack-3"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <h3 className="ui-heading-sm">{term.name}</h3>
              <Badge variant={term.status === "active" ? "success" : "default"}>
                {term.status}
              </Badge>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "var(--space-2)",
              }}
            >
              <div>
                <p className="ui-text-xs-muted">Due Within</p>
                <p className="ui-text-sm" style={{ fontWeight: 600 }}>
                  {term.dueDays > 0 ? `${term.dueDays} days` : "Immediate"}
                </p>
              </div>
              <div>
                <p className="ui-text-xs-muted">Discount Days</p>
                <p className="ui-text-sm" style={{ fontWeight: 600 }}>
                  {term.discountDays > 0 ? `${term.discountDays} days` : "—"}
                </p>
              </div>
              <div>
                <p className="ui-text-xs-muted">Discount %</p>
                <p className="ui-text-sm" style={{ fontWeight: 600 }}>
                  {term.discountPercent > 0 ? `${term.discountPercent}%` : "—"}
                </p>
              </div>
            </div>
            {term.isDefault && <Badge variant="info">Default</Badge>}
            <div className="ui-hstack-2" style={{ justifyContent: "flex-end" }}>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
              <Button variant="ghost" size="sm">
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Card padding="lg" className="ui-stack-3">
        <h3 className="ui-heading-sm">All Payment Terms</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="ui-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Due Days</th>
                <th>Discount Days</th>
                <th>Discount %</th>
                <th>Default</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((term) => (
                <tr key={term.id}>
                  <td style={{ fontWeight: 600 }}>{term.name}</td>
                  <td>{term.dueDays > 0 ? `${term.dueDays} days` : "N/A"}</td>
                  <td>
                    {term.discountDays > 0 ? `${term.discountDays} days` : "—"}
                  </td>
                  <td>
                    {term.discountPercent > 0
                      ? `${term.discountPercent}%`
                      : "—"}
                  </td>
                  <td>
                    {term.isDefault ? (
                      <CheckCircle2 size={16} className="ui-text-success" />
                    ) : (
                      <XCircle size={16} className="ui-text-muted" />
                    )}
                  </td>
                  <td>
                    <Badge
                      variant={term.status === "active" ? "success" : "default"}
                    >
                      {term.status}
                    </Badge>
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
