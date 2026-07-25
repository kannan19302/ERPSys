"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, ShoppingCart, Users } from "lucide-react";
import { PageHeader, Card, Spinner, DataTable, KPICard } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";

interface ClvEntry {
  id: string;
  customerId: string;
  clvAmount: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  customerLifespanMonths: number;
  totalRevenue: number;
  totalOrders: number;
  calculatedAt: string;
  customer: { id: string; name: string; email: string } | null;
}

export default function ClvPage() {
  const [entries, setEntries] = useState<ClvEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/clv")
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const totalClv = entries.reduce(
    (sum, e) => sum + Number(e.clvAmount || 0),
    0,
  );
  const avgClv = entries.length > 0 ? totalClv / entries.length : 0;
  const totalRevenue = entries.reduce(
    (sum, e) => sum + Number(e.totalRevenue || 0),
    0,
  );

  return (
    <RouteGuard module="crm" permission="crm.clv.read">
      <div>
        <PageHeader
          title="Customer Lifetime Value"
          description="CLV analytics and calculations"
        />

        {loading ? (
          <div className="ui-flex ui-justify-center ui-py-20">
            <Spinner />
          </div>
        ) : (
          <div className="ui-space-y-6">
            <div className="ui-grid-4">
              <KPICard
                title="Total CLV"
                value={`$${totalClv.toLocaleString()}`}
                icon={<DollarSign className="ui-w-5 ui-h-5" />}
              />
              <KPICard
                title="Average CLV"
                value={`$${Math.round(avgClv).toLocaleString()}`}
                icon={<TrendingUp className="ui-w-5 ui-h-5" />}
              />
              <KPICard
                title="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                icon={<ShoppingCart className="ui-w-5 ui-h-5" />}
              />
              <KPICard
                title="Customers"
                value={entries.length}
                icon={<Users className="ui-w-5 ui-h-5" />}
              />
            </div>

            <Card className="ui-p-0">
              <DataTable
                columns={[
                  {
                    header: "Customer",
                    accessor: (row: ClvEntry) =>
                      row.customer?.name || "Unknown",
                    sortable: true,
                  },
                  {
                    header: "CLV",
                    accessor: (row: ClvEntry) =>
                      `$${Number(row.clvAmount).toLocaleString()}`,
                    sortable: true,
                  },
                  {
                    header: "Avg Order Value",
                    accessor: (row: ClvEntry) =>
                      `$${Number(row.averageOrderValue).toLocaleString()}`,
                  },
                  { header: "Orders", accessor: "totalOrders", sortable: true },
                  {
                    header: "Lifespan (mo)",
                    accessor: "customerLifespanMonths",
                    sortable: true,
                  },
                  {
                    header: "Total Revenue",
                    accessor: (row: ClvEntry) =>
                      `$${Number(row.totalRevenue).toLocaleString()}`,
                  },
                  {
                    header: "Calculated",
                    accessor: (row: ClvEntry) =>
                      new Date(row.calculatedAt).toLocaleDateString(),
                  },
                ]}
                data={entries}
              />
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
