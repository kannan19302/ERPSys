// @ts-nocheck
import Link from "next/link";

export default function PartnerDeepPage() {
  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Partner & Channel Management</h1>
      <div className="ui-grid-3">
        <Link
          href="/crm/partner-deep/contracts"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Contracts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage partner agreements and contracts
          </p>
        </Link>
        <Link
          href="/crm/partner-deep/tier-requirements"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Tier Requirements</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define and evaluate partner tier criteria
          </p>
        </Link>
        <Link
          href="/crm/partner-deep/referrals"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Referrals</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track partner-sourced referrals
          </p>
        </Link>
        <Link
          href="/crm/partner-deep/performance"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Performance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Partner KPIs and scorecards
          </p>
        </Link>
        <Link
          href="/crm/partner-deep/dashboard"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregated partner analytics
          </p>
        </Link>
      </div>
    </div>
  );
}
