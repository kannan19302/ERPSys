import Link from "next/link";

export default function CommunicationDeepPage() {
  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Communication Deep</h1>
      <div className="ui-grid-3">
        <Link
          href="/crm/communication-deep/sms-templates"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">SMS Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage SMS message templates
          </p>
        </Link>
        <Link
          href="/crm/communication-deep/whatsapp-templates"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">WhatsApp Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage WhatsApp message templates
          </p>
        </Link>
        <Link
          href="/crm/communication-deep/social-posts"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Social Posts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule and publish social media content
          </p>
        </Link>
        <Link
          href="/crm/communication-deep/analytics"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Communication analytics and dashboard
          </p>
        </Link>
        <Link
          href="/crm/communication-deep/message-history"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Message History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View all communications with entities
          </p>
        </Link>
        <Link
          href="/crm/communication-deep/opt-out"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Opt-Out List</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage communication opt-outs
          </p>
        </Link>
        <Link
          href="/crm/communication-deep/preferences"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Preferences</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Communication preferences per entity
          </p>
        </Link>
      </div>
    </div>
  );
}
