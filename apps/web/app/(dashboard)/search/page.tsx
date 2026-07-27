"use client";

import { useState, useCallback } from "react";
import { Search, Save, Clock, TrendingUp } from "lucide-react";
import { DataTable } from "@unerp/ui";
import type { Column } from "@unerp/ui";

interface SearchResult {
  entity: string;
  group: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search/global?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(json.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSearch = async () => {
    if (!saveName || !query) return;
    await fetch("/api/search/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: saveName, query, scope: "ALL" }),
    });
    setSaveName("");
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Enterprise Search</h1>
      <div className="ui-form-group mb-6">
        <div className="flex gap-2">
          <input
            className="ui-input flex-1"
            placeholder="Search across all modules..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              doSearch(e.target.value);
            }}
          />
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => doSearch(query)}
          >
            <Search className="w-4 h-4 mr-2" /> Search
          </button>
        </div>
      </div>
      <div className="flex gap-4 mb-6">
        <a href="/search/saved" className="ui-btn ui-btn-outline">
          <Save className="w-4 h-4 mr-2" /> Saved Searches
        </a>
        <a href="/search/analytics" className="ui-btn ui-btn-outline">
          <TrendingUp className="w-4 h-4 mr-2" /> Analytics
        </a>
      </div>
      {results.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2 items-center">
            <input
              className="ui-input flex-1"
              placeholder="Name this search..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <button className="ui-btn ui-btn-secondary" onClick={saveSearch}>
              <Save className="w-4 h-4 mr-2" /> Save
            </button>
          </div>
        </div>
      )}
      {loading && <div className="text-gray-500">Searching...</div>}
      {!loading && results.length === 0 && query.length >= 2 && (
        <div className="text-gray-500">No results found for "{query}"</div>
      )}
      {results.length > 0 && (
        <table className="ui-table w-full">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Detail</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={`${r.entity}-${r.id}-${i}`}>
                <td>
                  <span className="badge badge-sm">{r.group}</span>
                </td>
                <td className="font-medium">{r.title}</td>
                <td className="text-gray-500">{r.subtitle}</td>
                <td>
                  <a href={r.href} className="ui-btn ui-btn-ghost btn-sm">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
