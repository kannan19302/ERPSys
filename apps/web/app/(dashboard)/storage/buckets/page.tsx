"use client";

import React from "react";

export default function StorageBucketsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Storage Buckets</h1>
          <p className="text-sm text-gray-500">
            Configure S3/Azure cloud storage buckets, quotas, and lifecycle
            policies.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + Connect Bucket
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase border-b">
            <tr>
              <th className="p-3">Bucket Name</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Region</th>
              <th className="p-3">Quota</th>
              <th className="p-3">Current Usage</th>
              <th className="p-3">Versioning</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            <tr>
              <td className="p-3 font-mono text-xs font-semibold">
                unerp-doc-vault-prod
              </td>
              <td className="p-3">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                  AWS S3
                </span>
              </td>
              <td className="p-3 font-mono text-xs">us-east-1</td>
              <td className="p-3">500 GB</td>
              <td className="p-3 font-medium text-blue-600">
                124.5 GB (24.9%)
              </td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                  ENABLED
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
