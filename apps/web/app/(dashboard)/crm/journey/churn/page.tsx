"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, Users, Shield } from "lucide-react";
import { PageHeader, Card, Spinner, DataTable, KPICard } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";

interface ChurnPrediction {
  id: string;
  customerId: string;
  score: number;
  riskLevel: string;
  signals: string[];
  reason: string | null;
  predictedAt: string;
  customer: { id: string; name: string; email: string; status: string } | null;
}

export default function ChurnPage() {
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/churn-predictions")
      .then((r) => r.json())
      .then((data) => setPredictions(Array.isArray(data) ? data : []))
      .catch(() => setPredictions([]))
      .finally(() => setLoading(false));
  }, []);

  const critical = predictions.filter((p) => p.riskLevel === "CRITICAL").length;
  const high = predictions.filter((p) => p.riskLevel === "HIGH").length;
  const medium = predictions.filter((p) => p.riskLevel === "MEDIUM").length;

  return (
    <RouteGuard module="crm" permission="crm.churn-predictions.read">
      <div>
        <PageHeader
          title="Churn Predictions"
          description="AI-powered churn risk analysis and predictions"
        />

        {loading ? (
          <div className="ui-flex ui-justify-center ui-py-20">
            <Spinner />
          </div>
        ) : (
          <div className="ui-space-y-6">
            <div className="ui-grid-4">
              <KPICard
                title="Total at Risk"
                value={predictions.length}
                icon={<Users className="ui-w-5 ui-h-5" />}
              />
              <KPICard
                title="Critical"
                value={critical}
                icon={
                  <AlertTriangle className="ui-w-5 ui-h-5 ui-text-red-600" />
                }
                trend={
                  critical > 0 ? { value: 0, isPositive: false } : undefined
                }
              />
              <KPICard
                title="High Risk"
                value={high}
                icon={
                  <TrendingDown className="ui-w-5 ui-h-5 ui-text-orange-600" />
                }
              />
              <KPICard
                title="Medium Risk"
                value={medium}
                icon={<Shield className="ui-w-5 ui-h-5 ui-text-amber-600" />}
              />
            </div>

            <Card className="ui-p-0">
              <DataTable
                columns={[
                  {
                    header: "Customer",
                    accessor: (row: ChurnPrediction) =>
                      row.customer?.name || "Unknown",
                    sortable: true,
                  },
                  {
                    header: "Risk Score",
                    accessor: (row: ChurnPrediction) =>
                      `${Number(row.score).toFixed(1)}%`,
                    sortable: true,
                  },
                  {
                    header: "Risk Level",
                    accessor: "riskLevel",
                    sortable: true,
                  },
                  {
                    header: "Signals",
                    accessor: (row: ChurnPrediction) =>
                      Array.isArray(row.signals)
                        ? row.signals.slice(0, 3).join(", ")
                        : "",
                  },
                  { header: "Reason", accessor: "reason" },
                  {
                    header: "Predicted",
                    accessor: (row: ChurnPrediction) =>
                      new Date(row.predictedAt).toLocaleDateString(),
                  },
                ]}
                data={predictions}
              />
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
