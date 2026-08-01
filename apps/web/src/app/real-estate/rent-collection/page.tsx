"use client";

import React from "react";

export default function RealEstateRentCollectionPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Rent Collection & Receipts
          </h1>
          <p className="text-muted-foreground text-sm">
            Tenant payment tracking, gateway receipts, and late fee processing
          </p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Collected This Month
          </p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">$185,400</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Collection Rate
          </p>
          <h3 className="text-2xl font-bold mt-1 text-blue-600">97.4%</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground">
            Overdue Rent
          </p>
          <h3 className="text-2xl font-bold mt-1 text-amber-600">$4,900</h3>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Payment Receipts</h2>
        <div className="space-y-3">
          <div className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
            <div>
              <p className="font-semibold text-sm">Lease #LSE-104 - Unit 12A</p>
              <p className="text-xs text-muted-foreground">
                Tenant: Robert Taylor | Method: ACH | Amount: $2,400.00
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-medium">
              PAID
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
