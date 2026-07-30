// @ts-nocheck
"use client";

import { useState } from "react";
import { useApiClient } from "@unerp/framework";

export default function PartnerPerformancePage() {
  const api = useApiClient();
  const [partnerId, setPartnerId] = useState("");
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const res: any = await api.get(
        `/crm/partner-deep/performance/${partnerId}`,
      );
      setMetrics(res.data || res);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Partner Performance</h1>
      <div className="ui-form-group flex gap-2 mb-6">
        <input
          className="ui-input flex-1"
          placeholder="Partner ID"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
        />
        <button className="ui-btn" onClick={fetchMetrics} disabled={loading}>
          Load Metrics
        </button>
      </div>
      {metrics && (
        <div className="ui-grid-3">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{metrics.wonRate}%</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Won Deals</p>
            <p className="text-2xl font-bold">{metrics.wonDeals}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">
              ${metrics.totalDealValue?.toLocaleString()}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Referrals</p>
            <p className="text-2xl font-bold">{metrics.totalReferrals}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Referral Conv.</p>
            <p className="text-2xl font-bold">
              {metrics.referralConversionRate}%
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">MDF Utilization</p>
            <p className="text-2xl font-bold">{metrics.mdfUtilization}%</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Active Contracts</p>
            <p className="text-2xl font-bold">{metrics.activeContracts}</p>
          </div>
        </div>
      )}
    </div>
  );
}
