"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Activity, MapPin, Plus } from "lucide-react";
import { PageHeader, Button, Card, Spinner, Modal, FormField } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";

interface JourneyEvent {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  eventDate: string;
  stage: { id: string; name: string; color: string } | null;
}

interface JourneyStage {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

interface JourneyData {
  customer: { id: string; name: string; email: string };
  stages: JourneyStage[];
  events: JourneyEvent[];
}

export default function CustomerJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    stageId: "",
    eventType: "NOTE_ADDED",
    title: "",
    description: "",
    eventDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetch(`/api/crm/customer-journey/${params.customerId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [params.customerId]);

  const handleRecordEvent = async () => {
    await fetch(`/api/crm/customer-journey/${params.customerId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setShowModal(false);
    setFormData({
      stageId: "",
      eventType: "NOTE_ADDED",
      title: "",
      description: "",
      eventDate: new Date().toISOString().split("T")[0],
    });
    fetch(`/api/crm/customer-journey/${params.customerId}`)
      .then((r) => r.json())
      .then((d) => setData(d));
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      LEAD_CREATED: "🎯",
      OPPORTUNITY_CREATED: "💼",
      QUOTE_SENT: "📄",
      ORDER_PLACED: "🛒",
      INVOICE_SENT: "🧾",
      PAYMENT_RECEIVED: "💰",
      SUPPORT_TICKET: "🎫",
      NOTE_ADDED: "📝",
      MEETING_HELD: "🤝",
      EMAIL_SENT: "📧",
      CALL_MADE: "📞",
      STAGE_CHANGE: "🔄",
    };
    return icons[type] || "📌";
  };

  return (
    <RouteGuard module="crm" permission="crm.customer-journey.events.read">
      <div>
        <PageHeader
          title={data ? `Journey: ${data.customer.name}` : "Customer Journey"}
          description={
            data ? `Track ${data.customer.name}'s lifecycle journey` : ""
          }
          breadcrumbs={[{ label: "Journey", href: "/crm/journey" }]}
          actions={
            <Button onClick={() => setShowModal(true)}>
              <Plus className="ui-w-4 ui-h-4 ui-mr-1" /> Record Event
            </Button>
          }
        />

        {loading ? (
          <div className="ui-flex ui-justify-center ui-py-20">
            <Spinner />
          </div>
        ) : data ? (
          <div className="ui-grid-3">
            <Card className="ui-p-4 ui-col-span-1">
              <h3 className="ui-font-semibold ui-mb-3">Journey Stages</h3>
              <div className="ui-space-y-2">
                {data.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="ui-flex ui-items-center ui-gap-2 ui-p-2 ui-rounded-lg ui-text-sm hover:ui-bg-gray-50"
                  >
                    <div
                      className="ui-w-3 ui-h-3 ui-rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span>{stage.name}</span>
                  </div>
                ))}
              </div>
              <div className="ui-mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/crm/journey/customer-360/${params.customerId}`,
                    )
                  }
                >
                  View 360 Profile
                </Button>
              </div>
            </Card>

            <Card className="ui-p-4 ui-col-span-2">
              <h3 className="ui-font-semibold ui-mb-3">Timeline</h3>
              <div className="ui-space-y-3">
                {data.events.map((event) => (
                  <div
                    key={event.id}
                    className="ui-flex ui-items-start ui-gap-3 ui-p-3 ui-rounded-lg hover:ui-bg-gray-50 ui-border ui-border-gray-100"
                  >
                    <span className="ui-text-lg">
                      {getEventIcon(event.eventType)}
                    </span>
                    <div className="ui-flex-1">
                      <div className="ui-flex ui-items-center ui-gap-2 ui-mb-1">
                        <span className="ui-text-xs ui-font-medium ui-text-gray-500">
                          {event.eventType.replace(/_/g, " ")}
                        </span>
                        {event.stage && (
                          <span
                            className="ui-px-2 ui-py-0.5 ui-rounded-full ui-text-xs"
                            style={{
                              backgroundColor: event.stage.color + "20",
                              color: event.stage.color,
                            }}
                          >
                            {event.stage.name}
                          </span>
                        )}
                        <span className="ui-text-xs ui-text-gray-400 ui-ml-auto">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="ui-text-sm ui-font-medium">{event.title}</p>
                      {event.description && (
                        <p className="ui-text-xs ui-text-gray-500 ui-mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {data.events.length === 0 && (
                  <p className="ui-text-sm ui-text-gray-400 ui-py-8 ui-text-center">
                    No events recorded yet. Click "Record Event" to add the
                    first one.
                  </p>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="ui-p-8 ui-text-center">
            <p className="ui-text-gray-500">Customer not found</p>
          </Card>
        )}

        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Record Journey Event"
        >
          <div className="ui-space-y-4">
            <FormField label="Event Type" error="">
              <select
                className="ui-input"
                value={formData.eventType}
                onChange={(e) =>
                  setFormData({ ...formData, eventType: e.target.value })
                }
              >
                <option value="NOTE_ADDED">Note Added</option>
                <option value="LEAD_CREATED">Lead Created</option>
                <option value="OPPORTUNITY_CREATED">Opportunity Created</option>
                <option value="QUOTE_SENT">Quote Sent</option>
                <option value="ORDER_PLACED">Order Placed</option>
                <option value="INVOICE_SENT">Invoice Sent</option>
                <option value="PAYMENT_RECEIVED">Payment Received</option>
                <option value="SUPPORT_TICKET">Support Ticket</option>
                <option value="MEETING_HELD">Meeting Held</option>
                <option value="EMAIL_SENT">Email Sent</option>
                <option value="CALL_MADE">Call Made</option>
                <option value="STAGE_CHANGE">Stage Change</option>
              </select>
            </FormField>
            <FormField label="Journey Stage (optional)" error="">
              <select
                className="ui-input"
                value={formData.stageId}
                onChange={(e) =>
                  setFormData({ ...formData, stageId: e.target.value })
                }
              >
                <option value="">No stage</option>
                {data?.stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Title" error="">
              <input
                className="ui-input"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Brief title for this event"
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
            <FormField label="Event Date" error="">
              <input
                type="date"
                className="ui-input"
                value={formData.eventDate}
                onChange={(e) =>
                  setFormData({ ...formData, eventDate: e.target.value })
                }
              />
            </FormField>
            <div className="ui-flex ui-justify-end ui-gap-2 ui-pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordEvent}>Record</Button>
            </div>
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
