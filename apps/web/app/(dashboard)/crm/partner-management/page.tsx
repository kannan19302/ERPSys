"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  PageHeader,
  Spinner,
  Button,
  Badge,
  ProtectedComponent,
} from "@unerp/ui";
import {
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { apiGet, apiSend } from "../_components/api";

interface DealRegistration {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  estimatedValue: number;
  status: string;
  submittedAt: string;
  partner?: { id: string; name: string };
}
interface MdfFund {
  id: string;
  name: string;
  budgetAmount: number;
  spentAmount: number;
  fundType: string;
  startDate: string;
  endDate: string;
  status: string;
  partner?: { id: string; name: string };
}
interface DealStats {
  submitted: number;
  approved: number;
  rejected: number;
  won: number;
  lost: number;
  totalEstimatedValue: number;
}

export default function PartnerManagementPage() {
  const [deals, setDeals] = useState<DealRegistration[]>([]);
  const [mdfFunds, setMdfFunds] = useState<MdfFund[]>([]);
  const [stats, setStats] = useState<DealStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dealsData, fundsData, statsData] = await Promise.all([
        apiGet<DealRegistration[]>("/crm/partner-deep/deal-registrations"),
        apiGet<MdfFund[]>("/crm/partner-deep/mdf-funds"),
        apiGet<DealStats>("/crm/partner-deep/deal-registrations/stats"),
      ]);
      setDeals(Array.isArray(dealsData) ? dealsData : []);
      setMdfFunds(Array.isArray(fundsData) ? fundsData : []);
      setStats(statsData as DealStats);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approveDeal = async (id: string) => {
    await apiSend(`/crm/partner-deep/deal-registrations/${id}/approve`, "POST");
    load();
  };

  const rejectDeal = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (reason) {
      await apiSend(
        `/crm/partner-deep/deal-registrations/${id}/reject`,
        "POST",
        { rejectionReason: reason },
      );
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Management"
        description="Deal registrations, MDF funds, and partner performance"
      />

      {stats && (
        <div className="ui-grid-5">
          <Card>
            <div className="text-2xl font-bold text-blue-600">
              {stats.submitted}
            </div>
            <div className="text-xs text-gray-500">Submitted</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
            <div className="text-xs text-gray-500">Approved</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <div className="text-xs text-gray-500">Rejected</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.won}
            </div>
            <div className="text-xs text-gray-500">Won</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">
              ${(stats.totalEstimatedValue || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total Value</div>
          </Card>
        </div>
      )}

      <Card title="Deal Registrations">
        {deals.length === 0 ? (
          <p className="text-sm text-gray-400">No deal registrations</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Company</th>
                <th className="text-left py-2">Partner</th>
                <th className="text-left py-2">Contact</th>
                <th className="text-right py-2">Value</th>
                <th className="text-left py-2">Status</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{d.companyName}</td>
                  <td className="py-2">{d.partner?.name || "-"}</td>
                  <td className="py-2">
                    {d.contactName}
                    <br />
                    <span className="text-xs text-gray-400">
                      {d.contactEmail}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    ${(d.estimatedValue || 0).toLocaleString()}
                  </td>
                  <td className="py-2">
                    <Badge
                      variant={
                        d.status === "APPROVED"
                          ? "success"
                          : d.status === "REJECTED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {d.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    {d.status === "SUBMITTED" && (
                      <div className="flex gap-1 justify-end">
                        <ProtectedComponent permission="crm.partner.approve">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => approveDeal(d.id)}
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => rejectDeal(d.id)}
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        </ProtectedComponent>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="MDF Funds">
        {mdfFunds.length === 0 ? (
          <p className="text-sm text-gray-400">No MDF funds</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Partner</th>
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">Budget</th>
                <th className="text-right py-2">Spent</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {mdfFunds.map((f) => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{f.name}</td>
                  <td className="py-2">{f.partner?.name || "-"}</td>
                  <td className="py-2">
                    <Badge variant="default">{f.fundType}</Badge>
                  </td>
                  <td className="py-2 text-right">
                    ${(f.budgetAmount || 0).toLocaleString()}
                  </td>
                  <td className="py-2 text-right">
                    ${(f.spentAmount || 0).toLocaleString()}
                  </td>
                  <td className="py-2">
                    <Badge
                      variant={f.status === "ACTIVE" ? "success" : "warning"}
                    >
                      {f.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
