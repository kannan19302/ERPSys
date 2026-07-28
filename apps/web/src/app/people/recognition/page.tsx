"use client";

import React from "react";

export default function PeopleRecognitionPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Peer Recognition & Kudos Wall</h1>
          <p className="text-muted-foreground text-sm">Employee shoutouts, core value badges, and reward points</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Give Recognition
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Kudos Given This Month</p>
          <h3 className="text-2xl font-bold mt-1 text-indigo-600">340</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Top Badge</p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">TEAMWORK</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">Points Awarded</p>
          <h3 className="text-2xl font-bold mt-1 text-amber-600">3,400 pts</h3>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Live Kudos Wall</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-md flex justify-between items-center bg-indigo-50/40">
            <div>
              <p className="font-semibold text-sm">🏆 Mark Davis recognized Jessica Wong</p>
              <p className="text-xs text-muted-foreground">"Awesome job leading the ERP migration deployment cleanly overnight!"</p>
            </div>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded font-medium">+10 PTS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
