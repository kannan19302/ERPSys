"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  PageHeader,
  Spinner,
  Badge,
  Modal,
  useToast,
  DataTable,
  Input,
  Select,
  ProtectedComponent,
  type Column,
  type SortOrder,
} from "@unerp/ui";
import { Plus, Pencil, Trash2 } from "lucide-react";

const RULE_TYPES = [
  "VOLUME_DISCOUNT",
  "TIERED_PRICING",
  "CONTRACT_PRICE",
  "PROMOTIONAL",
  "BUNDLE",
];
const APPLIED_TO_OPTIONS = ["PRODUCT", "BUNDLE", "CATEGORY", "ORDER"];

export default function CpqPricingRulesPage() {
  const router = useRouter();
  const toast = useToast();
  const [rules, setRules] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("priority");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/crm/cpq/pricing-rules?${params}`);
      const data = await res.json();
      setRules(data.data || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this pricing rule?")) return;
    try {
      await fetch(`/api/crm/cpq/pricing-rules/${id}`, { method: "DELETE" });
      toast.success("Pricing rule deleted");
      fetchRules();
    } catch {
      toast.error("Failed to delete rule");
    }
  };

  const ruleTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      VOLUME_DISCOUNT: "info",
      TIERED_PRICING: "warning",
      CONTRACT_PRICE: "success",
      PROMOTIONAL: "danger",
      BUNDLE: "primary",
    };
    return (
      <Badge
        variant={
          (colors[type] || "default") as
            | "info"
            | "warning"
            | "success"
            | "danger"
            | "primary"
            | "default"
        }
      >
        {type.replace("_", " ")}
      </Badge>
    );
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "ruleType",
      header: "Type",
      render: (row: Record<string, unknown>) =>
        ruleTypeBadge(row.ruleType as string),
    },
    { key: "priority", header: "Priority", sortable: true },
    { key: "appliedTo", header: "Applies To" },
    {
      key: "isActive",
      header: "Active",
      render: (row: Record<string, unknown>) =>
        row.isActive ? (
          <Badge variant="success">Yes</Badge>
        ) : (
          <Badge variant="default">No</Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: Record<string, unknown>) => (
        <div className="ui-flex-row ui-gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              router.push(`/crm/cpq/pricing-rules/${row.id}`);
            }}
          >
            <Pencil size={14} />
          </Button>
          <ProtectedComponent permission="crm.cpq-pricing-rules.delete">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleDelete(row.id as string);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </ProtectedComponent>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Pricing Rules"
        description="Configure volume discounts, tiered pricing, and promotional rules"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "CPQ & Quoting", href: "/crm/cpq" },
          { label: "Pricing Rules" },
        ]}
        actions={
          <ProtectedComponent permission="crm.cpq-pricing-rules.create">
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} /> New Rule
            </Button>
          </ProtectedComponent>
        }
      />

      <Card>
        {loading ? (
          <div className="ui-flex-center" style={{ padding: "2rem" }}>
            <Spinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rules}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(key, order) => {
              setSortBy(key);
              setSortOrder(order);
            }}
            onRowClick={(row) =>
              router.push(`/crm/cpq/pricing-rules/${row.id}`)
            }
          />
        )}
      </Card>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Pricing Rule"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setCreating(true);
            const form = e.target as HTMLFormElement;
            const data = Object.fromEntries(new FormData(form));
            try {
              const res = await fetch("/api/crm/cpq/pricing-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...data,
                  priority: Number(data.priority),
                }),
              });
              if (!res.ok) throw new Error();
              toast.success("Pricing rule created");
              setShowCreate(false);
              fetchRules();
            } catch {
              toast.error("Failed to create pricing rule");
            }
            setCreating(false);
          }}
        >
          <div className="ui-form-group">
            <label className="ui-label">Name</label>
            <Input name="name" required className="ui-input" />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Rule Type</label>
            <select name="ruleType" required className="ui-input">
              {RULE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Priority</label>
            <Input
              name="priority"
              type="number"
              defaultValue="0"
              className="ui-input"
            />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Applies To</label>
            <select name="appliedTo" className="ui-input">
              {APPLIED_TO_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="ui-form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Rule"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
