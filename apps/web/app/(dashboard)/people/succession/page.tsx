// @ts-nocheck
"use client";

import React from "react";

export default function PeopleSuccessionPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Succession Planning
          </h1>
          <p className="text-sm text-gray-500">
            Pipeline readiness, key position bench strength, and talent risk
            analysis.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + New Succession Plan
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase border-b">
            <tr>
              <th className="p-3">Position</th>
              <th className="p-3">Readiness</th>
              <th className="p-3">Risk of Loss</th>
              <th className="p-3">Impact of Loss</th>
              <th className="p-3">Successor Bench</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            <tr>
              <td className="p-3 font-semibold">Chief Technology Officer</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                  READY_NOW
                </span>
              </td>
              <td className="p-3">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                  MEDIUM
                </span>
              </td>
              <td className="p-3">
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-medium">
                  CRITICAL
                </span>
              </td>
              <td className="p-3 text-xs text-gray-500">
                2 Candidates Identified
              </td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">VP of Global Sales</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                  1_YEAR
                </span>
              </td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                  LOW
                </span>
              </td>
              <td className="p-3">
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded font-medium">
                  HIGH
                </span>
              </td>
              <td className="p-3 text-xs text-gray-500">
                3 Candidates Identified
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
