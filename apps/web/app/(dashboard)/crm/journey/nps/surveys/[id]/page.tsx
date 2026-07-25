"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { HeartHandshake, ArrowLeft, BarChart3, Users } from "lucide-react";
import {
  PageHeader,
  Button,
  Card,
  Spinner,
  DataTable,
  KPICard,
} from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";

interface NpsResponse {
  id: string;
  rating: number;
  category: string;
  comment: string | null;
  customerId: string | null;
  contactId: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
}

interface SurveyDetail {
  id: string;
  name: string;
  question: string;
  status: string;
  description: string | null;
  targetSegment: string | null;
  sendAutomatically: boolean;
  triggerEvent: string | null;
  delayDays: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export default function SurveyDetailPage() {
  const params = useParams();
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [responses, setResponses] = useState<NpsResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [surveyRes, responsesRes] = await Promise.all([
          fetch(`/api/crm/nps/surveys`),
          fetch(`/api/crm/nps/surveys/${params.id}/responses`),
        ]);
        const surveys = await surveyRes.json();
        const respData = await responsesRes.json();
        const found = Array.isArray(surveys)
          ? surveys.find((s: SurveyDetail) => s.id === params.id)
          : null;
        setSurvey(found || null);
        setResponses(Array.isArray(respData) ? respData : []);
      } catch {
        setSurvey(null);
        setResponses([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const promoters = responses.filter((r) => r.category === "PROMOTER").length;
  const passives = responses.filter((r) => r.category === "PASSIVE").length;
  const detractors = responses.filter((r) => r.category === "DETRACTOR").length;
  const score =
    responses.length > 0
      ? Math.round(((promoters - detractors) / responses.length) * 100)
      : 0;

  return (
    <RouteGuard module="crm" permission="crm.nps.surveys.read">
      <div>
        <PageHeader
          title={survey?.name || "Survey Details"}
          description={survey?.question || ""}
          breadcrumbs={[
            { label: "NPS Surveys", href: "/crm/journey/nps" },
            { label: survey?.name || "Survey" },
          ]}
          actions={
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="ui-w-4 ui-h-4 ui-mr-1" /> Back
            </Button>
          }
        />

        {loading ? (
          <div className="ui-flex ui-justify-center ui-py-20">
            <Spinner />
          </div>
        ) : (
          <div className="ui-space-y-6">
            {survey && (
              <div className="ui-grid-4">
                <KPICard
                  title="Status"
                  value={survey.status}
                  icon={<BarChart3 className="ui-w-5 ui-h-5" />}
                />
                <KPICard
                  title="NPS Score"
                  value={score}
                  icon={<HeartHandshake className="ui-w-5 ui-h-5" />}
                />
                <KPICard
                  title="Total Responses"
                  value={responses.length}
                  icon={<Users className="ui-w-5 ui-h-5" />}
                />
                <KPICard
                  title="Response Rate"
                  value={responses.length > 0 ? "N/A" : "No responses yet"}
                  icon={<BarChart3 className="ui-w-5 ui-h-5" />}
                />
              </div>
            )}

            <div className="ui-grid-3">
              <Card className="ui-p-4">
                <h4 className="ui-text-sm ui-font-medium ui-text-green-700 ui-mb-2">
                  Promoters (9-10)
                </h4>
                <p className="ui-text-3xl ui-font-bold ui-text-green-600">
                  {promoters}
                </p>
                <p className="ui-text-sm ui-text-gray-500">
                  {responses.length > 0
                    ? Math.round((promoters / responses.length) * 100)
                    : 0}
                  % of responses
                </p>
              </Card>
              <Card className="ui-p-4">
                <h4 className="ui-text-sm ui-font-medium ui-text-amber-700 ui-mb-2">
                  Passives (7-8)
                </h4>
                <p className="ui-text-3xl ui-font-bold ui-text-amber-600">
                  {passives}
                </p>
                <p className="ui-text-sm ui-text-gray-500">
                  {responses.length > 0
                    ? Math.round((passives / responses.length) * 100)
                    : 0}
                  % of responses
                </p>
              </Card>
              <Card className="ui-p-4">
                <h4 className="ui-text-sm ui-font-medium ui-text-red-700 ui-mb-2">
                  Detractors (0-6)
                </h4>
                <p className="ui-text-3xl ui-font-bold ui-text-red-600">
                  {detractors}
                </p>
                <p className="ui-text-sm ui-text-gray-500">
                  {responses.length > 0
                    ? Math.round((detractors / responses.length) * 100)
                    : 0}
                  % of responses
                </p>
              </Card>
            </div>

            <Card className="ui-p-0">
              <div className="ui-p-4 ui-border-b">
                <h3 className="ui-font-semibold">Responses</h3>
              </div>
              <DataTable
                columns={[
                  { header: "Rating", accessor: "rating", sortable: true },
                  { header: "Category", accessor: "category", sortable: true },
                  { header: "Comment", accessor: "comment" },
                  {
                    header: "Responded",
                    accessor: (row: NpsResponse) =>
                      row.respondedAt
                        ? new Date(row.respondedAt).toLocaleDateString()
                        : "N/A",
                  },
                ]}
                data={responses}
              />
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
