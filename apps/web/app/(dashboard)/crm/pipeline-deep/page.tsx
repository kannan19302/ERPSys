import Link from "next/link";

export default function PipelineDeepPage() {
  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">
        Pipeline Risk & Deal Analytics
      </h1>
      <div className="ui-grid-3">
        <Link
          href="/crm/pipeline-deep/inspection"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Inspection</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure and run pipeline inspections
          </p>
        </Link>
        <Link
          href="/crm/pipeline-deep/deal-comparison"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Deal Comparison</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Side-by-side deal analysis
          </p>
        </Link>
        <Link
          href="/crm/pipeline-deep/analytics"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pipeline KPIs, conversion, win rates
          </p>
        </Link>
        <Link
          href="/crm/pipeline-deep/conversion"
          className="ui-card p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg">Conversion</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Stage conversion rates and duration
          </p>
        </Link>
      </div>
    </div>
  );
}
