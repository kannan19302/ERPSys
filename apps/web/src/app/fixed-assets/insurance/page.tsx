"use client";

import React from "react";

export default function FixedAssetsInsurancePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fixed Asset Insurance Policies</h1>
          <p className="text-muted-foreground text-sm">Asset insurance coverage, policy premiums, and claim records</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Add Policy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Total Insured Value</p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">$12,450,000</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Annual Premiums</p>
          <h3 className="text-2xl font-bold mt-1 text-amber-600">$84,000</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Active Policies</p>
          <h3 className="text-2xl font-bold mt-1">45</h3>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Active Insurance Policies</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
            <div>
              <p className="font-semibold text-sm">CNC Milling Machine #CNC-01 — POL-4091</p>
              <p className="text-xs text-muted-foreground">Insurer: Allianz Industrial | Coverage: $250,000 | Premium: $2,400/yr</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-medium">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
