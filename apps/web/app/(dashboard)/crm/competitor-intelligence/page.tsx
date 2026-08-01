"use client";
import React from "react";
import { Card, PageHeader, Button } from "@unerp/ui";
import {
  Target,
  FileText,
  PieChart,
  Layers,
  Crosshair,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    name: "Intelligence Reports",
    desc: "SWOT, pricing, competitor analysis reports",
    icon: FileText,
    href: "/crm/competitor-intelligence/reports",
    color: "#8b5cf6",
  },
  {
    name: "Competitor Landscape",
    desc: "Full competitor SWOT and positioning",
    icon: Layers,
    href: "/crm/competitor-intelligence/landscape",
    color: "#3b82f6",
  },
  {
    name: "Win/Loss Categories",
    desc: "Win/loss reason category management",
    icon: PieChart,
    href: "/crm/competitor-intelligence/win-loss-categories",
    color: "#10b981",
  },
];

export default function CompetitorIntelligencePage() {
  return (
    <div className="ui-page">
      <PageHeader
        title="Competitor Intelligence"
        description="Track competitors, manage battlecards, and analyze win/loss patterns"
      />
      <div className="ui-grid-3" style={{ gap: "1rem" }}>
        {features.map((f) => (
          <Link key={f.name} href={f.href} style={{ textDecoration: "none" }}>
            <Card hover>
              <div
                className="ui-card-body"
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: `${f.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <f.icon size={22} color={f.color} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                    {f.name}
                  </h4>
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.85rem",
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
