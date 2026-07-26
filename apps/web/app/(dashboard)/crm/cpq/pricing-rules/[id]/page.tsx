"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Card, PageHeader, Spinner, Button, useToast } from "@unerp/ui";
import { ArrowLeft } from "lucide-react";

export default function CpqPricingRuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [rule, setRule] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/crm/cpq/pricing-rules/${id}`);
        if (res.ok) setRule(await res.json());
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, [id]);

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

  if (loading)
    return (
      <div className="ui-flex-center" style={{ padding: "3rem" }}>
        <Spinner />
      </div>
    );
  if (!rule)
    return (
      <div className="ui-flex-center" style={{ padding: "3rem" }}>
        Pricing rule not found
      </div>
    );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title={rule.name as string}
        description={`Rule type: ${rule.ruleType as string}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "CPQ", href: "/crm/cpq" },
          { label: "Pricing Rules", href: "/crm/cpq/pricing-rules" },
          { label: rule.name as string },
        ]}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/crm/cpq/pricing-rules")}
          >
            <ArrowLeft size={14} /> Back
          </Button>
        }
      />

      <div className="ui-grid-2">
        <Card>
          <div className="ui-card-header">
            <h3 className="ui-text-md ui-font-semibold">Details</h3>
          </div>
          <div className="ui-stack-2" style={{ padding: "1rem" }}>
            <div>
              <strong>Type:</strong> {ruleTypeBadge(rule.ruleType as string)}
            </div>
            <div>
              <strong>Priority:</strong> {rule.priority as number}
            </div>
            <div>
              <strong>Applies To:</strong> {rule.appliedTo as string}
            </div>
            {!!rule.targetId && (
              <div>
                <strong>Target ID:</strong> {String(rule.targetId)}
              </div>
            )}
            <div>
              <strong>Active:</strong>{" "}
              {rule.isActive ? (
                <Badge variant="success">Yes</Badge>
              ) : (
                <Badge variant="default">No</Badge>
              )}
            </div>
            {!!rule.validFrom && (
              <div>
                <strong>Valid From:</strong>{" "}
                {new Date(String(rule.validFrom)).toLocaleDateString()}
              </div>
            )}
            {!!rule.validUntil && (
              <div>
                <strong>Valid Until:</strong>{" "}
                {new Date(String(rule.validUntil)).toLocaleDateString()}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="ui-card-header">
            <h3 className="ui-text-md ui-font-semibold">Conditions</h3>
          </div>
          <div className="ui-stack-2" style={{ padding: "1rem" }}>
            {(
              rule.conditions as Array<{
                field: string;
                operator: string;
                value: number;
              }>
            )?.map(
              (
                c: { field: string; operator: string; value: number },
                i: number,
              ) => (
                <div key={i} className="ui-text-sm">
                  {c.field} {c.operator} {c.value}
                </div>
              ),
            )}
            {!rule.conditions && (
              <div className="ui-text-sm ui-text-muted">No conditions</div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="ui-card-header">
          <h3 className="ui-text-md ui-font-semibold">Actions</h3>
        </div>
        <div className="ui-stack-2" style={{ padding: "1rem" }}>
          {(rule.actions as Array<{ type: string; value: number }>)?.map(
            (a: { type: string; value: number }, i: number) => (
              <div key={i} className="ui-text-sm">
                {a.type.replace("_", " ")}:{" "}
                {a.type === "discount_pct" ? `${a.value}%` : `$${a.value}`}
              </div>
            ),
          )}
          {!rule.actions && (
            <div className="ui-text-sm ui-text-muted">No actions</div>
          )}
        </div>
      </Card>
    </div>
  );
}
