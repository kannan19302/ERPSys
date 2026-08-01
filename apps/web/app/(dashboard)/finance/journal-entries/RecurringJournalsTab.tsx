"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@unerp/framework";
import { Card, Button, Badge, DataTable } from "@unerp/ui";
import {
  Repeat,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";

interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

interface RecurringTemplate {
  id: string;
  name: string;
  frequency: string;
  status: string;
  nextRunDate: string | null;
  lastRunDate: string | null;
  linesCount: number;
  totalAmount: number;
  isBalanced: boolean;
  entryTemplate?: JournalLine[];
}

export function RecurringJournalsTab() {
  const client = useApiClient();
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [lines, setLines] = useState<JournalLine[]>([
    {
      accountId: "acc-6000",
      accountCode: "6000",
      accountName: "Rent Expense",
      debit: 2500,
      credit: 0,
      description: "Monthly office rent",
    },
    {
      accountId: "acc-1000",
      accountCode: "1000",
      accountName: "Operating Cash",
      debit: 0,
      credit: 2500,
      description: "Monthly office rent",
    },
  ]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await client.get<RecurringTemplate[]>(
        "/advanced-finance/recurring-journals/templates",
      );
      if (data) setTemplates(data);
    } catch {
      setTemplates([
        {
          id: "rj-1",
          name: "Monthly Office Rent",
          frequency: "MONTHLY",
          status: "ACTIVE",
          nextRunDate: "2026-08-01",
          lastRunDate: "2026-07-01",
          linesCount: 2,
          totalAmount: 2500,
          isBalanced: true,
        },
        {
          id: "rj-2",
          name: "Quarterly Equipment Amortization",
          frequency: "QUARTERLY",
          status: "ACTIVE",
          nextRunDate: "2026-10-01",
          lastRunDate: "2026-07-01",
          linesCount: 2,
          totalAmount: 4800,
          isBalanced: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce(
    (sum, l) => sum + (Number(l.credit) || 0),
    0,
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleCreate = async () => {
    if (!name || !isBalanced) return;
    try {
      await client.post("/advanced-finance/recurring-journals/templates", {
        name,
        frequency,
        startDate,
        lines,
      });
      setShowCreateModal(false);
      setName("");
      fetchTemplates();
    } catch {
      setShowCreateModal(false);
    }
  };

  const handlePostNow = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/recurring-journals/templates/${id}/post-now`,
        {},
      );
      fetchTemplates();
    } catch {
      fetchTemplates();
    }
  };

  const handleProcessDue = async () => {
    try {
      await client.post("/advanced-finance/recurring-journals/process-due", {});
      fetchTemplates();
    } catch {
      fetchTemplates();
    }
  };

  const updateLineField = (
    index: number,
    field: keyof JournalLine,
    value: any,
  ) => {
    setLines((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  return (
    <div className="ui-stack-4 ui-animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Recurring Journal Entry Templates & Auto-Posting Scheduler
          </h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleProcessDue}>
            <Play className="w-4 h-4 mr-1 text-green-500" /> Process Due
            Journals
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs text-muted-foreground">
            Active Recurring Templates
          </p>
          <p className="text-2xl font-bold text-primary">{templates.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Automated GL schedule entries
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">
            Next Scheduled Execution
          </p>
          <p className="text-2xl font-bold text-amber-500">
            {templates.find((t) => t.nextRunDate)?.nextRunDate || "2026-08-01"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Auto-post enabled
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted-foreground">
            Monthly Automated Volume
          </p>
          <p className="text-2xl font-bold text-emerald-500">
            $
            {templates
              .reduce((acc, t) => acc + t.totalAmount, 0)
              .toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Balanced debits/credits
          </p>
        </Card>
      </div>

      <Card padding="md">
        <h4 className="text-md font-semibold mb-3">
          Recurring Journal Templates
        </h4>
        <DataTable
          data={templates}
          columns={[
            { key: "name", header: "Template Name", sortable: true },
            { key: "frequency", header: "Frequency", sortable: true },
            {
              key: "totalAmount",
              header: "Amount ($)",
              sortable: true,
              render: (row: RecurringTemplate) =>
                `$${row.totalAmount.toLocaleString()}`,
            },
            { key: "nextRunDate", header: "Next Run Date", sortable: true },
            { key: "lastRunDate", header: "Last Run Date" },
            {
              key: "isBalanced",
              header: "Balance Status",
              render: (row: RecurringTemplate) =>
                row.isBalanced ? (
                  <Badge variant="success">Balanced</Badge>
                ) : (
                  <Badge variant="danger">Unbalanced</Badge>
                ),
            },
            {
              key: "actions",
              header: "Actions",
              render: (row: RecurringTemplate) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePostNow(row.id)}
                >
                  <Play className="w-3 h-3 mr-1 text-green-600" /> Post Now
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card p-6 rounded-xl border max-w-2xl w-full shadow-xl my-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" /> Create
              Recurring Journal Template
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  className="ui-input w-full"
                  placeholder="e.g. Monthly Prepaid Rent Amortization"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Recurrence Frequency
                </label>
                <select
                  className="ui-input w-full"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUALLY">Annually</option>
                </select>
              </div>
            </div>

            <h4 className="text-xs font-semibold mb-2">
              Split Line Journal Entries
            </h4>
            <div className="space-y-2 mb-4">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 text-xs">
                  <input
                    type="text"
                    className="ui-input"
                    placeholder="Account Code"
                    value={line.accountCode}
                    onChange={(e) =>
                      updateLineField(idx, "accountCode", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="ui-input col-span-2"
                    placeholder="Account Name"
                    value={line.accountName}
                    onChange={(e) =>
                      updateLineField(idx, "accountName", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    className="ui-input"
                    placeholder="Debit"
                    value={line.debit}
                    onChange={(e) =>
                      updateLineField(idx, "debit", Number(e.target.value))
                    }
                  />
                  <input
                    type="number"
                    className="ui-input"
                    placeholder="Credit"
                    value={line.credit}
                    onChange={(e) =>
                      updateLineField(idx, "credit", Number(e.target.value))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="p-3 rounded bg-muted/40 border flex items-center justify-between text-xs mb-6">
              <span>
                Total Debits: <strong>${totalDebit.toFixed(2)}</strong>
              </span>
              <span>
                Total Credits: <strong>${totalCredit.toFixed(2)}</strong>
              </span>
              {isBalanced ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Entry Balanced
                </span>
              ) : (
                <span className="text-red-500 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Out of Balance ($
                  {Math.abs(totalDebit - totalCredit).toFixed(2)})
                </span>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!name || !isBalanced}>
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
