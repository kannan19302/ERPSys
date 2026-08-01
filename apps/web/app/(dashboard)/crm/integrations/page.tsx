import Link from "next/link";

export default function IntegrationsPage() {
  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Integrations</h1>
      <div className="ui-grid-3">
        <Link
          href="/crm/integrations/webhooks"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Webhooks</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure outgoing webhooks and delivery logs
          </p>
        </Link>
        <Link
          href="/crm/integrations/calendar"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Calendar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect Google, Outlook, or iCal calendars
          </p>
        </Link>
        <Link
          href="/crm/integrations/slack"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Slack</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Slack workspace connections and notifications
          </p>
        </Link>
        <Link
          href="/crm/integrations/event-logs"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Event Logs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Event delivery history and retries
          </p>
        </Link>
      </div>
    </div>
  );
}
