// @ts-nocheck
"use client";

import React from "react";

export default function FixedAssetsRevaluationPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Revaluation & Appraisals</h1>
          <p className="text-muted-foreground text-sm">Fair market value adjustments, appraisal records, and gain/loss logs</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Record Revaluation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Total Revaluations YTD</p>
          <h3 className="text-2xl font-bold mt-1">24</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Net Value Adjustment</p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">+$340,000</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Pending Appraisals</p>
          <h3 className="text-2xl font-bold mt-1 text-blue-600">3</h3>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Revaluation History</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
            <div>
              <p className="font-semibold text-sm">HQ Office Building (Commercial Real Estate)</p>
              <p className="text-xs text-muted-foreground">Old: $4,500,000 → New: $4,850,000 | Appraiser: Cushman & Wakefield</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-medium">REVALUED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
