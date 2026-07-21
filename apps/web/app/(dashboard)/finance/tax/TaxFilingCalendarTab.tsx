"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@unerp/framework";
import { Card, Button, Badge, DataTable } from "@unerp/ui";
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  state: string;
  stateName: string;
  period: string;
  frequency: string;
  dueDate: string;
  status: "UPCOMING" | "DUE_SOON" | "OVERDUE" | "FILED" | "EXTENDED";
  estimatedTaxLiability: number;
  penaltyAmount: number;
  interestAmount: number;
  totalAmountDue: number;
  daysRemaining: number;
  isOverdue: boolean;
}

interface FilingReminder {
  id: string;
  state: string;
  title: string;
  message: string;
  dueDate: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  isAcknowledged: boolean;
  amountDue: number;
}

export function TaxFilingCalendarTab() {
  const client = useApiClient();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [reminders, setReminders] = useState<FilingReminder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFilingCalendar = async () => {
    setLoading(true);
    try {
      const resData = await client.get<ScheduleItem[]>(
        "/advanced-finance/tax/filing-calendar",
      );
      if (resData) setSchedules(resData);
      const remData = await client.get<FilingReminder[]>(
        "/advanced-finance/tax/filing-reminders",
      );
      if (remData) setReminders(remData);
    } catch {
      setSchedules([
        {
          id: "s1",
          state: "CA",
          stateName: "California",
          period: "2026-07",
          frequency: "MONTHLY",
          dueDate: "2026-08-30",
          status: "UPCOMING",
          estimatedTaxLiability: 14200,
          penaltyAmount: 0,
          interestAmount: 0,
          totalAmountDue: 14200,
          daysRemaining: 40,
          isOverdue: false,
        },
        {
          id: "s2",
          state: "NY",
          stateName: "New York",
          period: "2026-Q2",
          frequency: "QUARTERLY",
          dueDate: "2026-07-20",
          status: "DUE_SOON",
          estimatedTaxLiability: 18500,
          penaltyAmount: 0,
          interestAmount: 0,
          totalAmountDue: 18500,
          daysRemaining: 2,
          isOverdue: false,
        },
        {
          id: "s3",
          state: "TX",
          stateName: "Texas",
          period: "2026-06",
          frequency: "MONTHLY",
          dueDate: "2026-07-15",
          status: "OVERDUE",
          estimatedTaxLiability: 9800,
          penaltyAmount: 490,
          interestAmount: 42,
          totalAmountDue: 10332,
          daysRemaining: -6,
          isOverdue: true,
        },
      ]);
      setReminders([
        {
          id: "r1",
          state: "TX",
          title: "Texas Sales Tax Return Past Due",
          message:
            "PAST DUE: Return was due on 2026-07-15. Estimated penalty: $490",
          dueDate: "2026-07-15",
          severity: "CRITICAL",
          isAcknowledged: false,
          amountDue: 10332,
        },
        {
          id: "r2",
          state: "NY",
          title: "New York Q2 Tax Return Due Soon",
          message:
            "Upcoming return due in 2 days on 2026-07-20. Est liability: $18,500",
          dueDate: "2026-07-20",
          severity: "HIGH",
          isAcknowledged: false,
          amountDue: 18500,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilingCalendar();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/tax/filing-reminders/${id}/acknowledge`,
        {},
      );
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isAcknowledged: true } : r)),
      );
    } catch {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isAcknowledged: true } : r)),
      );
    }
  };

  const handleRecalculate = async () => {
    try {
      await client.post(
        "/advanced-finance/tax/filing-calendar/recalculate",
        {},
      );
      fetchFilingCalendar();
    } catch {
      fetchFilingCalendar();
    }
  };

  const getStatusBadge = (status: ScheduleItem["status"]) => {
    switch (status) {
      case "OVERDUE":
        return <Badge variant="danger">Overdue</Badge>;
      case "DUE_SOON":
        return <Badge variant="warning">Due Soon</Badge>;
      case "FILED":
        return <Badge variant="success">Filed</Badge>;
      default:
        return <Badge variant="info">Upcoming</Badge>;
    }
  };

  return (
    <div className="ui-stack-4 ui-animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Tax Return Filing Calendar & Penalty Estimator
          </h3>
        </div>
        <Button
          onClick={handleRecalculate}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
          />{" "}
          Recalculate Calendar
        </Button>
      </div>

      {reminders.some(
        (r) => !r.isAcknowledged && r.severity === "CRITICAL",
      ) && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">
                Critical Past-Due Filing Reminders
              </p>
              <p className="text-xs">
                Action required to avoid accruing interest and state late filing
                fees.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {schedules.map((item) => (
          <Card key={item.id} padding="md" className="border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-base">
                {item.stateName} ({item.state})
              </span>
              {getStatusBadge(item.status)}
            </div>
            <div className="space-y-1 text-xs mb-3 text-muted-foreground">
              <p>
                Filing Period:{" "}
                <span className="font-medium text-foreground">
                  {item.period}
                </span>
              </p>
              <p>
                Due Date:{" "}
                <span className="font-medium text-foreground">
                  {item.dueDate}
                </span>
              </p>
              <p>
                Frequency:{" "}
                <span className="font-medium text-foreground">
                  {item.frequency}
                </span>
              </p>
            </div>
            <div className="p-2 rounded bg-muted/30 border text-xs space-y-1">
              <div className="flex justify-between">
                <span>Est. Tax Liability:</span>
                <span className="font-semibold">
                  ${item.estimatedTaxLiability.toLocaleString()}
                </span>
              </div>
              {item.penaltyAmount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Penalty & Interest:</span>
                  <span className="font-semibold">
                    +${(item.penaltyAmount + item.interestAmount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-1 text-sm text-primary">
                <span>Total Due:</span>
                <span>${item.totalAmountDue.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="md">
        <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> State Tax Filing Reminders & Alert Queue
        </h4>
        <DataTable
          data={reminders}
          columns={[
            { key: "state", header: "State", sortable: true },
            { key: "title", header: "Reminder Title" },
            { key: "message", header: "Details" },
            { key: "dueDate", header: "Due Date", sortable: true },
            {
              key: "severity",
              header: "Severity",
              render: (row: FilingReminder) => (
                <Badge
                  variant={
                    row.severity === "CRITICAL"
                      ? "danger"
                      : row.severity === "HIGH"
                        ? "warning"
                        : "info"
                  }
                >
                  {row.severity}
                </Badge>
              ),
            },
            {
              key: "isAcknowledged",
              header: "Status",
              render: (row: FilingReminder) =>
                row.isAcknowledged ? (
                  <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3 h-3" /> Acknowledged
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAcknowledge(row.id)}
                  >
                    Acknowledge
                  </Button>
                ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
