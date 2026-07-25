"use client";
import { useState, useEffect } from "react";

export default function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/crm/contract-deep/templates").then((r) => r.json()),
      fetch("/api/crm/contract-deep/template-categories").then((r) => r.json()),
    ]).then(([t, c]) => {
      setTemplates(t.data || []);
      setCategories(c.data || []);
      setLoading(false);
    });
  }, []);

  if (loading)
    return (
      <div className="ui-card p-6">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Contract Templates</h1>
      {categories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            Categories
          </h2>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c: any) => (
              <span
                key={c.id}
                className="px-3 py-1 bg-muted rounded-full text-sm"
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium">Type</th>
              <th className="py-2 px-3 font-medium">Version</th>
              <th className="py-2 px-3 font-medium">Active</th>
              <th className="py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t: any) => (
              <tr key={t.id} className="border-b hover:bg-muted/50">
                <td className="py-2 px-3">{t.name}</td>
                <td className="py-2 px-3">{t.contractType}</td>
                <td className="py-2 px-3">v{t.version}</td>
                <td className="py-2 px-3">{t.isActive ? "Yes" : "No"}</td>
                <td className="py-2 px-3 space-x-2">
                  <button className="text-blue-600 hover:underline">
                    Generate
                  </button>
                  <button className="text-blue-600 hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-muted-foreground"
                >
                  No templates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
