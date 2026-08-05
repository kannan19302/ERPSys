"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@unerp/ui";
import { Clock, Play, Calendar, Mail } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function ReportingJobsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobName, setJobName] = useState("");
  const toast = useToast();

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/reporting/scheduled-jobs-deep/jobs",
      );
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Scheduled Jobs",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreate = async () => {
    try {
      if (!jobName) {
        toast.error("Validation Error", "Job name is required");
        return;
      }
      await client.post("/reporting/scheduled-jobs-deep/jobs", {
        jobName,
        templateId: "tmpl-default-1",
        cronSchedule: "0 8 * * 1",
        outputFormat: "PDF",
      });
      toast.success(
        "Job Scheduled",
        `Report execution job "${jobName}" scheduled.`,
      );
      setJobName("");
      loadJobs();
    } catch (err) {
      toast.error(
        "Failed to schedule job",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      await client.post(`/reporting/scheduled-jobs-deep/jobs/${id}/run`, {});
      toast.success(
        "Job Executed",
        "Report generated and emailed to distribution list.",
      );
      loadJobs();
    } catch (err) {
      toast.error(
        "Failed to execute job",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Automated Scheduled Report Scheduler & Dispatch"
        description="Schedule automated weekly/monthly report generation, email dispatch to stakeholder distribution lists."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Schedule New Automated Report Job
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Job Title (e.g. Monday Morning Executive Revenue Dispatch)..."
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleCreate}>Schedule Job</Button>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Scheduled Report Cron Jobs
        </h3>
        {jobs.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No scheduled report jobs.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}
              >
                <th style={{ padding: "12px" }}>Job Name</th>
                <th style={{ padding: "12px" }}>Cron Schedule</th>
                <th style={{ padding: "12px" }}>Format</th>
                <th style={{ padding: "12px" }}>Last Execution</th>
                <th style={{ padding: "12px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>
                    {j.jobName}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <code>{j.cronSchedule}</code>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Badge variant="info">{j.outputFormat}</Badge>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--color-text-secondary)",
                      fontSize: "13px",
                    }}
                  >
                    {j.lastRunAt
                      ? new Date(j.lastRunAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunNow(j.id)}
                    >
                      <Play size={12} style={{ marginRight: "6px" }} /> Run Now
                    </Button>
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
