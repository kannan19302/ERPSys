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
  FormField,
  Select,
  Disclosure,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { Plus, Search, Route, DollarSign, TrendingDown } from "lucide-react";

interface LaneRate {
  id: string;
  origin: string;
  destination: string;
  carrier: string;
  mode: string;
  ratePerUnit: number;
  minCharge: number;
  transitTime: string;
  validUntil: string;
}

const fmtCurrency = (n: number) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function LaneRatesPage() {
  const client = useApiClient();
  const [rates, setRates] = useState<LaneRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [findRateOpen, setFindRateOpen] = useState(false);
  const [bestRate, setBestRate] = useState<LaneRate | null>(null);
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    carrier: "",
    mode: "OCEAN",
    ratePerUnit: 0,
    minCharge: 0,
    transitTime: "",
    validUntil: "",
  });
  const [searchForm, setSearchForm] = useState({
    origin: "",
    destination: "",
    mode: "OCEAN",
    weight: 1000,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await client.get<LaneRate[]>("/supply-chain/lane-rates");
        setRates(data ?? []);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.origin || !form.destination) return;
    setSaving(true);
    try {
      const created = await client.post<LaneRate>(
        "/supply-chain/lane-rates",
        form,
      );
      setRates((prev) => [created, ...prev]);
      setCreateOpen(false);
      setForm({
        origin: "",
        destination: "",
        carrier: "",
        mode: "OCEAN",
        ratePerUnit: 0,
        minCharge: 0,
        transitTime: "",
        validUntil: "",
      });
    } catch {
      /* empty */
    } finally {
      setSaving(false);
    }
  };

  const handleFindRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchForm.origin || !searchForm.destination) return;
    setSaving(true);
    setBestRate(null);
    try {
      const params = new URLSearchParams({
        origin: searchForm.origin,
        destination: searchForm.destination,
        mode: searchForm.mode,
        weight: String(searchForm.weight),
      });
      const result = await client.get<LaneRate>(
        `/supply-chain/lane-rates/best-rate?${params}`,
      );
      setBestRate(result);
    } catch {
      const matches = rates.filter(
        (r) =>
          r.origin.toLowerCase().includes(searchForm.origin.toLowerCase()) &&
          r.destination
            .toLowerCase()
            .includes(searchForm.destination.toLowerCase()) &&
          r.mode === searchForm.mode,
      );
      if (matches.length > 0) {
        const sorted = [...matches].sort(
          (a, b) => a.ratePerUnit - b.ratePerUnit,
        );
        if (sorted[0]) setBestRate(sorted[0]);
      }
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<LaneRate>[] = [
    { key: "origin", header: "Origin", sortable: true },
    { key: "destination", header: "Destination", sortable: true },
    { key: "carrier", header: "Carrier", sortable: true },
    {
      key: "mode",
      header: "Mode",
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.mode === "OCEAN"
              ? "info"
              : row.mode === "AIR"
                ? "warning"
                : row.mode === "RAIL"
                  ? "primary"
                  : "default"
          }
        >
          {row.mode}
        </Badge>
      ),
    },
    {
      key: "ratePerUnit",
      header: "Rate/Unit",
      sortable: true,
      render: (row) => fmtCurrency(row.ratePerUnit),
    },
    {
      key: "minCharge",
      header: "Min Charge",
      render: (row) => fmtCurrency(row.minCharge),
    },
    {
      key: "transitTime",
      header: "Transit Time",
      render: (row) => (
        <span className="ui-text-xs-muted">{row.transitTime}</span>
      ),
    },
    {
      key: "validUntil",
      header: "Valid Until",
      sortable: true,
      render: (row) => new Date(row.validUntil).toLocaleDateString(),
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="supply-chain.lane-rates.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Lane Rates"
          description="Manage carrier rate cards by origin-destination lane"
          breadcrumbs={[
            { label: "Supply Chain", href: "/supply-chain" },
            { label: "Lane Rates" },
          ]}
          actions={
            <div className="ui-flex ui-gap-2">
              <Button variant="secondary" onClick={() => setFindRateOpen(true)}>
                <TrendingDown size={14} /> Find Best Rate
              </Button>
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus size={14} /> New Lane Rate
              </Button>
            </div>
          }
        />

        <Card padding="none">
          <DataTable
            columns={columns}
            data={rates}
            rowKey={(r) => r.id}
            emptyTitle="No lane rates"
            emptyMessage="Add your first carrier rate for a lane."
            emptyIcon={<Route size={48} />}
          />
        </Card>

        <Modal
          open={findRateOpen}
          onClose={() => {
            setFindRateOpen(false);
            setBestRate(null);
          }}
          title="Find Best Rate"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setFindRateOpen(false);
                  setBestRate(null);
                }}
              >
                Close
              </Button>
            </>
          }
        >
          <form onSubmit={handleFindRate} className="ui-stack-4">
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Origin"
                required
                placeholder="Shanghai"
                value={searchForm.origin}
                onChange={(e) =>
                  setSearchForm({ ...searchForm, origin: e.target.value })
                }
              />
              <TextField
                label="Destination"
                required
                placeholder="Los Angeles"
                value={searchForm.destination}
                onChange={(e) =>
                  setSearchForm({ ...searchForm, destination: e.target.value })
                }
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Mode">
                <Select
                  value={searchForm.mode}
                  onChange={(e) =>
                    setSearchForm({ ...searchForm, mode: e.target.value })
                  }
                >
                  <option value="OCEAN">Ocean</option>
                  <option value="AIR">Air</option>
                  <option value="RAIL">Rail</option>
                  <option value="TRUCK">Truck</option>
                </Select>
              </FormField>
              <TextField
                label="Weight (kg)"
                type="number"
                min={0}
                value={searchForm.weight || ""}
                onChange={(e) =>
                  setSearchForm({
                    ...searchForm,
                    weight: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <Button variant="primary" type="submit" isLoading={saving}>
              <Search size={14} /> Find Best Rate
            </Button>
          </form>

          {bestRate && (
            <Card
              style={{
                marginTop: "1rem",
                border: "2px solid var(--success-400)",
              }}
            >
              <div className="ui-stack-3">
                <div
                  className="ui-flex ui-gap-2 ui-items-center"
                  style={{ color: "var(--success-700)" }}
                >
                  <DollarSign size={18} />
                  <span className="ui-text-bold">Best Rate Found</span>
                </div>
                <div className="ui-grid-2">
                  <div>
                    <span className="ui-text-xs-tertiary">Carrier</span>
                    <div className="ui-text-sm-bold">{bestRate.carrier}</div>
                  </div>
                  <div>
                    <span className="ui-text-xs-tertiary">Rate/Unit</span>
                    <div className="ui-text-sm-bold">
                      {fmtCurrency(bestRate.ratePerUnit)}
                    </div>
                  </div>
                  <div>
                    <span className="ui-text-xs-tertiary">Min Charge</span>
                    <div className="ui-text-sm-bold">
                      {fmtCurrency(bestRate.minCharge)}
                    </div>
                  </div>
                  <div>
                    <span className="ui-text-xs-tertiary">Transit Time</span>
                    <div className="ui-text-sm-bold">
                      {bestRate.transitTime}
                    </div>
                  </div>
                </div>
                {bestRate.transitTime && (
                  <div>
                    <span className="ui-text-xs-tertiary">
                      Estimated total:{" "}
                    </span>
                    <span className="ui-text-bold">
                      {fmtCurrency(
                        Math.max(
                          bestRate.ratePerUnit * searchForm.weight,
                          bestRate.minCharge,
                        ),
                      )}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </Modal>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Lane Rate"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate as any}
                disabled={saving}
              >
                {saving ? "Saving..." : "Create Rate"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreate} className="ui-stack-4">
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Origin"
                required
                placeholder="Shanghai"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
              <TextField
                label="Destination"
                required
                placeholder="Los Angeles"
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Carrier"
                required
                placeholder="Maersk"
                value={form.carrier}
                onChange={(e) => setForm({ ...form, carrier: e.target.value })}
              />
              <FormField label="Mode">
                <Select
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                >
                  <option value="OCEAN">Ocean</option>
                  <option value="AIR">Air</option>
                  <option value="RAIL">Rail</option>
                  <option value="TRUCK">Truck</option>
                </Select>
              </FormField>
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Rate per Unit ($)"
                type="number"
                min={0}
                step={0.01}
                value={form.ratePerUnit || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    ratePerUnit: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <TextField
                label="Min Charge ($)"
                type="number"
                min={0}
                step={0.01}
                value={form.minCharge || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minCharge: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Transit Time"
                placeholder="14 days"
                value={form.transitTime}
                onChange={(e) =>
                  setForm({ ...form, transitTime: e.target.value })
                }
              />
              <TextField
                label="Valid Until"
                type="date"
                value={form.validUntil}
                onChange={(e) =>
                  setForm({ ...form, validUntil: e.target.value })
                }
              />
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
