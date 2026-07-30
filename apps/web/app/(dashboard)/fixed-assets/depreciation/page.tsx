// @ts-nocheck
"use client";

import React from "react";

export default function AssetDepreciationPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Depreciation Schedules
          </h1>
          <p className="text-sm text-gray-500">
            Track book value schedules, accumulated depreciation, and GL posting
            status.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          Post Period Depreciation
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase border-b">
            <tr>
              <th className="p-3">Period</th>
              <th className="p-3">Asset ID</th>
              <th className="p-3">Start Book Value</th>
              <th className="p-3">Depreciation Amount</th>
              <th className="p-3">End Book Value</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            <tr>
              <td className="p-3 font-semibold">2026-07</td>
              <td className="p-3 font-mono text-xs">AST-10492</td>
              <td className="p-3">$45,000.00</td>
              <td className="p-3 text-red-600 font-medium">-$1,250.00</td>
              <td className="p-3 font-semibold">$43,750.00</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                  POSTED
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
