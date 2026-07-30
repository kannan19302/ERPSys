// @ts-nocheck
"use client";
import { useState, useEffect } from "react";

export default function SocialPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/communication-deep/social-posts")
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.data || []);
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
        <h1 className="text-2xl font-bold">Social Media Posts</h1>
        <button className="ui-btn">+ New Post</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-3 font-medium">Platform</th>
              <th className="py-2 px-3 font-medium">Content</th>
              <th className="py-2 px-3 font-medium">Status</th>
              <th className="py-2 px-3 font-medium">Scheduled</th>
              <th className="py-2 px-3 font-medium">Published</th>
              <th className="py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-muted/50">
                <td className="py-2 px-3">{p.platform}</td>
                <td className="py-2 px-3 max-w-xs truncate">{p.content}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${p.status === "PUBLISHED" ? "bg-green-100 text-green-700" : p.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-2 px-3">
                  {p.scheduledAt
                    ? new Date(p.scheduledAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="py-2 px-3">
                  {p.publishedAt
                    ? new Date(p.publishedAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="py-2 px-3 space-x-2">
                  <button className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button className="text-green-600 hover:underline">
                    Publish
                  </button>
                  <button className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-4 text-center text-muted-foreground"
                >
                  No social posts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
