"use client";
import { useState, useEffect } from "react";

export default function ClauseLibraryPage() {
  const [clauses, setClauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/contract-deep/clause-library")
      .then((r) => r.json())
      .then((d) => {
        setClauses(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="ui-card p-6">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="ui-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Clause Library</h1>
        <button className="ui-btn">+ New Clause</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-3 font-medium">Title</th>
              <th className="py-2 px-3 font-medium">Category</th>
              <th className="py-2 px-3 font-medium">Standard</th>
              <th className="py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clauses.map((c: any) => (
              <tr key={c.id} className="border-b hover:bg-muted/50">
                <td className="py-2 px-3 font-medium">{c.title}</td>
                <td className="py-2 px-3">{c.category}</td>
                <td className="py-2 px-3">{c.isStandard ? "Yes" : "No"}</td>
                <td className="py-2 px-3 space-x-2">
                  <button className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {clauses.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-4 text-center text-muted-foreground"
                >
                  No clauses in library
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
