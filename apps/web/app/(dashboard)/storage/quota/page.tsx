"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, StatCardRow } from "@unerp/ui";
import { apiGet } from "@/lib/api";

export default function QuotaPage() {
  const [quota, setQuota] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/storage/quota")
      .then(setQuota)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const usedGB = quota
    ? (Number(quota.storageUsed) / 1073741824).toFixed(2)
    : "0";
  const limitGB = quota
    ? (Number(quota.storageLimit) / 1073741824).toFixed(2)
    : "1";

  return (
    <div>
      <PageHeader
        title="Storage Quota"
        description={`${usedGB} GB used of ${limitGB} GB`}
      />
      <StatCardRow
        stats={[
          { label: "Storage Used", value: `${usedGB} GB` },
          { label: "Storage Limit", value: `${limitGB} GB` },
          { label: "Total Files", value: quota?.fileCount || 0 },
          { label: "Folders", value: quota?.folderCount || 0 },
        ]}
      />
    </div>
  );
}
