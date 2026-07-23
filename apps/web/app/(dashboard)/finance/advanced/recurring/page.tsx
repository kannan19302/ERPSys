"use client";
import styles from "./page.module.css";
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
  KPICard,
} from "@unerp/ui";
import {
  RefreshCw,
  Plus,
  Play,
  Pause,
  Calendar,
  DollarSign,
  FileText,
  Clock,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface RecurringSchedule {
  id: string;
  frequency: string;
  nextRunDate: string;
  lastRunDate: string | null;
  status: string;
  entryTemplate: {
    customerId?: string;
    customerName?: string;
    description?: string;
    amount?: number;
    lineItems?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>;
  };
  createdAt: string;
}

export default function RecurringInvoicesPage() {
  const client = useApiClient();
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ processed: number } | null>(
    null,
  );

  // Form
  const [form, setForm] = useState({
    frequency: "MONTHLY",
    nextRunDate: "",
    description: "",
    customerName: "",
    amount: 0,
  });
  const [creating, setCreating] = useState(false);

  const fetchSchedules = async () => {
    try {
      setSchedules(
        await client.get<RecurringSchedule[]>(
          "/advanced-finance/recurring-schedules",
        ),
      );
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nextRunDate) return;
    setCreating(true);
    try {
      await client.post("/advanced-finance/recurring-schedules", {
        frequency: form.frequency,
        nextRunDate: form.nextRunDate,
        entryTemplate: {
          customerName: form.customerName,
          description: form.description,
          lineItems: [
            {
              description: form.description || "Recurring Service",
              quantity: 1,
              unitPrice: form.amount,
              taxRate: 0,
            },
          ],
        },
      });
      setCreateOpen(false);
      fetchSchedules();
      setForm({
        frequency: "MONTHLY",
        nextRunDate: "",
        description: "",
        customerName: "",
        amount: 0,
      });
    } catch {
      /* handled */
    } finally {
      setCreating(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      setGenResult(
        await client.post<{ processed: number }>(
          "/advanced-finance/recurring/generate",
        ),
      );
    } catch {
      /* handled */
    } finally {
      setGenerating(false);
    }
  };

  const activeCount = schedules.filter((s) => s.status === "ACTIVE").length;
  const pausedCount = schedules.filter((s) => s.status === "PAUSED").length;

  const columns: Column<RecurringSchedule>[] = [
    {
      key: "template",
      header: "Schedule",
      render: (row) => (
        <div className="ui-hstack-3">
          <div className={styles.s1}>
            <RefreshCw size={16} />
          </div>
          <div>
            <div className="ui-heading-sm">
              {row.entryTemplate?.description ||
                row.entryTemplate?.customerName ||
                "Recurring Invoice"}
            </div>
            <div className="ui-text-xs-tertiary">
              {row.entryTemplate?.customerName || "No customer set"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (row) => <Badge variant="info">{row.frequency}</Badge>,
    },
    {
      key: "nextRunDate",
      header: "Next Run",
      render: (row) => (
        <span className={styles.s2}>
          <Calendar size={12} />{" "}
          {new Date(row.nextRunDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "lastRunDate",
      header: "Last Run",
      render: (row) => (
        <span className="ui-text-xs-tertiary">
          {row.lastRunDate
            ? new Date(row.lastRunDate).toLocaleDateString()
            : "Never"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "ACTIVE" ? "success" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <RouteGuard permission="finance.recurring.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Recurring Invoices"
          description="Automate invoice generation on a recurring schedule"
          breadcrumbs={[
            { label: "Finance", href: "/finance" },
            { label: "Advanced", href: "/finance/advanced" },
            { label: "Recurring Invoices" },
          ]}
          actions={
            <div className="ui-flex ui-gap-2">
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={generating}
              >
                <Play size={14} className="mr-2" />{" "}
                {generating ? "Generating..." : "Run Now"}
              </Button>
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus size={14} className="mr-2" /> New Schedule
              </Button>
            </div>
          }
        />

        {genResult && (
          <div className={styles.s3}>
            Processed {genResult.processed} recurring schedule(s).
          </div>
        )}

        <div className="ui-grid-auto">
          <KPICard
            title="Total Schedules"
            value={schedules.length}
            icon={<RefreshCw size={18} />}
            color="var(--color-primary)"
          />
          <KPICard
            title="Active"
            value={activeCount}
            icon={<Play size={18} />}
            color="var(--color-success)"
          />
          <KPICard
            title="Paused"
            value={pausedCount}
            icon={<Pause size={18} />}
            color="var(--color-warning)"
          />
        </div>

        <Card padding="none">
          <DataTable
            columns={columns}
            data={schedules}
            loading={loading}
            rowKey={(row) => row.id}
            emptyTitle="No recurring schedules"
            emptyMessage="Create your first recurring invoice schedule to automate billing."
            emptyIcon={<RefreshCw size={48} />}
          />
        </Card>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Create Recurring Schedule"
          description="Set up automatic invoice generation"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate as any}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Spinner size="sm" /> Creating...
                  </>
                ) : (
                  "Create Schedule"
                )}
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreate} className="ui-stack-4">
            <TextField
              label="Customer Name"
              placeholder="Acme Corp"
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
            />
            <TextField
              label="Description"
              placeholder="Monthly retainer"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Frequency" required>
                <Select
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({ ...form, frequency: e.target.value })
                  }
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUALLY">Annually</option>
                </Select>
              </FormField>
              <TextField
                label="First Run Date"
                type="date"
                required
                value={form.nextRunDate}
                onChange={(e) =>
                  setForm({ ...form, nextRunDate: e.target.value })
                }
              />
            </div>
            <TextField
              label="Amount ($)"
              type="number"
              min={0}
              step={0.01}
              placeholder="1000.00"
              value={form.amount || ""}
              onChange={(e) =>
                setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
              }
            />
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
