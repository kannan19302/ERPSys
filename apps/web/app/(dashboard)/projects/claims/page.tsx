// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Plus,
} from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  StatCardRow,
  useToast,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  { id: "claims", label: "Claims", href: "/projects/claims?tab=claims" },
  {
    id: "variations",
    label: "Variations",
    href: "/projects/claims?tab=variations",
  },
  { id: "disputes", label: "Disputes", href: "/projects/claims?tab=disputes" },
  { id: "reports", label: "Reports", href: "/projects/claims?tab=reports" },
];

interface Claim {
  id: string;
  claimNumber: string;
  title: string;
  description?: string;
  claimType: string;
  status: string;
  claimedAmount: number;
  approvedAmount?: number;
  settlementAmount?: number;
  priority: string;
  disputeResolutions?: { id: string; method: string; status: string }[];
  claimDocuments?: { id: string }[];
}
interface Variation {
  id: string;
  variationNumber: string;
  title: string;
  changeType: string;
  status: string;
  costImpact?: number;
  scheduleImpact?: number;
}

export default function ClaimsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "claims";
  const [claims, setClaims] = useState<Claim[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [client]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const [claimsData, varsData] = await Promise.all([
        client.get<Claim[] | { data?: Claim[] }>("/projects/claims"),
        client.get<Variation[] | { data?: Variation[] }>(
          "/projects/variation-orders",
        ),
      ]);
      setClaims(Array.isArray(claimsData) ? claimsData : claimsData.data || []);
      setVariations(Array.isArray(varsData) ? varsData : varsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      notifyError("Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="ui-alert ui-alert-danger">{error}</div>;

  const totalClaimed = claims.reduce((s, c) => s + Number(c.claimedAmount), 0);
  const totalSettled = claims.reduce(
    (s, c) => s + Number(c.settlementAmount || 0),
    0,
  );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Claims & Changes"
        description="Manage contract claims, variation orders, and dispute resolution"
      />
      <div className="ui-flex-between">
        <SubTabBar tabs={SUB_TABS} />
        <div className="ui-hstack-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Submit Variation (API ready)")}
          >
            <FileText size={14} /> New Variation
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => alert("Create Claim (API ready)")}
          >
            <Plus size={14} /> New Claim
          </Button>
        </div>
      </div>
      {activeTab === "claims" && (
        <>
          <StatCardRow
            stats={[
              {
                label: "Total Claims",
                value: claims.length,
                icon: <Scale size={16} />,
                color: "var(--chart-1)",
              },
              {
                label: "Open",
                value: claims.filter(
                  (c) =>
                    c.status === "DRAFT" ||
                    c.status === "SUBMITTED" ||
                    c.status === "UNDER_EVALUATION",
                ).length,
                icon: <AlertTriangle size={16} />,
                color: "var(--chart-3)",
              },
              {
                label: "Settled",
                value: claims.filter((c) => c.status === "SETTLED").length,
                icon: <CheckCircle2 size={16} />,
                color: "var(--chart-2)",
              },
              {
                label: "Total Claimed",
                value: `$${totalClaimed.toLocaleString()}`,
                icon: <DollarSign size={16} />,
                color: "var(--chart-1)",
              },
            ]}
          />
          <div className="ui-stack-3">
            {claims.map((c) => (
              <Card key={c.id} className="ui-stack-2">
                <div className="ui-flex-between">
                  <div className="ui-hstack-2">
                    <strong>{c.title}</strong>
                    <span className="ui-badge ui-badge-info">
                      {c.claimNumber}
                    </span>
                  </div>
                  <div className="ui-hstack-2">
                    <span
                      className={`ui-badge ${c.priority === "CRITICAL" || c.priority === "HIGH" ? "ui-badge-danger" : "ui-badge-muted"}`}
                    >
                      {c.priority}
                    </span>
                    <span
                      className={`ui-badge ${c.status === "SETTLED" ? "ui-badge-success" : c.status === "APPROVED" ? "ui-badge-info" : c.status === "REJECTED" ? "ui-badge-danger" : "ui-badge-warning"}`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
                <p className="ui-text-micro">
                  {c.claimType} · Claimed: $
                  {Number(c.claimedAmount).toLocaleString()}
                  {c.approvedAmount
                    ? ` · Approved: $${Number(c.approvedAmount).toLocaleString()}`
                    : ""}
                </p>
              </Card>
            ))}
          </div>
        </>
      )}
      {activeTab === "variations" && (
        <div className="ui-stack-3">
          {variations.map((v) => (
            <Card key={v.id} className="ui-flex-between">
              <div>
                <div className="ui-hstack-2">
                  <strong>{v.title}</strong>
                  <span className="ui-badge ui-badge-info">
                    {v.variationNumber}
                  </span>
                </div>
                <p className="ui-text-micro">
                  {v.changeType} · Cost: $
                  {Number(v.costImpact || 0).toLocaleString()} · Schedule:{" "}
                  {v.scheduleImpact || 0}d
                </p>
              </div>
              <span
                className={`ui-badge ${v.status === "APPROVED" ? "ui-badge-success" : v.status === "REJECTED" ? "ui-badge-danger" : "ui-badge-warning"}`}
              >
                {v.status}
              </span>
            </Card>
          ))}
        </div>
      )}
      {activeTab === "disputes" && (
        <div className="ui-stack-3">
          {claims.flatMap((c) =>
            (c.disputeResolutions || []).map((d) => (
              <Card key={d.id} className="ui-flex-between">
                <div>
                  <strong>{d.method}</strong>
                  <p className="ui-text-micro">{c.claimNumber}</p>
                </div>
                <span
                  className={`ui-badge ${d.status === "RESOLVED" ? "ui-badge-success" : "ui-badge-warning"}`}
                >
                  {d.status}
                </span>
              </Card>
            )),
          )}
        </div>
      )}
      {activeTab === "reports" && (
        <StatCardRow
          stats={[
            {
              label: "Total Claimed",
              value: `$${totalClaimed.toLocaleString()}`,
              icon: <DollarSign size={16} />,
              color: "var(--chart-1)",
            },
            {
              label: "Total Settled",
              value: `$${totalSettled.toLocaleString()}`,
              icon: <CheckCircle2 size={16} />,
              color: "var(--chart-2)",
            },
            {
              label: "Rejected",
              value: claims.filter((c) => c.status === "REJECTED").length,
              icon: <XCircle size={16} />,
              color: "var(--chart-4)",
            },
          ]}
        />
      )}
    </div>
  );
}
