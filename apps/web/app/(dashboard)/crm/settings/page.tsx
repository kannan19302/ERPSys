"use client";

import { PageHeader, Card } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import {
  Settings,
  GitBranch,
  Target,
  Mail,
  Shield,
  Layers,
  CheckSquare,
  ToggleLeft,
} from "lucide-react";
import Link from "next/link";

const settingsCards = [
  {
    title: "Pipelines",
    href: "/crm/settings/pipelines",
    icon: GitBranch,
    description: "Manage sales pipelines and stages",
  },
  {
    title: "Lead Scoring",
    href: "/crm/settings/lead-scoring",
    icon: Target,
    description: "Configure lead scoring rules and models",
  },
  {
    title: "Email Integration",
    href: "/crm/settings/email-integration",
    icon: Mail,
    description: "Connect and manage email accounts",
  },
  {
    title: "Duplicate Rules",
    href: "/crm/settings/duplicate-rules",
    icon: Layers,
    description: "Set up duplicate detection rules",
  },
  {
    title: "Custom Fields",
    href: "/crm/settings/custom-fields",
    icon: ToggleLeft,
    description: "Create and manage custom fields",
  },
  {
    title: "Record Types",
    href: "/crm/settings/record-types",
    icon: Shield,
    description: "Configure record type mappings",
  },
  {
    title: "SLA Policies",
    href: "/crm/settings/sla-policies",
    icon: CheckSquare,
    description: "Define service level agreement policies",
  },
  {
    title: "Approvals",
    href: "/crm/settings/approvals",
    icon: Settings,
    description: "Configure approval workflows",
  },
];

export default function CrmSettingsPage() {
  return (
    <RouteGuard permission="crm.settings.read">
      <div className="ui-card">
        <PageHeader
          title="CRM Settings"
          description="Configure CRM pipelines, scoring, integrations, and rules"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "CRM", href: "/crm" },
            { label: "Settings" },
          ]}
        />
        <div className="ui-grid-3" style={{ padding: "var(--space-4)" }}>
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href} className="no-underline">
                <Card hover padding="md" style={{ cursor: "pointer" }}>
                  <div
                    className="ui-flex"
                    style={{ gap: "var(--space-3)", alignItems: "flex-start" }}
                  >
                    <div
                      style={{
                        color: "var(--color-primary)",
                        marginTop: "var(--space-1)",
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold m-0">
                        {card.title}
                      </h3>
                      <p
                        className="text-xs text-gray-500 m-0"
                        style={{ marginTop: "var(--space-1)" }}
                      >
                        {card.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </RouteGuard>
  );
}
