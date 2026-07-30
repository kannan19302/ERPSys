// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, StatCardRow } from "@unerp/ui";
import { apiGet } from "@/lib/api";

export default function WorkflowAnalyticsPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/workflow/instances")
      .then((d) => setInstances(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const total = instances.length;
  const running = instances.filter((i: any) => i.status === "RUNNING").length;
  const completed = instances.filter(
    (i: any) => i.status === "COMPLETED",
  ).length;
  const failed = instances.filter((i: any) => i.status === "FAILED").length;

  return (
    <div>
      <PageHeader title="Workflow Analytics" description="Performance metrics" />
      <StatCardRow
        stats={[
          { label: "Total Instances", value: total },
          { label: "Running", value: running },
          { label: "Completed", value: completed },
          { label: "Failed", value: failed },
        ]}
      />
    </div>
  );
}
