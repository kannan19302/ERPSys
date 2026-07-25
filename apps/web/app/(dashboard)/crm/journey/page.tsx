"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  TrendingUp,
  Users,
  BarChart3,
  ArrowRight,
  AlertTriangle,
  HeartHandshake,
  MapPin,
} from "lucide-react";
import { PageHeader, Button, Card, Spinner, KPICard } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";

interface JourneyDashboardData {
  stagesCount: number;
  eventsCount: number;
  npsScore: number;
  atRiskCustomers: number;
  totalClv: number;
  upsellOpportunities: number;
}

export default function CustomerJourneyDashboard() {
  const router = useRouter();
  const [data, setData] = useState<JourneyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/crm/customer-journey/stages").then((r) => r.json()),
      fetch("/api/crm/nps/summary").then((r) => r.json()),
      fetch("/api/crm/churn-predictions").then((r) => r.json()),
      fetch("/api/crm/clv").then((r) => r.json()),
    ])
      .then(([stages, nps, churn, clv]) => {
        setData({
          stagesCount: stages?.length || 0,
          eventsCount: 0,
          npsScore: nps?.npsScore || 0,
          atRiskCustomers:
            churn?.filter((c: { riskLevel: string }) =>
              ["HIGH", "CRITICAL"].includes(c.riskLevel),
            )?.length || 0,
          totalClv:
            clv?.reduce(
              (sum: number, c: { clvAmount: number }) =>
                sum + Number(c.clvAmount || 0),
              0,
            ) || 0,
          upsellOpportunities: 0,
        });
      })
      .catch(() => {
        setData({
          stagesCount: 0,
          eventsCount: 0,
          npsScore: 0,
          atRiskCustomers: 0,
          totalClv: 0,
          upsellOpportunities: 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <RouteGuard module="crm" permission="crm.contact.read">
      <div>
        <PageHeader
          title="Customer Journey"
          description="Track and manage the complete customer lifecycle"
          actions={
            <div className="ui-flex ui-gap-2">
              <Link href="/crm/journey/stages">
                <Button variant="outline">Manage Stages</Button>
              </Link>
              <Link href="/crm/journey/nps">
                <Button variant="outline">NPS Surveys</Button>
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="ui-flex ui-justify-center ui-py-20">
            <Spinner />
          </div>
        ) : (
          <div className="ui-space-y-6">
            <div className="ui-grid-4">
              <Link href="/crm/journey/stages">
                <KPICard
                  title="Journey Stages"
                  value={data?.stagesCount ?? 0}
                  icon={<MapPin className="ui-w-5 ui-h-5" />}
                  trend={{ value: 0, isPositive: true }}
                />
              </Link>
              <Link href="/crm/journey/nps">
                <KPICard
                  title="NPS Score"
                  value={data?.npsScore ?? 0}
                  icon={<HeartHandshake className="ui-w-5 ui-h-5" />}
                  trend={
                    data && data.npsScore > 0
                      ? { value: 0, isPositive: true }
                      : undefined
                  }
                />
              </Link>
              <Link href="/crm/journey/churn">
                <KPICard
                  title="At-Risk Customers"
                  value={data?.atRiskCustomers ?? 0}
                  icon={<AlertTriangle className="ui-w-5 ui-h-5" />}
                />
              </Link>
              <Link href="/crm/journey/clv">
                <KPICard
                  title="Total CLV"
                  value={`$${Number(data?.totalClv || 0).toLocaleString()}`}
                  icon={<TrendingUp className="ui-w-5 ui-h-5" />}
                />
              </Link>
            </div>

            <div className="ui-grid-3">
              <Card className="ui-p-6">
                <div className="ui-flex ui-items-center ui-justify-between ui-mb-4">
                  <h3 className="ui-text-lg ui-font-semibold">Quick Actions</h3>
                </div>
                <div className="ui-space-y-3">
                  <Link
                    href="/crm/journey/nps"
                    className="ui-flex ui-items-center ui-justify-between ui-p-3 ui-rounded-lg hover:ui-bg-gray-50 ui-transition-colors"
                  >
                    <div className="ui-flex ui-items-center ui-gap-3">
                      <HeartHandshake className="ui-w-5 ui-h-5 ui-text-blue-600" />
                      <span>Create NPS Survey</span>
                    </div>
                    <ArrowRight className="ui-w-4 ui-h-4 ui-text-gray-400" />
                  </Link>
                  <Link
                    href="/crm/journey/churn"
                    className="ui-flex ui-items-center ui-justify-between ui-p-3 ui-rounded-lg hover:ui-bg-gray-50 ui-transition-colors"
                  >
                    <div className="ui-flex ui-items-center ui-gap-3">
                      <AlertTriangle className="ui-w-5 ui-h-5 ui-text-amber-600" />
                      <span>View Churn Predictions</span>
                    </div>
                    <ArrowRight className="ui-w-4 ui-h-4 ui-text-gray-400" />
                  </Link>
                  <Link
                    href="/crm/journey/upsell"
                    className="ui-flex ui-items-center ui-justify-between ui-p-3 ui-rounded-lg hover:ui-bg-gray-50 ui-transition-colors"
                  >
                    <div className="ui-flex ui-items-center ui-gap-3">
                      <TrendingUp className="ui-w-5 ui-h-5 ui-text-green-600" />
                      <span>Upsell Recommendations</span>
                    </div>
                    <ArrowRight className="ui-w-4 ui-h-4 ui-text-gray-400" />
                  </Link>
                </div>
              </Card>

              <Card className="ui-p-6 ui-col-span-2">
                <div className="ui-flex ui-items-center ui-justify-between ui-mb-4">
                  <h3 className="ui-text-lg ui-font-semibold">
                    Customer 360 View
                  </h3>
                </div>
                <p className="ui-text-gray-600 ui-mb-4">
                  Get a comprehensive 360-degree view of any customer including
                  journey, health, NPS history, CLV, churn risk, and upsell
                  opportunities.
                </p>
                <div className="ui-flex ui-gap-2">
                  <input
                    type="text"
                    placeholder="Enter Customer ID..."
                    className="ui-input ui-flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        router.push(
                          `/crm/journey/customer-360/${(e.target as HTMLInputElement).value}`,
                        );
                      }
                    }}
                  />
                  <Button>View 360</Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
