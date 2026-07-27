"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  Badge,
  DataTable,
  type Column,
  Modal,
  TextField,
  KPICard,
  useToast,
  Select,
  FormField,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  PieChart,
} from "lucide-react";

interface PropertyFinancial {
  id: string;
  propertyId: string;
  periodStart: string;
  periodEnd: string;
  grossRentIncome: number;
  otherIncome: number;
  totalIncome: number;
  vacancyLoss: number;
  effectiveIncome: number;
  operatingExpenses: number;
  repairsMaintenance: number;
  totalExpenses: number;
  netOperatingIncome: number;
  debtService: number;
  cashFlowBeforeTax: number;
  netCashFlow: number;
  capRate?: number;
  cashOnCashReturn?: number;
  occupancyRate?: number;
  status: string;
  currency: string;
  notes?: string;
  property?: { id: string; name: string; type: string };
}

interface PortfolioSummary {
  propertyCount: number;
  totalNOI: number;
  totalIncome: number;
  totalExpenses: number;
  properties: PropertyFinancial[];
}

export default function FinancialsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [financials, setFinancials] = useState<PropertyFinancial[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"records" | "summary">("records");
  const [form, setForm] = useState({
    propertyId: "",
    periodStart: "",
    periodEnd: "",
    grossRentIncome: "0",
    otherIncome: "0",
    vacancyLoss: "0",
    operatingExpenses: "0",
    repairsMaintenance: "0",
    propertyManagement: "0",
    insurance: "0",
    taxes: "0",
    utilities: "0",
    hoaFees: "0",
    otherExpenses: "0",
    debtService: "0",
    capitalExpenditures: "0",
    notes: "",
    status: "DRAFT",
  });

  const loadData = async () => {
    try {
      const [f, s] = await Promise.all([
        client.get<{ data?: PropertyFinancial[] }>(
          "/ext/real-estate/property-financials?limit=100",
        ),
        client.get<PortfolioSummary>(
          "/ext/real-estate/property-financials/portfolio-summary",
        ),
      ]);
      setFinancials(Array.isArray(f) ? f : f.data || []);
      setSummary(s || null);
    } catch (err) {
      notifyError(
        "Failed to load financials",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client, notifyError]);

  const handleCreate = async () => {
    if (!form.propertyId || !form.periodStart || !form.periodEnd) return;
    setCreating(true);
    try {
      const payload: any = {};
      Object.entries(form).forEach(([k, v]) => {
        payload[k] =
          isNaN(Number(v)) ||
          k === "notes" ||
          k === "propertyId" ||
          k === "periodStart" ||
          k === "periodEnd" ||
          k === "status"
            ? v
            : parseFloat(v);
      });
      payload.periodStart = new Date(payload.periodStart).toISOString();
      payload.periodEnd = new Date(payload.periodEnd).toISOString();
      await client.post("/ext/real-estate/property-financials", payload);
      setCreateOpen(false);
      await loadData();
    } catch (err) {
      notifyError(
        "Failed to create financial record",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<PropertyFinancial>[] = [
    {
      key: "property",
      header: "Property",
      render: (r) => (
        <div>
          <span className="ui-heading-sm">
            {r.property?.name || r.propertyId.slice(0, 8)}
          </span>
          <div className="ui-text-xs-tertiary">
            {new Date(r.periodStart).toLocaleDateString()} -{" "}
            {new Date(r.periodEnd).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: "income",
      header: "Effective Income",
      render: (r) => <span>${Number(r.effectiveIncome).toLocaleString()}</span>,
    },
    {
      key: "expenses",
      header: "Expenses",
      render: (r) => <span>${Number(r.totalExpenses).toLocaleString()}</span>,
    },
    {
      key: "noi",
      header: "NOI",
      render: (r) => (
        <span
          className={`font-semibold ${r.netOperatingIncome >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          ${Number(r.netOperatingIncome).toLocaleString()}
        </span>
      ),
    },
    {
      key: "cap",
      header: "Cap Rate",
      render: (r) => (
        <span>{r.capRate ? `${r.capRate.toFixed(2)}%` : "—"}</span>
      ),
    },
    {
      key: "cashflow",
      header: "Net Cash Flow",
      render: (r) => (
        <span
          className={r.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}
        >
          ${Number(r.netCashFlow).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "FINAL" ? "success" : "warning"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "occupancy",
      header: "Occupancy",
      render: (r) => (
        <span>{r.occupancyRate ? `${r.occupancyRate.toFixed(1)}%` : "—"}</span>
      ),
    },
  ];

  const fmtCurrency = (n: number) =>
    `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="real-estate.property-financial.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Property Financials"
          description="NOI, P&L, Cap Rate, and cash flow analysis"
          breadcrumbs={[
            { label: "Real Estate", href: "/real-estate" },
            { label: "Financials" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-2" /> New Record
            </Button>
          }
        />
        <div className="ui-grid-auto">
          <KPICard
            title="Properties"
            value={summary?.propertyCount || 0}
            icon={<Building2 size={18} />}
            color="var(--color-primary)"
          />
          <KPICard
            title="Total NOI"
            value={fmtCurrency(summary?.totalNOI || 0)}
            icon={<TrendingUp size={18} />}
            color={
              summary && summary.totalNOI >= 0
                ? "var(--color-success)"
                : "var(--color-danger)"
            }
          />
          <KPICard
            title="Total Income"
            value={fmtCurrency(summary?.totalIncome || 0)}
            icon={<DollarSign size={18} />}
            color="var(--color-info)"
          />
          <KPICard
            title="Total Expenses"
            value={fmtCurrency(summary?.totalExpenses || 0)}
            icon={<TrendingDown size={18} />}
            color="var(--color-warning)"
          />
        </div>
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === "records" ? "primary" : "secondary"}
            onClick={() => setTab("records")}
          >
            Financial Records
          </Button>
          <Button
            variant={tab === "summary" ? "primary" : "secondary"}
            onClick={() => setTab("summary")}
          >
            Portfolio Summary
          </Button>
        </div>
        {tab === "records" ? (
          <Card padding="none">
            <DataTable
              columns={columns}
              data={financials}
              rowKey={(r) => r.id}
              emptyTitle="No financial records"
              emptyMessage="Create financial records for properties."
              emptyIcon={<DollarSign size={48} />}
            />
          </Card>
        ) : (
          <div className="ui-stack-4">
            {summary?.properties.map((p: any) => (
              <Card
                key={p.propertyId}
                title={p.property?.name || p.propertyId}
                className="ui-card"
              >
                <div className="ui-grid-4 ui-gap-4">
                  <div>
                    <span className="ui-text-xs-tertiary">NOI</span>
                    <div className="ui-heading-sm">
                      ${Number(p.netOperatingIncome || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="ui-text-xs-tertiary">Income</span>
                    <div className="ui-heading-sm">
                      ${Number(p.effectiveIncome || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="ui-text-xs-tertiary">Expenses</span>
                    <div className="ui-heading-sm">
                      ${Number(p.totalExpenses || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="ui-text-xs-tertiary">Cap Rate</span>
                    <div className="ui-heading-sm">
                      {p.capRate ? `${p.capRate.toFixed(2)}%` : "—"}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {(!summary?.properties || summary.properties.length === 0) && (
              <div className="ui-text-center ui-text-tertiary py-8">
                No finalized financial records yet. Create and finalize records
                to see the portfolio summary.
              </div>
            )}
          </div>
        )}
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Property Financial Record"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Saving..." : "Create"}
              </Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField
              label="Property ID"
              required
              value={form.propertyId}
              onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
            />
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Period Start"
                type="date"
                required
                value={form.periodStart}
                onChange={(e) =>
                  setForm({ ...form, periodStart: e.target.value })
                }
              />
              <TextField
                label="Period End"
                type="date"
                required
                value={form.periodEnd}
                onChange={(e) =>
                  setForm({ ...form, periodEnd: e.target.value })
                }
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Gross Rent Income ($)"
                type="number"
                value={form.grossRentIncome}
                onChange={(e) =>
                  setForm({ ...form, grossRentIncome: e.target.value })
                }
              />
              <TextField
                label="Other Income ($)"
                type="number"
                value={form.otherIncome}
                onChange={(e) =>
                  setForm({ ...form, otherIncome: e.target.value })
                }
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Vacancy Loss ($)"
                type="number"
                value={form.vacancyLoss}
                onChange={(e) =>
                  setForm({ ...form, vacancyLoss: e.target.value })
                }
              />
              <TextField
                label="Operating Expenses ($)"
                type="number"
                value={form.operatingExpenses}
                onChange={(e) =>
                  setForm({ ...form, operatingExpenses: e.target.value })
                }
              />
            </div>
            <div className="ui-grid-3 ui-gap-3">
              <TextField
                label="Repairs ($)"
                type="number"
                value={form.repairsMaintenance}
                onChange={(e) =>
                  setForm({ ...form, repairsMaintenance: e.target.value })
                }
              />
              <TextField
                label="Insurance ($)"
                type="number"
                value={form.insurance}
                onChange={(e) =>
                  setForm({ ...form, insurance: e.target.value })
                }
              />
              <TextField
                label="Taxes ($)"
                type="number"
                value={form.taxes}
                onChange={(e) => setForm({ ...form, taxes: e.target.value })}
              />
            </div>
            <div className="ui-grid-3 ui-gap-3">
              <TextField
                label="Utilities ($)"
                type="number"
                value={form.utilities}
                onChange={(e) =>
                  setForm({ ...form, utilities: e.target.value })
                }
              />
              <TextField
                label="HOA Fees ($)"
                type="number"
                value={form.hoaFees}
                onChange={(e) => setForm({ ...form, hoaFees: e.target.value })}
              />
              <TextField
                label="Other Expenses ($)"
                type="number"
                value={form.otherExpenses}
                onChange={(e) =>
                  setForm({ ...form, otherExpenses: e.target.value })
                }
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Debt Service ($)"
                type="number"
                value={form.debtService}
                onChange={(e) =>
                  setForm({ ...form, debtService: e.target.value })
                }
              />
              <TextField
                label="CapEx ($)"
                type="number"
                value={form.capitalExpenditures}
                onChange={(e) =>
                  setForm({ ...form, capitalExpenditures: e.target.value })
                }
              />
            </div>
            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="DRAFT">Draft</option>
                <option value="FINAL">Final</option>
              </Select>
            </FormField>
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
