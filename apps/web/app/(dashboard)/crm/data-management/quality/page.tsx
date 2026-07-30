// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Input } from "@unerp/ui";
import { Shield, Search, RotateCw } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

interface QualityDashboard {
  totalScored: number;
  avgOverall: number;
  avgCompleteness: number;
  avgAccuracy: number;
  avgConsistency: number;
  lowQualityCount: number;
}

interface DataQualityScore {
  id: string;
  entityType: string;
  entityId: string;
  overallScore: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  issues?: Array<{ field: string; issue: string; severity: string }>;
}

export default function DataQualityPage() {
  const [dash, setDash] = useState<QualityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("CUSTOMER");
  const [entityId, setEntityId] = useState("");
  const [score, setScore] = useState<DataQualityScore | null>(null);
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    apiGet<QualityDashboard>("/crm/data/quality/dashboard")
      .then((d) => setDash(d as QualityDashboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lookupScore = async () => {
    if (!entityId) return;
    setScoring(true);
    try {
      const data = await apiGet<DataQualityScore>(
        `/crm/data/quality/${entityType}/${entityId}`,
      );
      setScore(data as DataQualityScore);
    } catch {
      setScore(null);
    } finally {
      setScoring(false);
    }
  };

  const computeScore = async () => {
    if (!entityId) return;
    setScoring(true);
    try {
      const data = await apiSend<DataQualityScore>(
        `/crm/data/quality/${entityType}/${entityId}/score`,
        "POST",
      );
      setScore(data as DataQualityScore);
    } catch {
      /* empty */
    } finally {
      setScoring(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Data Quality"
        description="Score and monitor the quality of your CRM data"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Data Management", href: "/crm/data-management" },
          { label: "Quality" },
        ]}
      />

      {dash && (
        <div className="ui-grid-5">
          <Card>
            <div className="text-2xl font-bold">{dash.avgOverall}%</div>
            <div className="text-sm text-gray-500">Avg Overall</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{dash.avgCompleteness}%</div>
            <div className="text-sm text-gray-500">Completeness</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{dash.avgAccuracy}%</div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{dash.avgConsistency}%</div>
            <div className="text-sm text-gray-500">Consistency</div>
          </Card>
          <Card>
            <div className="text-2xl font-bold">{dash.lowQualityCount}</div>
            <div className="text-sm text-gray-500">Low Quality</div>
          </Card>
        </div>
      )}

      <Card title="Score an Entity">
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="CUSTOMER">Customer</option>
              <option value="LEAD">Lead</option>
              <option value="CONTACT">Contact</option>
              <option value="OPPORTUNITY">Opportunity</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity ID
            </label>
            <Input
              placeholder="Enter entity ID"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={lookupScore}
            disabled={scoring}
          >
            <Search className="w-4 h-4 mr-1" />
            Lookup
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={computeScore}
            disabled={scoring}
          >
            <RotateCw className="w-4 h-4 mr-1" />
            Score
          </Button>
        </div>

        {score && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <div className="ui-grid-4 mb-3">
              <div>
                <span className="font-semibold">Overall:</span>{" "}
                {score.overallScore}%
              </div>
              <div>
                <span className="font-semibold">Completeness:</span>{" "}
                {score.completeness}%
              </div>
              <div>
                <span className="font-semibold">Accuracy:</span>{" "}
                {score.accuracy}%
              </div>
              <div>
                <span className="font-semibold">Consistency:</span>{" "}
                {score.consistency}%
              </div>
            </div>
            {score.issues && score.issues.length > 0 && (
              <div>
                <div className="font-semibold mb-1">Issues:</div>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {score.issues.map((iss, i) => (
                    <li key={i}>
                      {iss.field}: {iss.issue} ({iss.severity})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
