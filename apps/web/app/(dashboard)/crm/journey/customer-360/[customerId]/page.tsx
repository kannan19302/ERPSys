"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  Activity,
  HeartHandshake,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  MapPin,
  ShoppingCart,
  FileText,
  MessageSquare,
} from "lucide-react";
import { PageHeader, Card, Spinner, KPICard } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";

interface Customer360Data {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    type: string;
    customerType: string;
    creditLimit: number | null;
    riskRating: string;
    createdAt: string;
    contacts: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    }>;
    tags: Array<{
      id: string;
      tag: { id: string; name: string; color: string };
    }>;
  };
  journey: {
    events: Array<{
      id: string;
      eventType: string;
      title: string;
      description: string | null;
      eventDate: string;
      stage: { id: string; name: string; color: string } | null;
    }>;
    stages: Array<{
      id: string;
      name: string;
      color: string;
      sortOrder: number;
    }>;
  };
  health: {
    currentScore: number;
    currentStatus: string;
    history: Array<{
      id: string;
      score: number;
      status: string;
      computedAt: string;
    }>;
  };
  churn: {
    id: string;
    score: number;
    riskLevel: string;
    reason: string | null;
  } | null;
  clv: {
    id: string;
    clvAmount: number;
    totalRevenue: number;
    totalOrders: number;
  } | null;
  upsell: Array<{
    id: string;
    productName: string;
    confidenceScore: number;
    estimatedValue: number;
  }>;
  nps: Array<{
    id: string;
    rating: number;
    category: string;
    survey: { id: string; name: string } | null;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    subject: string;
    createdAt: string;
  }>;
  metrics: {
    totalInvoices: number;
    totalQuotations: number;
    totalOrders: number;
    totalCases: number;
  };
}

export default function Customer360Page() {
  const params = useParams();
  const [data, setData] = useState<Customer360Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/crm/customer-360/${params.customerId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [params.customerId]);

  const getHealthColor = (status: string) => {
    switch (status) {
      case "GREEN":
        return "text-green-600 bg-green-50";
      case "YELLOW":
        return "text-amber-600 bg-amber-50";
      case "RED":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <RouteGuard permission="crm.contact.read">
      <div>
        <PageHeader
          title={data ? `Customer 360: ${data.customer.name}` : "Customer 360"}
          description={
            data ? `Comprehensive view of ${data.customer.name}` : "Loading..."
          }
          breadcrumbs={[
            { label: "CRM", href: "/crm" },
            { label: "Customer 360" },
          ]}
        />

        {loading ? (
          <div className="ui-flex ui-justify-center ui-py-20">
            <Spinner />
          </div>
        ) : data ? (
          <div className="ui-space-y-6">
            <div className="ui-grid-4">
              <KPICard
                title="Health Score"
                value={data.health.currentScore}
                icon={<Activity className="ui-w-5 ui-h-5" />}
              />
              <KPICard
                title="NPS History"
                value={data.nps.length}
                icon={<HeartHandshake className="ui-w-5 ui-h-5" />}
              />
              {data.churn && (
                <KPICard
                  title="Churn Risk"
                  value={`${data.churn.riskLevel} (${Number(data.churn.score).toFixed(0)}%)`}
                  icon={<AlertTriangle className="ui-w-5 ui-h-5" />}
                />
              )}
              {data.clv && (
                <KPICard
                  title="CLV"
                  value={`$${Number(data.clv.clvAmount).toLocaleString()}`}
                  icon={<DollarSign className="ui-w-5 ui-h-5" />}
                />
              )}
            </div>

            <div className="ui-grid-2">
              <Card className="ui-p-4">
                <h3 className="ui-font-semibold ui-mb-3">Customer Info</h3>
                <div className="ui-space-y-2 ui-text-sm">
                  <div className="ui-flex ui-justify-between">
                    <span className="ui-text-gray-500">Email:</span>
                    <span>{data.customer.email}</span>
                  </div>
                  <div className="ui-flex ui-justify-between">
                    <span className="ui-text-gray-500">Phone:</span>
                    <span>{data.customer.phone || "N/A"}</span>
                  </div>
                  <div className="ui-flex ui-justify-between">
                    <span className="ui-text-gray-500">Status:</span>
                    <span>{data.customer.status}</span>
                  </div>
                  <div className="ui-flex ui-justify-between">
                    <span className="ui-text-gray-500">Type:</span>
                    <span>{data.customer.customerType}</span>
                  </div>
                  <div className="ui-flex ui-justify-between">
                    <span className="ui-text-gray-500">Risk Rating:</span>
                    <span
                      className={getHealthColor(
                        data.customer.riskRating === "LOW"
                          ? "GREEN"
                          : data.customer.riskRating === "HIGH"
                            ? "RED"
                            : "YELLOW",
                      )}
                    >
                      {data.customer.riskRating}
                    </span>
                  </div>
                  <div className="ui-flex ui-justify-between">
                    <span className="ui-text-gray-500">Credit Limit:</span>
                    <span>
                      {data.customer.creditLimit
                        ? `$${Number(data.customer.creditLimit).toLocaleString()}`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="ui-flex ui-justify-between">
                    <span className="ui-text-gray-500">Customer Since:</span>
                    <span>
                      {new Date(data.customer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {data.customer.tags.length > 0 && (
                  <div className="ui-flex ui-gap-1 ui-mt-3 ui-flex-wrap">
                    {data.customer.tags.map((t) => (
                      <span
                        key={t.id}
                        className="ui-px-2 ui-py-0.5 ui-rounded-full ui-text-xs"
                        style={{
                          backgroundColor: t.tag.color + "20",
                          color: t.tag.color,
                        }}
                      >
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="ui-p-4">
                <h3 className="ui-font-semibold ui-mb-3">Health Status</h3>
                <div className="ui-flex ui-items-center ui-gap-3 ui-mb-4">
                  <div
                    className={`ui-w-16 ui-h-16 ui-rounded-full ui-flex ui-items-center ui-justify-center ui-text-xl ui-font-bold ${getHealthColor(data.health.currentStatus)}`}
                  >
                    {data.health.currentScore}
                  </div>
                  <div>
                    <p className="ui-text-lg ui-font-semibold">
                      {data.health.currentStatus}
                    </p>
                    <p className="ui-text-sm ui-text-gray-500">
                      Current health score
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="ui-p-4">
              <h3 className="ui-font-semibold ui-mb-3">Journey Timeline</h3>
              <div className="ui-space-y-3">
                {data.journey.events.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="ui-flex ui-items-start ui-gap-3 ui-p-2 ui-rounded-lg hover:ui-bg-gray-50"
                  >
                    <div
                      className="ui-w-2 ui-h-2 ui-rounded-full ui-mt-2"
                      style={{
                        backgroundColor:
                          event.stage?.color || "var(--color-text-secondary)",
                      }}
                    />
                    <div className="ui-flex-1">
                      <div className="ui-flex ui-items-center ui-gap-2">
                        <span className="ui-text-xs ui-font-medium ui-text-gray-500">
                          {event.stage?.name || "General"}
                        </span>
                        <span className="ui-text-xs ui-text-gray-400">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="ui-text-sm ui-font-medium">{event.title}</p>
                      {event.description && (
                        <p className="ui-text-xs ui-text-gray-500">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {data.journey.events.length === 0 && (
                  <p className="ui-text-sm ui-text-gray-400">
                    No journey events recorded yet.
                  </p>
                )}
              </div>
            </Card>

            <div className="ui-grid-3">
              <Card className="ui-p-4">
                <h3 className="ui-font-semibold ui-mb-3">Metrics</h3>
                <div className="ui-space-y-3">
                  <div className="ui-flex ui-items-center ui-gap-2">
                    <ShoppingCart className="ui-w-4 ui-h-4 ui-text-blue-600" />
                    <span className="ui-text-sm">
                      Orders: {data.metrics.totalOrders}
                    </span>
                  </div>
                  <div className="ui-flex ui-items-center ui-gap-2">
                    <FileText className="ui-w-4 ui-h-4 ui-text-purple-600" />
                    <span className="ui-text-sm">
                      Invoices: {data.metrics.totalInvoices}
                    </span>
                  </div>
                  <div className="ui-flex ui-items-center ui-gap-2">
                    <MessageSquare className="ui-w-4 ui-h-4 ui-text-amber-600" />
                    <span className="ui-text-sm">
                      Cases: {data.metrics.totalCases}
                    </span>
                  </div>
                  <div className="ui-flex ui-items-center ui-gap-2">
                    <FileText className="ui-w-4 ui-h-4 ui-text-green-600" />
                    <span className="ui-text-sm">
                      Quotations: {data.metrics.totalQuotations}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="ui-p-4">
                <h3 className="ui-font-semibold ui-mb-3">NPS History</h3>
                <div className="ui-space-y-2">
                  {data.nps.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      className="ui-flex ui-items-center ui-justify-between ui-text-sm"
                    >
                      <span>{r.survey?.name || "Survey"}</span>
                      <span
                        className={
                          r.category === "PROMOTER"
                            ? "ui-text-green-600"
                            : r.category === "DETRACTOR"
                              ? "ui-text-red-600"
                              : "ui-text-amber-600"
                        }
                      >
                        {r.rating} - {r.category}
                      </span>
                    </div>
                  ))}
                  {data.nps.length === 0 && (
                    <p className="ui-text-sm ui-text-gray-400">
                      No NPS responses yet.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="ui-p-4">
                <h3 className="ui-font-semibold ui-mb-3">
                  Upsell Opportunities
                </h3>
                <div className="ui-space-y-2">
                  {data.upsell.slice(0, 5).map((u) => (
                    <div
                      key={u.id}
                      className="ui-flex ui-items-center ui-justify-between ui-text-sm"
                    >
                      <span>{u.productName}</span>
                      <span className="ui-text-green-600">
                        ${Number(u.estimatedValue).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {data.upsell.length === 0 && (
                    <p className="ui-text-sm ui-text-gray-400">
                      No upsell opportunities.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            <Card className="ui-p-4">
              <h3 className="ui-font-semibold ui-mb-3">Recent Activities</h3>
              <div className="ui-space-y-2">
                {data.recentActivities.slice(0, 10).map((a) => (
                  <div
                    key={a.id}
                    className="ui-flex ui-items-center ui-gap-3 ui-p-2 ui-rounded-lg hover:ui-bg-gray-50 ui-text-sm"
                  >
                    <span className="ui-px-2 ui-py-0.5 ui-rounded ui-text-xs ui-font-medium ui-bg-gray-100">
                      {a.type}
                    </span>
                    <span className="ui-flex-1">{a.subject}</span>
                    <span className="ui-text-gray-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {data.recentActivities.length === 0 && (
                  <p className="ui-text-sm ui-text-gray-400">
                    No recent activities.
                  </p>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="ui-p-8 ui-text-center">
            <p className="ui-text-gray-500">Customer not found</p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
