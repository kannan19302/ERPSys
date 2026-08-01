"use client";

import React from "react";

export default function EducationReportCardsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Academic Report Cards
          </h1>
          <p className="text-muted-foreground text-sm">
            Student term performance, GPA calculations, and transcripts
          </p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Generate Report Cards
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Generated Cards
          </p>
          <h3 className="text-2xl font-bold mt-1">450</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Average Class GPA
          </p>
          <h3 className="text-2xl font-bold mt-1 text-indigo-600">3.54</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Honor Roll Students
          </p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">112</h3>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Term Fall 2025 Reports</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
            <div>
              <p className="font-semibold text-sm">Alex Johnson — Grade 10-A</p>
              <p className="text-xs text-muted-foreground">
                GPA: 3.92 | Status: Published
              </p>
            </div>
            <button className="border text-xs px-3 py-1.5 rounded font-medium hover:bg-muted">
              View PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
