// @ts-nocheck
"use client";

import React, { useState } from "react";

export default function PeopleCompetenciesPage() {
  const [category, setCategory] = useState("ALL");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Competency Framework
          </h1>
          <p className="text-sm text-gray-500">
            Manage employee skill matrix, proficiency levels, and competency
            models.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + New Competency
        </button>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {["ALL", "TECHNICAL", "LEADERSHIP", "SOFT_SKILLS", "DOMAIN"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                category === cat
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ),
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 space-y-2 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900">System Architecture</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              TECHNICAL
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Ability to design scalable distributed microservices and database
            models.
          </p>
          <div className="text-xs font-medium text-gray-700 pt-2 border-t">
            5 Proficiency Levels Defined
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-2 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900">
              Executive Leadership
            </h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800">
              LEADERSHIP
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Cross-functional team alignment, strategic roadmap execution, and
            mentorship.
          </p>
          <div className="text-xs font-medium text-gray-700 pt-2 border-t">
            5 Proficiency Levels Defined
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-2 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900">Financial Modeling</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-800">
              DOMAIN
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Enterprise budgeting, forecast scenario building, and GL variance
            analysis.
          </p>
          <div className="text-xs font-medium text-gray-700 pt-2 border-t">
            5 Proficiency Levels Defined
          </div>
        </div>
      </div>
    </div>
  );
}
