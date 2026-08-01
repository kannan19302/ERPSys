"use client";

import React from "react";

export default function PeopleOnboardingPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Employee Onboarding Workflows
          </h1>
          <p className="text-muted-foreground text-sm">
            New hire task assignments, IT provisioning, and document collection
          </p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Add Onboarding Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Active Onboardings
          </p>
          <h3 className="text-2xl font-bold mt-1 text-blue-600">12</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Tasks Pending
          </p>
          <h3 className="text-2xl font-bold mt-1 text-amber-600">45</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Completed This Month
          </p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">28</h3>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Onboarding Task Queue</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
            <div>
              <p className="font-semibold text-sm">
                Submit Tax Forms (W-4 & Direct Deposit)
              </p>
              <p className="text-xs text-muted-foreground">
                Employee: Emily Clark | Due: Jul 30, 2026
              </p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded font-medium">
              PENDING
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
