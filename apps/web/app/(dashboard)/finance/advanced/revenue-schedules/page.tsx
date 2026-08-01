"use client";
import styles from "./page.module.css";
import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  type Column,
  Modal,
  TextField,
  FormField,
  Select,
  KPICard,
} from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { TrendingUp, Plus, DollarSign, Clock, CheckCircle } from "lucide-react";

interface RevenueSchedule {
  id: string;
  description: string;
  totalAmount: number;
  recognizedAmount: number;
  deferredAmount: number;
  startDate: string;
  endDate: string;
  recognitionType: string;
  status: string;
}

const fmtCurrency = (n: number) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function RevenueRecognitionPage() {
  const client = useApiClient();
  const [schedules, setSchedules] = useState<RevenueSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [recognitionType, setRecognitionType] = useState("STRAIGHT_LINE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchSchedules = () => {
    setLoading(true);
    client
      .get<RevenueSchedule[]>("/advanced-finance/revenue-schedules")
      .then((res) => setSchedules(res || []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchSchedules, [client]);

  const totalDeferred = schedules.reduce(
    (acc, s) => acc + Number(s.deferredAmount),
    0,
  );
  const totalRecognized = schedules.reduce(
    (acc, s) => acc + Number(s.recognizedAmount),
    0,
  );

  const canSubmit =
    description && totalAmount && startDate && endDate && !submitting;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await client.post("/advanced-finance/revenue-schedules", {
        description,
        totalAmount: Number(totalAmount),
        recognitionType,
        startDate,
        endDate,
      });
      setCreateOpen(false);
      setDescription("");
      setTotalAmount("");
      setStartDate("");
      setEndDate("");
      fetchSchedules();
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<RevenueSchedule>[] = [
    {
      key: "description",
      header: "Contract",
      render: (row) => (
        <div>
          <div className="ui-heading-sm">{row.description}</div>
          <div className="ui-text-xs-tertiary">
            {row.startDate?.slice(0, 10)} → {row.endDate?.slice(0, 10)}
          </div>
        </div>
      ),
    },
    {
      key: "recognitionType",
      header: "Method",
      render: (row) => (
        <Badge variant="info">{row.recognitionType.replace("_", " ")}</Badge>
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      align: "right" as const,
      render: (row) => (
        <span className="font-semibold">{fmtCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (row) => {
        const total = Number(row.totalAmount) || 1;
        const pct = Math.round((Number(row.recognizedAmount) / total) * 100);
        return (
          <div className="ui-hstack-2">
            <div className={styles.s1}>
              <div style={{ width: `${pct}%` }} className={styles.s2} />
            </div>
            <span className={styles.s3}>{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "ACTIVE" ? "success" : "default"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Revenue Recognition"
        description="Manage deferred revenue schedules and recognition rules"
        breadcrumbs={[
          { label: "Finance", href: "/finance" },
          { label: "Advanced", href: "/finance/advanced" },
          { label: "Revenue Recognition" },
        ]}
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-2" /> New Schedule
          </Button>
        }
      />

      <div className="ui-grid-auto">
        <KPICard
          title="Total Contract Value"
          value={fmtCurrency(
            schedules.reduce((a, s) => a + Number(s.totalAmount), 0),
          )}
          icon={<DollarSign size={18} />}
          color="var(--color-primary)"
        />
        <KPICard
          title="Recognized"
          value={fmtCurrency(totalRecognized)}
          icon={<CheckCircle size={18} />}
          color="var(--color-success)"
        />
        <KPICard
          title="Deferred"
          value={fmtCurrency(totalDeferred)}
          icon={<Clock size={18} />}
          color="var(--color-warning)"
        />
      </div>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={schedules}
          loading={loading}
          rowKey={(row) => row.id}
          emptyTitle="No revenue schedules"
          emptyMessage="Create a schedule to track deferred revenue recognition."
          emptyIcon={<TrendingUp size={48} />}
        />
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Revenue Schedule"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!canSubmit}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="ui-stack-4">
          <TextField
            label="Contract Name"
            placeholder="Enterprise License - Customer"
            required
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDescription(e.target.value)
            }
          />
          <div className="ui-grid-2 ui-gap-3">
            <TextField
              label="Total Amount ($)"
              type="number"
              placeholder="120000"
              required
              value={totalAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTotalAmount(e.target.value)
              }
            />
            <FormField label="Recognition Method" required>
              <Select
                value={recognitionType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setRecognitionType(e.target.value)
                }
              >
                <option value="STRAIGHT_LINE">Straight Line</option>
                <option value="MILESTONE">Milestone</option>
              </Select>
            </FormField>
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <TextField
              label="Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStartDate(e.target.value)
              }
            />
            <TextField
              label="End Date"
              type="date"
              required
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEndDate(e.target.value)
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
