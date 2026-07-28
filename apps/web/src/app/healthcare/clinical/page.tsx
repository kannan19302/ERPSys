"use client";

import React from "react";

export default function HealthcareClinicalPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinical EHR Notes</h1>
          <p className="text-muted-foreground text-sm">Practitioner session notes, diagnoses, and ICD-10 coding</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + New Clinical Note
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Total Notes</p>
          <h3 className="text-2xl font-bold mt-1">1,240</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Draft Notes</p>
          <h3 className="text-2xl font-bold mt-1 text-amber-600">18</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Signed Notes</p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">1,222</h3>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Patient Notes</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
            <div>
              <p className="font-semibold text-sm">Patient #P-9021 — John Doe</p>
              <p className="text-xs text-muted-foreground">ICD-10: G43.909 (Migraine) | CPT: 99214</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-medium">SIGNED</span>
          </div>
          <div className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
            <div>
              <p className="font-semibold text-sm">Patient #P-8812 — Sarah Jenkins</p>
              <p className="text-xs text-muted-foreground">ICD-10: E11.9 (Type 2 Diabetes)</p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded font-medium">DRAFT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
