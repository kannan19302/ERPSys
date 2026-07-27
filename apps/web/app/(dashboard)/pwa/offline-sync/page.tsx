"use client";

import React from "react";

export default function PwaOfflineSyncPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            PWA Offline Sync Queue
          </h1>
          <p className="text-sm text-gray-500">
            Monitor background sync requests captured when technicians or users
            were offline.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          Force Re-Sync All
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase border-b">
            <tr>
              <th className="p-3">Action Type</th>
              <th className="p-3">User ID</th>
              <th className="p-3">Retries</th>
              <th className="p-3">Status</th>
              <th className="p-3">Enqueued At</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            <tr>
              <td className="p-3 font-semibold">TICKET_UPDATE</td>
              <td className="p-3 font-mono text-xs">usr_88291</td>
              <td className="p-3">0</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                  SYNCED
                </span>
              </td>
              <td className="p-3 text-xs text-gray-500">2026-07-27 15:30:00</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">CREATE_SALES_ORDER</td>
              <td className="p-3 font-mono text-xs">usr_10492</td>
              <td className="p-3">1</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                  PENDING
                </span>
              </td>
              <td className="p-3 text-xs text-gray-500">2026-07-27 15:42:10</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
