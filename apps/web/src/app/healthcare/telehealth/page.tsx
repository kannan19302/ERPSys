"use client";

import React from "react";

export default function HealthcareTelehealthPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Telemedicine Virtual Sessions
          </h1>
          <p className="text-muted-foreground text-sm">
            Virtual consultations, room links, and session logs
          </p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Schedule Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Scheduled Sessions
          </p>
          <h3 className="text-2xl font-bold mt-1">14</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            In Progress
          </p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">2</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Completed Today
          </p>
          <h3 className="text-2xl font-bold mt-1">28</h3>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Live & Upcoming Sessions</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-md flex justify-between items-center bg-emerald-50/50">
            <div>
              <p className="font-semibold text-sm">
                Dr. Smith & Patient #P-1044
              </p>
              <p className="text-xs text-muted-foreground">
                Room: https://telehealth.unerp.io/room/1044
              </p>
            </div>
            <button className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded font-medium">
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
