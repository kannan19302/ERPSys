"use client";

import { useState } from "react";
import { DollarSign, Euro, PoundSterling } from "lucide-react";
import { Card, PageHeader, Button, Badge, Spinner } from "@unerp/ui";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
  decimalPlaces: number;
  status: "active" | "inactive";
}

interface ExchangeRate {
  id: string;
  from: string;
  to: string;
  rate: number;
  validFrom: string;
  validTo: string;
}

const SAMPLE_CURRENCIES: Currency[] = [
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    isBase: true,
    decimalPlaces: 2,
    status: "active",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    isBase: false,
    decimalPlaces: 2,
    status: "active",
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    isBase: false,
    decimalPlaces: 2,
    status: "active",
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    isBase: false,
    decimalPlaces: 0,
    status: "active",
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
    isBase: false,
    decimalPlaces: 2,
    status: "active",
  },
  {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    isBase: false,
    decimalPlaces: 2,
    status: "active",
  },
  {
    code: "CHF",
    name: "Swiss Franc",
    symbol: "Fr",
    isBase: false,
    decimalPlaces: 2,
    status: "inactive",
  },
];

const SAMPLE_RATES: ExchangeRate[] = [
  {
    id: "ER01",
    from: "USD",
    to: "EUR",
    rate: 0.9215,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
  },
  {
    id: "ER02",
    from: "USD",
    to: "GBP",
    rate: 0.7842,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
  },
  {
    id: "ER03",
    from: "USD",
    to: "JPY",
    rate: 149.82,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
  },
  {
    id: "ER04",
    from: "USD",
    to: "CAD",
    rate: 1.3625,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
  },
  {
    id: "ER05",
    from: "USD",
    to: "AUD",
    rate: 1.5348,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
  },
  {
    id: "ER06",
    from: "EUR",
    to: "GBP",
    rate: 0.8512,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
  },
  {
    id: "ER07",
    from: "EUR",
    to: "JPY",
    rate: 162.59,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
  },
];

export default function CurrenciesPage() {
  const [currencies] = useState<Currency[]>(SAMPLE_CURRENCIES);
  const [rates] = useState<ExchangeRate[]>(SAMPLE_RATES);
  const [loading] = useState(false);

  if (loading) return <Spinner />;

  const renderCurrencyIcon = (code: string) => {
    switch (code) {
      case "USD":
        return <DollarSign size={20} />;
      case "EUR":
        return <Euro size={20} />;
      case "GBP":
        return <PoundSterling size={20} />;
      case "JPY":
        return <span style={{ fontSize: 20 }}>¥</span>;
      default:
        return <DollarSign size={20} />;
    }
  };

  return (
    <div className="ui-stack-6">
      <div
        className="ui-hstack-4"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <PageHeader
          title="Currencies & Exchange Rates"
          description="Manage base currency, active currencies, and exchange rate pairs"
        />
        <div className="ui-hstack-2">
          <Button variant="ghost">Update Rates</Button>
          <Button variant="primary">Add Currency</Button>
        </div>
      </div>
      <h3 className="ui-heading-sm">Base Currency</h3>
      <div className="ui-grid-4">
        {currencies
          .filter((c) => c.isBase)
          .map((curr) => (
            <Card
              key={curr.code}
              padding="lg"
              className="ui-hstack-3"
              style={{ border: "2px solid var(--color-primary)" }}
            >
              <div className="ui-text-primary">
                {renderCurrencyIcon(curr.code)}
              </div>
              <div>
                <div className="ui-hstack-2" style={{ alignItems: "center" }}>
                  <h3 className="ui-heading-sm">{curr.code}</h3>
                  <Badge variant="info">Base</Badge>
                </div>
                <p className="ui-text-xs-muted">
                  {curr.name} ({curr.symbol})
                </p>
              </div>
            </Card>
          ))}
      </div>
      <h3 className="ui-heading-sm">Active Currencies</h3>
      <div className="ui-grid-4">
        {currencies
          .filter((c) => !c.isBase && c.status === "active")
          .map((curr) => (
            <Card
              key={curr.code}
              padding="lg"
              className="ui-hstack-3"
              style={{ alignItems: "center" }}
            >
              <div className="ui-text-muted">
                {renderCurrencyIcon(curr.code)}
              </div>
              <div>
                <div className="ui-hstack-2" style={{ alignItems: "center" }}>
                  <h3 className="ui-heading-sm">{curr.code}</h3>
                  <span className="ui-text-xs-muted">{curr.symbol}</span>
                </div>
                <p className="ui-text-xs-muted">{curr.name}</p>
              </div>
            </Card>
          ))}
      </div>
      <Card padding="lg" className="ui-stack-3">
        <div
          className="ui-hstack-3"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <h3 className="ui-heading-sm">Exchange Rates</h3>
          <Button variant="ghost" size="sm">
            Add Rate
          </Button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="ui-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Rate</th>
                <th>Valid From</th>
                <th>Valid To</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id}>
                  <td style={{ fontWeight: 600 }}>{rate.from}</td>
                  <td style={{ fontWeight: 600 }}>{rate.to}</td>
                  <td>{rate.rate.toFixed(4)}</td>
                  <td>{rate.validFrom}</td>
                  <td>{rate.validTo}</td>
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
