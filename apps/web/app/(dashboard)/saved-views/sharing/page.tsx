"use client";

import React from "react";

export default function SavedViewSharingPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Saved View Permissions
          </h1>
          <p className="text-sm text-gray-500">
            Manage view sharing rules, role-level visibility, and default layout
            preferences.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + Share View
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase border-b">
            <tr>
              <th className="p-3">View ID</th>
              <th className="p-3">Shared With</th>
              <th className="p-3">Permission</th>
              <th className="p-3">Shared At</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            <tr>
              <td className="p-3 font-mono text-xs font-semibold">
                vw_q1_pipeline_open
              </td>
              <td className="p-3">role:SALES_MANAGER</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                  EDIT
                </span>
              </td>
              <td className="p-3 text-xs text-gray-500">2026-07-26</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
