"use client";

import React from "react";

export default function ApiRateLimitsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            API Rate Limits & Quotas
          </h1>
          <p className="text-sm text-gray-500">
            Configure rate limit buckets, client app quotas, and burst
            thresholds.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + New Rate Limit Rule
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase border-b">
            <tr>
              <th className="p-3">Rule Name</th>
              <th className="p-3">Endpoint Pattern</th>
              <th className="p-3">Limit / Min</th>
              <th className="p-3">Burst Limit</th>
              <th className="p-3">Client Tier</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            <tr>
              <td className="p-3 font-semibold">Standard REST API Rule</td>
              <td className="p-3 font-mono text-xs">/api/v1/*</td>
              <td className="p-3 font-medium">60 req/min</td>
              <td className="p-3">100</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-medium">
                  STANDARD
                </span>
              </td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                  ACTIVE
                </span>
              </td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">High-Throughput Partner API</td>
              <td className="p-3 font-mono text-xs">/api/v1/orders/*</td>
              <td className="p-3 font-medium">1,000 req/min</td>
              <td className="p-3">2,500</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-medium">
                  ENTERPRISE
                </span>
              </td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                  ACTIVE
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
