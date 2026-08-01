"use client";

import React from "react";

export default function SubscriptionPlanTiersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Subscription Plan Tiers
          </h1>
          <p className="text-sm text-gray-500">
            Configure SaaS pricing tiers, included usage units, and overage
            rates.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + Add Plan Tier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-xl p-6 bg-white shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Starter Plan</h3>
            <div className="text-3xl font-extrabold mt-2 text-gray-900">
              $49{" "}
              <span className="text-xs font-normal text-gray-500">/ mo</span>
            </div>
          </div>
          <ul className="text-xs text-gray-600 space-y-2 border-t pt-4">
            <li>✓ Up to 10 Team Members</li>
            <li>✓ 100GB Cloud Storage</li>
            <li>✓ Standard Support</li>
          </ul>
        </div>

        <div className="border-2 border-blue-600 rounded-xl p-6 bg-white shadow-md space-y-4 relative">
          <span className="absolute -top-3 right-4 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">
            POPULAR
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Professional Plan
            </h3>
            <div className="text-3xl font-extrabold mt-2 text-gray-900">
              $149{" "}
              <span className="text-xs font-normal text-gray-500">/ mo</span>
            </div>
          </div>
          <ul className="text-xs text-gray-600 space-y-2 border-t pt-4">
            <li>✓ Up to 50 Team Members</li>
            <li>✓ 500GB Cloud Storage</li>
            <li>✓ Priority 24/7 Support</li>
            <li>✓ Custom Integrations</li>
          </ul>
        </div>

        <div className="border rounded-xl p-6 bg-white shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Enterprise Plan</h3>
            <div className="text-3xl font-extrabold mt-2 text-gray-900">
              $499{" "}
              <span className="text-xs font-normal text-gray-500">/ mo</span>
            </div>
          </div>
          <ul className="text-xs text-gray-600 space-y-2 border-t pt-4">
            <li>✓ Unlimited Team Members</li>
            <li>✓ 2TB Cloud Storage</li>
            <li>✓ Dedicated Account Manager</li>
            <li>✓ SLA Guarantee</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
