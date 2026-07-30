// @ts-nocheck
"use client";

import React from "react";

export default function SearchIndexConfigPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Search Index Configurations
          </h1>
          <p className="text-sm text-gray-500">
            Configure entity indexing, boost fields, and synonym rules for
            global search.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + Add Entity Config
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-bold text-gray-900">
              Customer Entity Index
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
              Auto-Indexed
            </span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>
              <span className="font-semibold">Searchable Fields:</span> name,
              email, phone, companyName
            </div>
            <div>
              <span className="font-semibold">Filter Fields:</span> status,
              country, industry, tier
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-bold text-gray-900">Sales Order Index</span>
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
              Auto-Indexed
            </span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>
              <span className="font-semibold">Searchable Fields:</span>{" "}
              orderNumber, customerName, poNumber
            </div>
            <div>
              <span className="font-semibold">Filter Fields:</span> status,
              currency, totalAmount
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
