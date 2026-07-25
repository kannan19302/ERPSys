"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Plus,
  BarChart3,
  Send,
  Eye,
  Trash2,
} from "lucide-react";
import {
  PageHeader,
  Button,
  Card,
  Spinner,
  DataTable,
  KPICard,
  Modal,
  FormField,
} from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";

interface NpsSurvey {
  id: string;
  name: string;
  description: string | null;
  status: string;
  question: string;
  targetSegment: string | null;
  sendAutomatically: boolean;
  triggerEvent: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  _count: { responses: number };
}

interface NpsSummary {
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
  surveyCount: number;
}

export default function NpsPage() {
  const [surveys, setSurveys] = useState<NpsSurvey[]>([]);
  const [summary, setSummary] = useState<NpsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    question: "How likely are you to recommend us?",
    targetSegment: "ALL",
    sendAutomatically: false,
    triggerEvent: "",
    delayDays: 7,
  });

  const loadData = async () => {
    try {
      const [surveysRes, summaryRes] = await Promise.all([
        fetch("/api/crm/nps/surveys"),
        fetch("/api/crm/nps/summary"),
      ]);
      const surveysData = await surveysRes.json();
      const summaryData = await summaryRes.json();
      setSurveys(Array.isArray(surveysData) ? surveysData : []);
      setSummary(summaryData || null);
    } catch {
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    await fetch("/api/crm/nps/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setShowModal(false);
    setFormData({
      name: "",
      description: "",
      question: "How likely are you to recommend us?",
      targetSegment: "ALL",
      sendAutomatically: false,
      triggerEvent: "",
      delayDays: 7,
    });
    loadData();
  };

  const handleSend = async (id: string) => {
    await fetch(`/api/crm/nps/surveys/${id}/send`, { method: "POST" });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this survey and all responses?")) return;
    await fetch(`/api/crm/nps/surveys/${id}`, { method: "DELETE" });
    loadData();
  };

  return (
    <RouteGuard module="crm" permission="crm.nps.surveys.read">
      <div>
        <PageHeader
          title="NPS Surveys"
          description="Net Promoter Score survey management and results"
          actions={
            <Button onClick={() => setShowModal(true)}>
              <Plus className="ui-w-4 ui-h-4 ui-mr-1" /> New Survey
            </Button>
          }
        />

        {loading ? (
          <div className="ui-flex ui-justify-center ui-py-20">
            <Spinner />
          </div>
        ) : (
          <div className="ui-space-y-6">
            {summary && (
              <div className="ui-grid-5">
                <KPICard
                  title="NPS Score"
                  value={summary.npsScore}
                  icon={<BarChart3 className="ui-w-5 ui-h-5" />}
                  trend={
                    summary.npsScore > 0
                      ? { value: 0, isPositive: true }
                      : undefined
                  }
                />
                <KPICard
                  title="Responses"
                  value={summary.totalResponses}
                  icon={<HeartHandshake className="ui-w-5 ui-h-5" />}
                />
                <KPICard
                  title="Promoters"
                  value={summary.promoters}
                  icon={
                    <HeartHandshake className="ui-w-5 ui-h-5 ui-text-green-600" />
                  }
                />
                <KPICard
                  title="Passives"
                  value={summary.passives}
                  icon={
                    <HeartHandshake className="ui-w-5 ui-h-5 ui-text-amber-600" />
                  }
                />
                <KPICard
                  title="Detractors"
                  value={summary.detractors}
                  icon={
                    <HeartHandshake className="ui-w-5 ui-h-5 ui-text-red-600" />
                  }
                />
              </div>
            )}

            <Card className="ui-p-0">
              <DataTable
                columns={[
                  { header: "Name", accessor: "name", sortable: true },
                  { header: "Status", accessor: "status", sortable: true },
                  {
                    header: "Responses",
                    accessor: (row: NpsSurvey) => row._count.responses,
                  },
                  { header: "Question", accessor: "question" },
                  {
                    header: "Auto-send",
                    accessor: (row: NpsSurvey) =>
                      row.sendAutomatically ? "Yes" : "No",
                  },
                  {
                    header: "Created",
                    accessor: (row: NpsSurvey) =>
                      new Date(row.createdAt).toLocaleDateString(),
                  },
                  {
                    header: "Actions",
                    accessor: (row: NpsSurvey) => (
                      <div className="ui-flex ui-gap-2">
                        <Link href={`/crm/journey/nps/surveys/${row.id}`}>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="ui-p-1 hover:ui-text-blue-600"
                          >
                            <Eye className="ui-w-4 ui-h-4" />
                          </button>
                        </Link>
                        {row.status === "DRAFT" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSend(row.id);
                            }}
                            className="ui-p-1 hover:ui-text-green-600"
                          >
                            <Send className="ui-w-4 ui-h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row.id);
                          }}
                          className="ui-p-1 hover:ui-text-red-600"
                        >
                          <Trash2 className="ui-w-4 ui-h-4" />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={surveys}
              />
            </Card>
          </div>
        )}

        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Create NPS Survey"
        >
          <div className="ui-space-y-4">
            <FormField label="Name" error="">
              <input
                className="ui-input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Q3 Customer Satisfaction"
              />
            </FormField>
            <FormField label="Question" error="">
              <textarea
                className="ui-input"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                rows={2}
              />
            </FormField>
            <FormField label="Description" error="">
              <textarea
                className="ui-input"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </FormField>
            <FormField label="Target Segment" error="">
              <select
                className="ui-input"
                value={formData.targetSegment}
                onChange={(e) =>
                  setFormData({ ...formData, targetSegment: e.target.value })
                }
              >
                <option value="ALL">All Customers</option>
                <option value="SPECIFIC_CUSTOMERS">Specific Customers</option>
                <option value="SPECIFIC_CONTACTS">Specific Contacts</option>
              </select>
            </FormField>
            <div className="ui-flex ui-items-center ui-gap-2">
              <input
                type="checkbox"
                id="autoSend"
                checked={formData.sendAutomatically}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sendAutomatically: e.target.checked,
                  })
                }
              />
              <label htmlFor="autoSend">Send automatically</label>
            </div>
            {formData.sendAutomatically && (
              <div className="ui-grid-2">
                <FormField label="Trigger Event" error="">
                  <select
                    className="ui-input"
                    value={formData.triggerEvent}
                    onChange={(e) =>
                      setFormData({ ...formData, triggerEvent: e.target.value })
                    }
                  >
                    <option value="">Select trigger</option>
                    <option value="AFTER_RENEWAL">After Renewal</option>
                    <option value="AFTER_SUPPORT_TICKET">
                      After Support Ticket
                    </option>
                    <option value="AFTER_PURCHASE">After Purchase</option>
                  </select>
                </FormField>
                <FormField label="Delay (days)" error="">
                  <input
                    type="number"
                    className="ui-input"
                    value={formData.delayDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delayDays: Number(e.target.value),
                      })
                    }
                  />
                </FormField>
              </div>
            )}
            <div className="ui-flex ui-justify-end ui-gap-2 ui-pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
