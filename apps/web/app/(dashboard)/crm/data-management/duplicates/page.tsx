// @ts-nocheck
"use client";
import React, { useState } from "react";
import { Card, PageHeader, Button, Input } from "@unerp/ui";
import { Search, Merge } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

export default function DuplicatesPage() {
  const [entityType, setEntityType] = useState("LEAD");
  const [field, setField] = useState("email");
  const [value, setValue] = useState("");
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [masterId, setMasterId] = useState("");
  const [mergeIds, setMergeIds] = useState<string[]>([]);
  const [mergeResult, setMergeResult] = useState("");

  const findDuplicates = async () => {
    if (!value) return;
    setLoading(true);
    try {
      const data = await apiGet<any[]>(
        `/crm/data/duplicates/${entityType}?field=${field}&value=${encodeURIComponent(value)}`,
      );
      setDuplicates(Array.isArray(data) ? data : []);
    } catch {
      setDuplicates([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMergeId = (id: string) => {
    setMergeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const executeMerge = async () => {
    if (!masterId || mergeIds.length === 0)
      return alert("Select a master and at least one record to merge");
    try {
      const result = await apiSend("/crm/data/merge", "POST", {
        entityType,
        masterId,
        mergeIds,
      });
      setMergeResult("Merge completed successfully");
      setDuplicates([]);
      setMergeIds([]);
      setMasterId("");
    } catch (e: any) {
      setMergeResult("Merge failed: " + (e.message || "Unknown error"));
    }
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Duplicate Detection & Merge"
        description="Find and merge duplicate records to keep your data clean"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Data Management", href: "/crm/data-management" },
          { label: "Duplicates" },
        ]}
      />

      <Card title="Find Duplicates">
        <div className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="LEAD">Lead</option>
              <option value="CONTACT">Contact</option>
              <option value="CUSTOMER">Customer</option>
              <option value="OPPORTUNITY">Opportunity</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field
            </label>
            <input
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value
            </label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search value"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={findDuplicates}
            disabled={loading}
          >
            <Search className="w-4 h-4 mr-1" />
            Find
          </Button>
        </div>
      </Card>

      {duplicates.length > 0 && (
        <Card title={`Found ${duplicates.length} matching records`}>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="pb-2">Master</th>
                <th className="pb-2">Merge</th>
                <th className="pb-2">ID</th>
                <th className="pb-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.map((dup) => (
                <tr key={dup.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">
                    <input
                      type="radio"
                      name="master"
                      checked={masterId === dup.id}
                      onChange={() => setMasterId(dup.id)}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={mergeIds.includes(dup.id)}
                      onChange={() => toggleMergeId(dup.id)}
                      disabled={masterId === dup.id}
                    />
                  </td>
                  <td className="py-2 text-xs">{dup.id}</td>
                  <td className="py-2">{dup.email || dup.firstName || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            variant="primary"
            size="sm"
            onClick={executeMerge}
            disabled={!masterId || mergeIds.length === 0}
          >
            <Merge className="w-4 h-4 mr-1" />
            Merge Selected
          </Button>
        </Card>
      )}

      {mergeResult && (
        <div
          className={`p-3 rounded text-sm ${mergeResult.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {mergeResult}
        </div>
      )}
    </div>
  );
}
