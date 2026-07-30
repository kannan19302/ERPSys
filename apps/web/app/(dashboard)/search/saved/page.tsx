// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Trash2, Search as SearchIcon } from "lucide-react";

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  scope: string;
  createdAt: string;
}

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/search/saved")
      .then((r) => r.json())
      .then((data) => {
        setSearches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const deleteSearch = async (id: string) => {
    await fetch(`/api/search/saved/${id}`, { method: "DELETE" });
    setSearches((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Saved Searches</h1>
      <a href="/search" className="ui-btn ui-btn-outline mb-4">
        <SearchIcon className="w-4 h-4 mr-2" /> New Search
      </a>
      {loading && <div className="text-gray-500">Loading...</div>}
      {!loading && searches.length === 0 && (
        <div className="text-gray-500">No saved searches yet.</div>
      )}
      {searches.length > 0 && (
        <table className="ui-table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Query</th>
              <th>Scope</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {searches.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}</td>
                <td className="text-gray-500">{s.query}</td>
                <td>{s.scope}</td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="ui-btn ui-btn-ghost"
                    onClick={() => deleteSearch(s.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
