"use client";
import { useState, useEffect } from "react";

export default function SmsTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/communication-deep/sms-templates")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.data || []);
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
        <h1 className="text-2xl font-bold">SMS Templates</h1>
        <button className="ui-btn">+ New Template</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium">Body</th>
              <th className="py-2 px-3 font-medium">Category</th>
              <th className="py-2 px-3 font-medium">Active</th>
              <th className="py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t: any) => (
              <tr key={t.id} className="border-b hover:bg-muted/50">
                <td className="py-2 px-3">{t.name}</td>
                <td className="py-2 px-3 max-w-xs truncate">{t.body}</td>
                <td className="py-2 px-3">{t.category}</td>
                <td className="py-2 px-3">{t.isActive ? "Yes" : "No"}</td>
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
            {templates.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-muted-foreground"
                >
                  No SMS templates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
