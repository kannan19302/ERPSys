// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@unerp/framework";

export default function PartnerReferralsPage() {
  const api = useApiClient();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/partner-deep/referrals")
      .then((res: any) => {
        setReferrals(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="ui-card p-6">Loading referrals...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Partner Referrals</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-2">Company</th>
            <th className="py-2 px-2">Contact</th>
            <th className="py-2 px-2">Email</th>
            <th className="py-2 px-2">Value</th>
            <th className="py-2 px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r: any) => (
            <tr key={r.id} className="border-b hover:bg-muted/50">
              <td className="py-2 px-2">{r.companyName}</td>
              <td className="py-2 px-2">{r.contactName}</td>
              <td className="py-2 px-2">{r.contactEmail}</td>
              <td className="py-2 px-2">
                {r.currency} {r.estimatedValue?.toLocaleString()}
              </td>
              <td className="py-2 px-2">{r.status}</td>
            </tr>
          ))}
          {referrals.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="py-4 text-center text-muted-foreground"
              >
                No referrals found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
