"use client";

import { useState } from "react";
import { CreditCard, Building2, Wallet } from "lucide-react";
import { Card, PageHeader, Button, Badge, Spinner } from "@unerp/ui";

interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  processingFee: number;
  isActive: boolean;
  icon: React.ReactNode;
}

const SAMPLE_METHODS: PaymentMethod[] = [
  {
    id: "PM01",
    code: "BANK_TRANSFER",
    name: "Bank Transfer",
    processingFee: 0,
    isActive: true,
    icon: <Building2 size={20} />,
  },
  {
    id: "PM02",
    code: "CREDIT_CARD",
    name: "Credit Card",
    processingFee: 2.9,
    isActive: true,
    icon: <CreditCard size={20} />,
  },
  {
    id: "PM03",
    code: "DEBIT_CARD",
    name: "Debit Card",
    processingFee: 1.5,
    isActive: true,
    icon: <CreditCard size={20} />,
  },
  {
    id: "PM04",
    code: "CASH",
    name: "Cash",
    processingFee: 0,
    isActive: true,
    icon: <Wallet size={20} />,
  },
  {
    id: "PM05",
    code: "CHECK",
    name: "Check",
    processingFee: 0,
    isActive: true,
    icon: <Wallet size={20} />,
  },
  {
    id: "PM06",
    code: "WIRE",
    name: "Wire Transfer",
    processingFee: 15,
    isActive: true,
    icon: <Building2 size={20} />,
  },
  {
    id: "PM07",
    code: "ACH",
    name: "ACH Direct Debit",
    processingFee: 0.5,
    isActive: true,
    icon: <Building2 size={20} />,
  },
  {
    id: "PM08",
    code: "PAYPAL",
    name: "PayPal",
    processingFee: 3.5,
    isActive: false,
    icon: <CreditCard size={20} />,
  },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  BANK_TRANSFER: <Building2 size={20} />,
  CREDIT_CARD: <CreditCard size={20} />,
  DEBIT_CARD: <CreditCard size={20} />,
  CASH: <Wallet size={20} />,
};

export default function PaymentMethodsPage() {
  const [methods] = useState<PaymentMethod[]>(SAMPLE_METHODS);
  const [loading] = useState(false);

  if (loading) return <Spinner />;

  return (
    <div className="ui-stack-6">
      <div
        className="ui-hstack-4"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <PageHeader
          title="Payment Methods"
          description="Configure payment methods, processing fees, and active status"
        />
        <Button variant="primary">Add Method</Button>
      </div>
      <div className="ui-grid-3">
        {methods.map((method) => (
          <Card key={method.id} padding="lg" className="ui-stack-3">
            <div className="ui-hstack-3" style={{ alignItems: "flex-start" }}>
              <div className="ui-text-primary">{method.icon}</div>
              <div style={{ flex: 1 }}>
                <div
                  className="ui-hstack-3"
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 className="ui-heading-sm">{method.name}</h3>
                  <Badge variant={method.isActive ? "success" : "default"}>
                    {method.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p
                  className="ui-text-xs-muted"
                  style={{ marginTop: "var(--space-1)" }}
                >
                  Code: {method.code}
                </p>
                <div
                  className="ui-hstack-2"
                  style={{
                    marginTop: "var(--space-2)",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <p className="ui-text-sm">
                    Processing Fee:{" "}
                    <span style={{ fontWeight: 600 }}>
                      {method.processingFee > 0
                        ? `${method.processingFee}%`
                        : "Free"}
                    </span>
                  </p>
                  <div className="ui-hstack-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
