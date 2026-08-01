"use client";

import React from "react";

export default function EducationScholarshipsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Student Scholarships & Grants
          </h1>
          <p className="text-muted-foreground text-sm">
            Financial aid awards, donor foundations, and disbursements
          </p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Award Scholarship
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Total Aid Awarded
          </p>
          <h3 className="text-2xl font-bold mt-1">$450,000</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Active Recipients
          </p>
          <h3 className="text-2xl font-bold mt-1 text-blue-600">65</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Disbursed This Term
          </p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">$215,000</h3>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Active Awards</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
            <div>
              <p className="font-semibold text-sm">
                STEM Excellence Grant — $5,000
              </p>
              <p className="text-xs text-muted-foreground">
                Recipient: Maria Garcia | Foundation: National Science Board
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-medium">
              DISBURSED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
