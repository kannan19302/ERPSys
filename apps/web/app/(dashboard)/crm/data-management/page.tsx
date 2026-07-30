// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button } from "@unerp/ui";
import {
  Upload,
  Shield,
  ListChecks,
  CopyCheck,
  Download,
  History,
  Database,
} from "lucide-react";
import Link from "next/link";
import { apiGet } from "../_components/api";

interface QualityDashboard {
  totalScored: number;
  avgOverall: number;
  avgCompleteness: number;
  avgAccuracy: number;
  avgConsistency: number;
  lowQualityCount: number;
}

export default function DataManagementPage() {
  const [quality, setQuality] = useState<QualityDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<QualityDashboard>("/crm/data/quality/dashboard")
      .then((d) => {
        setQuality(d as QualityDashboard);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    {
      title: "Data Imports",
      desc: "Import CSV or JSON data",
      icon: <Upload className="w-6 h-6" />,
      href: "/crm/data-management/imports",
      color: "text-blue-500",
    },
    {
      title: "Data Quality",
      desc: "Score and monitor data quality",
      icon: <Shield className="w-6 h-6" />,
      href: "/crm/data-management/quality",
      color: "text-green-500",
    },
    {
      title: "Bulk Operations",
      desc: "Update, assign, or delete in bulk",
      icon: <ListChecks className="w-6 h-6" />,
      href: "/crm/data-management/bulk-operations",
      color: "text-purple-500",
    },
    {
      title: "Duplicates",
      desc: "Find and merge duplicate records",
      icon: <CopyCheck className="w-6 h-6" />,
      href: "/crm/data-management/duplicates",
      color: "text-orange-500",
    },
    {
      title: "Export",
      desc: "Export data to CSV or JSON",
      icon: <Download className="w-6 h-6" />,
      href: "/crm/data-management/export",
      color: "text-teal-500",
    },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Data Management"
        description="Import, clean, and manage your CRM data"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Data Management" },
        ]}
      />

      <div className="ui-grid-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className={`${card.color} mb-2`}>{card.icon}</div>
              <div className="font-semibold">{card.title}</div>
              <div className="text-sm text-gray-500">{card.desc}</div>
            </Card>
          </Link>
        ))}
      </div>

      {quality && (
        <Card title="Data Quality Overview">
          <div className="ui-grid-5">
            <div>
              <div className="text-2xl font-bold">{quality.avgOverall}%</div>
              <div className="text-sm text-gray-500">Avg Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {quality.avgCompleteness}%
              </div>
              <div className="text-sm text-gray-500">Completeness</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{quality.avgAccuracy}%</div>
              <div className="text-sm text-gray-500">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {quality.avgConsistency}%
              </div>
              <div className="text-sm text-gray-500">Consistency</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {quality.lowQualityCount}
              </div>
              <div className="text-sm text-gray-500">Low Quality</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
