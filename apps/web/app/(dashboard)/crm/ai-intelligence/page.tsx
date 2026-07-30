// @ts-nocheck
"use client";
import React from "react";
import { Card, PageHeader, Button, DashboardKPICard } from "@unerp/ui";
import {
  Brain,
  TrendingUp,
  Target,
  Heart,
  Activity,
  DollarSign,
  Zap,
  Crosshair,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    name: "Win Probability",
    desc: "AI-powered win probability scoring and rationale",
    icon: Crosshair,
    href: "/crm/ai-intelligence/win-probability",
    color: "#8b5cf6",
  },
  {
    name: "Next Best Action",
    desc: "Recommended next actions for every deal",
    icon: Zap,
    href: "/crm/ai-intelligence/next-best-action",
    color: "#3b82f6",
  },
  {
    name: "Deal Health",
    desc: "Deal health scores and factor analysis",
    icon: Heart,
    href: "/crm/ai-intelligence/deal-health",
    color: "#ef4444",
  },
  {
    name: "Pipeline Anomalies",
    desc: "Detect stalled deals and slipping dates",
    icon: Activity,
    href: "/crm/ai-intelligence/pipeline-anomalies",
    color: "#f59e0b",
  },
  {
    name: "Revenue Intelligence",
    desc: "Revenue digests, trends, and forecasting",
    icon: DollarSign,
    href: "/crm/ai-intelligence/revenue-intelligence",
    color: "#10b981",
  },
  {
    name: "Sales Velocity",
    desc: "Velocity metrics, trends, and cycle analysis",
    icon: TrendingUp,
    href: "/crm/ai-intelligence/sales-velocity",
    color: "#ec4899",
  },
  {
    name: "Competitor Intelligence",
    desc: "Competitor tracking, battlecards, win/loss categories",
    icon: Target,
    href: "/crm/competitor-intelligence",
    color: "#6366f1",
  },
];

export default function AiIntelligencePage() {
  return (
    <div className="ui-page">
      <PageHeader
        title="AI Intelligence"
        description="AI-powered sales intelligence and predictive analytics"
      />
      <div className="ui-grid-4" style={{ gap: "1rem" }}>
        {features.map((f) => (
          <Link key={f.name} href={f.href} style={{ textDecoration: "none" }}>
            <Card hover>
              <div
                className="ui-card-body"
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: `${f.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <f.icon size={20} color={f.color} />
                </div>
                <div>
                  <h4
                    style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}
                  >
                    {f.name}
                  </h4>
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.8rem",
                      color: "#666",
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
