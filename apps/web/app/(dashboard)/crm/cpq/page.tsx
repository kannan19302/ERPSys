"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  PageHeader,
  Spinner,
  Button,
  Badge,
  DataTable,
  type Column,
  type SortOrder,
} from "@unerp/ui";
import { Calculator, Package, Tag, TrendingUp, Eye } from "lucide-react";

const TABS = [
  { id: "bundles", label: "Bundles", icon: Package, href: "/crm/cpq/bundles" },
  {
    id: "pricing-rules",
    label: "Pricing Rules",
    icon: Tag,
    href: "/crm/cpq/pricing-rules",
  },
  {
    id: "quote-analysis",
    label: "Quote Analysis",
    icon: TrendingUp,
    href: "/crm/cpq/quote-analysis",
  },
];

export default function CrmCpqPage() {
  const router = useRouter();
  const [bundles, setBundles] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    const params = new URLSearchParams({ sortBy, sortOrder, limit: "5" });
    fetch(`/api/crm/cpq/bundles?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setBundles(data.data || data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sortBy, sortOrder]);

  const columns: Column[] = [
    { key: "name", label: "Bundle", sortable: true },
    {
      key: "bundlePrice",
      label: "Price",
      sortable: true,
      render: (v: unknown) => `$${Number(v).toFixed(2)}`,
    },
    {
      key: "isActive",
      label: "Status",
      render: (v: unknown) =>
        v ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Inactive</Badge>
        ),
    },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="CPQ & Quoting Engine"
        description="Configure product bundles, pricing rules, and analyze quote margins"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "CPQ & Quoting" },
        ]}
      />

      <div className="ui-grid-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Card
              key={tab.id}
              className="ui-card-hover"
              onClick={() => router.push(tab.href)}
            >
              <div className="ui-stack-2" style={{ padding: "1rem" }}>
                <Icon size={24} />
                <h3 className="ui-text-lg ui-font-semibold">{tab.label}</h3>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="ui-card-header">
          <h3 className="ui-text-md ui-font-semibold">Recent Bundles</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/crm/cpq/bundles")}
          >
            <Eye size={14} /> View All
          </Button>
        </div>
        {loading ? (
          <div className="ui-flex-center" style={{ padding: "2rem" }}>
            <Spinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={bundles}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(key, order) => {
              setSortBy(key);
              setSortOrder(order);
            }}
            onRowClick={(row) => router.push(`/crm/cpq/bundles/${row.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
