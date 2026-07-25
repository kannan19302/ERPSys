"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Check, X, Package } from "lucide-react";
import { PageHeader, Card, Spinner, DataTable, KPICard } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";

interface UpsellRecommendation {
  id: string;
  customerId: string;
  productName: string;
  productCategory: string | null;
  reason: string | null;
  confidenceScore: number;
  estimatedValue: number;
  status: string;
  createdAt: string;
}

export default function UpsellPage() {
  const [recommendations, setRecommendations] = useState<
    UpsellRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/churn-predictions");
      const churnData = await res.json();
      const customers = Array.isArray(churnData)
        ? churnData
            .slice(0, 20)
            .map((c: { customerId: string }) => c.customerId)
        : [];
      const allRecs: UpsellRecommendation[] = [];
      for (const cid of customers.slice(0, 10)) {
        try {
          const r = await fetch(`/api/crm/upsell-recommendations/${cid}`);
          const d = await r.json();
          if (Array.isArray(d)) allRecs.push(...d);
        } catch {
          /* skip */
        }
      }
      setRecommendations(allRecs);
    } catch {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAction = async (id: string, action: "accept" | "dismiss") => {
    await fetch(`/api/crm/upsell-recommendations/${id}/${action}`, {
      method: "POST",
    });
    loadAll();
  };

  const pendingCount = recommendations.filter(
    (r) => r.status === "PENDING",
  ).length;
  const totalValue = recommendations
    .filter((r) => r.status === "PENDING")
    .reduce((s, r) => s + Number(r.estimatedValue || 0), 0);

  return (
    <RouteGuard permission="crm.upsell-recommendations.read">
      <div>
        <PageHeader
          title="Upsell Recommendations"
          description="AI-powered upsell and cross-sell opportunities"
        />

        {loading ? (
          <div className="ui-flex ui-justify-center ui-py-20">
            <Spinner />
          </div>
        ) : (
          <div className="ui-space-y-6">
            <div className="ui-grid-3">
              <KPICard
                title="Pending"
                value={pendingCount}
                icon={<TrendingUp className="ui-w-5 ui-h-5" />}
              />
              <KPICard
                title="Estimated Value"
                value={`$${totalValue.toLocaleString()}`}
                icon={<Package className="ui-w-5 ui-h-5" />}
              />
              <KPICard
                title="Total Recommendations"
                value={recommendations.length}
                icon={<TrendingUp className="ui-w-5 ui-h-5" />}
              />
            </div>

            <Card className="ui-p-0">
              <DataTable<any>
                columns={[
                  { header: "Product", key: "productName" },
                  { header: "Category", key: "productCategory" },
                  {
                    header: "Confidence",
                    key: "confidenceScore",
                    render: (_v: any, row: UpsellRecommendation) =>
                      `${Number(row.confidenceScore).toFixed(0)}%`,
                  },
                  {
                    header: "Est. Value",
                    key: "estimatedValue",
                    render: (_v: any, row: UpsellRecommendation) =>
                      `$${Number(row.estimatedValue).toLocaleString()}`,
                  },
                  { header: "Status", key: "status" },
                  { header: "Reason", key: "reason" },
                  {
                    header: "Actions",
                    key: "id",
                    render: (_v: any, row: UpsellRecommendation) =>
                      row.status === "PENDING" ? (
                        <div className="ui-flex ui-gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(row.id, "accept");
                            }}
                            className="ui-p-1 hover:ui-text-green-600"
                          >
                            <Check className="ui-w-4 ui-h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(row.id, "dismiss");
                            }}
                            className="ui-p-1 hover:ui-text-red-600"
                          >
                            <X className="ui-w-4 ui-h-4" />
                          </button>
                        </div>
                      ) : null,
                  },
                ]}
                data={recommendations}
              />
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
