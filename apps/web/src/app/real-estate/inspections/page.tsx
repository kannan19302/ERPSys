// @ts-nocheck
"use client";

import React from "react";

export default function RealEstateInspectionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Property Inspections</h1>
          <p className="text-muted-foreground text-sm">Move-in, move-out, and routine physical property condition checks</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Start Inspection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Inspections Conducted</p>
          <h3 className="text-2xl font-bold mt-1">184</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Passed Condition</p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">172</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Action Required</p>
          <h3 className="text-2xl font-bold mt-1 text-red-600">12</h3>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Inspection Logs</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
            <div>
              <p className="font-semibold text-sm">Apt 4B - Grand Plaza Towers</p>
              <p className="text-xs text-muted-foreground">Type: MOVE_IN | Inspector: Sarah Lee | Status: Passed</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-medium">PASSED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
